import { Router } from 'express';
import { HealingController } from '@controllers/healing.controller';
import { validate } from '@middleware/validation.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@types';
import {
  createListingSchema,
  updateListingSchema,
  listingIdSchema,
  searchListingSchema,
  categoryListingSchema,
  createPackageSchema,
  updatePackageSchema,
  packageIdSchema,
  createReviewSchema,
  updateReviewSchema,
  reviewIdSchema,
} from '@validators/healing.validator';

const router = Router();
const healingController = new HealingController();

// Public routes - Listings
router.get('/listings', healingController.getAllListings);
router.get(
  '/listings/search',
  validate(searchListingSchema),
  healingController.searchListings
);
router.get(
  '/listings/category/:category',
  validate(categoryListingSchema),
  healingController.getListingsByCategory
);
router.get(
  '/listings/:id',
  validate(listingIdSchema),
  healingController.getListing
);
router.get(
  '/listings/:id/reviews',
  validate(listingIdSchema),
  healingController.getListingReviews
);
router.get(
  '/listings/:id/details',
  validate(listingIdSchema),
  healingController.getListingWithReviews
);

// Public routes - Packages
router.get('/packages', healingController.getAllPackages);
router.get(
  '/packages/:id',
  validate(packageIdSchema),
  healingController.getPackage
);
router.get(
  '/packages/healer/:healerId',
  healingController.getPackagesByHealer
);

// Protected routes - Listings (Healer or Admin)
router.post(
  '/listings',
  authenticate,
  authorize(UserRole.HEALER, UserRole.ADMIN),
  validate(createListingSchema),
  healingController.createListing
);
router.put(
  '/listings/:id',
  authenticate,
  validate(updateListingSchema),
  validate(listingIdSchema),
  healingController.updateListing
);
router.delete(
  '/listings/:id',
  authenticate,
  validate(listingIdSchema),
  healingController.deleteListing
);
router.get(
  '/listings/healer/:healerId',
  healingController.getListingsByHealer
);

// Protected routes - Packages (Healer or Admin)
router.post(
  '/packages',
  authenticate,
  authorize(UserRole.HEALER, UserRole.ADMIN),
  validate(createPackageSchema),
  healingController.createPackage
);
router.put(
  '/packages/:id',
  authenticate,
  validate(updatePackageSchema),
  validate(packageIdSchema),
  healingController.updatePackage
);
router.delete(
  '/packages/:id',
  authenticate,
  validate(packageIdSchema),
  healingController.deletePackage
);

// Protected routes - Reviews (Authenticated users)
router.post(
  '/listings/:id/reviews',
  authenticate,
  validate(createReviewSchema),
  healingController.createReview
);
router.put(
  '/reviews/:reviewId',
  authenticate,
  validate(updateReviewSchema),
  healingController.updateReview
);
router.delete(
  '/reviews/:reviewId',
  authenticate,
  validate(reviewIdSchema),
  healingController.deleteReview
);

export default router;












