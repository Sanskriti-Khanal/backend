import { PaymentRepository } from '@repositories/payment.repository';
import { PaymentService } from '@services/payment.service';
import { KhaltiService } from '@services/khalti.service';
import { PaymentMethod } from '@models/Payment.model';
import logger from '@utils/logger';

/**
 * Repairs product orders after crashes: payment SUCCESS but fulfillment incomplete.
 */
export class OrderReconciliationService {
  private readonly paymentRepository = new PaymentRepository();
  private readonly paymentService = new PaymentService();
  private readonly khaltiService = new KhaltiService();

  async reconcileProductOrders(limit: number = 40): Promise<{
    scanned: number;
    fixed: number;
    errors: string[];
  }> {
    const payments = await this.paymentRepository.findProductPaymentsNeedingFulfillment(limit);
    const errors: string[] = [];
    let fixed = 0;

    for (const p of payments) {
      try {
        const full = await this.paymentRepository.findPaymentById(p._id.toString());
        if (!full || !full.orderId) continue;

        const order = await this.paymentRepository.findOrderById(full.orderId.toString());
        if (!order) continue;

        let totalPaisa: number;
        if (typeof full.metadata?.total_amount === 'number') {
          totalPaisa = full.metadata.total_amount as number;
        } else if (
          full.gatewayTransactionId &&
          full.paymentMethod === PaymentMethod.KHALTI
        ) {
          const v = await this.khaltiService.verifyPayment(full.gatewayTransactionId);
          totalPaisa = v.total_amount;
        } else {
          totalPaisa = this.khaltiService.nprToPaisa(full.amount);
        }

        await this.paymentService.completeProductOrderAfterKhaltiSuccess(full, {
          status: 'Completed',
          total_amount: totalPaisa,
          transaction_id: full.gatewayPaymentId,
        });
        fixed++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${p._id.toString()}: ${msg}`);
        logger.warn('order reconciliation row failed', { paymentId: p._id.toString(), msg });
      }
    }

    return { scanned: payments.length, fixed, errors };
  }
}
