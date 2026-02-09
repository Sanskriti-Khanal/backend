import mongoose from 'mongoose';
import { ProductModel, IProduct } from '@models/Product.model';
import { ProductReviewModel, IProductReview } from '@models/ProductReview.model';

export class ProductRepository {
  async create(productData: Partial<IProduct>): Promise<IProduct> {
    return ProductModel.create(productData);
  }

  async findById(id: string): Promise<IProduct | null> {
    return ProductModel.findById(id).populate('createdBy', 'fullName');
  }

  async findBySku(sku: string): Promise<IProduct | null> {
    return ProductModel.findOne({ sku: sku.toUpperCase() });
  }

  async findAll(filter: any = {}): Promise<IProduct[]> {
    return ProductModel.find(filter)
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
  }

  async findActive(filter: any = {}): Promise<IProduct[]> {
    return ProductModel.find({ ...filter, isActive: true })
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
  }

  async search(query: string): Promise<IProduct[]> {
    return ProductModel.find({
      $text: { $search: query },
      isActive: true,
    })
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
  }

  async findByCategory(category: string): Promise<IProduct[]> {
    return ProductModel.find({ category, isActive: true })
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
  }

  async findByRudrakshaCategory(rudrakshaCategoryId: string): Promise<IProduct[]> {
    return ProductModel.find({
      rudrakshaCategory: rudrakshaCategoryId,
      isActive: true,
    })
      .populate('createdBy', 'fullName')
      .populate('rudrakshaCategory', 'name slug')
      .sort({ createdAt: -1 });
  }

  async findByRudrakshaCategoryAndType(
    rudrakshaCategoryId: string,
    productType?: string
  ): Promise<IProduct[]> {
    const filter: any = {
      rudrakshaCategory: rudrakshaCategoryId,
      isActive: true,
    };
    if (productType) {
      filter.productType = productType;
    }
    return ProductModel.find(filter)
      .populate('createdBy', 'fullName')
      .populate('rudrakshaCategory', 'name slug')
      .sort({ createdAt: -1 });
  }

  async findByGemCategory(gemCategoryId: string): Promise<IProduct[]> {
    return ProductModel.find({
      gemCategory: gemCategoryId,
      isActive: true,
    })
      .populate('createdBy', 'fullName')
      .populate('gemCategory', 'name slug')
      .sort({ createdAt: -1 });
  }

  async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    return ProductModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(id);
    return !!result;
  }

  async updateStock(id: string, quantity: number): Promise<IProduct | null> {
    return ProductModel.findByIdAndUpdate(id, { $inc: { stock: quantity } }, { new: true });
  }

  // Review methods
  async createReview(reviewData: Partial<IProductReview>): Promise<IProductReview> {
    return ProductReviewModel.create(reviewData);
  }

  async findReviewById(reviewId: string): Promise<IProductReview | null> {
    return ProductReviewModel.findById(reviewId);
  }

  async findReviewByProductAndUser(
    productId: string,
    userId: string
  ): Promise<IProductReview | null> {
    return ProductReviewModel.findOne({ product: productId, user: userId });
  }

  async findReviewsByProduct(productId: string): Promise<IProductReview[]> {
    return ProductReviewModel.find({ product: productId })
      .populate('user', 'fullName username')
      .sort({ createdAt: -1 });
  }

  async getProductRatingStats(productId: string): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const stats = await ProductReviewModel.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
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
    data: Partial<IProductReview>
  ): Promise<IProductReview | null> {
    return ProductReviewModel.findByIdAndUpdate(reviewId, data, { new: true });
  }

  async deleteReview(reviewId: string): Promise<boolean> {
    const result = await ProductReviewModel.findByIdAndDelete(reviewId);
    return !!result;
  }
}

