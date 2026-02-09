import mongoose from 'mongoose';
import { PujaRepository } from '@repositories/puja.repository';
import { UserRepository } from '@repositories/user.repository';
import { IPujaListing } from '@models/PujaListing.model';
import { IPujaPackage } from '@models/PujaPackage.model';
import { IPujaReview } from '@models/PujaReview.model';
import { NotFoundError, ConflictError, BadRequestError } from '@errors/AppError';
import { UserRole } from '@types';

export class PujaService {
  private pujaRepository: PujaRepository;
  private userRepository: UserRepository;

  constructor() {
    this.pujaRepository = new PujaRepository();
    this.userRepository = new UserRepository();
  }

  // Helper to extract pujari ID from both populated and non-populated fields
  private getPujariId(pujari: any): string {
    if (pujari instanceof mongoose.Types.ObjectId) {
      return pujari.toString();
    }
    // If populated, it's a User document
    return (pujari?._id?.toString() || pujari?.id?.toString() || pujari?.toString()) || '';
  }

  /** Ensure price fields and timeSlots are always present in API response (so clients always receive them). */
  private normalizePackageForResponse(pkg: IPujaPackage): Record<string, unknown> {
    const raw = pkg.toObject ? pkg.toObject() : (pkg as any);
    return {
      ...raw,
      price: raw.price != null ? Number(raw.price) : 0,
      onlinePrice: raw.onlinePrice != null ? Number(raw.onlinePrice) : raw.price != null ? Number(raw.price) : 0,
      offlinePrice: raw.offlinePrice != null ? Number(raw.offlinePrice) : raw.price != null ? Number(raw.price) : 0,
      timeSlots: Array.isArray(raw.timeSlots) ? raw.timeSlots : [],
    };
  }

  // Listing methods
  async createListing(
    data: Partial<IPujaListing>,
    pujariId: string
  ): Promise<IPujaListing> {
    return this.pujaRepository.createListing({
      ...data,
      pujari: pujariId as any,
    });
  }

  async getListingById(id: string): Promise<IPujaListing> {
    const listing = await this.pujaRepository.findListingById(id);
    if (!listing) {
      throw new NotFoundError('Puja listing not found');
    }
    return listing;
  }

  /** Get pujari profiles that offer this listing's category and are currently available (active). */
  async getAvailablePujarisForListing(listingId: string): Promise<
    Array<{ _id: string; fullName: string; avatarUrl?: string; availabilityStatus?: string }>
  > {
    await this.getListingById(listingId);
    const pujariIds = await this.pujaRepository.findPujariIdsForListingCategory(listingId);
    if (pujariIds.length === 0) return [];
    const users = await this.userRepository.findByIdsWithAvailabilityStatus(
      pujariIds,
      'active'
    );
    return users.map((u: any) => ({
      _id: u._id?.toString() ?? '',
      fullName: u.fullName ?? '',
      avatarUrl: u.avatarUrl,
      availabilityStatus: u.availabilityStatus,
    }));
  }

  /** Get the pujari who offers this package (single pujari, same response shape as listing). */
  async getAvailablePujarisForPackage(packageId: string): Promise<
    Array<{ _id: string; fullName: string; avatarUrl?: string; availabilityStatus?: string }>
  > {
    const pkg = await this.pujaRepository.findPackageById(packageId);
    if (!pkg) throw new NotFoundError('Puja package not found');
    const pujariId = this.getPujariId(pkg.pujari);
    if (!pujariId) return [];
    const users = await this.userRepository.findByIdsWithAvailabilityStatus(
      [pujariId as any],
      'active'
    );
    return users.map((u: any) => ({
      _id: u._id?.toString() ?? '',
      fullName: u.fullName ?? '',
      avatarUrl: u.avatarUrl,
      availabilityStatus: u.availabilityStatus,
    }));
  }

  async getAllListings(includeInactive: boolean = false): Promise<IPujaListing[]> {
    if (includeInactive) {
      return this.pujaRepository.findAllListings();
    }
    return this.pujaRepository.findActiveListings();
  }

  async getListingsByPujari(pujariId: string): Promise<IPujaListing[]> {
    return this.pujaRepository.findListingsByPujari(pujariId);
  }

  async getListingsByCategory(category: string): Promise<IPujaListing[]> {
    return this.pujaRepository.findListingsByCategory(category);
  }

  async searchListings(query: string): Promise<IPujaListing[]> {
    return this.pujaRepository.searchListings(query);
  }

  async updateListing(
    id: string,
    data: Partial<IPujaListing>,
    userId: string,
    userRole: UserRole
  ): Promise<IPujaListing> {
    const listing = await this.pujaRepository.findListingById(id);
    if (!listing) {
      throw new NotFoundError('Puja listing not found');
    }

    // Only pujari who created it or admin can update
    const pujariId = this.getPujariId(listing.pujari);
    if (userRole !== UserRole.ADMIN && pujariId !== userId) {
      throw new BadRequestError(
        'You do not have permission to update this listing'
      );
    }

    const updatedListing = await this.pujaRepository.updateListing(id, data);
    if (!updatedListing) {
      throw new NotFoundError('Puja listing not found');
    }

    return updatedListing;
  }

  async deleteListing(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    const listing = await this.pujaRepository.findListingById(id);
    if (!listing) {
      throw new NotFoundError('Puja listing not found');
    }

    // Only pujari who created it or admin can delete
    const pujariId = this.getPujariId(listing.pujari);
    if (userRole !== UserRole.ADMIN && pujariId !== userId) {
      throw new BadRequestError(
        'You do not have permission to delete this listing'
      );
    }

    const deleted = await this.pujaRepository.deleteListing(id);
    if (!deleted) {
      throw new NotFoundError('Puja listing not found');
    }
  }

  // Package methods
  async createPackage(
    data: Partial<IPujaPackage>,
    pujariId: string
  ): Promise<IPujaPackage> {
    // Validate that all listings belong to the pujari
    if (data.listings && data.listings.length > 0) {
      const listings = await Promise.all(
        (data.listings as any[]).map((listingId) =>
          this.pujaRepository.findListingById(listingId.toString())
        )
      );

      const invalidListings = listings.filter((listing) => {
        if (!listing) return true;
        // Handle both populated (User object) and non-populated (ObjectId) cases
        const listingPujariId = this.getPujariId(listing.pujari);
        return listingPujariId !== pujariId;
      });

      if (invalidListings.length > 0) {
        throw new BadRequestError(
          'All listings in the package must belong to you'
        );
      }
    }

    return this.pujaRepository.createPackage({
      ...data,
      pujari: pujariId as any,
    });
  }

  async getPackageById(id: string): Promise<Record<string, unknown>> {
    const package_ = await this.pujaRepository.findPackageById(id);
    if (!package_) {
      throw new NotFoundError('Puja package not found');
    }
    return this.normalizePackageForResponse(package_);
  }

  async getAllPackages(includeInactive: boolean = false): Promise<Record<string, unknown>[]> {
    const packages = includeInactive
      ? await this.pujaRepository.findAllPackages()
      : await this.pujaRepository.findActivePackages();
    return packages.map((p) => this.normalizePackageForResponse(p));
  }

  async getPackagesByPujari(pujariId: string): Promise<Record<string, unknown>[]> {
    const packages = await this.pujaRepository.findPackagesByPujari(pujariId);
    return packages.map((p) => this.normalizePackageForResponse(p));
  }

  async updatePackage(
    id: string,
    data: Partial<IPujaPackage>,
    userId: string,
    userRole: UserRole
  ): Promise<IPujaPackage> {
    const package_ = await this.pujaRepository.findPackageById(id);
    if (!package_) {
      throw new NotFoundError('Puja package not found');
    }

    // Only pujari who created it or admin can update
    const packagePujariId = this.getPujariId(package_.pujari);
    if (userRole !== UserRole.ADMIN && packagePujariId !== userId) {
      throw new BadRequestError(
        'You do not have permission to update this package'
      );
    }

    // Validate listings if being updated
    if (data.listings && data.listings.length > 0) {
      const listings = await Promise.all(
        (data.listings as any[]).map((listingId) =>
          this.pujaRepository.findListingById(listingId.toString())
        )
      );

      const invalidListings = listings.filter(
        (listing) => !listing || this.getPujariId(listing.pujari) !== userId
      );

      if (invalidListings.length > 0) {
        throw new BadRequestError(
          'All listings in the package must belong to you'
        );
      }
    }

    const updatedPackage = await this.pujaRepository.updatePackage(id, data);
    if (!updatedPackage) {
      throw new NotFoundError('Puja package not found');
    }

    return updatedPackage;
  }

  async deletePackage(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    const package_ = await this.pujaRepository.findPackageById(id);
    if (!package_) {
      throw new NotFoundError('Puja package not found');
    }

    // Only pujari who created it or admin can delete
    const packagePujariId = this.getPujariId(package_.pujari);
    if (userRole !== UserRole.ADMIN && packagePujariId !== userId) {
      throw new BadRequestError(
        'You do not have permission to delete this package'
      );
    }

    const deleted = await this.pujaRepository.deletePackage(id);
    if (!deleted) {
      throw new NotFoundError('Puja package not found');
    }
  }

  // Review methods
  async createReview(
    listingId: string,
    userId: string,
    data: { rating: number; comment?: string }
  ): Promise<IPujaReview> {
    const listing = await this.pujaRepository.findListingById(listingId);
    if (!listing) {
      throw new NotFoundError('Puja listing not found');
    }

    // Check if user already reviewed this listing
    const existingReview = await this.pujaRepository.findReviewByListingAndUser(
      listingId,
      userId
    );
    if (existingReview) {
      throw new ConflictError('You have already reviewed this listing');
    }

    return this.pujaRepository.createReview({
      listing: listingId as any,
      user: userId as any,
      rating: data.rating,
      comment: data.comment,
    });
  }

  async getListingReviews(listingId: string): Promise<IPujaReview[]> {
    const listing = await this.pujaRepository.findListingById(listingId);
    if (!listing) {
      throw new NotFoundError('Puja listing not found');
    }

    return this.pujaRepository.findReviewsByListing(listingId);
  }

  async getListingWithReviews(listingId: string): Promise<{
    listing: IPujaListing;
    reviews: IPujaReview[];
    ratingStats: { averageRating: number; totalReviews: number };
  }> {
    const listing = await this.pujaRepository.findListingById(listingId);
    if (!listing) {
      throw new NotFoundError('Puja listing not found');
    }

    const reviews = await this.pujaRepository.findReviewsByListing(listingId);
    const ratingStats = await this.pujaRepository.getListingRatingStats(listingId);

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
  ): Promise<IPujaReview> {
    const review = await this.pujaRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new BadRequestError('You do not have permission to update this review');
    }

    const updatedReview = await this.pujaRepository.updateReview(reviewId, data);
    if (!updatedReview) {
      throw new NotFoundError('Review not found');
    }

    return updatedReview;
  }

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.pujaRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new BadRequestError('You do not have permission to delete this review');
    }

    const deleted = await this.pujaRepository.deleteReview(reviewId);
    if (!deleted) {
      throw new NotFoundError('Review not found');
    }
  }
}












