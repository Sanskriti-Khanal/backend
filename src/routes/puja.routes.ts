import { Router } from 'express';
import { PujaController } from '@controllers/puja.controller';
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
} from '@validators/puja.validator';

const router = Router();
const pujaController = new PujaController();

// Public routes - Listings
router.get('/listings', pujaController.getAllListings);
router.get(
  '/listings/search',
  validate(searchListingSchema),
  pujaController.searchListings
);
router.get(
  '/listings/category/:category',
  validate(categoryListingSchema),
  pujaController.getListingsByCategory
);
router.get('/listings/:id', validate(listingIdSchema), pujaController.getListing);
router.get(
  '/listings/:id/reviews',
  validate(listingIdSchema),
  pujaController.getListingReviews
);
router.get(
  '/listings/:id/details',
  validate(listingIdSchema),
  pujaController.getListingWithReviews
);
router.get(
  '/listings/:id/review-eligibility',
  authenticate,
  validate(listingIdSchema),
  pujaController.getReviewEligibility
);
router.get(
  '/listings/:id/available-pujaris',
  validate(listingIdSchema),
  pujaController.getAvailablePujarisForListing
);

// Public routes - Packages (specific paths before :id)
router.get('/packages', pujaController.getAllPackages);
router.get(
  '/packages/pujari/:pujariId',
  pujaController.getPackagesByPujari
);
router.get(
  '/packages/:id/available-pujaris',
  validate(packageIdSchema),
  pujaController.getAvailablePujarisForPackage
);
router.get('/packages/:id', validate(packageIdSchema), pujaController.getPackage);

// Protected routes - Listings (Pujari or Admin only)
router.post(
  '/listings',
  authenticate,
  authorize(
    UserRole.JYOTISH,
    UserRole.PREMIUM_JYOTISH,
    UserRole.VAASTU,
    UserRole.ADMIN
  ),
  validate(createListingSchema),
  pujaController.createListing
);
router.put(
  '/listings/:id',
  authenticate,
  validate(updateListingSchema),
  validate(listingIdSchema),
  pujaController.updateListing
);
router.delete(
  '/listings/:id',
  authenticate,
  validate(listingIdSchema),
  pujaController.deleteListing
);
router.get(
  '/listings/pujari/:pujariId',
  pujaController.getListingsByPujari
);

// Protected routes - Packages (Pujari or Admin only)
router.post(
  '/packages',
  authenticate,
  authorize(
    UserRole.JYOTISH,
    UserRole.PREMIUM_JYOTISH,
    UserRole.VAASTU,
    UserRole.ADMIN
  ),
  validate(createPackageSchema),
  pujaController.createPackage
);
router.put(
  '/packages/:id',
  authenticate,
  validate(updatePackageSchema),
  validate(packageIdSchema),
  pujaController.updatePackage
);
router.delete(
  '/packages/:id',
  authenticate,
  validate(packageIdSchema),
  pujaController.deletePackage
);

// Protected routes - Reviews (Authenticated users)
router.post(
  '/listings/:id/reviews',
  authenticate,
  validate(createReviewSchema),
  pujaController.createReview
);
router.put(
  '/reviews/:reviewId',
  authenticate,
  validate(updateReviewSchema),
  pujaController.updateReview
);
router.delete(
  '/reviews/:reviewId',
  authenticate,
  validate(reviewIdSchema),
  pujaController.deleteReview
);

export default router;










