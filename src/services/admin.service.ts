import bcrypt from 'bcryptjs';
import { FilterQuery } from 'mongoose';
import { UserRepository } from '@repositories/user.repository';
import { ProductRepository } from '@repositories/product.repository';
import { HealingRepository } from '@repositories/healing.repository';
import { PujaRepository } from '@repositories/puja.repository';
import { JyotishRepository } from '@repositories/jyotish.repository';
import { PaymentRepository } from '@repositories/payment.repository';
import { ProductEnquiryRepository } from '@repositories/product-enquiry.repository';
import { IUser } from '@models/User.model';
import { IProduct } from '@models/Product.model';
import { IHealingListing } from '@models/HealingListing.model';
import { IHealingPackage } from '@models/HealingPackage.model';
import { IPujaListing } from '@models/PujaListing.model';
import { IPujaPackage } from '@models/PujaPackage.model';
import { IJyotishBooking } from '@models/JyotishBooking.model';
import {
  IPayment,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from '@models/Payment.model';
import { IOrder, OrderStatus, OrderType } from '@models/Order.model';
import { IProductEnquiry, EnquiryStatus } from '@models/ProductEnquiry.model';
import { NotFoundError, BadRequestError } from '@errors/AppError';
import { UserRole } from '@types';

export class AdminService {
  private userRepository: UserRepository;
  private productRepository: ProductRepository;
  private healingRepository: HealingRepository;
  private pujaRepository: PujaRepository;
  private jyotishRepository: JyotishRepository;
  private paymentRepository: PaymentRepository;
  private enquiryRepository: ProductEnquiryRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.productRepository = new ProductRepository();
    this.healingRepository = new HealingRepository();
    this.pujaRepository = new PujaRepository();
    this.jyotishRepository = new JyotishRepository();
    this.paymentRepository = new PaymentRepository();
    this.enquiryRepository = new ProductEnquiryRepository();
  }

  // User Management
  async getAllUsers(role?: UserRole): Promise<IUser[]> {
    if (role) {
      return this.userRepository.findByRole(role);
    }
    return this.userRepository.findAll();
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async createUser(data: Partial<IUser>): Promise<IUser> {
    // Check if phone already exists
    const existingPhone = await this.userRepository.findByPhone(data.phone!);
    if (existingPhone) {
      throw new BadRequestError('Phone number already registered');
    }

    // Check if username already exists
    if (data.username) {
      const existingUsername = await this.userRepository.findByUsername(data.username);
      if (existingUsername) {
        throw new BadRequestError('Username already taken');
      }
    }

    // Hash password if provided, otherwise generate a default one
    let hashedPassword: string;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    } else {
      // Generate a random password if not provided
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      hashedPassword = await bcrypt.hash(randomPassword, 10);
    }

    // Generate username if not provided (use phone as fallback)
    const username = data.username || data.phone || `user_${Date.now()}`;

    return this.userRepository.create({
      ...data,
      username: username.toLowerCase(),
      password: hashedPassword,
    });
  }

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser> {
    const user = await this.userRepository.update(id, data);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('User not found');
    }
  }

  // Product Management
  async getAllProducts(): Promise<IProduct[]> {
    return this.productRepository.findAll();
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async createProduct(data: Partial<IProduct>): Promise<IProduct> {
    return this.productRepository.create(data);
  }

  async updateProduct(id: string, data: Partial<IProduct>): Promise<IProduct> {
    const product = await this.productRepository.update(id, data);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const deleted = await this.productRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Product not found');
    }
  }

  // Healing Services Management
  async getAllHealingListings(): Promise<IHealingListing[]> {
    return this.healingRepository.findAllListings();
  }

  async getHealingListingById(id: string): Promise<IHealingListing> {
    const listing = await this.healingRepository.findListingById(id);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }
    return listing;
  }

  async createHealingListing(data: Partial<IHealingListing>): Promise<IHealingListing> {
    return this.healingRepository.createListing(data);
  }

  async updateHealingListing(
    id: string,
    data: Partial<IHealingListing>
  ): Promise<IHealingListing> {
    const listing = await this.healingRepository.updateListing(id, data);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }
    return listing;
  }

  async deleteHealingListing(id: string): Promise<void> {
    const deleted = await this.healingRepository.deleteListing(id);
    if (!deleted) {
      throw new NotFoundError('Healing listing not found');
    }
  }

  async getAllHealingPackages(): Promise<IHealingPackage[]> {
    return this.healingRepository.findAllPackages();
  }

  async getHealingPackageById(id: string): Promise<IHealingPackage> {
    const package_ = await this.healingRepository.findPackageById(id);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }
    return package_;
  }

  async createHealingPackage(data: Partial<IHealingPackage>): Promise<IHealingPackage> {
    return this.healingRepository.createPackage(data);
  }

  async updateHealingPackage(
    id: string,
    data: Partial<IHealingPackage>
  ): Promise<IHealingPackage> {
    const package_ = await this.healingRepository.updatePackage(id, data);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }
    return package_;
  }

  async deleteHealingPackage(id: string): Promise<void> {
    const deleted = await this.healingRepository.deletePackage(id);
    if (!deleted) {
      throw new NotFoundError('Healing package not found');
    }
  }

  // Puja Services Management
  async getAllPujaListings(): Promise<IPujaListing[]> {
    return this.pujaRepository.findAllListings();
  }

  async getPujaListingById(id: string): Promise<IPujaListing> {
    const listing = await this.pujaRepository.findListingById(id);
    if (!listing) {
      throw new NotFoundError('Puja listing not found');
    }
    return listing;
  }

  async createPujaListing(data: Partial<IPujaListing>): Promise<IPujaListing> {
    return this.pujaRepository.createListing(data);
  }

  async updatePujaListing(
    id: string,
    data: Partial<IPujaListing>
  ): Promise<IPujaListing> {
    const listing = await this.pujaRepository.updateListing(id, data);
    if (!listing) {
      throw new NotFoundError('Puja listing not found');
    }
    return listing;
  }

  async deletePujaListing(id: string): Promise<void> {
    const deleted = await this.pujaRepository.deleteListing(id);
    if (!deleted) {
      throw new NotFoundError('Puja listing not found');
    }
  }

  async getAllPujaPackages(): Promise<IPujaPackage[]> {
    return this.pujaRepository.findAllPackages();
  }

  async getPujaPackageById(id: string): Promise<IPujaPackage> {
    const package_ = await this.pujaRepository.findPackageById(id);
    if (!package_) {
      throw new NotFoundError('Puja package not found');
    }
    return package_;
  }

  async createPujaPackage(data: Partial<IPujaPackage>): Promise<IPujaPackage> {
    return this.pujaRepository.createPackage(data);
  }

  async updatePujaPackage(
    id: string,
    data: Partial<IPujaPackage>
  ): Promise<IPujaPackage> {
    const package_ = await this.pujaRepository.updatePackage(id, data);
    if (!package_) {
      throw new NotFoundError('Puja package not found');
    }
    return package_;
  }

  async deletePujaPackage(id: string): Promise<void> {
    const deleted = await this.pujaRepository.deletePackage(id);
    if (!deleted) {
      throw new NotFoundError('Puja package not found');
    }
  }

  // Jyotish Bookings Management
  async getAllBookings(): Promise<IJyotishBooking[]> {
    return this.jyotishRepository.findAllBookings();
  }

  async getBookingById(id: string): Promise<IJyotishBooking> {
    const booking = await this.jyotishRepository.findBookingById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    return booking;
  }

  async updateBooking(
    id: string,
    data: Partial<IJyotishBooking>
  ): Promise<IJyotishBooking> {
    const booking = await this.jyotishRepository.updateBooking(id, data);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    return booking;
  }

  async deleteBooking(id: string): Promise<void> {
    // Note: We might want to soft delete instead
    const booking = await this.jyotishRepository.findBookingById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    // For now, just update status to cancelled
    await this.jyotishRepository.updateBooking(id, {
      status: 'cancelled' as any,
    });
  }

  /** Active video/audio calls (started but not ended) for admin to join as host */
  async getActiveCalls(): Promise<any[]> {
    return this.jyotishRepository.findAllActiveCalls();
  }

  // Orders / Payments
  async getAllOrders(filters?: {
    status?: string;
    orderType?: string;
  }): Promise<IOrder[]> {
    const query: FilterQuery<IOrder> = {};

    if (filters?.status && (Object.values(OrderStatus) as string[]).includes(filters.status)) {
      query.status = filters.status as OrderStatus;
    }
    if (filters?.orderType && (Object.values(OrderType) as string[]).includes(filters.orderType)) {
      query.orderType = filters.orderType as OrderType;
    }

    return this.paymentRepository.findAllOrders(query);
  }

  async getOrderById(id: string): Promise<IOrder> {
    const order = await this.paymentRepository.findOrderById(id);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<IOrder> {
    const updated = await this.paymentRepository.updateOrder(id, { status });
    if (!updated) throw new NotFoundError('Order not found');
    return updated;
  }

  async getAllPayments(filters?: {
    status?: string;
    paymentMethod?: string;
    paymentType?: string;
  }): Promise<IPayment[]> {
    const query: FilterQuery<IPayment> = {};

    if (filters?.status && (Object.values(PaymentStatus) as string[]).includes(filters.status)) {
      query.status = filters.status as PaymentStatus;
    }
    if (
      filters?.paymentMethod &&
      (Object.values(PaymentMethod) as string[]).includes(filters.paymentMethod)
    ) {
      query.paymentMethod = filters.paymentMethod as PaymentMethod;
    }
    if (
      filters?.paymentType &&
      (Object.values(PaymentType) as string[]).includes(filters.paymentType)
    ) {
      query.paymentType = filters.paymentType as PaymentType;
    }

    return this.paymentRepository.findAllPayments(query);
  }

  async getPaymentById(id: string): Promise<IPayment> {
    const payment = await this.paymentRepository.findPaymentById(id);
    if (!payment) throw new NotFoundError('Payment not found');
    return payment;
  }

  // Dashboard/Stats
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalProducts: number;
    totalHealingListings: number;
    totalPujaListings: number;
    totalBookings: number;
    activeBookings: number;
    totalEnquiries: number;
    pendingEnquiries: number;
  }> {
    const [users, products, healingListings, pujaListings, bookings, enquiries] =
      await Promise.all([
        this.userRepository.findAll(),
        this.productRepository.findAll(),
        this.healingRepository.findAllListings(),
        this.pujaRepository.findAllListings(),
        this.jyotishRepository.findAllBookings(),
        this.enquiryRepository.findAll(),
      ]);

    const activeBookings = bookings.filter(
      (b) => b.status === 'in_progress' || b.status === 'confirmed'
    ).length;

    const pendingEnquiries = enquiries.filter(
      (e) => e.status === 'pending'
    ).length;

    return {
      totalUsers: users.length,
      totalProducts: products.length,
      totalHealingListings: healingListings.length,
      totalPujaListings: pujaListings.length,
      totalBookings: bookings.length,
      activeBookings,
      totalEnquiries: enquiries.length,
      pendingEnquiries,
    };
  }

  // Product Enquiry Management
  async getAllEnquiries(): Promise<IProductEnquiry[]> {
    return this.enquiryRepository.findAll();
  }

  async getEnquiryById(id: string): Promise<IProductEnquiry> {
    const enquiry = await this.enquiryRepository.findById(id);
    if (!enquiry) {
      throw new NotFoundError('Enquiry not found');
    }
    return enquiry;
  }

  async updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<IProductEnquiry> {
    const enquiry = await this.enquiryRepository.update(id, { status });
    if (!enquiry) {
      throw new NotFoundError('Enquiry not found');
    }
    return enquiry;
  }

  async deleteEnquiry(id: string): Promise<void> {
    const deleted = await this.enquiryRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Enquiry not found');
    }
  }
}

