import {
  TransactionLogModel,
  ITransactionLog,
  TransactionLogType,
} from '@models/TransactionLog.model';

export class TransactionLogRepository {
  /**
   * Create a new transaction log
   */
  async createLog(logData: Partial<ITransactionLog>): Promise<ITransactionLog> {
    try {
      // Validate required fields
      if (!logData.transactionId) {
        throw new Error('transactionId is required');
      }
      if (!logData.type) {
        throw new Error('type is required');
      }
      
      const log = await TransactionLogModel.create(logData);
      console.log(`✅ Transaction log created: ${logData.type} (ID: ${log._id})`);
      return log;
    } catch (error: any) {
      console.error('❌ Error creating transaction log:', error);
      console.error('  Log data:', JSON.stringify(logData, null, 2));
      throw error;
    }
  }

  /**
   * Get all logs for a transaction
   */
  async getLogsByTransactionId(transactionId: string): Promise<ITransactionLog[]> {
    return TransactionLogModel.find({ transactionId })
      .sort({ receivedAt: 1 })
      .exec();
  }

  /**
   * Get logs by order ID and session ID
   */
  async getLogsByOrderAndSession(
    orderId: string,
    sessionId: string
  ): Promise<ITransactionLog[]> {
    return TransactionLogModel.find({
      $or: [{ orderId }, { sessionId }],
    })
      .sort({ receivedAt: 1 })
      .exec();
  }

  /**
   * Get logs by type
   */
  async getLogsByType(type: TransactionLogType): Promise<ITransactionLog[]> {
    return TransactionLogModel.find({ type })
      .sort({ receivedAt: -1 })
      .exec();
  }

  /**
   * Get recent logs
   */
  async getRecentLogs(limit: number = 100): Promise<ITransactionLog[]> {
    return TransactionLogModel.find()
      .sort({ receivedAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get logs by date range
   */
  async getLogsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<ITransactionLog[]> {
    return TransactionLogModel.find({
      receivedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ receivedAt: -1 })
      .exec();
  }
}


