import { Router } from 'express';
import { TransactionLogController } from '@controllers/transaction-log.controller';

const router = Router();
const transactionLogController = new TransactionLogController();

// Public endpoint for PHP to send logs (no authentication required)
router.post('/', transactionLogController.createLog);

// Public routes for viewing logs (no authentication required for easy access)
// Note: These can be protected later if needed
router.get(
  '/transaction/:transactionId',
  transactionLogController.getLogsByTransactionId
);
router.get(
  '/order/:orderId/session/:sessionId',
  transactionLogController.getLogsByOrderAndSession
);
router.get('/recent', transactionLogController.getRecentLogs);

export default router;

