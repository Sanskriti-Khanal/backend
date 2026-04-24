import { Router, Request, Response, NextFunction } from 'express';
import env from '@config/env';
import { NotificationService } from '@services/notification.service';
import { OrderReconciliationService } from '@services/order-reconciliation.service';
import { sendSuccess } from '@utils/response.util';

const router = Router();

/**
 * External scheduler (Vercel Cron, GitHub Actions, etc.):
 * POST /api/v1/cron/daily-rashifal
 * Header: x-cron-secret: <CRON_SECRET>
 */
router.post('/daily-rashifal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!env.CRON_SECRET) {
      res.status(503).json({
        success: false,
        message: 'CRON_SECRET is not configured on the server',
      });
      return;
    }
    if (req.get('x-cron-secret') !== env.CRON_SECRET) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const result = await new NotificationService().sendDailyForecasts();
    sendSuccess(res, result, 'Daily Rashifal job completed');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/cron/order-reconciliation
 * Header: x-cron-secret: <CRON_SECRET>
 */
router.post('/order-reconciliation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!env.CRON_SECRET) {
      res.status(503).json({
        success: false,
        message: 'CRON_SECRET is not configured on the server',
      });
      return;
    }
    if (req.get('x-cron-secret') !== env.CRON_SECRET) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const limit = Math.min(
      200,
      Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50)
    );
    const result = await new OrderReconciliationService().reconcileProductOrders(limit);
    sendSuccess(res, result, 'Order reconciliation completed');
  } catch (error) {
    next(error);
  }
});

export default router;
