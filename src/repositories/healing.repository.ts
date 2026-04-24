import mongoose from 'mongoose';
import {
  HealingListingModel,
  IHealingListing,
} from '@models/HealingListing.model';
import {
  HealingPackageModel,
  IHealingPackage,
} from '@models/HealingPackage.model';
import {
  HealingReviewModel,
  IHealingReview,
} from '@models/HealingReview.model';
import {
  HealingPackageReviewModel,
  IHealingPackageReview,
} from '@models/HealingPackageReview.model';

export class HealingRepository {
  // Listing methods
  async createListing(
    listingData: Partial<IHealingListing>
  ): Promise<IHealingListing> {
    return HealingListingModel.create(listingData);
  }

  async findListingById(id: string): Promise<IHealingListing | null> {
    return HealingListingModel.findById(id).populate('healer', 'fullName');
  }

  async findAllListings(filter: any = {}): Promise<IHealingListing[]> {
    return HealingListingModel.find(filter)
      .populate('healer', 'fullName')
      .sort({ createdAt: -1 });
  }

  async findActiveListings(filter: any = {}): Promise<IHealingListing[]> {
    return HealingListingModel.find({ ...filter, isActive: true })
      .populate('healer', 'fullName')
      .sort({ createdAt: -1 });
  }

  async findListingsByHealer(healerId: string): Promise<IHealingListing[]> {
    return HealingListingModel.find({ healer: healerId })
      .populate('healer', 'fullName')
      .sort({ createdAt: -1 });
  }

  async findListingsByCategory(category: string): Promise<IHealingListing[]> {
    return HealingListingModel.find({ category, isActive: true })
      .populate('healer', 'fullName')
      .sort({ createdAt: -1 });
  }

  async searchListings(query: string): Promise<IHealingListing[]> {
    return HealingListingModel.find({
      $text: { $search: query },
      isActive: true,
    })
      .populate('healer', 'fullName')
      .sort({ createdAt: -1 });
  }

  async updateListing(
    id: string,
    data: Partial<IHealingListing>
  ): Promise<IHealingListing | null> {
    return HealingListingModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deleteListing(id: string): Promise<boolean> {
    const result = await HealingListingModel.findByIdAndDelete(id);
    return !!result;
  }

  // Package methods
  async createPackage(
    packageData: Partial<IHealingPackage>
  ): Promise<IHealingPackage> {
    return HealingPackageModel.create(packageData);
  }

  async findPackageById(id: string): Promise<IHealingPackage | null> {
    return HealingPackageModel.findById(id)
      .populate('healer', 'fullName')
      .populate('listings');
  }

  async findAllPackages(filter: any = {}): Promise<IHealingPackage[]> {
    return HealingPackageModel.find(filter)
      .populate('healer', 'fullName')
      .populate('listings')
      .sort({ createdAt: -1 });
  }

  async findActivePackages(filter: any = {}): Promise<IHealingPackage[]> {
    return HealingPackageModel.find({ ...filter, isActive: true })
      .populate('healer', 'fullName')
      .populate('listings')
      .sort({ createdAt: -1 });
  }

  async findPackagesByHealer(healerId: string): Promise<IHealingPackage[]> {
    return HealingPackageModel.find({ healer: healerId })
      .populate('healer', 'fullName')
      .populate('listings')
      .sort({ createdAt: -1 });
  }

  async updatePackage(
    id: string,
    data: Partial<IHealingPackage>
  ): Promise<IHealingPackage | null> {
    return HealingPackageModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deletePackage(id: string): Promise<boolean> {
    const result = await HealingPackageModel.findByIdAndDelete(id);
    return !!result;
  }

  // Review methods
  async createReview(
    reviewData: Partial<IHealingReview>
  ): Promise<IHealingReview> {
    return HealingReviewModel.create(reviewData);
  }

  async findReviewById(reviewId: string): Promise<IHealingReview | null> {
    return HealingReviewModel.findById(reviewId);
  }

  async findReviewByListingAndUser(
    listingId: string,
    userId: string
  ): Promise<IHealingReview | null> {
    return HealingReviewModel.findOne({ listing: listingId, user: userId });
  }

  async findReviewsByListing(listingId: string): Promise<IHealingReview[]> {
    return HealingReviewModel.find({ listing: listingId })
      .populate('user', 'fullName username')
      .sort({ createdAt: -1 });
  }

  async getListingRatingStats(listingId: string): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const stats = await HealingReviewModel.aggregate([
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
    data: Partial<IHealingReview>
  ): Promise<IHealingReview | null> {
    return HealingReviewModel.findByIdAndUpdate(reviewId, data, { new: true });
  }

  async deleteReview(reviewId: string): Promise<boolean> {
    const result = await HealingReviewModel.findByIdAndDelete(reviewId);
    return !!result;
  }

  // Package review methods
  async createPackageReview(
    reviewData: Partial<IHealingPackageReview>
  ): Promise<IHealingPackageReview> {
    return HealingPackageReviewModel.create(reviewData);
  }

  async findPackageReviewById(reviewId: string): Promise<IHealingPackageReview | null> {
    return HealingPackageReviewModel.findById(reviewId);
  }

  async findPackageReviewByPackageAndUser(
    packageId: string,
    userId: string
  ): Promise<IHealingPackageReview | null> {
    return HealingPackageReviewModel.findOne({ package: packageId, user: userId });
  }

  async findReviewsByPackage(packageId: string): Promise<IHealingPackageReview[]> {
    return HealingPackageReviewModel.find({ package: packageId })
      .populate('user', 'fullName username')
      .sort({ createdAt: -1 });
  }

  async getPackageRatingStats(packageId: string): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const stats = await HealingPackageReviewModel.aggregate([
      { $match: { package: new mongoose.Types.ObjectId(packageId) } },
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

  async updatePackageReview(
    reviewId: string,
    data: Partial<IHealingPackageReview>
  ): Promise<IHealingPackageReview | null> {
    return HealingPackageReviewModel.findByIdAndUpdate(reviewId, data, { new: true });
  }

  async deletePackageReview(reviewId: string): Promise<boolean> {
    const result = await HealingPackageReviewModel.findByIdAndDelete(reviewId);
    return !!result;
  }
}












