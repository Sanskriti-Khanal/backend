import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import env from '@config/env';
import { normalizePemFromEnv } from '@utils/jwt.util';
import { parseExpiresInToMs } from '@utils/token-expiry.util';
import { UserRepository } from '@repositories/user.repository';
import { OTPService } from './otp.service';
import { OtpAttemptTrackerService } from './otp-attempt-tracker.service';
import { PasswordSetTokenService } from './password-set-token.service';
import { Types } from 'mongoose';
import { UserModel, IUser, IAstroDetails } from '@models/User.model';
import { RefreshTokenModel } from '@models/RefreshToken.model';
import { ConsumedRefreshTokenModel } from '@models/ConsumedRefreshToken.model';
import { UserRole, isConsultationExpertRole } from '@types';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from '@errors/AppError';
import {
  isOTPExpired,
  nepalPhoneLocalKeyIfApplicable,
  normalizePhoneToE164,
  normalizeOTP,
} from '@utils/otp.util';

export class UserService {
  private userRepository: UserRepository;
  private otpService: OTPService;
  private otpAttemptTracker: OtpAttemptTrackerService;
  private passwordSetTokenService: PasswordSetTokenService;

  constructor() {
    this.userRepository = new UserRepository();
    this.otpService = new OTPService();
    this.otpAttemptTracker = new OtpAttemptTrackerService();
    this.passwordSetTokenService = new PasswordSetTokenService();
  }

  async registerUser(data: {
    phone: string;
    username?: string;
    password?: string;
    fullName: string;
    role?: UserRole;
    dob?: Date;
    birthTime?: string;
    birthPlace?: string;
  }): Promise<{ user: IUser; message: string }> {
    const phone = normalizePhoneToE164(data.phone);
    if (phone.length < 11) {
      throw new BadRequestError('Phone must include country code (e.g. 9779812345678, 14155551234)');
    }
    // Check if phone already exists
    const existingPhone = await this.userRepository.findByPhone(phone);
    if (existingPhone) {
      throw new ConflictError('Phone number already registered');
    }
    this.assertCanRequestOtp(phone);

    // Use provided username or generate from fullName + phone for uniqueness
    let finalUsername = data.username?.trim().toLowerCase();
    if (!finalUsername || finalUsername.length < 3) {
      const slug = data.fullName.trim().toLowerCase().replace(/\s+/g, '');
      finalUsername = `${slug}_${phone}`;
    }
    const existingUsername = await this.userRepository.findByUsername(finalUsername);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    const parsedDob = data.dob ? new Date(data.dob) : undefined;
    const isValidDob = parsedDob && !Number.isNaN(parsedDob.getTime());

    // Hash password if provided, otherwise create user without password (will be set after OTP verification)
    const userData: Partial<IUser> = {
      phone,
      username: finalUsername,
      fullName: data.fullName,
      role: data.role || UserRole.USER,
      isPhoneVerified: false,
      dob: isValidDob ? parsedDob : undefined,
      birthTime: data.birthTime?.trim() || undefined,
      birthPlace: data.birthPlace?.trim() || undefined,
      kundaliCompleted: Boolean(
        isValidDob &&
          data.birthTime?.trim() &&
          data.birthPlace?.trim(),
      ),
    };

    // Only add password if provided
    if (data.password) {
      userData.password = await bcrypt.hash(data.password, 10);
    } else {
      // Set a temporary placeholder password that will be replaced after OTP verification
      userData.password = await bcrypt.hash('temp_' + Date.now(), 10);
    }

    // Create user
    const user = await this.userRepository.create(userData);

    // Generate and send OTP
    const otp = this.otpService.generateOTP();
    const otpExpiry = this.otpService.getOTPExpiry();
    await this.userRepository.updateOTP(phone, otp, otpExpiry);
    await this.otpService.sendOTP(phone, otp);
    this.otpAttemptTracker.recordOtpSent(phone);

    return {
      user,
      message: 'OTP sent to your phone number',
    };
  }

  async sendOTP(phone: string): Promise<{ message: string }> {
    const normalized = normalizePhoneToE164(phone);
    if (normalized.length < 11) {
      throw new BadRequestError('Phone must include country code (e.g. 9779812345678, 14155551234)');
    }
    let user = await this.userRepository.findByPhone(normalized);
    const localKey = nepalPhoneLocalKeyIfApplicable(normalized);
    if (!user && localKey) {
      user = await this.userRepository.findByPhone(localKey);
    }
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const phoneKey = user.phone!;
    this.assertCanRequestOtp(phoneKey);

    const otp = this.otpService.generateOTP();
    const otpExpiry = this.otpService.getOTPExpiry();
    await this.userRepository.updateOTP(phoneKey, otp, otpExpiry);
    await this.otpService.sendOTP(normalized, otp);
    this.otpAttemptTracker.recordOtpSent(phoneKey);

    return { message: 'OTP sent to your phone number' };
  }

  async verifyOTP(
    phone: string,
    otp: string
  ): Promise<{ user: IUser; requiresPassword: boolean; passwordSetToken: string }> {
    const normalized = normalizePhoneToE164(phone);
    if (normalized.length < 11) {
      throw new BadRequestError('Phone must include country code (e.g. 9779812345678, 14155551234)');
    }
    let user = await this.userRepository.findByPhoneWithOTP(normalized);
    const localKeyVerify = nepalPhoneLocalKeyIfApplicable(normalized);
    if (!user && localKeyVerify) {
      user = await this.userRepository.findByPhoneWithOTP(localKeyVerify);
    }
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const phoneKey = user.phone!;
    if (!this.otpAttemptTracker.canVerifyOtp(phoneKey).allowed) {
      await this.userRepository.clearOTP(phoneKey);
      throw new BadRequestError('Maximum OTP verification attempts exceeded. Please request a new OTP');
    }

    const verifiedByProvider = await this.otpService.verifyOTP(normalized, otp);
    if (verifiedByProvider === false) {
      await this.onFailedOtpVerification(phoneKey);
    }
    if (verifiedByProvider === true) {
      this.otpAttemptTracker.clearVerifyFailures(phoneKey);
      const verifiedUser = await this.userRepository.verifyPhone(phoneKey);
      if (!verifiedUser) {
        throw new NotFoundError('User not found');
      }
      const passwordSetToken = await this.passwordSetTokenService.issueForUserId(
        String(verifiedUser._id)
      );
      return { user: verifiedUser, requiresPassword: true, passwordSetToken };
    }

    if (!user.otp || !user.otpExpiry) {
      throw new BadRequestError('OTP not found. Please request a new OTP');
    }

    if (isOTPExpired(user.otpExpiry)) {
      throw new BadRequestError('OTP expired. Please request a new OTP');
    }

    const otpTrimmed = normalizeOTP(otp);
    const storedOtp = normalizeOTP(String(user.otp));
    // In development, optional bypass so you can use a fixed code (e.g. 1234) instead of copying from terminal
    const devBypass = env.NODE_ENV === 'development' && env.DEV_OTP_BYPASS && otpTrimmed === env.DEV_OTP_BYPASS.trim();
    if (!devBypass && storedOtp !== otpTrimmed) {
      await this.onFailedOtpVerification(phoneKey);
    }
    this.otpAttemptTracker.clearVerifyFailures(phoneKey);

    // Verify phone (use stored key for backward compat with 10-digit Nepal)
    const verifiedUser = await this.userRepository.verifyPhone(phoneKey);
    if (!verifiedUser) {
      throw new NotFoundError('User not found');
    }

    const passwordSetToken = await this.passwordSetTokenService.issueForUserId(
      String(verifiedUser._id)
    );
    return { user: verifiedUser, requiresPassword: true, passwordSetToken };
  }

  async login(
    username: string,
    password: string,
    rememberMe = false,
    deviceInfo?: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string; token: string }> {
    // Support login by phone number (with or without country code), username, or full name
    const digitsOnly = username.replace(/\D/g, '');
    const isPhoneNumber = digitsOnly.length >= 10 && /^[0-9]+$/.test(digitsOnly);
    const trimmed = username.trim().toLowerCase();
    
    let user: IUser | null;
    if (isPhoneNumber) {
      const phoneKey = normalizePhoneToE164(digitsOnly);
      user = await UserModel.findOne({ phone: phoneKey }).select('+password');
      const localLogin = nepalPhoneLocalKeyIfApplicable(phoneKey);
      if (!user && localLogin) {
        user = await UserModel.findOne({ phone: localLogin }).select('+password');
      }
    } else {
      // Try username first, then full name (case-insensitive match)
      user = await UserModel.findOne({ username: trimmed }).select('+password');
      if (!user) {
        user = await UserModel.findOne({
          fullName: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        }).select('+password');
      }
    }
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const accessToken = this.generateAccessToken(user, env.JWT_ACCESS_EXPIRE);
    const refreshToken = await this.createRefreshTokenForUser(user._id, {
      rememberMe,
      deviceInfo,
      tokenVersionAtIssue: (user as any).tokenVersion ?? 0,
    });

    return { user, accessToken, refreshToken, token: accessToken };
  }

  /**
   * Exchange a valid refresh token for a new access token and rotated refresh token.
   * Detects refresh-token reuse (replay after rotation) and revokes all sessions for that user.
   */
  async refreshTokens(plainRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    token: string;
    rememberMe: boolean;
  }> {
    const tokenHash = crypto.createHash('sha256').update(plainRefreshToken).digest('hex');
    const doc = await RefreshTokenModel.findOne({ tokenHash });
    if (!doc || doc.expiresAt.getTime() <= Date.now()) {
      const replay = await ConsumedRefreshTokenModel.findOne({ tokenHash });
      if (replay) {
        await this.revokeAllSessionsForUserId(replay.userId.toString());
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await UserModel.findById(doc.userId);
    if (!user || !user.isActive) {
      await RefreshTokenModel.deleteOne({ _id: doc._id });
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const dbTv = (user as any).tokenVersion ?? 0;
    if (doc.tokenVersionAtIssue !== dbTv) {
      await RefreshTokenModel.deleteOne({ _id: doc._id });
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const consumedTtl = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await ConsumedRefreshTokenModel.create({
      tokenHash,
      userId: doc.userId,
      expiresAt: consumedTtl,
    }).catch(() => {
      /* duplicate hash — ignore */
    });

    await RefreshTokenModel.deleteOne({ _id: doc._id });

    const newRefresh = await this.createRefreshTokenForUser(user._id, {
      rememberMe: doc.rememberMe,
      deviceInfo: doc.deviceInfo,
      familyId: doc.familyId,
      tokenVersionAtIssue: dbTv,
    });
    const accessToken = this.generateAccessToken(user, env.JWT_ACCESS_EXPIRE);

    return {
      accessToken,
      refreshToken: newRefresh,
      token: accessToken,
      rememberMe: doc.rememberMe,
    };
  }

  async revokeRefreshTokensForUser(userId: string): Promise<void> {
    await this.revokeAllSessionsForUserId(userId);
  }

  private async revokeAllSessionsForUserId(userId: string): Promise<void> {
    const uid = new Types.ObjectId(userId);
    await RefreshTokenModel.deleteMany({ userId: uid });
    await ConsumedRefreshTokenModel.deleteMany({ userId: uid });
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, data: Partial<IUser>): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Don't allow role changes through profile update
    if (data.role) {
      delete data.role;
    }

    // If phone is being updated, ensure it's not taken by another user
    if (data.phone) {
      const existingByPhone = await this.userRepository.findByPhone(data.phone);
      if (existingByPhone && existingByPhone._id.toString() !== userId) {
        throw new ConflictError('Phone number already in use');
      }
    }

    // Sync isOnline with availabilityStatus for consultation experts
    if (data.availabilityStatus != null) {
      const isExpert = isConsultationExpertRole(user.role);
      if (isExpert) {
        (data as any).isOnline = data.availabilityStatus === 'active';
      } else {
        delete data.availabilityStatus;
      }
    }

    const nextDob = data.dob !== undefined ? data.dob : user.dob;
    const nextBirthTime =
      data.birthTime !== undefined ? data.birthTime : user.birthTime;
    const nextBirthPlace =
      data.birthPlace !== undefined ? data.birthPlace : user.birthPlace;
    (data as any).kundaliCompleted = Boolean(
      nextDob && nextBirthTime && nextBirthPlace,
    );

    const updatedUser = await this.userRepository.update(userId, data);
    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }
    return updatedUser;
  }

  /**
   * Save birth details for personalized Rashifal / notifications.
   * Syncs legacy `dob` / `birthTime` / `birthPlace` / `kundaliCompleted` for existing features.
   */
  async saveAstroDetails(
    userId: string,
    body: {
      dateOfBirth: string;
      timeOfBirth: string;
      placeOfBirth: string;
      gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    }
  ): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const dob = new Date(body.dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      throw new BadRequestError('Invalid date of birth');
    }
    const timeOfBirth = body.timeOfBirth.trim();
    const placeOfBirth = body.placeOfBirth.trim();
    if (!timeOfBirth) {
      throw new BadRequestError('Time of birth is required');
    }
    if (!placeOfBirth) {
      throw new BadRequestError('Place of birth is required');
    }

    const allowed: Array<NonNullable<IAstroDetails['gender']>> = [
      'male',
      'female',
      'other',
      'prefer_not_to_say',
    ];
    const g = body.gender?.toLowerCase() as IAstroDetails['gender'] | undefined;
    const gender = g && allowed.includes(g as NonNullable<IAstroDetails['gender']>) ? g : undefined;

    const astroDetails: IAstroDetails = {
      dateOfBirth: dob,
      timeOfBirth,
      placeOfBirth,
      ...(gender ? { gender } : {}),
    };

    const updatedUser = await this.userRepository.update(userId, {
      astroDetails,
      profileCompleted: true,
      dob,
      birthTime: timeOfBirth,
      birthPlace: placeOfBirth,
      kundaliCompleted: true,
    });
    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }
    return updatedUser;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePasswordById(userId, hashedPassword);
    await this.revokeAllSessionsForUserId(userId);
    return { message: 'Password changed successfully' };
  }

  async updateJyotishStatus(
    userId: string,
    payload: { isOnline?: boolean; availabilityStatus?: 'active' | 'not_active' | 'busy' }
  ): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const isExpert = isConsultationExpertRole(user.role);
    if (!isExpert) {
      throw new BadRequestError(
        'Only Jyotish, Premium Jyotish, or Vaastu experts can update availability status'
      );
    }

    let update: Partial<IUser> = {};
    if (payload.availabilityStatus != null) {
      update.availabilityStatus = payload.availabilityStatus;
      update.isOnline = payload.availabilityStatus === 'active';
    } else if (payload.isOnline != null) {
      update.isOnline = payload.isOnline;
      update.availabilityStatus = payload.isOnline ? 'active' : 'not_active';
    }

    const updatedUser = await this.userRepository.update(userId, update);
    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }
    return updatedUser;
  }

  async setPassword(
    phone: string | undefined,
    password: string,
    passwordSetToken?: string
  ): Promise<{ message: string }> {
    const token = passwordSetToken?.trim();
    if (token) {
      const userId = await this.passwordSetTokenService.verifyAndConsume(token);
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      if (!user.isPhoneVerified) {
        throw new BadRequestError('Phone number must be verified before setting password');
      }
      const phoneKey = user.phone!;
      const hashedPassword = await bcrypt.hash(password, 10);
      const updated = await this.userRepository.updatePassword(phoneKey, hashedPassword);
      if (updated?._id) {
        await this.revokeAllSessionsForUserId(String(updated._id));
      }
      return { message: 'Password set successfully' };
    }

    if (!phone) {
      throw new BadRequestError('Phone is required when passwordSetToken is not provided');
    }

    const normalized = normalizePhoneToE164(phone);
    if (normalized.length < 11) {
      throw new BadRequestError('Phone must include country code (e.g. 9779812345678, 14155551234)');
    }
    let user = await this.userRepository.findByPhone(normalized);
    const localSet = nepalPhoneLocalKeyIfApplicable(normalized);
    if (!user && localSet) {
      user = await this.userRepository.findByPhone(localSet);
    }
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const phoneKey = user.phone!;

    if (!user.isPhoneVerified) {
      throw new BadRequestError('Phone number must be verified before setting password');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password (+ tokenVersion bump in repository)
    const updated = await this.userRepository.updatePassword(phoneKey, hashedPassword);
    if (updated?._id) {
      await this.revokeAllSessionsForUserId(String(updated._id));
    }

    return { message: 'Password set successfully' };
  }

  async resetPassword(phone: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const normalized = normalizePhoneToE164(phone);
    if (normalized.length < 11) {
      throw new BadRequestError('Phone must include country code (e.g. 9779812345678, 14155551234)');
    }
    let user = await this.userRepository.findByPhoneWithOTP(normalized);
    const localReset = nepalPhoneLocalKeyIfApplicable(normalized);
    if (!user && localReset) {
      user = await this.userRepository.findByPhoneWithOTP(localReset);
    }
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const phoneKey = user.phone!;
    if (!this.otpAttemptTracker.canVerifyOtp(phoneKey).allowed) {
      await this.userRepository.clearOTP(phoneKey);
      throw new BadRequestError('Maximum OTP verification attempts exceeded. Please request a new OTP');
    }

    const verifiedByProvider = await this.otpService.verifyOTP(normalized, otp);
    if (verifiedByProvider === false) {
      await this.onFailedOtpVerification(phoneKey);
    }
    if (verifiedByProvider !== true) {
      if (!user.otp || !user.otpExpiry) {
        throw new BadRequestError('OTP not found. Please request a new OTP');
      }

      if (isOTPExpired(user.otpExpiry)) {
        throw new BadRequestError('OTP expired. Please request a new OTP');
      }

      const otpTrimmed = normalizeOTP(otp);
      const storedOtp = normalizeOTP(String(user.otp));
      const devBypass = env.NODE_ENV === 'development' && env.DEV_OTP_BYPASS && otpTrimmed === env.DEV_OTP_BYPASS.trim();
      if (!devBypass && storedOtp !== otpTrimmed) {
        await this.onFailedOtpVerification(phoneKey);
      }
    }
    this.otpAttemptTracker.clearVerifyFailures(phoneKey);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP (use stored key for backward compat)
    const updated = await this.userRepository.updatePassword(phoneKey, hashedPassword);
    if (updated?._id) {
      await this.revokeAllSessionsForUserId(String(updated._id));
    }

    return { message: 'Password reset successfully' };
  }

  /**
   * Experts listing for Services UI. Aligns `availabilityStatus` with `isOnline` when they drift
   * (e.g. DB had isOnline true but status still not_active) so clients show availability correctly.
   */
  async getExperts(role?: string | UserRole): Promise<Record<string, unknown>[]> {
    let experts: IUser[];

    if (role) {
      const roleUpper =
        typeof role === 'string' ? role.toUpperCase().trim() : String(role).toUpperCase();
      switch (roleUpper) {
        case 'ASTROLOGY':
        case 'ASTROLOGER':
        case 'JYOTISH':
          experts = await this.userRepository.findActiveByRoleIn([
            UserRole.JYOTISH,
            UserRole.PREMIUM_JYOTISH,
            'pujari',
          ]);
          break;
        case 'VAASTU':
          experts = await this.userRepository.findActiveByRoleIn([
            UserRole.VAASTU,
            'pandit',
          ]);
          break;
        default: {
          if (Object.values(UserRole).includes(role as UserRole)) {
            const list = await this.userRepository.findByRole(role as UserRole);
            experts = list.filter((u) => u.isActive);
          } else {
            experts = [];
          }
          break;
        }
      }
    } else {
      experts = await this.userRepository.findAll().then((users) =>
        users.filter((u) => u.isActive && isConsultationExpertRole(u.role)),
      );
    }

    return experts.map((u) => UserService.expertToServicesPayload(u));
  }

  /** Plain object for GET /users/experts with consistent online vs availabilityStatus. */
  static expertToServicesPayload(user: IUser): Record<string, unknown> {
    const o: Record<string, unknown> =
      typeof (user as any).toObject === 'function'
        ? (user as any).toObject()
        : { ...(user as any) };

    if (!isConsultationExpertRole(o.role as string)) {
      return o;
    }

    const status = String(o.availabilityStatus ?? '').toLowerCase();
    const online = o.isOnline === true;

    if (status === 'busy') {
      return o;
    }

    if (online) {
      o.availabilityStatus = 'active';
    }

    return o;
  }

  private generateAccessToken(user: IUser, expiresIn: string): string {
    const tv = (user as any).tokenVersion ?? 0;
    const payload = {
      id: user._id.toString(),
      role: user.role,
      phone: user.phone,
      tv,
    };
    const privateKey = normalizePemFromEnv(env.JWT_PRIVATE_KEY);
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn } as SignOptions);
  }

  private async createRefreshTokenForUser(
    userId: Types.ObjectId | string,
    opts: {
      rememberMe: boolean;
      deviceInfo?: string;
      familyId?: Types.ObjectId;
      tokenVersionAtIssue: number;
    }
  ): Promise<string> {
    const plain = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plain).digest('hex');
    const expStr = opts.rememberMe ? env.JWT_REFRESH_EXPIRE_REMEMBER : env.JWT_REFRESH_EXPIRE_SESSION;
    const expiresAt = new Date(Date.now() + parseExpiresInToMs(expStr));
    const familyId = opts.familyId ?? new Types.ObjectId();
    await RefreshTokenModel.create({
      userId,
      tokenHash,
      expiresAt,
      familyId,
      rememberMe: opts.rememberMe,
      tokenVersionAtIssue: opts.tokenVersionAtIssue,
      deviceInfo: opts.deviceInfo?.slice(0, 512),
    });
    return plain;
  }

  private assertCanRequestOtp(phoneKey: string): void {
    const gate = this.otpAttemptTracker.canRequestOtp(phoneKey);
    if (!gate.allowed) {
      throw new BadRequestError(
        `OTP request limit reached. Please try again in ${gate.retryAfterSec} seconds`
      );
    }
  }

  private async onFailedOtpVerification(phoneKey: string): Promise<never> {
    const result = this.otpAttemptTracker.recordVerifyFailure(phoneKey);
    if (result.exhausted) {
      await this.userRepository.clearOTP(phoneKey);
      throw new BadRequestError('Maximum OTP verification attempts exceeded. Please request a new OTP');
    }
    throw new UnauthorizedError(`Invalid OTP. ${result.attemptsLeft} attempt(s) remaining`);
  }
}

