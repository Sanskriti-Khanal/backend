import bcrypt from 'bcryptjs';
import { UserRepository } from '@repositories/user.repository';
import { OtpChallengeRepository } from '@repositories/otp-challenge.repository';
import { UserService } from '@services/user.service';
import { sendOTP, verifyOTP } from '@utils/twilio';
import { ConflictError, BadRequestError, NotFoundError, TooManyRequestsError, UnauthorizedError } from '@errors/AppError';
import { nepalPhoneLocalKeyIfApplicable, normalizePhoneToE164, toE164Plus } from '@utils/otp.util';
import { UserRole } from '@types';
import { IUser } from '@models/User.model';

const RESEND_WINDOW_MS = 15 * 60 * 1000;
const MAX_RESEND_PER_WINDOW = 3;
const MAX_FAILED_VERIFY_ATTEMPTS = 3;

type Purpose = 'registration' | 'password_reset';

export class AuthOtpService {
  private readonly users = new UserRepository();
  private readonly otpChallenges = new OtpChallengeRepository();
  private readonly userService = new UserService();

  async sendRegistrationOtp(phone: string): Promise<{ message: string }> {
    const { phoneE164, phoneKey } = this.normalizePhone(phone);
    const existing = await this.findUserByPhoneKey(phoneKey);
    if (existing) {
      throw new ConflictError('Phone number already registered');
    }
    await this.enforceResendPolicy(phoneE164, 'registration');
    await sendOTP(phoneE164);
    return { message: 'OTP sent to your phone number' };
  }

  async verifyRegistration(input: {
    phone: string;
    code: string;
    fullName: string;
    username?: string;
    password: string;
    role?: UserRole;
  }): Promise<{ user: IUser; accessToken: string; refreshToken: string; token: string }> {
    const { phoneE164, phoneKey } = this.normalizePhone(input.phone);
    await this.enforceVerifyPolicy(phoneE164, 'registration');

    const approved = await verifyOTP(phoneE164, input.code);
    if (!approved) {
      await this.recordFailedAttempt(phoneE164, 'registration');
      throw new UnauthorizedError('Invalid OTP');
    }

    const existing = await this.findUserByPhoneKey(phoneKey);
    if (existing) {
      await this.otpChallenges.deleteChallenge(phoneE164, 'registration');
      throw new ConflictError('Phone number already registered');
    }

    const finalUsername = await this.resolveUsername(input.username, input.fullName, phoneKey);
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await this.users.create({
      phone: phoneKey,
      username: finalUsername,
      fullName: input.fullName.trim(),
      password: hashedPassword,
      role: input.role || UserRole.USER,
      isPhoneVerified: true,
    });

    await this.otpChallenges.deleteChallenge(phoneE164, 'registration');
    return this.userService.login(finalUsername, input.password, false);
  }

  async sendPasswordResetOtp(phone: string): Promise<{ message: string }> {
    const { phoneE164, phoneKey } = this.normalizePhone(phone);
    const existing = await this.findUserByPhoneKey(phoneKey);
    if (!existing) {
      throw new NotFoundError('User not found');
    }
    await this.enforceResendPolicy(phoneE164, 'password_reset');
    await sendOTP(phoneE164);
    return { message: 'OTP sent to your phone number' };
  }

  async resetPassword(input: {
    phone?: string;
    code?: string;
    newPassword: string;
    passwordSetToken?: string;
  }): Promise<{ message: string }> {
    const token = input.passwordSetToken?.trim();
    if (token) {
      return this.userService.setPassword(undefined, input.newPassword, token);
    }
    if (!input.phone || !input.code) {
      throw new BadRequestError('phone and code are required when passwordSetToken is not provided');
    }
    const { phoneE164, phoneKey } = this.normalizePhone(input.phone);
    await this.enforceVerifyPolicy(phoneE164, 'password_reset');

    const approved = await verifyOTP(phoneE164, input.code!);
    if (!approved) {
      await this.recordFailedAttempt(phoneE164, 'password_reset');
      throw new UnauthorizedError('Invalid OTP');
    }

    const existing = await this.findUserByPhoneKey(phoneKey);
    if (!existing) {
      await this.otpChallenges.deleteChallenge(phoneE164, 'password_reset');
      throw new NotFoundError('User not found');
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 10);
    const updated = await this.users.updatePassword(phoneKey, hashedPassword);
    if (updated?._id) {
      await this.userService.revokeRefreshTokensForUser(String(updated._id));
    }

    await this.otpChallenges.deleteChallenge(phoneE164, 'password_reset');
    return { message: 'Password reset successfully' };
  }

  private normalizePhone(phone: string): { phoneE164: string; phoneKey: string } {
    const phoneE164 = toE164Plus(phone);
    const digitKey = phoneE164.replace(/\D/g, '');
    const phoneKey = normalizePhoneToE164(digitKey);
    return { phoneE164, phoneKey };
  }

  private async resolveUsername(
    username: string | undefined,
    fullName: string,
    phoneKey: string
  ): Promise<string> {
    let finalUsername = username?.trim().toLowerCase();
    if (!finalUsername || finalUsername.length < 3) {
      const slug = fullName.trim().toLowerCase().replace(/\s+/g, '');
      finalUsername = `${slug}_${phoneKey}`;
    }
    const existingUsername = await this.users.findByUsername(finalUsername);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }
    return finalUsername;
  }

  private async findUserByPhoneKey(phoneKey: string): Promise<IUser | null> {
    let user = await this.users.findByPhone(phoneKey);
    if (!user) {
      const localKey = nepalPhoneLocalKeyIfApplicable(phoneKey);
      if (localKey) {
        user = await this.users.findByPhone(localKey);
      }
    }
    return user;
  }

  private async enforceResendPolicy(phoneE164: string, purpose: Purpose): Promise<void> {
    const now = new Date();
    const challenge = await this.otpChallenges.findByPhoneAndPurpose(phoneE164, purpose);
    if (!challenge || now.getTime() - challenge.resendWindowStartedAt.getTime() >= RESEND_WINDOW_MS) {
      await this.otpChallenges.upsertChallenge(phoneE164, purpose, {
        resendCount: 1,
        resendWindowStartedAt: now,
        failedVerifyCount: 0,
        invalidated: false,
        lastSentAt: now,
      });
      return;
    }

    if (challenge.resendCount >= MAX_RESEND_PER_WINDOW) {
      throw new TooManyRequestsError('OTP resend limit reached. Please try again after 15 minutes');
    }

    await this.otpChallenges.upsertChallenge(phoneE164, purpose, {
      resendCount: challenge.resendCount + 1,
      resendWindowStartedAt: challenge.resendWindowStartedAt,
      failedVerifyCount: 0,
      invalidated: false,
      lastSentAt: now,
    });
  }

  private async enforceVerifyPolicy(phoneE164: string, purpose: Purpose): Promise<void> {
    const challenge = await this.otpChallenges.findByPhoneAndPurpose(phoneE164, purpose);
    // Twilio Verify holds the real verification. Our document is for resend/attempt limits.
    // It may be missing if the client used legacy /users/send-otp (no OtpChallenge row) or
    // mixed old/new flows; verifyOTP still enforces a valid code.
    if (!challenge) {
      return;
    }
    if (challenge.invalidated) {
      throw new BadRequestError('OTP session is invalid. Please request a new OTP');
    }
    if (challenge.failedVerifyCount >= MAX_FAILED_VERIFY_ATTEMPTS) {
      await this.otpChallenges.upsertChallenge(phoneE164, purpose, {
        invalidated: true,
      });
      throw new BadRequestError('Maximum OTP verification attempts exceeded. Please request a new OTP');
    }
  }

  private async recordFailedAttempt(phoneE164: string, purpose: Purpose): Promise<void> {
    const now = new Date();
    const challenge = await this.otpChallenges.findByPhoneAndPurpose(phoneE164, purpose);
    if (!challenge) {
      const nextCount = 1;
      await this.otpChallenges.upsertChallenge(phoneE164, purpose, {
        resendCount: 0,
        resendWindowStartedAt: now,
        failedVerifyCount: nextCount,
        invalidated: nextCount >= MAX_FAILED_VERIFY_ATTEMPTS,
      });
      return;
    }

    const nextCount = challenge.failedVerifyCount + 1;
    await this.otpChallenges.upsertChallenge(phoneE164, purpose, {
      failedVerifyCount: nextCount,
      invalidated: nextCount >= MAX_FAILED_VERIFY_ATTEMPTS,
    });
  }
}

