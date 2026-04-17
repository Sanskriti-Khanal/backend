import bcrypt from 'bcryptjs';
import { FilterQuery } from 'mongoose';
import { UserRepository } from '@repositories/user.repository';
import { ProductRepository } from '@repositories/product.repository';
import { HealingRepository } from '@repositories/healing.repository';
import { PujaRepository } from '@repositories/puja.repository';
import { JyotishRepository } from '@repositories/jyotish.repository';
import { PaymentRepository } from '@repositories/payment.repository';
import { ProductEnquiryRepository } from '@repositories/product-enquiry.repository';
import { SavedAstrologyRepository } from '@repositories/saved-astrology.repository';
import { IUser, UserModel } from '@models/User.model';
import { SavedAstrologyKind } from '@models/SavedAstrology.model';
import { IProduct } from '@models/Product.model';
import { ProductModel } from '@models/Product.model';
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
import { IOrder, OrderSessionStatus, OrderStatus, OrderType } from '@models/Order.model';
import { IProductEnquiry, EnquiryStatus } from '@models/ProductEnquiry.model';
import { NotificationType } from '@models/Notification.model';
import { NotFoundError, BadRequestError } from '@errors/AppError';
import { UserRole } from '@types';
import { NotificationService } from './notification.service';
import logger from '@utils/logger';

const ADMIN_SERVICE_ORDER_TYPES: OrderType[] = [
  OrderType.HEALING,
  OrderType.HEALING_PACKAGE,
  OrderType.PUJA,
  OrderType.PUJA_PACKAGE,
  OrderType.JYOTISH_SERVICE,
];

export class AdminService {
  private userRepository: UserRepository;
  private productRepository: ProductRepository;
  private healingRepository: HealingRepository;
  private pujaRepository: PujaRepository;
  private jyotishRepository: JyotishRepository;
  private paymentRepository: PaymentRepository;
  private enquiryRepository: ProductEnquiryRepository;
  private savedAstrologyRepository: SavedAstrologyRepository;
  private notificationService: NotificationService;

  constructor() {
    this.userRepository = new UserRepository();
    this.productRepository = new ProductRepository();
    this.healingRepository = new HealingRepository();
    this.pujaRepository = new PujaRepository();
    this.jyotishRepository = new JyotishRepository();
    this.paymentRepository = new PaymentRepository();
    this.enquiryRepository = new ProductEnquiryRepository();
    this.savedAstrologyRepository = new SavedAstrologyRepository();
    this.notificationService = new NotificationService();
  }

  private static asRecord(v: unknown): Record<string, unknown> {
    return v !== null && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  }

  private static summarizeBirthSnippet(person: Record<string, unknown> | undefined): string {
    if (!person) return '';
    const da = AdminService.asRecord(person.date_ad);
    if (typeof da.year === 'number') {
      return `${da.year}-${String(da.month)}-${String(da.day)}`;
    }
    return '';
  }

  /** Saved chart request (Create Kundali flow). */
  private static summarizeKundaliRequest(req: Record<string, unknown>): string {
    const name = typeof req.name === 'string' ? req.name.trim() : '';
    const da = AdminService.asRecord(req.date_ad);
    const dateStr =
      typeof da.year === 'number'
        ? `${da.year}-${String(da.month)}-${String(da.day)}`
        : '';
    const t = AdminService.asRecord(req.time);
    const timeStr =
      typeof t.hour === 'number' ? `${t.hour}:${String(t.minute ?? 0)}` : '';
    const loc = AdminService.asRecord(req.location);
    const city = typeof loc.cityName === 'string' ? loc.cityName : '';
    const country = typeof loc.countryName === 'string' ? loc.countryName : '';
    const place = [city, country].filter((p) => p).join(', ');
    const parts = [name, dateStr, timeStr, place].filter((p) => String(p).trim());
    return parts.length ? parts.join(' · ') : '—';
  }

  /** Saved milan request (Kundali Milan flow). */
  private static summarizeMilanRequest(req: Record<string, unknown>): string {
    const boy = AdminService.asRecord(req.boy);
    const girl = AdminService.asRecord(req.girl);
    const bName = typeof boy.name === 'string' ? boy.name : '?';
    const gName = typeof girl.name === 'string' ? girl.name : '?';
    const bD = AdminService.summarizeBirthSnippet(boy);
    const gD = AdminService.summarizeBirthSnippet(girl);
    return `Boy: ${bName}${bD ? ` (${bD})` : ''} · Girl: ${gName}${gD ? ` (${gD})` : ''}`;
  }

  private static humanizeStatus(status: string): string {
    return status
      .replace(/_/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private static extractRefId(ref: unknown): string | null {
    if (typeof ref === 'string') return ref;
    if (ref && typeof ref === 'object' && '_id' in ref) {
      return String((ref as { _id: unknown })._id);
    }
    return null;
  }

  private static pickCustomerPhone(orderObj: Record<string, unknown>): string {
    const user = orderObj.user as Record<string, unknown> | undefined;
    const shipping = orderObj.shippingAddress as Record<string, unknown> | undefined;
    const fromUser = typeof user?.phone === 'string' ? user.phone.trim() : '';
    if (fromUser) return fromUser;
    const fromShipping = typeof shipping?.phone === 'string' ? shipping.phone.trim() : '';
    return fromShipping;
  }

  private static pickCustomerName(orderObj: Record<string, unknown>): string {
    const user = orderObj.user as Record<string, unknown> | undefined;
    const shipping = orderObj.shippingAddress as Record<string, unknown> | undefined;
    const fullName = typeof user?.fullName === 'string' ? user.fullName.trim() : '';
    if (fullName) return fullName;
    const username = typeof user?.username === 'string' ? user.username.trim() : '';
    if (username) return `@${username}`;
    const shippingName = typeof shipping?.fullName === 'string' ? shipping.fullName.trim() : '';
    return shippingName;
  }

  private async enrichOrderForAdmin(order: IOrder): Promise<Record<string, unknown>> {
    const base =
      typeof (order as { toObject?: () => Record<string, unknown> }).toObject === 'function'
        ? (order as { toObject: () => Record<string, unknown> }).toObject()
        : (order as unknown as Record<string, unknown>);

    const enriched: Record<string, unknown> = { ...base };
    enriched.customerName = AdminService.pickCustomerName(base) || '—';
    enriched.customerPhone = AdminService.pickCustomerPhone(base) || '—';

    const orderType = String(base.orderType);
    if (orderType === OrderType.HEALING_PACKAGE) {
      const rawItems = Array.isArray(base.items) ? (base.items as Array<Record<string, unknown>>) : [];
      const packageItem = rawItems.find((item) => String(item.itemType) === 'healing_package');
      const packageIdRaw = packageItem?.itemId;
      const packageId =
        typeof packageIdRaw === 'string'
          ? packageIdRaw
          : packageIdRaw && typeof packageIdRaw === 'object' && '_id' in packageIdRaw
            ? String((packageIdRaw as { _id: unknown })._id)
            : '';
      const sessionProgress = Array.isArray(base.sessionProgress)
        ? (base.sessionProgress as Array<Record<string, unknown>>)
        : [];
      enriched.totalSessions = sessionProgress.length > 0 ? sessionProgress.length : 1;
      enriched.sessionProgress = sessionProgress;
      if (packageId) {
        enriched.packageId = packageId;
      }
      return enriched;
    }

    if (orderType !== OrderType.PRODUCT) {
      return enriched;
    }

    const rawItems = Array.isArray(base.items) ? (base.items as Array<Record<string, unknown>>) : [];
    const productIds = rawItems
      .filter((item) => String(item.itemType) === 'product')
      .map((item) => {
        const itemId = item.itemId;
        if (typeof itemId === 'string') return itemId;
        if (itemId && typeof itemId === 'object' && '_id' in itemId) {
          return String((itemId as { _id: unknown })._id);
        }
        return '';
      })
      .filter((id) => id.length > 0);

    const products = productIds.length
      ? await ProductModel.find({ _id: { $in: productIds } })
          .select('_id name images')
          .lean()
      : [];
    const productById = new Map(products.map((p) => [String(p._id), p]));

    const enrichedItems = rawItems.map((item) => {
      if (String(item.itemType) !== 'product') return item;
      const itemId = typeof item.itemId === 'string' ? item.itemId : String(item.itemId ?? '');
      const product = productById.get(itemId);
      const imageUrl =
        Array.isArray(product?.images) && typeof product.images[0] === 'string' ? product.images[0] : '';
      const productName =
        typeof product?.name === 'string' && product.name.trim()
          ? product.name
          : typeof item.name === 'string'
            ? item.name
            : '';

      return {
        ...item,
        name: productName || item.name,
        imageUrl,
      };
    });

    const primaryProduct =
      (enrichedItems.find((i) => String(i.itemType) === 'product') as
        | { name?: unknown; imageUrl?: unknown }
        | undefined) ?? undefined;

    enriched.items = enrichedItems;
    enriched.primaryProductName =
      typeof primaryProduct?.name === 'string' && primaryProduct.name.trim() ? primaryProduct.name : '—';
    enriched.primaryProductImage =
      typeof primaryProduct?.imageUrl === 'string' ? primaryProduct.imageUrl : '';
    return enriched;
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
    const clearAvatar = (data as { avatarUrl?: string }).avatarUrl === '';
    const { avatarUrl, ...rest } = data as Partial<IUser> & { avatarUrl?: string };
    const $set: Record<string, unknown> = { ...(rest as object) };
    if (!clearAvatar && avatarUrl !== undefined && avatarUrl !== '') {
      $set.avatarUrl = avatarUrl;
    }

    const update: Record<string, unknown> = {};
    if (Object.keys($set).length > 0) {
      update.$set = $set;
    }
    if (clearAvatar) {
      update.$unset = { avatarUrl: 1 };
    }

    if (Object.keys(update).length === 0) {
      const user = await this.userRepository.findById(id);
      if (!user) throw new NotFoundError('User not found');
      return user;
    }

    const user = await UserModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
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

  // Jyotish Bookings Management (consultation sessions; use ?kind=chat for chat-only)
  async getAllBookings(kind?: 'chat'): Promise<IJyotishBooking[]> {
    const all = await this.jyotishRepository.findAllBookings();
    if (kind === 'chat') {
      return all.filter((b) => String(b.type).toLowerCase() === 'chat');
    }
    return all;
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
    /** product | service — splits catalog vs all service order types */
    bucket?: 'product' | 'service';
    /** Narrow service orders: healing listings+packages, puja listings+packages, or vaastu jyotish_service */
    bookingSegment?: 'healing' | 'puja' | 'vaastu';
  }): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<IOrder> = {};

    if (filters?.status && (Object.values(OrderStatus) as string[]).includes(filters.status)) {
      query.status = filters.status as OrderStatus;
    }

    if (filters?.bookingSegment === 'healing') {
      query.orderType = { $in: [OrderType.HEALING, OrderType.HEALING_PACKAGE] };
    } else if (filters?.bookingSegment === 'puja') {
      query.orderType = { $in: [OrderType.PUJA, OrderType.PUJA_PACKAGE] };
    } else if (filters?.bookingSegment === 'vaastu') {
      query.orderType = OrderType.JYOTISH_SERVICE;
    } else if (filters?.bucket === 'product') {
      query.orderType = OrderType.PRODUCT;
    } else if (filters?.bucket === 'service') {
      query.orderType = { $in: ADMIN_SERVICE_ORDER_TYPES };
    } else if (filters?.orderType && (Object.values(OrderType) as string[]).includes(filters.orderType)) {
      query.orderType = filters.orderType as OrderType;
    }

    const orders = await this.paymentRepository.findAllOrders(query);

    if (filters?.bookingSegment === 'vaastu') {
      const filtered = orders.filter((o) => {
        const sp = o.serviceProvider as unknown;
        if (!sp || typeof sp !== 'object' || !('role' in sp)) return false;
        return String((sp as { role?: string }).role).toLowerCase() === UserRole.VAASTU;
      });
      return Promise.all(filtered.map((o) => this.enrichOrderForAdmin(o)));
    }

    return Promise.all(orders.map((o) => this.enrichOrderForAdmin(o)));
  }

  async getOrderById(id: string): Promise<Record<string, unknown>> {
    const order = await this.paymentRepository.findOrderById(id);
    if (!order) throw new NotFoundError('Order not found');
    return this.enrichOrderForAdmin(order);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Record<string, unknown>> {
    const existing = await this.paymentRepository.findOrderById(id);
    if (!existing) throw new NotFoundError('Order not found');

    if (existing.status === status) {
      return this.enrichOrderForAdmin(existing);
    }

    const updated = await this.paymentRepository.updateOrder(id, { status });
    if (!updated) throw new NotFoundError('Order not found');

    const userId = AdminService.extractRefId(existing.user);
    if (userId) {
      const firstItemName =
        Array.isArray(existing.items) && typeof existing.items[0]?.name === 'string'
          ? String(existing.items[0].name)
          : '';
      const orderLabel =
        firstItemName && firstItemName.trim()
          ? firstItemName.trim()
          : `${String(existing.orderType).toUpperCase()} order`;
      const statusLabel = AdminService.humanizeStatus(status);
      const firstItem = Array.isArray(existing.items) ? existing.items[0] : undefined;
      const firstItemId = firstItem?.itemId != null
        ? AdminService.extractRefId(firstItem.itemId as unknown) ?? undefined
        : undefined;
      const isDeliveredProduct =
        existing.orderType === OrderType.PRODUCT && status === OrderStatus.DELIVERED;

      try {
        await this.notificationService.createNotification(userId, {
          type: NotificationType.ORDER_UPDATE,
          title: isDeliveredProduct ? 'Delivered! Share your product review' : 'Order status updated',
          message: isDeliveredProduct
            ? `${orderLabel} was delivered. Tap to rate and review your product.`
            : `${orderLabel} is now ${statusLabel}.`,
          metadata: {
            orderId: updated._id.toString(),
            orderType: updated.orderType,
            status,
            ...(isDeliveredProduct && firstItemId
              ? {
                  action: 'open_product_review',
                  productId: firstItemId,
                }
              : {}),
          },
        });
      } catch (error) {
        logger.error('Failed to send order update notification', {
          orderId: updated._id.toString(),
          userId,
          status,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return this.enrichOrderForAdmin(updated);
  }

  async updateOrderSessionStatus(
    id: string,
    sessionNumber: number,
    status: OrderSessionStatus
  ): Promise<Record<string, unknown>> {
    const existing = await this.paymentRepository.findOrderById(id);
    if (!existing) throw new NotFoundError('Order not found');
    if (existing.orderType !== OrderType.HEALING_PACKAGE) {
      throw new BadRequestError('Session status updates are only supported for healing packages');
    }

    const currentProgress = Array.isArray(existing.sessionProgress)
      ? [...existing.sessionProgress]
      : [];
    const idx = currentProgress.findIndex((s) => s.sessionNumber === sessionNumber);
    if (idx < 0) {
      throw new BadRequestError(`Session ${sessionNumber} does not exist for this order`);
    }

    const prev = currentProgress[idx];
    if (prev.status === status) {
      return this.enrichOrderForAdmin(existing);
    }

    currentProgress[idx] = {
      ...prev,
      status,
      completedAt: status === OrderSessionStatus.COMPLETED ? new Date() : undefined,
    };

    const updated = await this.paymentRepository.updateOrder(id, {
      sessionProgress: currentProgress as IOrder['sessionProgress'],
    });
    if (!updated) throw new NotFoundError('Order not found');

    if (status === OrderSessionStatus.COMPLETED) {
      const userId = AdminService.extractRefId(existing.user);
      const packageItem = existing.items.find((i) => String(i.itemType) === 'healing_package');
      const packageId = packageItem?.itemId != null ? String(packageItem.itemId) : '';
      if (userId && packageId) {
        try {
          await this.notificationService.createNotification(userId, {
            type: NotificationType.ORDER_UPDATE,
            title: `Session ${sessionNumber} completed - leave a review`,
            message:
              `Session ${sessionNumber} is marked completed. Tap to open your healing package and share a review.`,
            metadata: {
              orderId: updated._id.toString(),
              orderType: updated.orderType,
              status: updated.status,
              action: 'open_healing_package_review',
              packageId,
              sessionNumber,
              listingId:
                currentProgress[idx].listingId != null
                  ? String(currentProgress[idx].listingId)
                  : undefined,
            },
          });
        } catch (error) {
          logger.error('Failed to send healing session review prompt', {
            orderId: updated._id.toString(),
            sessionNumber,
            userId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return this.enrichOrderForAdmin(updated);
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

  /** Saved kundali / milan charts (inputs users submitted when saving). */
  async getSavedAstrologyForAdmin(
    kind: SavedAstrologyKind,
    limit?: number
  ): Promise<Record<string, unknown>[]> {
    const rows = await this.savedAstrologyRepository.findAllForAdmin({ kind, limit });
    return rows.map((row) => {
      const req = AdminService.asRecord(row.requestPayload);
      const inputSummary =
        kind === 'kundali'
          ? AdminService.summarizeKundaliRequest(req)
          : AdminService.summarizeMilanRequest(req);
      return {
        _id: row._id,
        kind: row.kind,
        title: row.title,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: row.user,
        inputSummary,
        requestPayload: row.requestPayload,
      };
    });
  }

  /**
   * Profile fields used for daily rashifal / notifications (onboarding),
   * not the same as saved chart payloads.
   */
  async getDailyRashifalProfileRows(limit?: number): Promise<Record<string, unknown>[]> {
    const lim = Math.min(Math.max(limit ?? 400, 1), 500);
    const users = await UserModel.find({
      role: UserRole.USER,
      $or: [
        { kundaliCompleted: true },
        {
          dob: { $exists: true, $ne: null },
          birthTime: { $exists: true, $nin: [null, ''] },
          birthPlace: { $exists: true, $nin: [null, ''] },
        },
      ],
    })
      .select(
        'fullName phone username dob birthTime birthPlace kundaliCompleted createdAt updatedAt'
      )
      .sort({ updatedAt: -1 })
      .limit(lim)
      .lean()
      .exec();

    return users.map((u) => {
      const o = u as Record<string, unknown>;
      const dob = o.dob;
      let dobStr: string | null = null;
      if (dob instanceof Date) {
        dobStr = dob.toISOString().slice(0, 10);
      } else if (typeof dob === 'string') {
        dobStr = dob.slice(0, 10);
      }
      return {
        ...o,
        dobDisplay: dobStr,
      };
    });
  }
}

