import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { UserController } from '@controllers/user.controller';
import { validate } from '@middleware/validation.middleware';
import { loginLimiter } from '@middleware/rateLimit.middleware';
import { refreshSessionSchema } from '@validators/user.validator';
import {
  sendPasswordResetOtpSchema,
  sendRegistrationOtpSchema,
  verifyRegistrationSchema,
  resetPasswordWithOtpSchema,
} from '@validators/auth.validator';

const router = Router();
const authController = new AuthController();
const userController = new UserController();

router.post(
  '/send-registration-otp',
  validate(sendRegistrationOtpSchema),
  authController.sendRegistrationOtp
);
router.post(
  '/verify-registration',
  validate(verifyRegistrationSchema),
  authController.verifyRegistration
);
router.post(
  '/send-password-reset-otp',
  validate(sendPasswordResetOtpSchema),
  authController.sendPasswordResetOtp
);
router.post(
  '/reset-password',
  validate(resetPasswordWithOtpSchema),
  authController.resetPassword
);

/** POST /api/v1/auth/refresh — cookie or body refresh token; returns new access JWT (15m). */
router.post('/refresh', loginLimiter, validate(refreshSessionSchema), userController.refresh);

export default router;
