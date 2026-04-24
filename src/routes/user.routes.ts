import { Router } from 'express';
import { UserController } from '@controllers/user.controller';
import { validate } from '@middleware/validation.middleware';
import { authenticate } from '@middleware/auth.middleware';
import { loginLimiter, otpLimiter } from '@middleware/rateLimit.middleware';
import {
  registerUserSchema,
  sendOTPSchema,
  verifyOTPSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateJyotishStatusSchema,
  resetPasswordSchema,
  setPasswordSchema,
  saveAstroDetailsSchema,
} from '@validators/user.validator';

const router = Router();
const userController = new UserController();

// Public routes
router.post('/register', validate(registerUserSchema), userController.register);
router.post('/send-otp', otpLimiter, validate(sendOTPSchema), userController.sendOTP);
router.post('/verify-otp', otpLimiter, validate(verifyOTPSchema), userController.verifyOTP);
router.post('/set-password', validate(setPasswordSchema), userController.setPassword);
router.post('/login', loginLimiter, validate(loginSchema), userController.login);
router.post('/reset-password', validate(resetPasswordSchema), userController.resetPassword);
router.get('/experts', userController.getExperts);

// Protected routes
router.use(authenticate);

router.post('/logout', userController.logout);
router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.post(
  '/astro-details',
  validate(saveAstroDetailsSchema),
  userController.saveAstroDetails
);
router.put('/change-password', validate(changePasswordSchema), userController.changePassword);

// Jyotish specific
router.put(
  '/jyotish/status',
  validate(updateJyotishStatusSchema),
  userController.updateJyotishStatus
);

export default router;








