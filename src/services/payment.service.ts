import { PaymentRepository } from '@repositories/payment.repository';
import { ProductRepository } from '@repositories/product.repository';
import { HealingRepository } from '@repositories/healing.repository';
import { PujaRepository } from '@repositories/puja.repository';
import { JyotishRepository } from '@repositories/jyotish.repository';
import { UserRepository } from '@repositories/user.repository';
import { ServiceAccessRepository } from '@repositories/service-access.repository';
import { NotificationService } from './notification.service';
import { NotificationType } from '@models/Notification.model';
import {
  IPayment,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from '@models/Payment.model';
import {
  IOrder,
  OrderSessionStatus,
  OrderStatus,
  OrderType,
} from '@models/Order.model';
import {
  assertProductCommerceTransition,
  isProductCommerceLifecycle,
} from './order-state-machine';
import { BookingType } from '@models/JyotishBooking.model';
import { NotFoundError, BadRequestError, ForbiddenError } from '@errors/AppError';
import { isConsultationExpertRole, UserRole } from '@types';
import crypto from 'crypto';
import env from '@config/env';
import logger from '@utils/logger';
import { KhaltiService } from './khalti.service';
import { NabilService } from './nabil.service';

// TODO: Integrate with actual payment gateways (Razorpay, Stripe, etc.)
// For now, this is a placeholder structure

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private productRepository: ProductRepository;
  private healingRepository: HealingRepository;
  private pujaRepository: PujaRepository;
  private jyotishRepository: JyotishRepository;
  private userRepository: UserRepository;
  private serviceAccessRepository: ServiceAccessRepository;
  private notificationService: NotificationService;
  private readonly khaltiService = new KhaltiService();
  private readonly nabilService = new NabilService();

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.productRepository = new ProductRepository();
    this.healingRepository = new HealingRepository();
    this.pujaRepository = new PujaRepository();
    this.jyotishRepository = new JyotishRepository();
    this.userRepository = new UserRepository();
    this.serviceAccessRepository = new ServiceAccessRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Notify healer / pujari when a listing/package is booked (call once when payment first succeeds).
   */
  async notifyServiceListingBooked(payment: IPayment): Promise<void> {
    if (
      payment.paymentType !== PaymentType.PUJA &&
      payment.paymentType !== PaymentType.HEALING
    ) {
      return;
    }
    const orderRefId = payment.orderId?.toString();
    if (!orderRefId) {
      logger.warn('notifyServiceListingBooked: missing order reference', {
        paymentId: payment._id?.toString(),
      });
      return;
    }

    const booker = await this.userRepository.findById(payment.user.toString());
    const bookerName =
      (booker?.fullName && String(booker.fullName).trim()) ||
      booker?.username ||
      'A customer';

    try {
      const orderDoc = await this.paymentRepository.findOrderById(orderRefId);
      if (orderDoc) {
        const firstItem = orderDoc.items[0];
        const firstItemId = firstItem?.itemId?.toString();
        if (!firstItemId) {
          return;
        }

        if (payment.paymentType === PaymentType.HEALING) {
          if (orderDoc.orderType === OrderType.HEALING_PACKAGE) {
            const pkg = await this.healingRepository.findPackageById(firstItemId);
            if (!pkg) return;
            const providerId = PaymentService.extractRefId(pkg.healer);
            if (!providerId) return;
            await this.notificationService.createNotification(providerId, {
              type: NotificationType.BOOKING_REMINDER,
              title: 'New healing package booking',
              message: `${bookerName} booked your healing package "${pkg.name}".`,
              metadata: {
                packageId: firstItemId,
                orderId: orderDoc._id.toString(),
                paymentId: payment._id.toString(),
                kind: 'healing_package',
              },
            });
            return;
          }

          const listing = await this.healingRepository.findListingById(firstItemId);
          if (!listing) return;
          const providerId = PaymentService.extractRefId(listing.healer);
          if (!providerId) return;
          await this.notificationService.createNotification(providerId, {
            type: NotificationType.BOOKING_REMINDER,
            title: 'New healing booking',
            message: `${bookerName} booked your healing session "${listing.title}".`,
            metadata: {
              listingId: firstItemId,
              orderId: orderDoc._id.toString(),
              paymentId: payment._id.toString(),
              kind: 'healing',
            },
          });
          return;
        }

        if (orderDoc.orderType === OrderType.PUJA_PACKAGE) {
          const pkg = await this.pujaRepository.findPackageById(firstItemId);
          if (!pkg) return;
          const providerId = PaymentService.extractRefId(pkg.pujari);
          if (!providerId) return;
          await this.notificationService.createNotification(providerId, {
            type: NotificationType.BOOKING_REMINDER,
            title: 'New puja package booking',
            message: `${bookerName} booked your puja package "${pkg.name}".`,
            metadata: {
              packageId: firstItemId,
              orderId: orderDoc._id.toString(),
              paymentId: payment._id.toString(),
              kind: 'puja_package',
            },
          });
          return;
        }

        const listing = await this.pujaRepository.findListingById(firstItemId);
        if (!listing) return;
        const providerId = PaymentService.extractRefId(listing.pujari);
        if (!providerId) return;
        await this.notificationService.createNotification(providerId, {
          type: NotificationType.BOOKING_REMINDER,
          title: 'New puja booking',
          message: `${bookerName} booked your puja "${listing.title}".`,
          metadata: {
            listingId: firstItemId,
            orderId: orderDoc._id.toString(),
            paymentId: payment._id.toString(),
            kind: 'puja',
          },
        });
        return;
      }

      // Backward compatibility for older payments where orderId stored listing/package id directly.
      if (payment.paymentType === PaymentType.HEALING) {
        const listing = await this.healingRepository.findListingById(orderRefId);
        if (!listing) {
          logger.warn('notifyServiceListingBooked: healing listing not found', { orderRefId });
          return;
        }
        const providerId = PaymentService.extractRefId(listing.healer);
        if (!providerId) return;
        await this.notificationService.createNotification(providerId, {
          type: NotificationType.BOOKING_REMINDER,
          title: 'New healing booking',
          message: `${bookerName} booked your healing session "${listing.title}".`,
          metadata: {
            listingId: orderRefId,
            paymentId: payment._id.toString(),
            kind: 'healing',
          },
        });
        return;
      }

      const listing = await this.pujaRepository.findListingById(orderRefId);
      if (!listing) {
        logger.warn('notifyServiceListingBooked: puja listing not found', { orderRefId });
        return;
      }
      const providerId = PaymentService.extractRefId(listing.pujari);
      if (!providerId) return;
      await this.notificationService.createNotification(providerId, {
        type: NotificationType.BOOKING_REMINDER,
        title: 'New puja booking',
        message: `${bookerName} booked your puja "${listing.title}".`,
        metadata: {
          listingId: orderRefId,
          paymentId: payment._id.toString(),
          kind: 'puja',
        },
      });
    } catch (err: unknown) {
      logger.error('notifyServiceListingBooked failed', {
        error: err instanceof Error ? err.message : err,
        paymentId: payment._id.toString(),
      });
    }
  }

  private static extractRefId(ref: unknown): string | null {
    if (ref == null) return null;
    if (typeof ref === 'object' && ref !== null && '_id' in ref) {
      return String((ref as { _id: unknown })._id);
    }
    return String(ref);
  }

  // Create payment intent for products
  async createProductPayment(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    shippingAddress?: any
  ): Promise<{ order: IOrder; payment: IPayment; paymentIntent: any }> {
    // Validate products and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundError(`Product ${item.productId} not found`);
      }
      if (!product.isActive) {
        throw new BadRequestError(`Product ${item.productId} is not available`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        itemId: product._id,
        itemType: 'product',
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    // Create order
    const order = await this.paymentRepository.createOrder({
      user: userId as any,
      orderType: OrderType.PRODUCT,
      items: orderItems,
      totalAmount,
      status: OrderStatus.PENDING,
      shippingAddress,
    });

    // Create payment
    const payment = await this.paymentRepository.createPayment({
      user: userId as any,
      orderId: order._id,
      amount: totalAmount,
      currency: 'INR',
      status: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.RAZORPAY, // Default
      paymentType: PaymentType.PRODUCT,
    });

    // Update order with payment reference
    await this.paymentRepository.updateOrder(order._id.toString(), {
      payment: payment._id,
    });

    // Create payment intent with gateway
    const paymentIntent = await this.createPaymentIntent(payment, order);

    return { order, payment, paymentIntent };
  }

  /**
   * Cart → OrderDraft: server-priced snapshot, awaiting payment (Khalti/Nabil).
   */
  async createProductCheckoutDraft(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    delivery: {
      preciseLocation: string;
      latitude?: number;
      longitude?: number;
      source?: string;
      shippingAddress?: IOrder['shippingAddress'];
    }
  ): Promise<{ order: IOrder; totalAmount: number }> {
    const loc = delivery.preciseLocation?.trim();
    if (!loc || loc.length < 3) {
      throw new BadRequestError('Delivery location is required for checkout');
    }
    const { order, totalAmount } = await this.createPendingProductOrderForGateway(
      userId,
      items,
      loc,
      {
        latitude: delivery.latitude,
        longitude: delivery.longitude,
        source: delivery.source,
        shippingAddress: delivery.shippingAddress,
      }
    );
    return { order, totalAmount };
  }

  /**
   * Creates a pending product order for Khalti/Nabil mobile checkout (no Payment row yet).
   * Caller creates the gateway payment and links `payment` to this order afterward.
   */
  async createPendingProductOrderForGateway(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    preciseLocation?: string,
    deliveryExtras?: {
      latitude?: number;
      longitude?: number;
      source?: string;
      shippingAddress?: IOrder['shippingAddress'];
    }
  ): Promise<{ order: IOrder; totalAmount: number }> {
    if (!items.length) {
      throw new BadRequestError('At least one product item is required');
    }

    let totalAmount = 0;
    const orderItems: IOrder['items'] = [];

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundError(`Product ${item.productId} not found`);
      }
      if (!product.isActive) {
        throw new BadRequestError(`Product ${item.productId} is not available`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        itemId: product._id,
        itemType: 'product',
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    const trimmedLoc = preciseLocation?.trim();
    const deliverySnapshot =
      trimmedLoc && trimmedLoc.length >= 3
        ? {
            preciseLocation: trimmedLoc,
            ...(typeof deliveryExtras?.latitude === 'number'
              ? { latitude: deliveryExtras.latitude }
              : {}),
            ...(typeof deliveryExtras?.longitude === 'number'
              ? { longitude: deliveryExtras.longitude }
              : {}),
            ...(deliveryExtras?.source ? { source: deliveryExtras.source } : {}),
            ...(deliveryExtras?.shippingAddress
              ? { shippingAddress: deliveryExtras.shippingAddress }
              : {}),
            capturedAt: new Date(),
          }
        : undefined;

    const order = await this.paymentRepository.createOrder({
      user: userId as any,
      orderType: OrderType.PRODUCT,
      items: orderItems,
      totalAmount,
      status: OrderStatus.PAYMENT_PENDING,
      ...(deliverySnapshot ? { deliverySnapshot } : {}),
      ...(trimmedLoc ? { notes: `Precise location: ${trimmedLoc}` } : {}),
    });

    return { order, totalAmount };
  }

  /**
   * Create a pending healing/puja order from a listing/package reference.
   * Mobile sends listing/package id via `orderId` during checkout.
   */
  async createPendingServiceOrderForGateway(
    userId: string,
    input: { paymentType: 'healing' | 'puja'; referenceId: string; preciseLocation?: string }
  ): Promise<{ order: IOrder; totalAmount: number }> {
    const { paymentType, referenceId, preciseLocation } = input;

    if (paymentType === 'healing') {
      const pkg = await this.healingRepository.findPackageById(referenceId);
      if (pkg && pkg.isActive) {
        const listings = Array.isArray(pkg.listings) ? pkg.listings : [];
        const sessionProgress = listings.map((listingRef, index) => {
          const listingId = PaymentService.extractRefId(listingRef);
          return {
            sessionNumber: index + 1,
            status: OrderSessionStatus.PENDING,
            ...(listingId ? { listingId: listingId as any } : {}),
          };
        });
        const totalSessions = sessionProgress.length || 1;

        const order = await this.paymentRepository.createOrder({
          user: userId as any,
          orderType: OrderType.HEALING_PACKAGE,
          items: [
            {
              itemId: pkg._id as any,
              itemType: 'healing_package',
              name: pkg.name,
              quantity: 1,
              price: pkg.price,
              total: pkg.price,
            },
          ],
          totalAmount: pkg.price,
          status: OrderStatus.PENDING,
          sessionProgress: sessionProgress.length
            ? sessionProgress
            : [
                {
                  sessionNumber: 1,
                  status: OrderSessionStatus.PENDING,
                },
              ],
          notes: `Total sessions: ${totalSessions}`,
        });

        if (preciseLocation) {
          await this.paymentRepository.updateOrder(order._id.toString(), {
            notes: `Total sessions: ${totalSessions}\nPrecise location: ${preciseLocation}`,
          });
        }

        return { order, totalAmount: pkg.price };
      }

      const listing = await this.healingRepository.findListingById(referenceId);
      if (!listing) {
        throw new NotFoundError('Healing listing/package not found');
      }
      if (!listing.isActive) {
        throw new BadRequestError('Healing offering is not available');
      }
      const order = await this.paymentRepository.createOrder({
        user: userId as any,
        orderType: OrderType.HEALING,
        items: [
          {
            itemId: listing._id as any,
            itemType: 'healing_listing',
            name: listing.title,
            quantity: 1,
            price: listing.price,
            total: listing.price,
          },
        ],
        totalAmount: listing.price,
        status: OrderStatus.PENDING,
        ...(preciseLocation ? { notes: `Precise location: ${preciseLocation}` } : {}),
      });
      return { order, totalAmount: listing.price };
    }

    const pkg = await this.pujaRepository.findPackageById(referenceId);
    if (pkg && pkg.isActive) {
      const order = await this.paymentRepository.createOrder({
        user: userId as any,
        orderType: OrderType.PUJA_PACKAGE,
        items: [
          {
            itemId: pkg._id as any,
            itemType: 'puja_package',
            name: pkg.name,
            quantity: 1,
            price: pkg.price,
            total: pkg.price,
          },
        ],
        totalAmount: pkg.price,
        status: OrderStatus.PENDING,
        ...(preciseLocation ? { notes: `Precise location: ${preciseLocation}` } : {}),
      });
      return { order, totalAmount: pkg.price };
    }

    const listing = await this.pujaRepository.findListingById(referenceId);
    if (!listing) {
      throw new NotFoundError('Puja listing/package not found');
    }
    if (!listing.isActive) {
      throw new BadRequestError('Puja offering is not available');
    }
    const order = await this.paymentRepository.createOrder({
      user: userId as any,
      orderType: OrderType.PUJA,
      items: [
        {
          itemId: listing._id as any,
          itemType: 'puja_listing',
          name: listing.title,
          quantity: 1,
          price: listing.price,
          total: listing.price,
        },
      ],
      totalAmount: listing.price,
      status: OrderStatus.PENDING,
      ...(preciseLocation ? { notes: `Precise location: ${preciseLocation}` } : {}),
    });
    return { order, totalAmount: listing.price };
  }

  // Create payment for healing/puja
  async createServicePayment(
    userId: string,
    serviceType: 'healing' | 'puja',
    listingId: string,
    quantity: number = 1
  ): Promise<{ order: IOrder; payment: IPayment; paymentIntent: any }> {
    let listing: any;
    let orderType: OrderType;

    if (serviceType === 'healing') {
      listing = await this.healingRepository.findListingById(listingId);
      orderType = OrderType.HEALING;
    } else {
      listing = await this.pujaRepository.findListingById(listingId);
      orderType = OrderType.PUJA;
    }

    if (!listing) {
      throw new NotFoundError('Service listing not found');
    }
    if (!listing.isActive) {
      throw new BadRequestError('Service listing is not available');
    }

    const totalAmount = listing.price * quantity;

    // Create order
    const order = await this.paymentRepository.createOrder({
      user: userId as any,
      orderType,
      items: [
        {
          itemId: listing._id,
          itemType: `${serviceType}_listing`,
          name: listing.title,
          quantity,
          price: listing.price,
          total: totalAmount,
        },
      ],
      totalAmount,
      status: OrderStatus.PENDING,
    });

    // Create payment
    const payment = await this.paymentRepository.createPayment({
      user: userId as any,
      orderId: order._id,
      amount: totalAmount,
      currency: 'INR',
      status: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.RAZORPAY,
      paymentType: serviceType === 'healing' ? PaymentType.HEALING : PaymentType.PUJA,
    });

    // Update order with payment reference
    await this.paymentRepository.updateOrder(order._id.toString(), {
      payment: payment._id,
    });

    // Create payment intent
    const paymentIntent = await this.createPaymentIntent(payment, order);

    return { order, payment, paymentIntent };
  }

  // Create payment for jyotish booking
  async createBookingPayment(
    userId: string,
    bookingId: string,
    amount: number
  ): Promise<{ payment: IPayment; paymentIntent: any }> {
    const booking = await this.jyotishRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.user.toString() !== userId) {
      throw new BadRequestError('You do not have permission to pay for this booking');
    }

    // Create payment
    const payment = await this.paymentRepository.createPayment({
      user: userId as any,
      bookingId: booking._id,
      amount,
      currency: 'INR',
      status: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.RAZORPAY,
      paymentType: PaymentType.JYOTISH_BOOKING,
    });

    // Create payment intent
    const paymentIntent = await this.createPaymentIntent(payment);

    return { payment, paymentIntent };
  }

  // Create payment for jyotish service (chat/call)
  async createJyotishServicePayment(
    userId: string,
    serviceProviderId: string,
    serviceType: 'chat' | 'call',
    amount: number,
    idempotencyKey?: string
  ): Promise<{ order: IOrder; payment: IPayment; paymentIntent: any }> {
    // Validate service provider exists and is a jyotish expert
    const serviceProvider = await this.userRepository.findById(serviceProviderId);
    if (!serviceProvider) {
      throw new NotFoundError('Service provider not found');
    }

    if (!isConsultationExpertRole(serviceProvider.role)) {
      throw new BadRequestError('Service provider is not a consultation expert');
    }

    // Check if expert is active
    if (!serviceProvider.isActive) {
      throw new BadRequestError('Service provider is not active');
    }

    const isPremiumJyotish = serviceProvider.role === UserRole.PREMIUM_JYOTISH;
    if (isPremiumJyotish && serviceType === 'chat') {
      throw new BadRequestError('This expert offers call-only consultations.');
    }

    // Premium jyotish: session is purchased as a ticket even when status is busy/offline
    if (!isPremiumJyotish) {
      if (!serviceProvider.isOnline) {
        throw new BadRequestError(
          'Service provider is currently offline. Please try again when they are online.'
        );
      }

      if (serviceType === 'call') {
        const activeCall = await this.jyotishRepository.findActiveCallForJyotish(serviceProviderId);
        if (activeCall) {
          throw new BadRequestError('Service provider is currently on a call. Please try again later.');
        }
      }

      const activeBooking = await this.jyotishRepository.findActiveBookingForJyotish(
        serviceProviderId
      );
      if (activeBooking) {
        throw new BadRequestError('Service provider is currently busy. Please try again later.');
      }
    }

    // Validate amount
    if (amount <= 0) {
      throw new BadRequestError('Invalid amount');
    }

    // Check for existing payment with same idempotency key
    if (idempotencyKey) {
      const existingPayment = await this.paymentRepository.findPaymentByIdempotencyKey(
        idempotencyKey
      );
      if (existingPayment) {
        const order = await this.paymentRepository.findOrderById(
          existingPayment.orderId?.toString() || ''
        );
        if (order) {
          logger.info('Returning existing payment due to idempotency key', {
            idempotencyKey,
            paymentId: existingPayment._id.toString(),
            orderId: order._id.toString(),
          });
          // Return existing payment intent (you may need to regenerate if expired)
          const paymentIntent = await this.createPaymentIntent(existingPayment, order);
          return {
            order,
            payment: existingPayment,
            paymentIntent,
          };
        }
      }
    }

    // Create order
    const order = await this.paymentRepository.createOrder({
      user: userId as any,
      serviceProvider: serviceProviderId as any,
      orderType: OrderType.JYOTISH_SERVICE,
      items: [
        {
          itemId: serviceProviderId as any,
          itemType: 'jyotish_expert',
          serviceType: serviceType,
          name: `${serviceProvider.fullName} - ${serviceType === 'chat' ? 'Chat' : 'Call'} Service`,
          quantity: 1,
          price: amount,
          total: amount,
        },
      ],
      totalAmount: amount,
      status: OrderStatus.PENDING,
    });

    // Generate idempotency key if not provided
    const finalIdempotencyKey = idempotencyKey || `jyotish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment
    const payment = await this.paymentRepository.createPayment({
      user: userId as any,
      orderId: order._id,
      amount,
      currency: 'INR',
      status: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.NABIL, // Using Nabil as default
      paymentType: PaymentType.JYOTISH_SERVICE,
      idempotencyKey: finalIdempotencyKey,
      metadata: {
        serviceProviderId,
        serviceType,
      },
    });

    // Update order with payment reference
    await this.paymentRepository.updateOrder(order._id.toString(), {
      payment: payment._id,
    });

    // Create payment intent (for gateways that use it)
    const paymentIntent = await this.createPaymentIntent(payment, order);

    // Order and payment remain PENDING until gateway confirms (Nabil/Khalti callback or verify)
    return { order, payment, paymentIntent };
  }

  /**
   * Grant service access (unlock call/chat) when payment for JYOTISH_SERVICE is successful.
   * Called from payment callbacks and verify endpoints.
   */
  async grantServiceAccessForPayment(payment: IPayment): Promise<void> {
    if (payment.paymentType !== PaymentType.JYOTISH_SERVICE || !payment.orderId) {
      return;
    }
    const serviceProviderId = payment.metadata?.serviceProviderId;
    const serviceType = payment.metadata?.serviceType;
    if (!serviceProviderId || !serviceType || (serviceType !== 'chat' && serviceType !== 'call')) {
      logger.warn('Jyotish service payment missing metadata for service access', {
        paymentId: payment._id.toString(),
        metadata: payment.metadata,
      });
      return;
    }
    try {
      await this.serviceAccessRepository.create({
        user: payment.user.toString(),
        serviceProvider: serviceProviderId,
        serviceType: serviceType as 'chat' | 'call',
        orderId: payment.orderId.toString(),
        paymentId: payment._id.toString(),
      });
      logger.info('Service access granted', {
        userId: payment.user.toString(),
        serviceProviderId,
        serviceType,
        orderId: payment.orderId.toString(),
      });
      await this.notifyJyotishExpertOfServicePurchase(payment, serviceType as 'chat' | 'call');
    } catch (err: any) {
      // Idempotent: unique index may already have this combo
      if (err.code !== 11000) {
        logger.error('Failed to grant service access', { error: err, paymentId: payment._id.toString() });
      }
    }

    await this.syncJyotishBookingAfterServicePayment(payment);
  }

  /**
   * Chat/call checkout uses Order + Payment (JYOTISH_SERVICE) without bookingId.
   * Mirror paid + amount onto the open JyotishBooking so admin and reports stay accurate.
   */
  private async syncJyotishBookingAfterServicePayment(payment: IPayment): Promise<void> {
    if (payment.paymentType !== PaymentType.JYOTISH_SERVICE || !payment.orderId) {
      return;
    }
    const serviceProviderId = payment.metadata?.serviceProviderId;
    const serviceType = payment.metadata?.serviceType;
    if (
      !serviceProviderId ||
      (serviceType !== 'chat' && serviceType !== 'call')
    ) {
      return;
    }

    const order = await this.paymentRepository.findOrderById(payment.orderId.toString());
    const amount =
      order && typeof order.totalAmount === 'number'
        ? order.totalAmount
        : payment.amount;

    const bookingType =
      serviceType === 'chat' ? BookingType.CHAT : BookingType.CALL;

    const booking = await this.jyotishRepository.findLatestUnpaidServiceBooking(
      payment.user.toString(),
      serviceProviderId,
      bookingType
    );

    if (!booking) {
      logger.debug('No unpaid jyotish booking to mark paid for service payment', {
        paymentId: payment._id.toString(),
        userId: payment.user.toString(),
        serviceProviderId,
        serviceType,
      });
      return;
    }

    await this.jyotishRepository.updateBooking(booking._id.toString(), {
      paid: true,
      totalAmount: amount,
    });
    logger.info('Synced JyotishBooking paid from JYOTISH_SERVICE payment', {
      bookingId: booking._id.toString(),
      paymentId: payment._id.toString(),
      amount,
    });
  }

  /** Inform the jyotish when a customer successfully pays for chat/call (once per new ServiceAccess row). */
  private async notifyJyotishExpertOfServicePurchase(
    payment: IPayment,
    serviceType: 'chat' | 'call'
  ): Promise<void> {
    const jyotishId = payment.metadata?.serviceProviderId;
    if (!jyotishId) return;

    const booker = await this.userRepository.findById(payment.user.toString());
    const bookerName =
      (booker?.fullName && String(booker.fullName).trim()) ||
      booker?.username ||
      'A customer';

    const modeLabel = serviceType === 'chat' ? 'chat' : 'call';

    try {
      await this.notificationService.createNotification(jyotishId, {
        type: NotificationType.BOOKING_REMINDER,
        title: `New paid ${modeLabel} session`,
        message: `${bookerName} purchased a ${modeLabel} consultation and can connect with you now.`,
        metadata: {
          kind: 'jyotish_service',
          serviceType,
          paymentId: payment._id.toString(),
          orderId: payment.orderId?.toString(),
          customerId: payment.user.toString(),
          ...(payment.bookingId ? { bookingId: payment.bookingId.toString() } : {}),
        },
      });
    } catch (err: unknown) {
      logger.error('notifyJyotishExpertOfServicePurchase failed', {
        error: err instanceof Error ? err.message : err,
        paymentId: payment._id.toString(),
      });
    }
  }

  // Verify payment (webhook handler)
  async verifyPayment(
    gatewayOrderId: string,
    gatewayPaymentId: string,
    signature: string
  ): Promise<IPayment> {
    const payment = await this.paymentRepository.findPaymentByGatewayOrderId(
      gatewayOrderId
    );
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // TODO: Verify signature with payment gateway
    const isValid = await this.verifyPaymentSignature(
      gatewayOrderId,
      gatewayPaymentId,
      signature
    );

    if (!isValid) {
      throw new BadRequestError('Invalid payment signature');
    }

    // Update payment status
    const updatedPayment = await this.paymentRepository.updatePayment(
      payment._id.toString(),
      {
        status: PaymentStatus.SUCCESS,
        gatewayPaymentId,
        receipt: `receipt_${gatewayPaymentId}`,
      }
    );

    if (!updatedPayment) {
      throw new NotFoundError('Payment not found');
    }

    // Update related order/booking
    if (updatedPayment.orderId) {
      await this.paymentRepository.updateOrder(
        updatedPayment.orderId.toString(),
        {
          status: OrderStatus.CONFIRMED,
        }
      );

      // Unlock call/chat service for jyotish_service payments
      if (updatedPayment.paymentType === PaymentType.JYOTISH_SERVICE) {
        await this.grantServiceAccessForPayment(updatedPayment);
      }

      // Update product stock if it's a product order (idempotent across webhook + unified verify)
      const order = await this.paymentRepository.findOrderById(
        updatedPayment.orderId.toString()
      );
      if (order && order.orderType === OrderType.PRODUCT) {
        if (updatedPayment.metadata?.productStockApplied === true) {
          // already decremented
        } else {
          for (const item of order.items) {
            if (item.itemType === 'product') {
              await this.productRepository.updateStock(
                item.itemId.toString(),
                -item.quantity
              );
            }
          }
          await this.paymentRepository.updatePayment(updatedPayment._id.toString(), {
            metadata: {
              ...updatedPayment.metadata,
              productStockApplied: true,
            },
          });
        }
      }
    }

    if (updatedPayment.bookingId) {
      await this.jyotishRepository.updateBooking(
        updatedPayment.bookingId.toString(),
        {
          paid: true,
          totalAmount: updatedPayment.amount,
        }
      );
    }

    return updatedPayment;
  }

  // Get payment by ID
  async getPaymentById(id: string): Promise<IPayment> {
    const payment = await this.paymentRepository.findPaymentById(id);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }
    return payment;
  }

  // Get user payments
  async getUserPayments(userId: string): Promise<IPayment[]> {
    return this.paymentRepository.findPaymentsByUser(userId);
  }

  // Get user orders
  async getUserOrders(userId: string): Promise<IOrder[]> {
    return this.paymentRepository.findOrdersByUser(userId);
  }

  // Get service provider orders
  async getServiceProviderOrders(serviceProviderId: string): Promise<IOrder[]> {
    return this.paymentRepository.findOrdersByServiceProvider(serviceProviderId);
  }

  /** Check if user has access to chat/call for an expert (after successful payment). */
  async hasServiceAccess(
    userId: string,
    serviceProviderId: string,
    serviceType: 'chat' | 'call'
  ): Promise<boolean> {
    return this.serviceAccessRepository.hasAccess(userId, serviceProviderId, serviceType);
  }

  /** Get all service accesses for a user (unlocked call/chat per expert). */
  async getUserServiceAccesses(userId: string) {
    return this.serviceAccessRepository.findByUser(userId);
  }

  /**
   * Astrologer ends the paid chat or call session for this customer.
   * Customer loses service access until they pay again.
   */
  async revokeCustomerAccessAsExpert(
    expertUserId: string,
    customerUserId: string,
    serviceType: 'chat' | 'call'
  ): Promise<void> {
    const expert = await this.userRepository.findById(expertUserId);
    if (!expert || !isConsultationExpertRole(expert.role)) {
      throw new ForbiddenError('Only astrologers can end a consultation session');
    }
    await this.serviceAccessRepository.revokeAccess(
      customerUserId,
      expertUserId,
      serviceType
    );
  }

  // Refund payment
  async refundPayment(
    paymentId: string,
    amount?: number
  ): Promise<IPayment> {
    const payment = await this.paymentRepository.findPaymentById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestError('Only successful payments can be refunded');
    }

    const refundAmount = amount || payment.amount;

    // TODO: Process refund with payment gateway
    const refundResult = await this.processRefund(payment, refundAmount);

    const updatedPayment = await this.paymentRepository.updatePayment(
      paymentId,
      {
        status: PaymentStatus.REFUNDED,
        refundAmount: refundResult.amount,
        refundedAt: new Date(),
      }
    );

    if (!updatedPayment) {
      throw new NotFoundError('Payment not found');
    }

    // Update order status if applicable
    if (updatedPayment.orderId) {
      await this.paymentRepository.updateOrder(
        updatedPayment.orderId.toString(),
        {
          status: OrderStatus.REFUNDED,
        }
      );
    }

    return updatedPayment;
  }

  // Private helper methods
  private async createPaymentIntent(
    payment: IPayment,
    order?: IOrder
  ): Promise<any> {
    // TODO: Integrate with Razorpay/Stripe
    // This is a placeholder
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      orderId: `order_${Date.now()}`,
      amount: payment.amount,
      currency: payment.currency,
      status: 'created',
    };

    // Update payment with gateway order ID
    await this.paymentRepository.updatePayment(payment._id.toString(), {
      gatewayOrderId: paymentIntent.orderId,
      status: PaymentStatus.PROCESSING,
    });

    return paymentIntent;
  }

  private async verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Nabil Bank signature verification
      // Note: Adjust signature format based on Nabil Bank's actual implementation
      const secret = env.NABIL_SECRET_KEY;
      
      if (!secret) {
        logger.warn('NABIL_SECRET_KEY not configured, skipping signature verification');
        // In development, allow without verification
        if (env.NODE_ENV === 'development') {
          return true;
        }
        return false;
      }

      // Reconstruct expected signature
      // Format may vary - adjust based on Nabil Bank documentation
      const data = `${orderId}${paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      if (signature.length !== expectedSignature.length) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Signature verification error', { error, orderId, paymentId });
      return false;
    }
  }

  private async processRefund(
    payment: IPayment,
    amount: number
  ): Promise<{ amount: number; refundId: string }> {
    // TODO: Implement actual refund processing
    return {
      amount,
      refundId: `refund_${Date.now()}`,
    };
  }

  async getOrderOwnedByUser(orderId: string, userId: string): Promise<IOrder> {
    const order = await this.paymentRepository.findOrderByIdForUser(orderId, userId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    return order;
  }

  /**
   * Single entry: Khalti lookup + persist payment + product fulfillment state machine (idempotent).
   */
  async verifyAndSettleGatewayPaymentForOrder(input: {
    userId: string;
    orderId: string;
    pidx?: string;
    paymentId?: string;
  }): Promise<{ order: IOrder; payment: IPayment }> {
    const { userId, orderId, pidx, paymentId } = input;
    if (!pidx && !paymentId) {
      throw new BadRequestError('pidx or paymentId is required');
    }
    let payment: IPayment | null = null;
    if (paymentId) {
      payment = await this.paymentRepository.findPaymentById(paymentId);
    } else if (pidx) {
      payment = await this.paymentRepository.findPaymentByGatewayTransactionId(pidx);
    }
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }
    if (payment.user.toString() !== userId) {
      throw new ForbiddenError('Unauthorized');
    }
    const boundOrderId = payment.orderId?.toString();
    if (!boundOrderId || boundOrderId !== orderId) {
      throw new BadRequestError('Payment is not bound to this order');
    }

    const pidxLive = (payment.gatewayTransactionId || pidx || '').trim();
    if (!pidxLive) {
      throw new BadRequestError('Missing Khalti pidx on payment');
    }

    const verifyResponse = await this.khaltiService.verifyPayment(pidxLive);

    let paymentStatus = PaymentStatus.PENDING;
    if (verifyResponse.status === 'Completed') {
      paymentStatus = PaymentStatus.SUCCESS;
    } else if (
      verifyResponse.status === 'Failed' ||
      verifyResponse.status === 'Expired'
    ) {
      paymentStatus = PaymentStatus.FAILED;
    }

    const previousPaymentStatus = payment.status;
    const updatedPayment = await this.paymentRepository.updatePayment(payment._id.toString(), {
      status: paymentStatus,
      gatewayPaymentId: verifyResponse.transaction_id,
      receipt: verifyResponse.transaction_id,
      metadata: {
        ...payment.metadata,
        verification_status: verifyResponse.status,
        total_amount: verifyResponse.total_amount,
        fee: verifyResponse.fee,
        refunded: verifyResponse.refunded,
      },
    });
    if (!updatedPayment) {
      throw new NotFoundError('Payment not found');
    }

    let order = await this.paymentRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (updatedPayment.paymentType !== PaymentType.PRODUCT) {
      if (paymentStatus === PaymentStatus.SUCCESS && updatedPayment.orderId) {
        await this.applyLegacyKhaltiOrderSuccess(updatedPayment, previousPaymentStatus);
        order = (await this.paymentRepository.findOrderById(orderId))!;
      }
      return { order, payment: updatedPayment };
    }

    if (paymentStatus !== PaymentStatus.SUCCESS) {
      return { order, payment: updatedPayment };
    }

    const { order: settled } = await this.completeProductOrderAfterKhaltiSuccess(
      updatedPayment,
      verifyResponse
    );
    return { order: settled, payment: updatedPayment };
  }

  /**
   * Worker / admin: replay fulfillment for stuck product orders (payment already SUCCESS).
   */
  async retryProductOrderFulfillment(orderId: string): Promise<IOrder> {
    const order = await this.paymentRepository.findOrderById(orderId);
    if (!order || order.orderType !== OrderType.PRODUCT) {
      throw new NotFoundError('Product order not found');
    }
    const fullPayment = await this.paymentRepository.findLatestSuccessfulProductPaymentForOrder(
      orderId
    );
    if (!fullPayment) {
      throw new BadRequestError('No successful product payment for this order');
    }
    const txnId =
      String(fullPayment.gatewayPaymentId || fullPayment.gatewayTransactionId || '').trim();
    if (!txnId) {
      throw new BadRequestError('Payment is missing gateway transaction reference');
    }
    const verifyShape = {
      status: 'Completed',
      total_amount: this.khaltiService.nprToPaisa(order.totalAmount),
      transaction_id: fullPayment.gatewayPaymentId,
    };
    const { order: out } = await this.completeProductOrderAfterKhaltiSuccess(
      fullPayment,
      verifyShape
    );
    return out;
  }

  async completeProductOrderAfterKhaltiSuccess(
    payment: IPayment,
    verify: { status: string; total_amount: number; transaction_id?: string }
  ): Promise<{ order: IOrder; idempotentReplay: boolean }> {
    if (payment.paymentType !== PaymentType.PRODUCT || !payment.orderId) {
      throw new BadRequestError('Product order payment required');
    }
    const oid = payment.orderId.toString();
    const txnId = String(verify.transaction_id || payment.gatewayPaymentId || '').trim();
    if (!txnId) {
      throw new BadRequestError('Missing gateway transaction id');
    }

    let order = await this.paymentRepository.findOrderById(oid);
    if (!order || order.orderType !== OrderType.PRODUCT) {
      throw new NotFoundError('Product order not found');
    }

    const npr =
      verify.total_amount === undefined || verify.total_amount === null
        ? order.totalAmount
        : this.khaltiService.paisaToNpr(Number(verify.total_amount));
    if (Math.abs(npr - order.totalAmount) > 0.02) {
      throw new BadRequestError('Payment amount does not match order total');
    }

    if (order.settledGatewayTransactionId && order.settledGatewayTransactionId !== txnId) {
      throw new BadRequestError('Order already settled with a different gateway transaction');
    }

    if (order.status === OrderStatus.COMPLETED) {
      return { order, idempotentReplay: true };
    }
    if (order.status === OrderStatus.CONFIRMED && payment.metadata?.productStockApplied === true) {
      return { order, idempotentReplay: true };
    }

    const stockAlready = payment.metadata?.productStockApplied === true;

    const commerceStates: OrderStatus[] = [
      OrderStatus.PAYMENT_PENDING,
      OrderStatus.PAID,
      OrderStatus.FULFILLMENT_PENDING,
      OrderStatus.FAILED,
    ];
    if (commerceStates.includes(order.status as OrderStatus)) {
      order = await this.advanceProductOrderToPaidOrRetryFulfillment(order);
      if (!stockAlready) {
        order = await this.runProductFulfillmentPipeline(order, payment, txnId);
      } else {
        order = await this.markProductOrderCompleted(oid, txnId, order);
      }
      return { order, idempotentReplay: false };
    }

    if (order.status === OrderStatus.PENDING) {
      if (!stockAlready) {
        for (const item of order.items) {
          if (item.itemType === 'product') {
            await this.productRepository.updateStock(item.itemId.toString(), -item.quantity);
          }
        }
        await this.paymentRepository.updatePayment(payment._id.toString(), {
          metadata: { ...payment.metadata, productStockApplied: true },
        });
      }
      await this.paymentRepository.updateOrder(oid, { status: OrderStatus.CONFIRMED });
      order = (await this.paymentRepository.findOrderById(oid))!;
      return { order, idempotentReplay: false };
    }

    throw new BadRequestError(`Order cannot be settled from status ${order.status}`);
  }

  private async advanceProductOrderToPaidOrRetryFulfillment(order: IOrder): Promise<IOrder> {
    const oid = order._id.toString();
    if (order.status === OrderStatus.PAYMENT_PENDING) {
      assertProductCommerceTransition(order, OrderStatus.PAID);
      await this.paymentRepository.updateOrder(oid, {
        status: OrderStatus.PAID,
        fulfillmentFailureReason: undefined,
      });
    } else if (order.status === OrderStatus.FAILED) {
      assertProductCommerceTransition(order, OrderStatus.FULFILLMENT_PENDING);
      await this.paymentRepository.updateOrder(oid, {
        status: OrderStatus.FULFILLMENT_PENDING,
        fulfillmentProcessingStatus: 'processing',
        fulfillmentFailureReason: undefined,
      });
    }

    let next = (await this.paymentRepository.findOrderById(oid))!;
    if (next.status === OrderStatus.PAID) {
      assertProductCommerceTransition(next, OrderStatus.FULFILLMENT_PENDING);
      await this.paymentRepository.updateOrder(oid, {
        status: OrderStatus.FULFILLMENT_PENDING,
        fulfillmentProcessingStatus: 'processing',
      });
    }
    const reloaded = await this.paymentRepository.findOrderById(oid);
    if (!reloaded) {
      throw new NotFoundError('Order not found');
    }
    return reloaded;
  }

  private async runProductFulfillmentPipeline(
    order: IOrder,
    payment: IPayment,
    txnId: string
  ): Promise<IOrder> {
    const oid = order._id.toString();
    try {
      for (const item of order.items) {
        if (item.itemType === 'product') {
          await this.productRepository.updateStock(item.itemId.toString(), -item.quantity);
        }
      }
      await this.paymentRepository.updatePayment(payment._id.toString(), {
        metadata: {
          ...payment.metadata,
          productStockApplied: true,
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.paymentRepository.updateOrder(oid, {
        status: OrderStatus.FAILED,
        fulfillmentFailureReason: msg,
        fulfillmentProcessingStatus: 'idle',
      });
      throw e;
    }
    return this.markProductOrderCompleted(oid, txnId, order);
  }

  private async markProductOrderCompleted(
    oid: string,
    txnId: string,
    order: IOrder
  ): Promise<IOrder> {
    const fresh = await this.paymentRepository.findOrderById(oid);
    if (!fresh) {
      throw new NotFoundError('Order not found');
    }
    if (isProductCommerceLifecycle(fresh)) {
      assertProductCommerceTransition(fresh, OrderStatus.COMPLETED);
    }
    await this.paymentRepository.updateOrder(oid, {
      status: OrderStatus.COMPLETED,
      settledGatewayTransactionId: txnId,
      fulfillmentProcessingStatus: 'done',
    });
    const done = await this.paymentRepository.findOrderById(oid);
    if (!done) {
      throw new NotFoundError('Order not found');
    }
    return done;
  }

  private async applyLegacyKhaltiOrderSuccess(
    updatedPayment: IPayment,
    previousStatus: PaymentStatus
  ): Promise<void> {
    if (!updatedPayment.orderId) {
      return;
    }
    await this.paymentRepository.updateOrder(updatedPayment.orderId.toString(), {
      status: OrderStatus.CONFIRMED,
    });
    if (updatedPayment.paymentType === PaymentType.JYOTISH_SERVICE) {
      await this.grantServiceAccessForPayment(updatedPayment);
    }
    if (
      previousStatus !== PaymentStatus.SUCCESS &&
      (updatedPayment.paymentType === PaymentType.PUJA ||
        updatedPayment.paymentType === PaymentType.HEALING)
    ) {
      await this.notifyServiceListingBooked(updatedPayment);
    }
  }

  /**
   * Poll Khalti for latest status and persist (order confirm + service notify).
   * No-op if payment is not Khalti or not in a pending gateway state.
   */
  async syncKhaltiPaymentFromGatewayById(paymentId: string): Promise<IPayment | null> {
    const payment = await this.paymentRepository.findPaymentById(paymentId);
    if (!payment) return null;
    const statusBeforeGatewayPoll = payment.status;
    if (payment.paymentMethod !== PaymentMethod.KHALTI) return payment;
    if (
      payment.status !== PaymentStatus.PENDING &&
      payment.status !== PaymentStatus.PROCESSING
    ) {
      return payment;
    }
    const pidx = payment.gatewayTransactionId;
    if (!pidx) return payment;
    let verifyResponse: {
      status: string;
      transaction_id?: string;
      pidx?: string;
      total_amount?: number;
    };
    try {
      verifyResponse = await this.khaltiService.verifyPayment(pidx);
    } catch (e) {
      logger.warn('syncKhaltiPaymentFromGatewayById: Khalti verify failed', {
        paymentId,
        error: String(e),
      });
      return payment;
    }

    let paymentStatus = PaymentStatus.PENDING;
    if (verifyResponse.status === 'Completed') {
      paymentStatus = PaymentStatus.SUCCESS;
    } else if (
      verifyResponse.status === 'Failed' ||
      verifyResponse.status === 'Expired'
    ) {
      paymentStatus = PaymentStatus.FAILED;
    }

    const updatedPayment = await this.paymentRepository.updatePayment(payment._id.toString(), {
      status: paymentStatus,
      gatewayPaymentId: verifyResponse.transaction_id,
      receipt: verifyResponse.transaction_id,
      metadata: {
        ...payment.metadata,
        verification_status: verifyResponse.status,
      },
    });

    if (
      paymentStatus === PaymentStatus.SUCCESS &&
      updatedPayment?.orderId &&
      statusBeforeGatewayPoll !== PaymentStatus.SUCCESS
    ) {
      if (updatedPayment.paymentType === PaymentType.PRODUCT) {
        try {
          await this.completeProductOrderAfterKhaltiSuccess(updatedPayment, {
            status: verifyResponse.status,
            total_amount:
              verifyResponse.total_amount ??
              this.khaltiService.nprToPaisa(updatedPayment.amount),
            transaction_id: verifyResponse.transaction_id,
          });
        } catch (e) {
          logger.error('syncKhaltiPaymentFromGatewayById: product settlement failed', {
            paymentId,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      } else {
        await this.applyLegacyKhaltiOrderSuccess(updatedPayment, statusBeforeGatewayPoll);
      }
    }

    return updatedPayment;
  }

  /**
   * Decrement product stock once per payment (webhook / unified verify / Khalti poll).
   */
  async applyProductStockIfNotYetApplied(payment: IPayment): Promise<void> {
    if (payment.metadata?.productStockApplied === true) return;
    if (!payment.orderId) return;
    const order = await this.paymentRepository.findOrderById(payment.orderId.toString());
    if (!order || order.orderType !== OrderType.PRODUCT) return;
    for (const item of order.items) {
      if (item.itemType === 'product') {
        await this.productRepository.updateStock(item.itemId.toString(), -item.quantity);
      }
    }
    await this.paymentRepository.updatePayment(payment._id.toString(), {
      metadata: {
        ...payment.metadata,
        productStockApplied: true,
      },
    });
  }

  async syncNabilPaymentFromGatewayById(paymentId: string): Promise<IPayment | null> {
    const payment = await this.paymentRepository.findPaymentById(paymentId);
    if (!payment) return null;
    const statusBeforeGatewayPoll = payment.status;
    if (payment.paymentMethod !== PaymentMethod.NABIL) return payment;
    if (
      payment.status !== PaymentStatus.PENDING &&
      payment.status !== PaymentStatus.PROCESSING
    ) {
      return payment;
    }

    let decryptedOrderID: string | undefined;
    let decryptedSessionID: string | undefined;
    if (payment.metadata?.decryptedOrderID && payment.metadata?.decryptedSessionID) {
      decryptedOrderID = String(payment.metadata.decryptedOrderID);
      decryptedSessionID = String(payment.metadata.decryptedSessionID);
    } else if (payment.gatewayOrderId && payment.gatewaySessionId) {
      try {
        decryptedOrderID = this.nabilService.decryptNabilId(payment.gatewayOrderId);
        decryptedSessionID = this.nabilService.decryptNabilId(payment.gatewaySessionId);
      } catch (e) {
        logger.warn('syncNabilPaymentFromGatewayById: decrypt failed', {
          paymentId,
          error: String(e),
        });
        return payment;
      }
    }
    if (!decryptedOrderID || !decryptedSessionID) return payment;

    let statusResponse: { orderStatus: number | string; responseCode?: string };
    try {
      statusResponse = await this.nabilService.getOrderStatus({
        orderID: decryptedOrderID,
        sessionID: decryptedSessionID,
      });
    } catch (e) {
      logger.warn('syncNabilPaymentFromGatewayById: getOrderStatus failed', {
        paymentId,
        error: String(e),
      });
      return payment;
    }

    const mapped = this.nabilService.mapOrderStatusToPaymentStatus(statusResponse.orderStatus);
    let paymentStatus: PaymentStatus = PaymentStatus.PROCESSING;
    if (mapped === 'success') paymentStatus = PaymentStatus.SUCCESS;
    else if (mapped === 'failed') paymentStatus = PaymentStatus.FAILED;
    else if (mapped === 'cancelled') paymentStatus = PaymentStatus.CANCELLED;

    const updatedPayment = await this.paymentRepository.updatePayment(payment._id.toString(), {
      status: paymentStatus,
      gatewayPaymentId: statusResponse.responseCode,
    });

    if (
      paymentStatus === PaymentStatus.SUCCESS &&
      updatedPayment?.orderId &&
      statusBeforeGatewayPoll !== PaymentStatus.SUCCESS
    ) {
      await this.paymentRepository.updateOrder(updatedPayment.orderId.toString(), {
        status: OrderStatus.CONFIRMED,
      });

      if (updatedPayment.paymentType === PaymentType.JYOTISH_SERVICE) {
        await this.grantServiceAccessForPayment(updatedPayment);
      }

      if (
        updatedPayment.paymentType === PaymentType.PUJA ||
        updatedPayment.paymentType === PaymentType.HEALING
      ) {
        await this.notifyServiceListingBooked(updatedPayment);
      }
    }

    return updatedPayment;
  }

  async syncPaymentFromGatewayById(paymentId: string): Promise<IPayment | null> {
    const payment = await this.paymentRepository.findPaymentById(paymentId);
    if (!payment) return null;
    if (payment.paymentMethod === PaymentMethod.NABIL) {
      return this.syncNabilPaymentFromGatewayById(paymentId);
    }
    if (payment.paymentMethod === PaymentMethod.KHALTI) {
      return this.syncKhaltiPaymentFromGatewayById(paymentId);
    }
    return payment;
  }
}












