import { Request, Response, NextFunction } from 'express';
import { AuthOtpService } from '@services/auth-otp.service';
import { sendSuccess } from '@utils/response.util';
import { setRefreshTokenCookie } from '@utils/auth-cookie.util';

export class AuthController {
  private readonly authOtpService = new AuthOtpService();

  sendRegistrationOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authOtpService.sendRegistrationOtp(req.body.phone);
      sendSuccess(res, result, 'OTP sent');
    } catch (error) {
      next(error);
    }
  };

  verifyRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rememberMe = false;
      const result = await this.authOtpService.verifyRegistration(req.body);
      const { refreshToken, ...publicPayload } = result;
      setRefreshTokenCookie(res, refreshToken, rememberMe);
      sendSuccess(res, publicPayload, 'Registration successful');
    } catch (error) {
      next(error);
    }
  };

  sendPasswordResetOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authOtpService.sendPasswordResetOtp(req.body.phone);
      sendSuccess(res, result, 'OTP sent');
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authOtpService.resetPassword(req.body);
      sendSuccess(res, result, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  };
}

