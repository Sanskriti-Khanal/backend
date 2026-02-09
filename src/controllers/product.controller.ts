import { Request, Response, NextFunction } from 'express';
import { ProductService } from '@services/product.service';
import { sendSuccess } from '@utils/response.util';
import { AuthRequest } from '@middleware/auth.middleware';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.createProduct(req.body, req.user!.id);
      sendSuccess(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.getProductById(req.params.id);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  };

  getProductWithReviews = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.productService.getProductWithReviews(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const products = await this.productService.getAllProducts(includeInactive);
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };

  searchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query.q as string;
      const products = await this.productService.searchProducts(query);
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };

  getProductsByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const products = await this.productService.getProductsByCategory(req.params.category);
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };

  getProductsByRudrakshaCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const slug = req.params.slug;
      const productType = req.query.type as string | undefined;
      const products = await this.productService.getProductsByRudrakshaCategorySlug(
        slug,
        productType
      );
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };

  getProductsByGemCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const slug = req.params.slug;
      const products = await this.productService.getProductsByGemCategorySlug(slug);
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.productService.updateProduct(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.productService.deleteProduct(req.params.id, req.user!.id, req.user!.role);
      sendSuccess(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  createReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const review = await this.productService.createReview(
        req.params.id,
        req.user!.id,
        req.body
      );
      sendSuccess(res, review, 'Review created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getProductReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviews = await this.productService.getProductReviews(req.params.id);
      sendSuccess(res, reviews);
    } catch (error) {
      next(error);
    }
  };

  updateReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const review = await this.productService.updateReview(
        req.params.reviewId,
        req.user!.id,
        req.body
      );
      sendSuccess(res, review, 'Review updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.productService.deleteReview(req.params.reviewId, req.user!.id);
      sendSuccess(res, null, 'Review deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}











