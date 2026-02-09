import { Router } from 'express';
import { ProductEnquiryController } from '@controllers/product-enquiry.controller';
import { validate } from '@middleware/validation.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@types';
import {
  createEnquirySchema,
  enquiryIdSchema,
  productIdParamSchema,
  updateEnquiryStatusSchema,
  enquiryQuerySchema,
} from '@validators/product-enquiry.validator';

const router = Router();
const enquiryController = new ProductEnquiryController();

// Public route - anyone can submit an enquiry
router.post('/', validate(createEnquirySchema), enquiryController.createEnquiry);

// Protected routes - require authentication
router.use(authenticate);

// Admin routes - require admin role
router.get(
  '/stats',
  authorize(UserRole.ADMIN),
  enquiryController.getEnquiryStats
);
router.get(
  '/',
  authorize(UserRole.ADMIN),
  validate(enquiryQuerySchema),
  enquiryController.getAllEnquiries
);
router.get(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(enquiryIdSchema),
  enquiryController.getEnquiryById
);
router.get(
  '/product/:productId',
  authorize(UserRole.ADMIN),
  validate(productIdParamSchema),
  enquiryController.getEnquiriesByProduct
);
router.put(
  '/:id/status',
  authorize(UserRole.ADMIN),
  validate(updateEnquiryStatusSchema),
  enquiryController.updateEnquiryStatus
);
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validate(enquiryIdSchema),
  enquiryController.deleteEnquiry
);

export default router;
