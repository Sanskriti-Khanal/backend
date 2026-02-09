import { Request, Response, NextFunction } from 'express';
import { RudrakshaCategoryService } from '@services/rudraksha-category.service';
import { sendSuccess } from '@utils/response.util';
import { AuthRequest } from '@middleware/auth.middleware';

export class RudrakshaCategoryController {
  private rudrakshaCategoryService: RudrakshaCategoryService;

  constructor() {
    this.rudrakshaCategoryService = new RudrakshaCategoryService();
  }

  createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.rudrakshaCategoryService.createCategory(req.body);
      sendSuccess(res, category, 'Rudraksha category created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.rudrakshaCategoryService.getCategoryById(req.params.id);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  };

  getCategoryBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.rudrakshaCategoryService.getCategoryBySlug(req.params.slug);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  };

  getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await this.rudrakshaCategoryService.getAllCategories(includeInactive);
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
      const type = req.params.type as 'mukhi' | 'special';
      if (type !== 'mukhi' && type !== 'special') {
        return next(new Error('Invalid category type. Must be "mukhi" or "special"'));
      }
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await this.rudrakshaCategoryService.getCategoriesByType(
        type,
        includeInactive
      );
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  };

  getCategoryByMukhiCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const mukhiCount = parseInt(req.params.mukhiCount, 10);
      if (isNaN(mukhiCount) || mukhiCount < 0 || mukhiCount > 26) {
        return next(new Error('Invalid mukhi count. Must be between 0 and 26'));
      }
      const category = await this.rudrakshaCategoryService.getCategoryByMukhiCount(mukhiCount);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.rudrakshaCategoryService.updateCategory(
        req.params.id,
        req.body
      );
      sendSuccess(res, category, 'Rudraksha category updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.rudrakshaCategoryService.deleteCategory(req.params.id);
      sendSuccess(res, null, 'Rudraksha category deleted successfully');
    } catch (error) {
      next(error);
    }
  };

}

