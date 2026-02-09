import { Router } from 'express';
import { RudrakshaCategoryController } from '@controllers/rudraksha-category.controller';
import { validate } from '@middleware/validation.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@types';
import {
  createRudrakshaCategorySchema,
  updateRudrakshaCategorySchema,
  rudrakshaCategoryIdSchema,
  rudrakshaCategorySlugSchema,
  rudrakshaCategoryTypeSchema,
  mukhiCountSchema,
} from '@validators/rudraksha-category.validator';

const router = Router();
const rudrakshaCategoryController = new RudrakshaCategoryController();

// Public routes
router.get('/', rudrakshaCategoryController.getAllCategories);
router.get('/type/:type', validate(rudrakshaCategoryTypeSchema), rudrakshaCategoryController.getCategoriesByType);
router.get('/mukhi/:mukhiCount', validate(mukhiCountSchema), rudrakshaCategoryController.getCategoryByMukhiCount);
router.get('/slug/:slug', validate(rudrakshaCategorySlugSchema), rudrakshaCategoryController.getCategoryBySlug);
router.get('/:id', validate(rudrakshaCategoryIdSchema), rudrakshaCategoryController.getCategory);

// Protected routes - require authentication
router.use(authenticate);

// Admin only routes
router.post(
  '/',
  validate(createRudrakshaCategorySchema),
  authorize(UserRole.ADMIN),
  rudrakshaCategoryController.createCategory
);
router.put(
  '/:id',
  validate(updateRudrakshaCategorySchema),
  validate(rudrakshaCategoryIdSchema),
  authorize(UserRole.ADMIN),
  rudrakshaCategoryController.updateCategory
);
router.delete(
  '/:id',
  validate(rudrakshaCategoryIdSchema),
  authorize(UserRole.ADMIN),
  rudrakshaCategoryController.deleteCategory
);

export default router;

