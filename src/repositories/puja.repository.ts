import mongoose from 'mongoose';
import { PujaListingModel, IPujaListing } from '@models/PujaListing.model';
import { PujaPackageModel, IPujaPackage } from '@models/PujaPackage.model';
import { PujaReviewModel, IPujaReview } from '@models/PujaReview.model';

export class PujaRepository {
  // Listing methods
  async createListing(listingData: Partial<IPujaListing>): Promise<IPujaListing> {
    return PujaListingModel.create(listingData);
  }

  async findListingById(id: string): Promise<IPujaListing | null> {
    return PujaListingModel.findById(id).populate('pujari', 'fullName');
  }

  async findAllListings(filter: any = {}): Promise<IPujaListing[]> {
    return PujaListingModel.find(filter)
      .populate('pujari', 'fullName')
      .sort({ createdAt: -1 });
  }

  async findActiveListings(filter: any = {}): Promise<IPujaListing[]> {
    return PujaListingModel.find({ ...filter, isActive: true })
      .populate('pujari', 'fullName')
      .sort({ createdAt: -1 });
  }

  async findListingsByPujari(pujariId: string): Promise<IPujaListing[]> {
    return PujaListingModel.find({ pujari: pujariId })
      .populate('pujari', 'fullName')
      .sort({ createdAt: -1 });
  }

  async findListingsByCategory(category: string): Promise<IPujaListing[]> {
    return PujaListingModel.find({ category, isActive: true })
      .populate('pujari', 'fullName')
      .sort({ createdAt: -1 });
  }

  /** Get distinct pujari IDs that have listings in the same category as the given listing (or all active listings if no category). */
  async findPujariIdsForListingCategory(listingId: string): Promise<mongoose.Types.ObjectId[]> {
    const listing = await PujaListingModel.findById(listingId).select('category').lean();
    if (!listing) return [];
    const filter: Record<string, unknown> = { isActive: true };
    if (listing.category != null && String(listing.category).trim() !== '') {
      filter.category = listing.category;
    }
    const ids = await PujaListingModel.find(filter).distinct('pujari').exec();
    return ids;
  }

  async searchListings(query: string): Promise<IPujaListing[]> {
    return PujaListingModel.find({
      $text: { $search: query },
      isActive: true,
    })
      .populate('pujari', 'fullName')
      .sort({ createdAt: -1 });
  }

  async updateListing(
    id: string,
    data: Partial<IPujaListing>
  ): Promise<IPujaListing | null> {
    return PujaListingModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deleteListing(id: string): Promise<boolean> {
    const result = await PujaListingModel.findByIdAndDelete(id);
    return !!result;
  }

  // Package methods
  async createPackage(packageData: Partial<IPujaPackage>): Promise<IPujaPackage> {
    return PujaPackageModel.create(packageData);
  }

  async findPackageById(id: string): Promise<IPujaPackage | null> {
    return PujaPackageModel.findById(id)
      .populate('pujari', 'fullName')
      .populate('listings');
  }

  async findAllPackages(filter: any = {}): Promise<IPujaPackage[]> {
    return PujaPackageModel.find(filter)
      .populate('pujari', 'fullName')
      .populate('listings')
      .sort({ createdAt: -1 });
  }

  async findActivePackages(filter: any = {}): Promise<IPujaPackage[]> {
    return PujaPackageModel.find({ ...filter, isActive: true })
      .populate('pujari', 'fullName')
      .populate('listings')
      .sort({ createdAt: -1 });
  }

  async findPackagesByPujari(pujariId: string): Promise<IPujaPackage[]> {
    return PujaPackageModel.find({ pujari: pujariId })
      .populate('pujari', 'fullName')
      .populate('listings')
      .sort({ createdAt: -1 });
  }

  async updatePackage(
    id: string,
    data: Partial<IPujaPackage>
  ): Promise<IPujaPackage | null> {
    return PujaPackageModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deletePackage(id: string): Promise<boolean> {
    const result = await PujaPackageModel.findByIdAndDelete(id);
    return !!result;
  }

  // Review methods
  async createReview(reviewData: Partial<IPujaReview>): Promise<IPujaReview> {
    return PujaReviewModel.create(reviewData);
  }

  async findReviewById(reviewId: string): Promise<IPujaReview | null> {
    return PujaReviewModel.findById(reviewId);
  }

  async findReviewByListingAndUser(
    listingId: string,
    userId: string
  ): Promise<IPujaReview | null> {
    return PujaReviewModel.findOne({ listing: listingId, user: userId });
  }

  async findReviewsByListing(listingId: string): Promise<IPujaReview[]> {
    return PujaReviewModel.find({ listing: listingId })
      .populate('user', 'fullName username')
      .sort({ createdAt: -1 });
  }

  async getListingRatingStats(listingId: string): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const stats = await PujaReviewModel.aggregate([
      { $match: { listing: new mongoose.Types.ObjectId(listingId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    return {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    };
  }

  async updateReview(
    reviewId: string,
    data: Partial<IPujaReview>
  ): Promise<IPujaReview | null> {
    return PujaReviewModel.findByIdAndUpdate(reviewId, data, { new: true });
  }

  async deleteReview(reviewId: string): Promise<boolean> {
    const result = await PujaReviewModel.findByIdAndDelete(reviewId);
    return !!result;
  }
}












