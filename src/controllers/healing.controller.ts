import { Request, Response, NextFunction } from 'express';
import { HealingService } from '@services/healing.service';
import { sendSuccess } from '@utils/response.util';
import { AuthRequest } from '@middleware/auth.middleware';

export class HealingController {
  private healingService: HealingService;

  constructor() {
    this.healingService = new HealingService();
  }

  // Listing methods
  createListing = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listing = await this.healingService.createListing(
        req.body,
        req.user!.id
      );
      sendSuccess(res, listing, 'Healing listing created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.healingService.getListingById(req.params.id);
      sendSuccess(res, listing);
    } catch (error) {
      next(error);
    }
  };

  getListingWithReviews = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.healingService.getListingWithReviews(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getAllListings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const listings = await this.healingService.getAllListings(includeInactive);
      sendSuccess(res, listings);
    } catch (error) {
      next(error);
    }
  };

  getListingsByHealer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listings = await this.healingService.getListingsByHealer(
        req.params.healerId
      );
      sendSuccess(res, listings);
    } catch (error) {
      next(error);
    }
  };

  searchListings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = req.query.q as string;
      const listings = await this.healingService.searchListings(query);
      sendSuccess(res, listings);
    } catch (error) {
      next(error);
    }
  };

  getListingsByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listings = await this.healingService.getListingsByCategory(
        req.params.category
      );
      sendSuccess(res, listings);
    } catch (error) {
      next(error);
    }
  };

  updateListing = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listing = await this.healingService.updateListing(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, listing, 'Healing listing updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteListing = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.healingService.deleteListing(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, null, 'Healing listing deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Package methods
  createPackage = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const package_ = await this.healingService.createPackage(
        req.body,
        req.user!.id
      );
      sendSuccess(res, package_, 'Healing package created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getPackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const package_ = await this.healingService.getPackageById(req.params.id);
      sendSuccess(res, package_);
    } catch (error) {
      next(error);
    }
  };

  getAllPackages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const packages = await this.healingService.getAllPackages(includeInactive);
      sendSuccess(res, packages);
    } catch (error) {
      next(error);
    }
  };

  getPackagesByHealer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const packages = await this.healingService.getPackagesByHealer(
        req.params.healerId
      );
      sendSuccess(res, packages);
    } catch (error) {
      next(error);
    }
  };

  updatePackage = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const package_ = await this.healingService.updatePackage(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, package_, 'Healing package updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deletePackage = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.healingService.deletePackage(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, null, 'Healing package deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Review methods
  createReview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const review = await this.healingService.createReview(
        req.params.id,
        req.user!.id,
        req.body
      );
      sendSuccess(res, review, 'Review created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getListingReviews = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reviews = await this.healingService.getListingReviews(req.params.id);
      sendSuccess(res, reviews);
    } catch (error) {
      next(error);
    }
  };

  updateReview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const review = await this.healingService.updateReview(
        req.params.reviewId,
        req.user!.id,
        req.body
      );
      sendSuccess(res, review, 'Review updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteReview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.healingService.deleteReview(req.params.reviewId, req.user!.id);
      sendSuccess(res, null, 'Review deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}












