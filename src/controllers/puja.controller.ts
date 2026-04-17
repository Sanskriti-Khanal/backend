import { Request, Response, NextFunction } from 'express';
import { PujaService } from '@services/puja.service';
import { sendSuccess } from '@utils/response.util';
import { AuthRequest } from '@middleware/auth.middleware';

export class PujaController {
  private pujaService: PujaService;

  constructor() {
    this.pujaService = new PujaService();
  }

  // Listing methods
  createListing = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listing = await this.pujaService.createListing(
        req.body,
        req.user!.id
      );
      sendSuccess(res, listing, 'Puja listing created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listing = await this.pujaService.getListingById(req.params.id);
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
      const result = await this.pujaService.getListingWithReviews(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getAvailablePujarisForListing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const list = await this.pujaService.getAvailablePujarisForListing(
        req.params.id
      );
      sendSuccess(res, list);
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
      const listings = await this.pujaService.getAllListings(includeInactive);
      sendSuccess(res, listings);
    } catch (error) {
      next(error);
    }
  };

  getListingsByPujari = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listings = await this.pujaService.getListingsByPujari(
        req.params.pujariId
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
      const listings = await this.pujaService.searchListings(query);
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
      const listings = await this.pujaService.getListingsByCategory(
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
      const listing = await this.pujaService.updateListing(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, listing, 'Puja listing updated successfully');
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
      await this.pujaService.deleteListing(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, null, 'Puja listing deleted successfully');
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
      const package_ = await this.pujaService.createPackage(
        req.body,
        req.user!.id
      );
      sendSuccess(res, package_, 'Puja package created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getPackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const package_ = await this.pujaService.getPackageById(req.params.id);
      sendSuccess(res, package_);
    } catch (error) {
      next(error);
    }
  };

  getAvailablePujarisForPackage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const list = await this.pujaService.getAvailablePujarisForPackage(req.params.id);
      sendSuccess(res, list);
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
      const packages = await this.pujaService.getAllPackages(includeInactive);
      sendSuccess(res, packages);
    } catch (error) {
      next(error);
    }
  };

  getPackagesByPujari = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const packages = await this.pujaService.getPackagesByPujari(
        req.params.pujariId
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
      const package_ = await this.pujaService.updatePackage(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, package_, 'Puja package updated successfully');
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
      await this.pujaService.deletePackage(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, null, 'Puja package deleted successfully');
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
      const review = await this.pujaService.createReview(
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
      const reviews = await this.pujaService.getListingReviews(req.params.id);
      sendSuccess(res, reviews);
    } catch (error) {
      next(error);
    }
  };

  getReviewEligibility = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.pujaService.getListingReviewEligibility(
        req.params.id,
        req.user!.id
      );
      sendSuccess(res, result);
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
      const review = await this.pujaService.updateReview(
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
      await this.pujaService.deleteReview(req.params.reviewId, req.user!.id);
      sendSuccess(res, null, 'Review deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}












