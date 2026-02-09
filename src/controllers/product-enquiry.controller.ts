import { Request, Response, NextFunction } from 'express';
import { ProductEnquiryService } from '@services/product-enquiry.service';
import { sendSuccess } from '@utils/response.util';
import { EnquiryStatus } from '@models/ProductEnquiry.model';

export class ProductEnquiryController {
  private enquiryService: ProductEnquiryService;

  constructor() {
    this.enquiryService = new ProductEnquiryService();
  }

  createEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId, mobile, email, message } = req.body;
      const enquiry = await this.enquiryService.createEnquiry({
        productId,
        mobile,
        email,
        message,
      });
      sendSuccess(res, enquiry, 'Enquiry submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getAllEnquiries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as EnquiryStatus | undefined;
      const enquiries = await this.enquiryService.getAllEnquiries(
        status ? { status } : undefined
      );
      sendSuccess(res, enquiries);
    } catch (error) {
      next(error);
    }
  };

  getEnquiryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const enquiry = await this.enquiryService.getEnquiryById(req.params.id);
      sendSuccess(res, enquiry);
    } catch (error) {
      next(error);
    }
  };

  getEnquiriesByProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const enquiries = await this.enquiryService.getEnquiriesByProduct(req.params.productId);
      sendSuccess(res, enquiries);
    } catch (error) {
      next(error);
    }
  };

  updateEnquiryStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { status } = req.body;
      const enquiry = await this.enquiryService.updateEnquiryStatus(req.params.id, status);
      sendSuccess(res, enquiry, 'Enquiry status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.enquiryService.deleteEnquiry(req.params.id);
      sendSuccess(res, null, 'Enquiry deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getEnquiryStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.enquiryService.getEnquiryStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
