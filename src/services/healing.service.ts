import mongoose from 'mongoose';
import { HealingRepository } from '@repositories/healing.repository';
import { PaymentRepository } from '@repositories/payment.repository';
import { OrderType } from '@models/Order.model';
import { IHealingListing } from '@models/HealingListing.model';
import { IHealingPackage } from '@models/HealingPackage.model';
import { IHealingReview } from '@models/HealingReview.model';
import { NotFoundError, ConflictError, BadRequestError } from '@errors/AppError';
import { UserRole } from '@types';

export class HealingService {
  private healingRepository: HealingRepository;
  private paymentRepository: PaymentRepository;

  constructor() {
    this.healingRepository = new HealingRepository();
    this.paymentRepository = new PaymentRepository();
  }

  // Helper to extract healer ID from both populated and non-populated fields
  private getHealerId(healer: any): string {
    if (healer instanceof mongoose.Types.ObjectId) {
      return healer.toString();
    }
    // If populated, it's a User document
    return (healer?._id?.toString() || healer?.id?.toString() || healer?.toString()) || '';
  }

  // Listing methods
  async createListing(
    data: Partial<IHealingListing>,
    healerId: string
  ): Promise<IHealingListing> {
    return this.healingRepository.createListing({
      ...data,
      healer: healerId as any,
    });
  }

  async getListingById(id: string): Promise<IHealingListing> {
    const listing = await this.healingRepository.findListingById(id);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }
    return listing;
  }

  async getAllListings(includeInactive: boolean = false): Promise<IHealingListing[]> {
    if (includeInactive) {
      return this.healingRepository.findAllListings();
    }
    return this.healingRepository.findActiveListings();
  }

  async getListingsByHealer(healerId: string): Promise<IHealingListing[]> {
    return this.healingRepository.findListingsByHealer(healerId);
  }

  async getListingsByCategory(category: string): Promise<IHealingListing[]> {
    return this.healingRepository.findListingsByCategory(category);
  }

  async searchListings(query: string): Promise<IHealingListing[]> {
    return this.healingRepository.searchListings(query);
  }

  async updateListing(
    id: string,
    data: Partial<IHealingListing>,
    userId: string,
    userRole: UserRole
  ): Promise<IHealingListing> {
    const listing = await this.healingRepository.findListingById(id);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    // Only healer who created it or admin can update
    const healerId = this.getHealerId(listing.healer);
    if (userRole !== UserRole.ADMIN && healerId !== userId) {
      throw new BadRequestError(
        'You do not have permission to update this listing'
      );
    }

    const updatedListing = await this.healingRepository.updateListing(id, data);
    if (!updatedListing) {
      throw new NotFoundError('Healing listing not found');
    }

    return updatedListing;
  }

  async deleteListing(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    const listing = await this.healingRepository.findListingById(id);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    // Only healer who created it or admin can delete
    const healerId = this.getHealerId(listing.healer);
    if (userRole !== UserRole.ADMIN && healerId !== userId) {
      throw new BadRequestError(
        'You do not have permission to delete this listing'
      );
    }

    const deleted = await this.healingRepository.deleteListing(id);
    if (!deleted) {
      throw new NotFoundError('Healing listing not found');
    }
  }

  // Package methods
  async createPackage(
    data: Partial<IHealingPackage>,
    healerId: string
  ): Promise<IHealingPackage> {
    // Validate that all listings belong to the healer
    if (data.listings && data.listings.length > 0) {
      const listings = await Promise.all(
        (data.listings as any[]).map((listingId) =>
          this.healingRepository.findListingById(listingId.toString())
        )
      );

      const invalidListings = listings.filter((listing) => {
        if (!listing) return true;
        // Handle both populated (User object) and non-populated (ObjectId) cases
        const listingHealerId = this.getHealerId(listing.healer);
        return listingHealerId !== healerId;
      });

      if (invalidListings.length > 0) {
        throw new BadRequestError(
          'All listings in the package must belong to you'
        );
      }
    }

    return this.healingRepository.createPackage({
      ...data,
      healer: healerId as any,
    });
  }

  async getPackageById(id: string): Promise<IHealingPackage> {
    const package_ = await this.healingRepository.findPackageById(id);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }
    return package_;
  }

  async getAllPackages(includeInactive: boolean = false): Promise<IHealingPackage[]> {
    if (includeInactive) {
      return this.healingRepository.findAllPackages();
    }
    return this.healingRepository.findActivePackages();
  }

  async getPackagesByHealer(healerId: string): Promise<IHealingPackage[]> {
    return this.healingRepository.findPackagesByHealer(healerId);
  }

  async updatePackage(
    id: string,
    data: Partial<IHealingPackage>,
    userId: string,
    userRole: UserRole
  ): Promise<IHealingPackage> {
    const package_ = await this.healingRepository.findPackageById(id);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }

    // Only healer who created it or admin can update
    const packageHealerId = this.getHealerId(package_.healer);
    if (userRole !== UserRole.ADMIN && packageHealerId !== userId) {
      throw new BadRequestError(
        'You do not have permission to update this package'
      );
    }

    // Validate listings if being updated
    if (data.listings && data.listings.length > 0) {
      const listings = await Promise.all(
        (data.listings as any[]).map((listingId) =>
          this.healingRepository.findListingById(listingId.toString())
        )
      );

      const invalidListings = listings.filter(
        (listing) => !listing || this.getHealerId(listing.healer) !== userId
      );

      if (invalidListings.length > 0) {
        throw new BadRequestError(
          'All listings in the package must belong to you'
        );
      }
    }

    const updatedPackage = await this.healingRepository.updatePackage(id, data);
    if (!updatedPackage) {
      throw new NotFoundError('Healing package not found');
    }

    return updatedPackage;
  }

  async deletePackage(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    const package_ = await this.healingRepository.findPackageById(id);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }

    // Only healer who created it or admin can delete
    const packageHealerId = this.getHealerId(package_.healer);
    if (userRole !== UserRole.ADMIN && packageHealerId !== userId) {
      throw new BadRequestError(
        'You do not have permission to delete this package'
      );
    }

    const deleted = await this.healingRepository.deletePackage(id);
    if (!deleted) {
      throw new NotFoundError('Healing package not found');
    }
  }

  // Review methods
  async createReview(
    listingId: string,
    userId: string,
    data: { rating: number; comment?: string }
  ): Promise<IHealingReview> {
    const listing = await this.healingRepository.findListingById(listingId);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    // Check if user already reviewed this listing
    const existingReview = await this.healingRepository.findReviewByListingAndUser(
      listingId,
      userId
    );
    if (existingReview) {
      throw new ConflictError('You have already reviewed this listing');
    }

    const hasPurchase = await this.paymentRepository.userHasCompletedServiceListingPurchase(
      userId,
      listingId,
      OrderType.HEALING,
      'healing_listing'
    );
    if (!hasPurchase) {
      throw new BadRequestError(
        'You can only review this service after completing a purchase'
      );
    }

    return this.healingRepository.createReview({
      listing: listingId as any,
      user: userId as any,
      rating: data.rating,
      comment: data.comment,
    });
  }

  async getListingReviewEligibility(
    listingId: string,
    userId: string
  ): Promise<{
    hasPurchased: boolean;
    hasExistingReview: boolean;
    canReview: boolean;
  }> {
    const listing = await this.healingRepository.findListingById(listingId);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    const hasPurchased = await this.paymentRepository.userHasCompletedServiceListingPurchase(
      userId,
      listingId,
      OrderType.HEALING,
      'healing_listing'
    );
    const existingReview = await this.healingRepository.findReviewByListingAndUser(
      listingId,
      userId
    );

    return {
      hasPurchased,
      hasExistingReview: !!existingReview,
      canReview: hasPurchased && !existingReview,
    };
  }

  async getListingReviews(listingId: string): Promise<IHealingReview[]> {
    const listing = await this.healingRepository.findListingById(listingId);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    return this.healingRepository.findReviewsByListing(listingId);
  }

  async getListingWithReviews(listingId: string): Promise<{
    listing: IHealingListing;
    reviews: IHealingReview[];
    ratingStats: { averageRating: number; totalReviews: number };
  }> {
    const listing = await this.healingRepository.findListingById(listingId);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    const reviews = await this.healingRepository.findReviewsByListing(listingId);
    const ratingStats = await this.healingRepository.getListingRatingStats(listingId);

    return {
      listing,
      reviews,
      ratingStats,
    };
  }

  async updateReview(
    reviewId: string,
    userId: string,
    data: { rating?: number; comment?: string }
  ): Promise<IHealingReview> {
    const review = await this.healingRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new BadRequestError('You do not have permission to update this review');
    }

    const updatedReview = await this.healingRepository.updateReview(reviewId, data);
    if (!updatedReview) {
      throw new NotFoundError('Review not found');
    }

    return updatedReview;
  }

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.healingRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new BadRequestError('You do not have permission to delete this review');
    }

    const deleted = await this.healingRepository.deleteReview(reviewId);
    if (!deleted) {
      throw new NotFoundError('Review not found');
    }
  }
}










