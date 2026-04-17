import {
  PaymentModel,
  IPayment,
  PaymentStatus,
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
      status: 'pending',
      createdAt: { $lt: expirationTime },
    });
  }

  /**
   * True if the user has at least one non-pending service order that includes this listing.
   */
  async userHasCompletedServiceListingPurchase(
    userId: string,
    listingId: string,
    orderType: OrderType.HEALING | OrderType.PUJA,
    itemType: 'healing_listing' | 'puja_listing'
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
}

