import { Router } from 'express';
import { GemCategoryController } from '@controllers/gem-category.controller';
import { validate } from '@middleware/validation.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@types';
import {
  createGemCategorySchema,
  updateGemCategorySchema,
  gemCategoryIdSchema,
  gemCategorySlugSchema,
  gemCategoryTypeSchema,
} from '@validators/gem-category.validator';

const router = Router();
const gemCategoryController = new GemCategoryController();

// Public routes
router.get('/', gemCategoryController.getAllCategories);
router.get('/type/:type', validate(gemCategoryTypeSchema), gemCategoryController.getCategoriesByType);
router.get('/slug/:slug', validate(gemCategorySlugSchema), gemCategoryController.getCategoryBySlug);
router.get('/:id', validate(gemCategoryIdSchema), gemCategoryController.getCategory);

// Protected routes - require authentication
router.use(authenticate);

// Admin only routes
router.post(
  '/',
  validate(createGemCategorySchema),
  authorize(UserRole.ADMIN),
  gemCategoryController.createCategory
);
router.put(
  '/:id',
  validate(updateGemCategorySchema),
  validate(gemCategoryIdSchema),
  authorize(UserRole.ADMIN),
  gemCategoryController.updateCategory
);
router.delete(
  '/:id',
  validate(gemCategoryIdSchema),
  authorize(UserRole.ADMIN),
  gemCategoryController.deleteCategory
);

export default router;









