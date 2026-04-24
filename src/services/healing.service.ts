import mongoose, { Types } from 'mongoose';
import { HealingRepository } from '@repositories/healing.repository';
import { PaymentRepository } from '@repositories/payment.repository';
import { OrderType, OrderStatus } from '@models/Order.model';
import { IHealingListing } from '@models/HealingListing.model';
import { IHealingPackage } from '@models/HealingPackage.model';
import { IHealingReview } from '@models/HealingReview.model';
import { IHealingPackageReview } from '@models/HealingPackageReview.model';
import { NotFoundError, ConflictError, BadRequestError } from '@errors/AppError';
import { UserRole } from '@types';
import { HealingSessionBookingRepository } from '@repositories/healing-session-booking.repository';
import { UnifiedTransactionRepository } from '@repositories/unified-transaction.repository';
import { PaymentService } from '@services/payment.service';
import { IPayment, PaymentStatus } from '@models/Payment.model';
import { NotificationType } from '@models/Notification.model';
import { NotificationService } from '@services/notification.service';
import { IHealingSessionBooking } from '@models/HealingSessionBooking.model';
import logger from '@utils/logger';

export class HealingService {
  private healingRepository: HealingRepository;
  private paymentRepository: PaymentRepository;
  private healingSessionBookingRepository: HealingSessionBookingRepository;
  private unifiedTransactionRepository: UnifiedTransactionRepository;
  private paymentService: PaymentService;
  private notificationService: NotificationService;

  constructor() {
    this.healingRepository = new HealingRepository();
    this.paymentRepository = new PaymentRepository();
    this.healingSessionBookingRepository = new HealingSessionBookingRepository();
    this.unifiedTransactionRepository = new UnifiedTransactionRepository();
    this.paymentService = new PaymentService();
    this.notificationService = new NotificationService();
  }

  // Helper to extract healer ID from both populated and non-populated fields
  private getHealerId(healer: any): string {
    if (healer instanceof mongoose.Types.ObjectId) {
      return healer.toString();
    }
    // If populated, it's a User document
    return (healer?._id?.toString() || healer?.id?.toString() || healer?.toString()) || '';
  }

  // Listing methods
  async createListing(
    data: Partial<IHealingListing>,
    healerId: string
  ): Promise<IHealingListing> {
    return this.healingRepository.createListing({
      ...data,
      healer: healerId as any,
    });
  }

  async getListingById(id: string): Promise<IHealingListing> {
    const listing = await this.healingRepository.findListingById(id);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }
    return listing;
  }

  async getAllListings(includeInactive: boolean = false): Promise<IHealingListing[]> {
    if (includeInactive) {
      return this.healingRepository.findAllListings();
    }
    return this.healingRepository.findActiveListings();
  }

  async getListingsByHealer(healerId: string): Promise<IHealingListing[]> {
    return this.healingRepository.findListingsByHealer(healerId);
  }

  async getListingsByCategory(category: string): Promise<IHealingListing[]> {
    return this.healingRepository.findListingsByCategory(category);
  }

  async searchListings(query: string): Promise<IHealingListing[]> {
    return this.healingRepository.searchListings(query);
  }

  async updateListing(
    id: string,
    data: Partial<IHealingListing>,
    userId: string,
    userRole: UserRole
  ): Promise<IHealingListing> {
    const listing = await this.healingRepository.findListingById(id);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    // Only healer who created it or admin can update
    const healerId = this.getHealerId(listing.healer);
    if (userRole !== UserRole.ADMIN && healerId !== userId) {
      throw new BadRequestError(
        'You do not have permission to update this listing'
      );
    }

    const updatedListing = await this.healingRepository.updateListing(id, data);
    if (!updatedListing) {
      throw new NotFoundError('Healing listing not found');
    }

    return updatedListing;
  }

  async deleteListing(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    const listing = await this.healingRepository.findListingById(id);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    // Only healer who created it or admin can delete
    const healerId = this.getHealerId(listing.healer);
    if (userRole !== UserRole.ADMIN && healerId !== userId) {
      throw new BadRequestError(
        'You do not have permission to delete this listing'
      );
    }

    const deleted = await this.healingRepository.deleteListing(id);
    if (!deleted) {
      throw new NotFoundError('Healing listing not found');
    }
  }

  // Package methods
  async createPackage(
    data: Partial<IHealingPackage>,
    healerId: string
  ): Promise<IHealingPackage> {
    // Validate that all listings belong to the healer
    if (data.listings && data.listings.length > 0) {
      const listings = await Promise.all(
        (data.listings as any[]).map((listingId) =>
          this.healingRepository.findListingById(listingId.toString())
        )
      );

      const invalidListings = listings.filter((listing) => {
        if (!listing) return true;
        // Handle both populated (User object) and non-populated (ObjectId) cases
        const listingHealerId = this.getHealerId(listing.healer);
        return listingHealerId !== healerId;
      });

      if (invalidListings.length > 0) {
        throw new BadRequestError(
          'All listings in the package must belong to you'
        );
      }
    }

    return this.healingRepository.createPackage({
      ...data,
      healer: healerId as any,
    });
  }

  async getPackageById(id: string): Promise<IHealingPackage> {
    const package_ = await this.healingRepository.findPackageById(id);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }
    return package_;
  }

  async getAllPackages(includeInactive: boolean = false): Promise<IHealingPackage[]> {
    if (includeInactive) {
      return this.healingRepository.findAllPackages();
    }
    return this.healingRepository.findActivePackages();
  }

  async getPackagesByHealer(healerId: string): Promise<IHealingPackage[]> {
    return this.healingRepository.findPackagesByHealer(healerId);
  }

  async updatePackage(
    id: string,
    data: Partial<IHealingPackage>,
    userId: string,
    userRole: UserRole
  ): Promise<IHealingPackage> {
    const package_ = await this.healingRepository.findPackageById(id);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }

    // Only healer who created it or admin can update
    const packageHealerId = this.getHealerId(package_.healer);
    if (userRole !== UserRole.ADMIN && packageHealerId !== userId) {
      throw new BadRequestError(
        'You do not have permission to update this package'
      );
    }

    // Validate listings if being updated
    if (data.listings && data.listings.length > 0) {
      const listings = await Promise.all(
        (data.listings as any[]).map((listingId) =>
          this.healingRepository.findListingById(listingId.toString())
        )
      );

      const invalidListings = listings.filter(
        (listing) => !listing || this.getHealerId(listing.healer) !== userId
      );

      if (invalidListings.length > 0) {
        throw new BadRequestError(
          'All listings in the package must belong to you'
        );
      }
    }

    const updatedPackage = await this.healingRepository.updatePackage(id, data);
    if (!updatedPackage) {
      throw new NotFoundError('Healing package not found');
    }

    return updatedPackage;
  }

  async deletePackage(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    const package_ = await this.healingRepository.findPackageById(id);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }

    // Only healer who created it or admin can delete
    const packageHealerId = this.getHealerId(package_.healer);
    if (userRole !== UserRole.ADMIN && packageHealerId !== userId) {
      throw new BadRequestError(
        'You do not have permission to delete this package'
      );
    }

    const deleted = await this.healingRepository.deletePackage(id);
    if (!deleted) {
      throw new NotFoundError('Healing package not found');
    }
  }

  // Review methods
  async createReview(
    listingId: string,
    userId: string,
    data: { rating: number; comment?: string }
  ): Promise<IHealingReview> {
    const listing = await this.healingRepository.findListingById(listingId);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    // Check if user already reviewed this listing
    const existingReview = await this.healingRepository.findReviewByListingAndUser(
      listingId,
      userId
    );
    if (existingReview) {
      throw new ConflictError('You have already reviewed this listing');
    }

    const hasDirectListingPurchase =
      await this.paymentRepository.userHasCompletedServiceListingPurchase(
        userId,
        listingId,
        OrderType.HEALING,
        'healing_listing'
      );
    const hasCompletedPackageSession =
      await this.paymentRepository.userHasCompletedHealingPackageSessionForListing(
        userId,
        listingId
      );
    const hasPurchase = hasDirectListingPurchase || hasCompletedPackageSession;
    if (!hasPurchase) {
      throw new BadRequestError(
        'You can only review this service after completing a purchase'
      );
    }

    return this.healingRepository.createReview({
      listing: listingId as any,
      user: userId as any,
      rating: data.rating,
      comment: data.comment,
    });
  }

  async getListingReviewEligibility(
    listingId: string,
    userId: string
  ): Promise<{
    hasPurchased: boolean;
    hasExistingReview: boolean;
    canReview: boolean;
  }> {
    const listing = await this.healingRepository.findListingById(listingId);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    const hasDirectListingPurchase =
      await this.paymentRepository.userHasCompletedServiceListingPurchase(
        userId,
        listingId,
        OrderType.HEALING,
        'healing_listing'
      );
    const hasCompletedPackageSession =
      await this.paymentRepository.userHasCompletedHealingPackageSessionForListing(
        userId,
        listingId
      );
    const hasPurchased = hasDirectListingPurchase || hasCompletedPackageSession;
    const existingReview = await this.healingRepository.findReviewByListingAndUser(
      listingId,
      userId
    );

    return {
      hasPurchased,
      hasExistingReview: !!existingReview,
      canReview: hasPurchased && !existingReview,
    };
  }

  async getListingReviews(listingId: string): Promise<IHealingReview[]> {
    const listing = await this.healingRepository.findListingById(listingId);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    return this.healingRepository.findReviewsByListing(listingId);
  }

  async getListingWithReviews(listingId: string): Promise<{
    listing: IHealingListing;
    reviews: IHealingReview[];
    ratingStats: { averageRating: number; totalReviews: number };
  }> {
    const listing = await this.healingRepository.findListingById(listingId);
    if (!listing) {
      throw new NotFoundError('Healing listing not found');
    }

    const reviews = await this.healingRepository.findReviewsByListing(listingId);
    const ratingStats = await this.healingRepository.getListingRatingStats(listingId);

    return {
      listing,
      reviews,
      ratingStats,
    };
  }

  async updateReview(
    reviewId: string,
    userId: string,
    data: { rating?: number; comment?: string }
  ): Promise<IHealingReview> {
    const review = await this.healingRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new BadRequestError('You do not have permission to update this review');
    }

    const updatedReview = await this.healingRepository.updateReview(reviewId, data);
    if (!updatedReview) {
      throw new NotFoundError('Review not found');
    }

    return updatedReview;
  }

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.healingRepository.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.user.toString() !== userId) {
      throw new BadRequestError('You do not have permission to delete this review');
    }

    const deleted = await this.healingRepository.deleteReview(reviewId);
    if (!deleted) {
      throw new NotFoundError('Review not found');
    }
  }

  async createPackageReview(
    packageId: string,
    userId: string,
    data: { rating: number; comment?: string }
  ): Promise<IHealingPackageReview> {
    const package_ = await this.healingRepository.findPackageById(packageId);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }

    const existingReview = await this.healingRepository.findPackageReviewByPackageAndUser(
      packageId,
      userId
    );
    if (existingReview) {
      throw new ConflictError('You have already reviewed this package');
    }

    const hasPurchased = await this.paymentRepository.userHasCompletedHealingPackagePurchase(
      userId,
      packageId
    );
    if (!hasPurchased) {
      throw new BadRequestError(
        'You can only review this package after completing a purchase'
      );
    }

    return this.healingRepository.createPackageReview({
      package: packageId as any,
      user: userId as any,
      rating: data.rating,
      comment: data.comment,
    });
  }

  async getPackageReviewEligibility(
    packageId: string,
    userId: string
  ): Promise<{
    hasPurchased: boolean;
    hasExistingReview: boolean;
    canReview: boolean;
  }> {
    const package_ = await this.healingRepository.findPackageById(packageId);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }

    const hasPurchased = await this.paymentRepository.userHasCompletedHealingPackagePurchase(
      userId,
      packageId
    );
    const existingReview = await this.healingRepository.findPackageReviewByPackageAndUser(
      packageId,
      userId
    );

    return {
      hasPurchased,
      hasExistingReview: !!existingReview,
      canReview: hasPurchased && !existingReview,
    };
  }

  async getPackageReviews(packageId: string): Promise<IHealingPackageReview[]> {
    const package_ = await this.healingRepository.findPackageById(packageId);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }

    return this.healingRepository.findReviewsByPackage(packageId);
  }

  async getPackageWithReviews(packageId: string): Promise<{
    package: IHealingPackage;
    reviews: IHealingPackageReview[];
    ratingStats: { averageRating: number; totalReviews: number };
  }> {
    const package_ = await this.healingRepository.findPackageById(packageId);
    if (!package_) {
      throw new NotFoundError('Healing package not found');
    }

    const reviews = await this.healingRepository.findReviewsByPackage(packageId);
    const ratingStats = await this.healingRepository.getPackageRatingStats(packageId);

    return {
      package: package_,
      reviews,
      ratingStats,
    };
  }

  async updatePackageReview(
    reviewId: string,
    userId: string,
    data: { rating?: number; comment?: string }
  ): Promise<IHealingPackageReview> {
    const review = await this.healingRepository.findPackageReviewById(reviewId);
    if (!review) {
      throw new NotFoundError('Package review not found');
    }

    if (review.user.toString() !== userId) {
      throw new BadRequestError(
        'You do not have permission to update this package review'
      );
    }

    const updatedReview = await this.healingRepository.updatePackageReview(reviewId, data);
    if (!updatedReview) {
      throw new NotFoundError('Package review not found');
    }

    return updatedReview;
  }

  async deletePackageReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.healingRepository.findPackageReviewById(reviewId);
    if (!review) {
      throw new NotFoundError('Package review not found');
    }

    if (review.user.toString() !== userId) {
      throw new BadRequestError(
        'You do not have permission to delete this package review'
      );
    }

    const deleted = await this.healingRepository.deletePackageReview(reviewId);
    if (!deleted) {
      throw new NotFoundError('Package review not found');
    }
  }

  private resolveHealingPriceNpr(params: {
    listingType: 'service' | 'package';
    sessionMode: 'online' | 'offline';
    listing?: IHealingListing | null;
    pkg?: IHealingPackage | null;
  }): { title: string; amount: number } {
    const { listingType, sessionMode, listing, pkg } = params;
    if (listingType === 'package') {
      if (!pkg || !pkg.isActive) {
        throw new NotFoundError('Healing package not found');
      }
      return { title: pkg.name, amount: pkg.price };
    }
    if (!listing || !listing.isActive) {
      throw new NotFoundError('Healing listing not found');
    }
    const online = sessionMode === 'online';
    const amount = online
      ? listing.onlinePrice ?? listing.price
      : listing.offlinePrice ?? listing.price;
    return { title: listing.title, amount };
  }

  async initHealingSessionBooking(
    userId: string,
    body: {
      sessionId: string;
      listingType: 'service' | 'package';
      scheduledDate: string;
      timeSlot?: string;
      sessionMode: 'online' | 'offline';
      amount: number;
    }
  ): Promise<{ bookingId: string; transactionId: string }> {
    const {
      sessionId,
      listingType,
      scheduledDate,
      timeSlot = '10:00',
      sessionMode,
      amount,
    } = body;

    const listing =
      listingType === 'service'
        ? await this.healingRepository.findListingById(sessionId)
        : null;
    const pkg =
      listingType === 'package'
        ? await this.healingRepository.findPackageById(sessionId)
        : null;

    const { title, amount: serverAmount } = this.resolveHealingPriceNpr({
      listingType,
      sessionMode,
      listing,
      pkg,
    });

    if (Math.abs(amount - serverAmount) > 0.02) {
      throw new BadRequestError(
        `Amount mismatch: expected NPR ${serverAmount}, got NPR ${amount}`
      );
    }

    const conflict = await this.healingSessionBookingRepository.hasActiveSlotConflict({
      sessionId,
      scheduledDate,
      timeSlot,
    });
    if (conflict) {
      throw new ConflictError(
        'This session slot is already reserved. Choose another date or time.'
      );
    }

    const doc = await this.healingSessionBookingRepository.create({
      user: userId as any,
      sessionId: sessionId as any,
      listingType,
      scheduledDate,
      timeSlot,
      sessionMode,
      sessionTitle: title,
      status: 'pending',
      paymentStatus: 'pending',
      amountNpr: serverAmount,
    });

    const unified = await this.unifiedTransactionRepository.create({
      user: userId as any,
      type: 'booking',
      referenceId: doc._id.toString(),
      amount: serverAmount,
      currency: 'NPR',
      status: 'pending',
      paymentStatus: 'pending',
      metadata: {
        listingType,
        sessionId,
        scheduledDate,
        timeSlot,
      },
    });

    return { bookingId: doc._id.toString(), transactionId: unified._id.toString() };
  }

  /** YYYY-MM-DD dates that are **paid+confirmed** (calendar “booked” styling). Pending checkout is excluded. */
  async getSessionOccupiedDates(sessionId: string): Promise<{ dates: string[] }> {
    if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
      throw new BadRequestError('Invalid session id');
    }
    const dates =
      await this.healingSessionBookingRepository.listActiveOccupiedScheduledDates(sessionId);
    return { dates };
  }

  /**
   * If payment was created with metadata.customerInfo.healingSessionBookingId but
   * attachGatewayPayment failed, link the latest matching payment here.
   */
  private async ensureHealingOrderConfirmedForPayment(payment: IPayment): Promise<void> {
    const orderRef = payment.orderId as unknown;
    if (!orderRef) return;
    const orderIdStr =
      orderRef instanceof Types.ObjectId
        ? orderRef.toString()
        : (orderRef as { _id?: Types.ObjectId })?._id?.toString() ?? String(orderRef);
    if (!orderIdStr || !Types.ObjectId.isValid(orderIdStr)) return;

    const order = await this.paymentRepository.findOrderById(orderIdStr);
    if (!order || order.status === OrderStatus.CONFIRMED) return;

    await this.paymentRepository.updateOrder(orderIdStr, {
      status: OrderStatus.CONFIRMED,
    });
  }

  private async notifyHealingCustomerBookingConfirmed(
    userId: string,
    booking: IHealingSessionBooking,
    payment: IPayment
  ): Promise<void> {
    try {
      const orderRef = payment.orderId as unknown;
      const orderIdStr = orderRef
        ? orderRef instanceof Types.ObjectId
          ? orderRef.toString()
          : (orderRef as { _id?: Types.ObjectId })?._id?.toString() ?? String(orderRef)
        : undefined;

      await this.notificationService.createNotification(userId, {
        type: NotificationType.ORDER_UPDATE,
        title: 'Healing session booked',
        message: `"${booking.sessionTitle}" on ${booking.scheduledDate} (${booking.sessionMode}) is confirmed. You can view it in My Sessions / Orders.`,
        inAppOnly: true,
        metadata: {
          kind: 'healing_session_booking',
          delivery: 'in_app',
          bookingId: booking._id.toString(),
          orderId: orderIdStr,
          paymentId: payment._id.toString(),
        },
      });
    } catch (e) {
      logger.warn('notifyHealingCustomerBookingConfirmed failed', {
        userId,
        bookingId: booking._id?.toString(),
        error: String(e),
      });
    }
  }

  private async tryLinkHealingPaymentFromMetadata(
    userId: string,
    bookingId: string
  ): Promise<void> {
    const b = await this.healingSessionBookingRepository.findByIdForUser(
      bookingId,
      userId
    );
    if (!b || b.paymentId) return;

    const loose = await this.paymentRepository.findLatestHealingPaymentForSessionBookingId(
      userId,
      bookingId
    );
    if (!loose?._id || !loose.orderId) return;

    const oid = loose.orderId as unknown;
    const orderIdStr =
      oid instanceof Types.ObjectId
        ? oid.toString()
        : (oid as { _id?: Types.ObjectId })?._id?.toString() ?? String(oid);
    if (!orderIdStr || !Types.ObjectId.isValid(orderIdStr)) return;

    await this.healingSessionBookingRepository.attachGatewayPayment(
      bookingId,
      userId,
      orderIdStr,
      loose._id.toString()
    );
  }

  async attachGatewayPaymentToHealingSessionBooking(
    userId: string,
    healingSessionBookingId: string,
    orderId: string,
    paymentId: string
  ): Promise<void> {
    if (!/^[0-9a-fA-F]{24}$/.test(healingSessionBookingId)) {
      throw new BadRequestError('Invalid healing session booking id');
    }
    const updated = await this.healingSessionBookingRepository.attachGatewayPayment(
      healingSessionBookingId,
      userId,
      orderId,
      paymentId
    );
    if (!updated) {
      throw new BadRequestError(
        'Could not link payment to booking. Booking may be invalid, expired, or already linked.'
      );
    }
  }

  async verifyHealingSessionBooking(
    userId: string,
    bookingId: string
  ): Promise<{
    status: 'success' | 'failed' | 'pending' | 'expired';
    booking: Record<string, unknown>;
  }> {
    if (!/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      throw new BadRequestError('Invalid booking id');
    }

    let booking = await this.healingSessionBookingRepository.findByIdForUser(
      bookingId,
      userId
    );
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const serialize = (b: typeof booking) => ({
      id: b!._id.toString(),
      sessionId: b!.sessionId.toString(),
      sessionTitle: b!.sessionTitle,
      scheduledDate: b!.scheduledDate,
      timeSlot: b!.timeSlot,
      sessionMode: b!.sessionMode,
      listingType: b!.listingType,
      status: b!.status,
      paymentStatus: b!.paymentStatus,
      transactionId: b!.transactionId ?? null,
      amountNpr: b!.amountNpr,
      createdAt: b!.createdAt?.toISOString?.() ?? null,
      updatedAt: b!.updatedAt?.toISOString?.() ?? null,
    });

    if (booking.status === 'confirmed' && booking.paymentStatus === 'success') {
      return { status: 'success', booking: serialize(booking) };
    }
    if (booking.status === 'failed') {
      return { status: 'failed', booking: serialize(booking) };
    }
    if (booking.status === 'expired') {
      return { status: 'expired', booking: serialize(booking) };
    }

    await this.tryLinkHealingPaymentFromMetadata(userId, bookingId);
    booking = await this.healingSessionBookingRepository.findByIdForUser(
      bookingId,
      userId
    );
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status === 'confirmed' && booking.paymentStatus === 'success') {
      return { status: 'success', booking: serialize(booking) };
    }

    const ageMs = Date.now() - new Date(booking.createdAt).getTime();
    const stalePending = ageMs > 10 * 60 * 1000;

    if (!booking.paymentId) {
      if (stalePending) {
        await this.healingSessionBookingRepository.updateById(bookingId, {
          status: 'expired',
          paymentStatus: 'failed',
        });
        booking = await this.healingSessionBookingRepository.findByIdForUser(
          bookingId,
          userId
        );
        return { status: 'expired', booking: serialize(booking) };
      }
      return { status: 'pending', booking: serialize(booking) };
    }

    // Refresh status from the correct gateway (Khalti or Nabil) before reading payment row.
    await this.paymentService.syncPaymentFromGatewayById(booking.paymentId.toString());

    const payment = await this.paymentRepository.findPaymentById(
      booking.paymentId.toString()
    );
    if (!payment) {
      return { status: 'pending', booking: serialize(booking) };
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      const needsBookingConfirm =
        booking.status !== 'confirmed' || booking.paymentStatus !== 'success';

      if (needsBookingConfirm) {
        const txn =
          payment.gatewayPaymentId?.toString() ||
          payment.gatewayTransactionId?.toString() ||
          '';
        await this.healingSessionBookingRepository.updateById(bookingId, {
          status: 'confirmed',
          paymentStatus: 'success',
          transactionId: txn,
        });
        await this.notifyHealingCustomerBookingConfirmed(userId, booking, payment);
      }

      await this.ensureHealingOrderConfirmedForPayment(payment);

      booking = await this.healingSessionBookingRepository.findByIdForUser(
        bookingId,
        userId
      );
      return { status: 'success', booking: serialize(booking) };
    }

    if (
      payment.status === PaymentStatus.FAILED ||
      payment.status === PaymentStatus.CANCELLED ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      await this.healingSessionBookingRepository.updateById(bookingId, {
        status: 'failed',
        paymentStatus: 'failed',
      });
      booking = await this.healingSessionBookingRepository.findByIdForUser(
        bookingId,
        userId
      );
      return { status: 'failed', booking: serialize(booking) };
    }

    if (stalePending) {
      await this.healingSessionBookingRepository.updateById(bookingId, {
        status: 'expired',
        paymentStatus: 'failed',
      });
      booking = await this.healingSessionBookingRepository.findByIdForUser(
        bookingId,
        userId
      );
      return { status: 'expired', booking: serialize(booking) };
    }

    return { status: 'pending', booking: serialize(booking) };
  }
}










