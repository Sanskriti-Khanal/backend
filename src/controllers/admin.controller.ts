import { Request, Response, NextFunction } from 'express';
import { AdminService } from '@services/admin.service';
import { sendSuccess } from '@utils/response.util';
import { OrderSessionStatus, OrderStatus } from '@models/Order.model';
import { EnquiryStatus } from '@models/ProductEnquiry.model';
import { SavedAstrologyKind } from '@models/SavedAstrology.model';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  // Dashboard
  getDashboardStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };

  // User Management
  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = req.query.role as any;
      const users = await this.adminService.getAllUsers(role);
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.adminService.getUserById(req.params.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.adminService.createUser(req.body);
      sendSuccess(res, user, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.adminService.updateUser(req.params.id, req.body);
      sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.adminService.deleteUser(req.params.id);
      sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Product Management
  getAllProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const products = await this.adminService.getAllProducts();
      sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.adminService.getProductById(req.params.id);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.adminService.createProduct(req.body);
      sendSuccess(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.adminService.updateProduct(req.params.id, req.body);
      sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.adminService.deleteProduct(req.params.id);
      sendSuccess(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Healing Services Management
  getAllHealingListings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listings = await this.adminService.getAllHealingListings();
      sendSuccess(res, listings);
    } catch (error) {
      next(error);
    }
  };

  getHealingListingById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listing = await this.adminService.getHealingListingById(req.params.id);
      sendSuccess(res, listing);
    } catch (error) {
      next(error);
    }
  };

  createHealingListing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listing = await this.adminService.createHealingListing(req.body);
      sendSuccess(res, listing, 'Healing listing created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateHealingListing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listing = await this.adminService.updateHealingListing(
        req.params.id,
        req.body
      );
      sendSuccess(res, listing, 'Healing listing updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteHealingListing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.adminService.deleteHealingListing(req.params.id);
      sendSuccess(res, null, 'Healing listing deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getAllHealingPackages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const packages = await this.adminService.getAllHealingPackages();
      sendSuccess(res, packages);
    } catch (error) {
      next(error);
    }
  };

  getHealingPackageById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const package_ = await this.adminService.getHealingPackageById(req.params.id);
      sendSuccess(res, package_);
    } catch (error) {
      next(error);
    }
  };

  createHealingPackage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const package_ = await this.adminService.createHealingPackage(req.body);
      sendSuccess(res, package_, 'Healing package created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateHealingPackage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const package_ = await this.adminService.updateHealingPackage(
        req.params.id,
        req.body
      );
      sendSuccess(res, package_, 'Healing package updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteHealingPackage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.adminService.deleteHealingPackage(req.params.id);
      sendSuccess(res, null, 'Healing package deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Puja Services Management
  getAllPujaListings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listings = await this.adminService.getAllPujaListings();
      sendSuccess(res, listings);
    } catch (error) {
      next(error);
    }
  };

  getPujaListingById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listing = await this.adminService.getPujaListingById(req.params.id);
      sendSuccess(res, listing);
    } catch (error) {
      next(error);
    }
  };

  createPujaListing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listing = await this.adminService.createPujaListing(req.body);
      sendSuccess(res, listing, 'Puja listing created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updatePujaListing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const listing = await this.adminService.updatePujaListing(
        req.params.id,
        req.body
      );
      sendSuccess(res, listing, 'Puja listing updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deletePujaListing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.adminService.deletePujaListing(req.params.id);
      sendSuccess(res, null, 'Puja listing deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getAllPujaPackages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const packages = await this.adminService.getAllPujaPackages();
      sendSuccess(res, packages);
    } catch (error) {
      next(error);
    }
  };

  getPujaPackageById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const package_ = await this.adminService.getPujaPackageById(req.params.id);
      sendSuccess(res, package_);
    } catch (error) {
      next(error);
    }
  };

  createPujaPackage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const package_ = await this.adminService.createPujaPackage(req.body);
      sendSuccess(res, package_, 'Puja package created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updatePujaPackage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const package_ = await this.adminService.updatePujaPackage(
        req.params.id,
        req.body
      );
      sendSuccess(res, package_, 'Puja package updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deletePujaPackage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.adminService.deletePujaPackage(req.params.id);
      sendSuccess(res, null, 'Puja package deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Booking Management
  getAllBookings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const kindRaw = typeof req.query.kind === 'string' ? req.query.kind.toLowerCase() : '';
      const kind = kindRaw === 'chat' ? ('chat' as const) : undefined;
      const bookings = await this.adminService.getAllBookings(kind);
      sendSuccess(res, bookings);
    } catch (error) {
      next(error);
    }
  };

  getBookingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.adminService.getBookingById(req.params.id);
      sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  };

  updateBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.adminService.updateBooking(req.params.id, req.body);
      sendSuccess(res, booking, 'Booking updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.adminService.deleteBooking(req.params.id);
      sendSuccess(res, null, 'Booking deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /** Active calls (video/audio) – admin can see join link as host */
  getActiveCalls = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const calls = await this.adminService.getActiveCalls();
      sendSuccess(res, calls);
    } catch (error) {
      next(error);
    }
  };

  // Orders / Payments
  getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const orderType = typeof req.query.orderType === 'string' ? req.query.orderType : undefined;
      const bucketRaw = typeof req.query.bucket === 'string' ? req.query.bucket.toLowerCase() : '';
      const bucket =
        bucketRaw === 'product' || bucketRaw === 'service' ? (bucketRaw as 'product' | 'service') : undefined;
      const segRaw =
        typeof req.query.bookingSegment === 'string' ? req.query.bookingSegment.toLowerCase() : '';
      const bookingSegment =
        segRaw === 'healing' || segRaw === 'puja' || segRaw === 'vaastu'
          ? (segRaw as 'healing' | 'puja' | 'vaastu')
          : undefined;
      const orders = await this.adminService.getAllOrders({
        status,
        orderType,
        bucket,
        bookingSegment,
      });
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.adminService.getOrderById(req.params.id);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  };

  updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await this.adminService.updateOrderStatus(req.params.id, req.body.status as OrderStatus);
      sendSuccess(res, updated, 'Order updated successfully');
    } catch (error) {
      next(error);
    }
  };

  updateOrderSessionStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const sessionNumber = Number(req.params.sessionNumber);
      const updated = await this.adminService.updateOrderSessionStatus(
        req.params.id,
        sessionNumber,
        req.body.status as OrderSessionStatus
      );
      sendSuccess(res, updated, 'Session status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getAllPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const paymentMethod =
        typeof req.query.paymentMethod === 'string' ? req.query.paymentMethod : undefined;
      const paymentType = typeof req.query.paymentType === 'string' ? req.query.paymentType : undefined;
      const payments = await this.adminService.getAllPayments({ status, paymentMethod, paymentType });
      sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  };

  getPaymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.adminService.getPaymentById(req.params.id);
      sendSuccess(res, payment);
    } catch (error) {
      next(error);
    }
  };

  // Product Enquiry Management
  getAllEnquiries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const enquiries = await this.adminService.getAllEnquiries();
      sendSuccess(res, enquiries);
    } catch (error) {
      next(error);
    }
  };

  getEnquiryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const enquiry = await this.adminService.getEnquiryById(req.params.id);
      sendSuccess(res, enquiry);
    } catch (error) {
      next(error);
    }
  };

  updateEnquiryStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.body.status as EnquiryStatus;
      const enquiry = await this.adminService.updateEnquiryStatus(req.params.id, status);
      sendSuccess(res, enquiry, 'Enquiry status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.adminService.deleteEnquiry(req.params.id);
      sendSuccess(res, null, 'Enquiry deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /** Saved chart requests: kind=kundali (Create Kundali) | milan (Kundali Milan) */
  getSavedAstrologyRecords = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const kind = req.query.kind as SavedAstrologyKind;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const rows = await this.adminService.getSavedAstrologyForAdmin(kind, limit);
      sendSuccess(res, rows);
    } catch (error) {
      next(error);
    }
  };

  /** User profile DOB / time / place used for daily rashifal & onboarding */
  getDailyRashifalProfileRows = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const rows = await this.adminService.getDailyRashifalProfileRows(limit);
      sendSuccess(res, rows);
    } catch (error) {
      next(error);
    }
  };
}












