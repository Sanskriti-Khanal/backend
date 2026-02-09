import { Request, Response, NextFunction } from 'express';
import { GemCategoryService } from '@services/gem-category.service';
import { sendSuccess } from '@utils/response.util';
import { AuthRequest } from '@middleware/auth.middleware';

export class GemCategoryController {
  private gemCategoryService: GemCategoryService;

  constructor() {
    this.gemCategoryService = new GemCategoryService();
  }

  createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.gemCategoryService.createCategory(req.body);
      sendSuccess(res, category, 'Gem category created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.gemCategoryService.getCategoryById(req.params.id);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  };

  getCategoryBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.gemCategoryService.getCategoryBySlug(req.params.slug);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  };

  getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await this.gemCategoryService.getAllCategories(includeInactive);
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  };

  getCategoriesByType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const type = req.params.type as 'precious' | 'semi-precious' | 'other';
      if (type !== 'precious' && type !== 'semi-precious' && type !== 'other') {
        return next(new Error('Invalid category type. Must be "precious", "semi-precious", or "other"'));
      }
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await this.gemCategoryService.getCategoriesByType(
        type,
        includeInactive
      );
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.gemCategoryService.updateCategory(
        req.params.id,
        req.body
      );
      sendSuccess(res, category, 'Gem category updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.gemCategoryService.deleteCategory(req.params.id);
      sendSuccess(res, null, 'Gem category deleted successfully');
    } catch (error) {
      next(error);
    }
  };

}









