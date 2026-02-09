import { Request, Response, NextFunction } from 'express';
import { TransactionLogRepository } from '@repositories/transaction-log.repository';
import { TransactionLogType } from '@models/TransactionLog.model';
import { sendSuccess, sendError } from '@utils/response.util';
import { BadRequestError } from '@errors/AppError';

export class TransactionLogController {
  private transactionLogRepository: TransactionLogRepository;

  constructor() {
    this.transactionLogRepository = new TransactionLogRepository();
  }

  /**
   * Create a transaction log (called from PHP)
   * POST /api/v1/transaction-logs
   */
  createLog = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        transactionId,
        type,
        orderId,
        sessionId,
        xmlData,
        metadata,
        errorMessage,
        httpCode,
        curlError,
      } = req.body;

      if (!transactionId || !type) {
        throw new BadRequestError('transactionId and type are required');
      }

      // Validate type
      if (!Object.values(TransactionLogType).includes(type)) {
        throw new BadRequestError('Invalid log type');
      }

      const log = await this.transactionLogRepository.createLog({
        transactionId,
        type,
        orderId,
        sessionId,
        xmlData,
        metadata,
        errorMessage,
        httpCode,
        curlError,
        receivedAt: new Date(),
      });

      sendSuccess(res, log, 'Log created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get logs by transaction ID
   * GET /api/v1/transaction-logs/transaction/:transactionId
   */
  getLogsByTransactionId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { transactionId } = req.params;

      if (!transactionId) {
        throw new BadRequestError('transactionId is required');
      }

      const logs = await this.transactionLogRepository.getLogsByTransactionId(
        transactionId
      );

      sendSuccess(res, logs, 'Logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get logs by order ID and session ID
   * GET /api/v1/transaction-logs/order/:orderId/session/:sessionId
   */
  getLogsByOrderAndSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderId, sessionId } = req.params;

      if (!orderId && !sessionId) {
        throw new BadRequestError('orderId or sessionId is required');
      }

      const logs = await this.transactionLogRepository.getLogsByOrderAndSession(
        orderId || '',
        sessionId || ''
      );

      sendSuccess(res, logs, 'Logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get recent logs
   * GET /api/v1/transaction-logs/recent?limit=100
   */
  getRecentLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      const logs = await this.transactionLogRepository.getRecentLogs(limit);

      sendSuccess(res, logs, 'Logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}


