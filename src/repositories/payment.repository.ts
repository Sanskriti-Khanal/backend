import {
  PaymentModel,
  IPayment,
  PaymentStatus,
  PaymentType,
} from '@models/Payment.model';
import {
  OrderModel,
  IOrder,
  OrderStatus,
  OrderType,
} from '@models/Order.model';
import { FilterQuery, Types } from 'mongoose';

/** Orders in these statuses count as a completed purchase for leaving a service review. */
const REVIEW_ELIGIBLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.PACKING,
  OrderStatus.SHIPPING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
];

export class PaymentRepository {
  async createPayment(paymentData: Partial<IPayment>): Promise<IPayment> {
    return PaymentModel.create(paymentData);
  }

  async findPaymentById(id: string): Promise<IPayment | null> {
    return PaymentModel.findById(id)
      .populate('user', 'fullName username phone')
      .populate('orderId')
      .populate('bookingId');
  }

  async findPaymentByGatewayOrderId(
    gatewayOrderId: string
  ): Promise<IPayment | null> {
    return PaymentModel.findOne({ gatewayOrderId });
  }

  async findPaymentByGatewayTransactionId(
    transactionId: string
  ): Promise<IPayment | null> {
    return PaymentModel.findOne({ gatewayTransactionId: transactionId });
  }

  async findPaymentByGatewaySessionId(
    sessionId: string
  ): Promise<IPayment | null> {
    return PaymentModel.findOne({ gatewaySessionId: sessionId });
  }

  /**
   * Latest healing payment whose client metadata references this healing session booking id.
   * Used to self-heal when attachGatewayPayment failed or was skipped.
   */
  async findLatestHealingPaymentForSessionBookingId(
    userId: string,
    healingSessionBookingId: string
  ): Promise<IPayment | null> {
    return PaymentModel.findOne({
      user: new Types.ObjectId(userId),
      paymentType: PaymentType.HEALING,
      'metadata.customerInfo.healingSessionBookingId': healingSessionBookingId,
    }).sort({ createdAt: -1 });
  }

  async findPaymentByMerosathiTransactionId(
    unifiedTransactionId: string
  ): Promise<IPayment | null> {
    return PaymentModel.findOne({
      'metadata.merosathiTransactionId': unifiedTransactionId,
    }).sort({ createdAt: -1 });
  }

  async findPaymentByIdempotencyKey(
    idempotencyKey: string
  ): Promise<IPayment | null> {
    return PaymentModel.findOne({ idempotencyKey });
  }

  /**
   * Find payment by decrypted OrderID or SessionID (stored in metadata)
   */
  async findPaymentByDecryptedId(
    decryptedOrderID?: string,
    decryptedSessionID?: string
  ): Promise<IPayment | null> {
    const query: any = {};
    
    if (decryptedOrderID) {
      query['metadata.decryptedOrderID'] = decryptedOrderID;
    }
    if (decryptedSessionID) {
      query['metadata.decryptedSessionID'] = decryptedSessionID;
    }
    
    if (Object.keys(query).length === 0) {
      return null;
    }
    
    return PaymentModel.findOne(query);
  }

  async findPaymentsByUser(userId: string): Promise<IPayment[]> {
    return PaymentModel.find({ user: userId })
      .populate('orderId')
      .populate('bookingId')
      .sort({ createdAt: -1 });
  }

  async findAllPayments(filter: FilterQuery<IPayment> = {}): Promise<IPayment[]> {
    return PaymentModel.find(filter)
      .populate('user', 'fullName username phone')
      .populate('orderId')
      .populate('bookingId')
      .sort({ createdAt: -1 });
  }

  async updatePayment(
    id: string,
    data: Partial<IPayment>
  ): Promise<IPayment | null> {
    return PaymentModel.findByIdAndUpdate(id, data, { new: true });
  }

  async updatePaymentByGatewayOrderId(
    gatewayOrderId: string,
    data: Partial<IPayment>
  ): Promise<IPayment | null> {
    return PaymentModel.findOneAndUpdate({ gatewayOrderId }, data, { new: true });
  }

  // Order methods
  async createOrder(orderData: Partial<IOrder>): Promise<IOrder> {
    return OrderModel.create(orderData);
  }

  async findOrderById(id: string): Promise<IOrder | null> {
    return OrderModel.findById(id)
      .populate('user', 'fullName username phone')
      .populate('serviceProvider', 'fullName username phone role')
      .populate('payment');
  }

  async findOrderByIdForUser(orderId: string, userId: string): Promise<IOrder | null> {
    return OrderModel.findOne({ _id: orderId, user: userId })
      .populate('user', 'fullName username phone')
      .populate('serviceProvider', 'fullName username phone role')
      .populate('payment');
  }

  async findOrdersByUser(userId: string): Promise<IOrder[]> {
    return OrderModel.find({ user: userId })
      .populate('payment')
      .populate('serviceProvider', 'fullName username phone')
      .sort({ createdAt: -1 });
  }

  async findOrdersByServiceProvider(serviceProviderId: string): Promise<IOrder[]> {
    return OrderModel.find({ serviceProvider: serviceProviderId })
      .populate('user', 'fullName username phone')
      .populate('payment')
      .sort({ createdAt: -1 });
  }

  async findAllOrders(filter: FilterQuery<IOrder> = {}): Promise<IOrder[]> {
    return OrderModel.find(filter)
      .populate('user', 'fullName username phone')
      .populate('serviceProvider', 'fullName username phone role')
      .populate('payment')
      .sort({ createdAt: -1 });
  }

  async updateOrder(id: string, data: Partial<IOrder>): Promise<IOrder | null> {
    return OrderModel.findByIdAndUpdate(id, data, { new: true });
  }

  async findExpiredPendingOrders(expirationTime: Date): Promise<IOrder[]> {
    return OrderModel.find({
      status: { $in: [OrderStatus.PENDING, OrderStatus.PAYMENT_PENDING] },
      createdAt: { $lt: expirationTime },
    });
  }

  /**
   * Successful product payments whose domain fulfillment (stock / order completion) may be incomplete.
   */
  async findProductPaymentsNeedingFulfillment(limit: number = 50): Promise<IPayment[]> {
    return PaymentModel.find({
      paymentType: PaymentType.PRODUCT,
      status: PaymentStatus.SUCCESS,
      orderId: { $exists: true, $ne: null },
      $nor: [{ 'metadata.productStockApplied': true }],
    })
      .sort({ updatedAt: 1 })
      .limit(limit);
  }

  async findLatestSuccessfulProductPaymentForOrder(orderId: string): Promise<IPayment | null> {
    if (!Types.ObjectId.isValid(orderId)) {
      return null;
    }
    return PaymentModel.findOne({
      orderId: new Types.ObjectId(orderId),
      paymentType: PaymentType.PRODUCT,
      status: PaymentStatus.SUCCESS,
    }).sort({ updatedAt: -1 });
  }

  /**
   * True if the user has at least one non-pending service order that includes this listing.
   */
  async userHasCompletedServiceListingPurchase(
    userId: string,
    listingId: string,
    orderType: OrderType.HEALING | OrderType.PUJA | OrderType.PRODUCT,
    itemType: 'healing_listing' | 'puja_listing' | 'product'
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(listingId)) {
      return false;
    }
    const listingOid = new Types.ObjectId(listingId);
    const doc = await OrderModel.findOne({
      user: userId,
      orderType,
      status: { $in: REVIEW_ELIGIBLE_ORDER_STATUSES },
      items: {
        $elemMatch: {
          itemId: listingOid,
          itemType,
        },
      },
    })
      .select('_id')
      .lean();
    return doc != null;
  }

  /**
   * True if user has a completed healing package session for the given listing.
   * Used to allow per-session listing reviews from healing package flows.
   */
  async userHasCompletedHealingPackageSessionForListing(
    userId: string,
    listingId: string
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(listingId)) {
      return false;
    }
    const listingOid = new Types.ObjectId(listingId);
    const doc = await OrderModel.findOne({
      user: userId,
      orderType: OrderType.HEALING_PACKAGE,
      status: { $in: REVIEW_ELIGIBLE_ORDER_STATUSES },
      sessionProgress: {
        $elemMatch: {
          listingId: listingOid,
          status: 'completed',
        },
      },
    })
      .select('_id')
      .lean();
    return doc != null;
  }

  /**
   * True if user has at least one completed healing package session.
   * Fallback for older rows where sessionProgress.listingId may be missing.
   */
  async userHasAnyCompletedHealingPackageSession(userId: string): Promise<boolean> {
    const doc = await OrderModel.findOne({
      user: userId,
      orderType: OrderType.HEALING_PACKAGE,
      sessionProgress: {
        $elemMatch: {
          status: 'completed',
        },
      },
    })
      .select('_id')
      .lean();
    return doc != null;
  }

  /**
   * True if user has ever purchased a healing package order.
   * Broad fallback for legacy records where session completion linkage is inconsistent.
   */
  async userHasAnyHealingPackageOrder(userId: string): Promise<boolean> {
    const doc = await OrderModel.findOne({
      user: userId,
      orderType: OrderType.HEALING_PACKAGE,
    })
      .select('_id')
      .lean();
    return doc != null;
  }

  /**
   * True if user has at least one completed-status healing package order for this package id.
   */
  async userHasCompletedHealingPackagePurchase(
    userId: string,
    packageId: string
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(packageId)) {
      return false;
    }
    const packageOid = new Types.ObjectId(packageId);
    const doc = await OrderModel.findOne({
      user: userId,
      orderType: OrderType.HEALING_PACKAGE,
      status: { $in: REVIEW_ELIGIBLE_ORDER_STATUSES },
      items: {
        $elemMatch: {
          itemId: packageOid,
          itemType: 'healing_package',
        },
      },
    })
      .select('_id')
      .lean();
    return doc != null;
  }
}

