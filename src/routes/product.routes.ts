import { Router } from 'express';
import { ProductController } from '@controllers/product.controller';
import { validate } from '@middleware/validation.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@types';
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  searchProductSchema,
  categorySchema,
  createReviewSchema,
  updateReviewSchema,
  reviewIdSchema,
} from '@validators/product.validator';

const router = Router();
const productController = new ProductController();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/search', validate(searchProductSchema), productController.searchProducts);
router.get('/category/:category', validate(categorySchema), productController.getProductsByCategory);
router.get('/rudraksha-category/:slug', productController.getProductsByRudrakshaCategory);
router.get('/gem-category/:slug', productController.getProductsByGemCategory);
router.get('/:id', validate(productIdSchema), productController.getProduct);
router.get('/:id/reviews', validate(productIdSchema), productController.getProductReviews);
router.get('/:id/details', validate(productIdSchema), productController.getProductWithReviews);

// Protected routes - require authentication
router.use(authenticate);

// Product CRUD (Admin or creator)
router.post(
  '/',
  validate(createProductSchema),
  authorize(UserRole.ADMIN),
  productController.createProduct
);
router.put(
  '/:id',
  validate(updateProductSchema),
  validate(productIdSchema),
  productController.updateProduct
);
router.delete('/:id', validate(productIdSchema), productController.deleteProduct);

// Reviews (Any authenticated user)
router.post(
  '/:id/reviews',
  validate(createReviewSchema),
  productController.createReview
);
router.put(
  '/reviews/:reviewId',
  validate(updateReviewSchema),
  productController.updateReview
);
router.delete(
  '/reviews/:reviewId',
  validate(reviewIdSchema),
  productController.deleteReview
);

export default router;











