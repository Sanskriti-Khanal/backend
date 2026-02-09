import { PaymentRepository } from '@repositories/payment.repository';
import { ProductRepository } from '@repositories/product.repository';
import { HealingRepository } from '@repositories/healing.repository';
import { PujaRepository } from '@repositories/puja.repository';
import { JyotishRepository } from '@repositories/jyotish.repository';
import { UserRepository } from '@repositories/user.repository';
import { ServiceAccessRepository } from '@repositories/service-access.repository';
import {
  IPayment,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from '@models/Payment.model';
import { IOrder, OrderStatus, OrderType } from '@models/Order.model';
import { NotFoundError, BadRequestError } from '@errors/AppError';
import crypto from 'crypto';
import env from '@config/env';
import logger from '@utils/logger';

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

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.productRepository = new ProductRepository();
    this.healingRepository = new HealingRepository();
    this.pujaRepository = new PujaRepository();
    this.jyotishRepository = new JyotishRepository();
    this.userRepository = new UserRepository();
    this.serviceAccessRepository = new ServiceAccessRepository();
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

    // Validate service provider is a jyotish expert (ASTROLOGY or VAASTU role)
    const role = serviceProvider.role?.toUpperCase();
    if (role !== 'ASTROLOGY' && role !== 'VAASTU' && role !== 'JYOTISH') {
      throw new BadRequestError('Service provider is not a jyotish expert');
    }

    // Check if expert is active
    if (!serviceProvider.isActive) {
      throw new BadRequestError('Service provider is not active');
    }

    // Check if expert is online
    if (!serviceProvider.isOnline) {
      throw new BadRequestError('Service provider is currently offline. Please try again when they are online.');
    }

    // Check if expert is currently on a call (for call service type)
    if (serviceType === 'call') {
      const activeCall = await this.jyotishRepository.findActiveCallForJyotish(serviceProviderId);
      if (activeCall) {
        throw new BadRequestError('Service provider is currently on a call. Please try again later.');
      }
    }

    // Check if expert has active booking in progress
    const activeBooking = await this.jyotishRepository.findActiveBookingForJyotish(serviceProviderId);
    if (activeBooking) {
      throw new BadRequestError('Service provider is currently busy. Please try again later.');
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
    } catch (err: any) {
      // Idempotent: unique index may already have this combo
      if (err.code !== 11000) {
        logger.error('Failed to grant service access', { error: err, paymentId: payment._id.toString() });
      }
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

      // Update product stock if it's a product order
      const order = await this.paymentRepository.findOrderById(
        updatedPayment.orderId.toString()
      );
      if (order && order.orderType === OrderType.PRODUCT) {
        for (const item of order.items) {
          if (item.itemType === 'product') {
            await this.productRepository.updateStock(
              item.itemId.toString(),
              -item.quantity
            );
          }
        }
      }
    }

    if (updatedPayment.bookingId) {
      await this.jyotishRepository.updateBooking(
        updatedPayment.bookingId.toString(),
        {
          paid: true,
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
}












