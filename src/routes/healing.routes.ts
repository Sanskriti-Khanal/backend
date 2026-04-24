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
  createPackageReviewSchema,
  updateReviewSchema,
  reviewIdSchema,
  initHealingSessionBookingSchema,
  verifyHealingSessionBookingSchema,
  healingOccupiedDatesQuerySchema,
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
router.get(
  '/listings/:id/review-eligibility',
  authenticate,
  validate(listingIdSchema),
  healingController.getReviewEligibility
);

// Public routes - Packages
router.get('/packages', healingController.getAllPackages);
router.get(
  '/packages/:id',
  validate(packageIdSchema),
  healingController.getPackage
);
router.get(
  '/packages/:id/reviews',
  validate(packageIdSchema),
  healingController.getPackageReviews
);
router.get(
  '/packages/:id/details',
  validate(packageIdSchema),
  healingController.getPackageWithReviews
);
router.get(
  '/packages/:id/review-eligibility',
  authenticate,
  validate(packageIdSchema),
  healingController.getPackageReviewEligibility
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

// Session availability (public — **paid/confirmed** dates only; pending checkout does not mark the calendar)
router.get(
  '/bookings/occupied-dates',
  validate(healingOccupiedDatesQuerySchema),
  healingController.getSessionOccupiedDates
);

// Session bookings (authenticated customers)
router.post(
  '/bookings/init',
  authenticate,
  validate(initHealingSessionBookingSchema),
  healingController.initHealingSessionBooking
);
router.get(
  '/bookings/verify',
  authenticate,
  validate(verifyHealingSessionBookingSchema),
  healingController.verifyHealingSessionBooking
);

// Protected routes - Reviews (Authenticated users)
router.post(
  '/listings/:id/reviews',
  authenticate,
  validate(createReviewSchema),
  healingController.createReview
);
router.post(
  '/packages/:id/reviews',
  authenticate,
  validate(createPackageReviewSchema),
  healingController.createPackageReview
);
router.put(
  '/reviews/:reviewId',
  authenticate,
  validate(updateReviewSchema),
  healingController.updateReview
);
router.put(
  '/package-reviews/:reviewId',
  authenticate,
  validate(updateReviewSchema),
  healingController.updatePackageReview
);
router.delete(
  '/reviews/:reviewId',
  authenticate,
  validate(reviewIdSchema),
  healingController.deleteReview
);
router.delete(
  '/package-reviews/:reviewId',
  authenticate,
  validate(reviewIdSchema),
  healingController.deletePackageReview
);

export default router;












