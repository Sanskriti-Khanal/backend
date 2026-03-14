import { Request, Response, NextFunction } from 'express';
import { UserService } from '@services/user.service';
import { addToBlacklist } from '@services/token-blacklist.service';
import { sendSuccess } from '@utils/response.util';
import { AuthRequest } from '@middleware/auth.middleware';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.registerUser(req.body);
      sendSuccess(res, result, 'Registration successful. OTP sent to your phone', 201);
    } catch (error) {
      next(error);
    }
  };

  sendOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.sendOTP(req.body.phone);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  verifyOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.verifyOTP(req.body.phone, req.body.otp);
      sendSuccess(res, result, 'Phone verified successfully');
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rememberMe = Boolean(req.body.rememberMe);
      const result = await this.userService.login(req.body.username, req.body.password, rememberMe);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        addToBlacklist(token);
      }
      sendSuccess(res, { loggedOut: true }, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getProfile(req.user!.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.updateProfile(req.user!.id, req.body);
      sendSuccess(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.userService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      sendSuccess(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  };

  updateJyotishStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.userService.updateJyotishStatus(req.user!.id, {
        isOnline: req.body.isOnline,
        availabilityStatus: req.body.availabilityStatus,
      });
      sendSuccess(res, user, 'Status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  setPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.setPassword(
        req.body.phone,
        req.body.password
      );
      sendSuccess(res, result, 'Password set successfully');
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.resetPassword(
        req.body.phone,
        req.body.otp,
        req.body.newPassword
      );
      sendSuccess(res, result, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  };

  getExperts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = req.query.role as any;
      const experts = await this.userService.getExperts(role);
      sendSuccess(res, experts);
    } catch (error) {
      next(error);
    }
  };
}








