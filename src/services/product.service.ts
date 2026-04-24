import { ProductRepository } from '@repositories/product.repository';
import { PaymentRepository } from '@repositories/payment.repository';
import { RudrakshaCategoryRepository } from '@repositories/rudraksha-category.repository';
import { GemCategoryRepository } from '@repositories/gem-category.repository';
import { OrderType } from '@models/Order.model';
import { IProduct } from '@models/Product.model';
import { IProductReview } from '@models/ProductReview.model';
import { NotFoundError, ConflictError, BadRequestError } from '@errors/AppError';
import { UserRole } from '@types';

export class ProductService {
  private productRepository: ProductRepository;
  private paymentRepository: PaymentRepository;
  private rudrakshaCategoryRepository: RudrakshaCategoryRepository;
  private gemCategoryRepository: GemCategoryRepository;

  constructor() {
    this.productRepository = new ProductRepository();
    this.paymentRepository = new PaymentRepository();
    this.rudrakshaCategoryRepository = new RudrakshaCategoryRepository();
    this.gemCategoryRepository = new GemCategoryRepository();
  }

  async createProduct(
    data: Partial<IProduct>,
    createdBy: string
  ): Promise<IProduct> {
    // Check if SKU already exists
    if (data.sku) {
      const existingProduct = await this.productRepository.findBySku(data.sku);
      if (existingProduct) {
        throw new ConflictError('Product with this SKU already exists');
      }
    }

    return this.productRepository.create({
      ...data,
      createdBy: createdBy as any,
    });
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async getAllProducts(includeInactive: boolean = false): Promise<IProduct[]> {
    if (includeInactive) {
      return this.productRepository.findAll();
    }
    return this.productRepository.findActive();
  }

  async searchProducts(query: string): Promise<IProduct[]> {
    return this.productRepository.search(query);
  }

  async getProductsByCategory(category: string): Promise<IProduct[]> {
    return this.productRepository.findByCategory(category);
  }

  async getProductsByRudrakshaCategorySlug(
    slug: string,
    productType?: string
  ): Promise<IProduct[]> {
    const category = await this.rudrakshaCategoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundError('Rudraksha category not found');
    }
    return this.productRepository.findByRudrakshaCategoryAndType(
      category._id.toString(),
      productType
    );
  }

  /**
   * Slugs that share the same inventory (separate GemCategory docs, same catalog).
   * e.g. products tagged `red-coral` still show under `coral` and vice versa.
   */
  private expandGemCategorySlugs(slug: string): string[] {
    const normalized = slug.trim().toLowerCase();
    const groups: string[][] = [
      ['coral', 'red-coral'],
      ['pearl', 'south-sea-pearl'],
    ];
    for (const g of groups) {
      if (g.includes(normalized)) return g;
    }
    return [slug.trim()];
  }

  async getProductsByGemCategorySlug(slug: string): Promise<IProduct[]> {
    const slugs = this.expandGemCategorySlugs(slug);
    const categoryIds: string[] = [];
    for (const s of slugs) {
      const category = await this.gemCategoryRepository.findBySlug(s);
      if (category) categoryIds.push(category._id.toString());
    }
    if (categoryIds.length === 0) {
      throw new NotFoundError('Gem category not found');
    }
    return this.productRepository.findByGemCategories(categoryIds);
  }

  async updateProduct(
    id: string,
    data: Partial<IProduct>,
    userId: string,
    userRole: UserRole
  ): Promise<IProduct> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Only admin or creator can update
    if (
      userRole !== UserRole.ADMIN &&
      product.createdBy?.toString() !== userId
    ) {
      throw new BadRequestError('You do not have permission to update this product');
    }

    return this.productRepository.update(id, data) as Promise<IProduct>;
  }

  async deleteProduct(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Only admin or creator can delete
    if (
      userRole !== UserRole.ADMIN &&
      product.createdBy?.toString() !== userId
    ) {
      throw new BadRequestError('You do not have permission to delete this product');
    }

    const deleted = await this.productRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Product not found');
    }
  }

  async updateStock(id: string, quantity: number): Promise<IProduct> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const updatedProduct = await this.productRepository.updateStock(id, quantity);
    if (!updatedProduct) {
      throw new NotFoundError('Product not found');
    }

    return updatedProduct;
  }

  // Review methods
  async createReview(
    productId: string,
    userId: string,
    data: { rating: number; comment?: string }
  ): Promise<IProductReview> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.productRepository.findReviewByProductAndUser(
      productId,
      userId
    );
    if (existingReview) {
      throw new ConflictError('You have already reviewed this product');
    }

    const hasPurchased = await this.paymentRepository.userHasCompletedServiceListingPurchase(
      userId,
      productId,
      OrderType.PRODUCT,
      'product'
    );
    if (!hasPurchased) {
      throw new BadRequestError(
        'You can only review this product after completing a purchase'
      );
    }

    return this.productRepository.createReview({
      product: productId as any,
      user: userId as any,
      rating: data.rating,
      comment: data.comment,
    });
  }

  async getProductReviews(productId: string): Promise<IProductReview[]> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return this.productRepository.findReviewsByProduct(productId);
  }

  async getProductWithReviews(productId: string): Promise<{
    product: IProduct;
    reviews: IProductReview[];
    ratingStats: { averageRating: number; totalReviews: number };
  }> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const reviews = await this.productRepository.findReviewsByProduct(productId);
    const ratingStats = await this.productRepository.getProductRatingStats(productId);

    return {
      product,
      reviews,
      ratingStats,
    };
  }

  async updateReview(
    reviewId: string,
    userId: string,
    data: { rating?: number; comment?: string }
  ): Promise<IProductReview> {
    const review = await this.productRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new BadRequestError('You do not have permission to update this review');
    }

    const updatedReview = await this.productRepository.updateReview(reviewId, data);
    if (!updatedReview) {
      throw new NotFoundError('Review not found');
    }

    return updatedReview;
  }

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.productRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new BadRequestError('You do not have permission to delete this review');
    }

    const deleted = await this.productRepository.deleteReview(reviewId);
    if (!deleted) {
      throw new NotFoundError('Review not found');
    }
  }
}

