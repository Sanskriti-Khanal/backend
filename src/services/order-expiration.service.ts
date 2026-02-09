import { PaymentRepository } from '@repositories/payment.repository';
import { OrderStatus } from '@models/Order.model';
import logger from '@utils/logger';

export class OrderExpirationService {
  private paymentRepository: PaymentRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
  }

  /**
   * Expire pending orders that are older than the expiration time
   * @param expirationMinutes - Minutes after which orders expire (default: 15)
   */
  async expirePendingOrders(expirationMinutes: number = 15): Promise<void> {
    try {
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() - expirationMinutes);

      // Find all pending orders older than expiration time
      const expiredOrders = await this.paymentRepository.findExpiredPendingOrders(
        expirationTime
      );

      let expiredCount = 0;
      for (const order of expiredOrders) {
        try {
          await this.paymentRepository.updateOrder(order._id.toString(), {
            status: OrderStatus.CANCELLED,
          });

          logger.info('Order expired and cancelled', {
            orderId: order._id.toString(),
            userId: order.user.toString(),
            serviceProviderId: order.serviceProvider?.toString(),
            orderType: order.orderType,
            createdAt: order.createdAt,
            expiredAfterMinutes: expirationMinutes,
          });

          expiredCount++;
        } catch (error) {
          logger.error('Error cancelling expired order', {
            orderId: order._id.toString(),
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (expiredCount > 0) {
        logger.info(`Expired ${expiredCount} pending orders`, {
          expirationMinutes,
          totalExpired: expiredCount,
        });
      }
    } catch (error) {
      logger.error('Error in expirePendingOrders', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
}

