import {
  NabilCallbackModel,
  INabilCallback,
  NabilCallbackStatus,
  NabilLogType,
} from '@models/NabilCallback.model';

export class NabilCallbackRepository {
  /**
   * Create a new callback transaction record
   */
  async createCallback(callbackData: Partial<INabilCallback>): Promise<INabilCallback> {
    return NabilCallbackModel.create(callbackData);
  }

  /**
   * Find callback by OrderID
   */
  async findCallbackByOrderId(orderId: string): Promise<INabilCallback | null> {
    return NabilCallbackModel.findOne({ orderId }).sort({ receivedAt: -1 });
  }

  /**
   * Find callback by SessionId
   */
  async findCallbackBySessionId(sessionId: string): Promise<INabilCallback | null> {
    return NabilCallbackModel.findOne({ sessionId }).sort({ receivedAt: -1 });
  }

  /**
   * Find callback by encrypted OrderID
   */
  async findCallbackByEncryptedOrderId(
    encryptedOrderId: string
  ): Promise<INabilCallback | null> {
    return NabilCallbackModel.findOne({ encryptedOrderId }).sort({ receivedAt: -1 });
  }

  /**
   * Find all callbacks by status
   */
  async findCallbacksByStatus(status: NabilCallbackStatus): Promise<INabilCallback[]> {
    return NabilCallbackModel.find({ status }).sort({ receivedAt: -1 });
  }

  /**
   * Get all callbacks (with pagination)
   */
  async getAllCallbacks(
    limit: number = 50,
    skip: number = 0
  ): Promise<INabilCallback[]> {
    return NabilCallbackModel.find()
      .sort({ receivedAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  /**
   * Count total callbacks
   */
  async countCallbacks(): Promise<number> {
    return NabilCallbackModel.countDocuments();
  }
}








