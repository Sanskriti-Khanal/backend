import { PaymentMethod, PaymentStatus, PaymentType } from '@models/Payment.model';
import { NotFoundError, BadRequestError } from '@errors/AppError';
import { PaymentRepository } from '@repositories/payment.repository';
import { UnifiedTransactionRepository } from '@repositories/unified-transaction.repository';
import { PaymentService } from '@services/payment.service';
import { HealingService } from '@services/healing.service';
import {
  IUnifiedTransaction,
  UnifiedTransactionLifecycleStatus,
  UnifiedTransactionType,
} from '@models/UnifiedTransaction.model';
import logger from '@utils/logger';

export class UnifiedTransactionService {
  private readonly txnRepo = new UnifiedTransactionRepository();
  private readonly paymentRepository = new PaymentRepository();
  private readonly paymentService = new PaymentService();
  private readonly healingService = new HealingService();

  async createPendingTransaction(input: {
    userId: string;
    type: UnifiedTransactionType;
    referenceId: string;
    amount: number;
    currency?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ transactionId: string }> {
    const doc = await this.txnRepo.create({
      user: input.userId as any,
      type: input.type,
      referenceId: input.referenceId,
      amount: input.amount,
      currency: (input.currency ?? 'NPR').toUpperCase(),
      status: 'pending',
      paymentStatus: 'pending',
      metadata: input.metadata,
    });
    return { transactionId: doc._id.toString() };
  }

  async linkPaymentToTransaction(input: {
    transactionId: string;
    userId: string;
    paymentId: string;
    paymentGateway: 'khalti' | 'nabil';
    gatewayTransactionRef?: string;
  }): Promise<void> {
    const { transactionId, userId, paymentId, paymentGateway, gatewayTransactionRef } =
      input;
    const txn = await this.txnRepo.findByIdForUser(transactionId, userId);
    if (!txn) {
      throw new BadRequestError('Invalid unified transaction');
    }
    if (txn.status !== 'pending' || txn.paymentStatus !== 'pending') {
      return;
    }
    await this.txnRepo.updateById(transactionId, {
      paymentId: paymentId as any,
      paymentGateway,
      ...(gatewayTransactionRef
        ? { gatewayTransactionRef: gatewayTransactionRef }
        : {}),
    });
  }

  private serialize(t: IUnifiedTransaction) {
    return {
      id: t._id.toString(),
      type: t.type,
      referenceId: t.referenceId,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      paymentStatus: t.paymentStatus,
      paymentGateway: t.paymentGateway ?? null,
      gatewayTransactionRef: t.gatewayTransactionRef ?? null,
      paymentId: t.paymentId?.toString() ?? null,
      createdAt: t.createdAt?.toISOString?.() ?? null,
      updatedAt: t.updatedAt?.toISOString?.() ?? null,
    };
  }

  /**
   * Single entry point: sync gateway payment state, update this row, then run domain fulfillment.
   * Idempotent when already success.
   */
  async verifyTransaction(
    transactionId: string,
    userId: string
  ): Promise<{
    status: 'success' | 'failed' | 'pending';
    transaction: Record<string, unknown>;
  }> {
    let txn = await this.txnRepo.findByIdForUser(transactionId, userId);
    if (!txn) {
      throw new NotFoundError('Transaction not found');
    }

    if (txn.status === 'success' && txn.paymentStatus === 'success') {
      return { status: 'success', transaction: this.serialize(txn) };
    }
    if (txn.status === 'failed' || txn.paymentStatus === 'failed') {
      return { status: 'failed', transaction: this.serialize(txn) };
    }

    if (!txn.paymentId) {
      const loose = await this.paymentRepository.findPaymentByMerosathiTransactionId(
        transactionId
      );
      if (loose?._id) {
        const gw =
          loose.paymentMethod === PaymentMethod.NABIL
            ? 'nabil'
            : loose.paymentMethod === PaymentMethod.KHALTI
              ? 'khalti'
              : undefined;
        if (gw) {
          await this.txnRepo.updateById(transactionId, {
            paymentId: loose._id as any,
            paymentGateway: gw,
            gatewayTransactionRef: loose.gatewayTransactionId,
          });
          txn = (await this.txnRepo.findByIdForUser(transactionId, userId))!;
        }
      }
    }

    if (!txn.paymentId) {
      return { status: 'pending', transaction: this.serialize(txn) };
    }

    await this.paymentService.syncPaymentFromGatewayById(txn.paymentId.toString());

    const payment = await this.paymentRepository.findPaymentById(
      txn.paymentId.toString()
    );
    if (!payment) {
      return { status: 'pending', transaction: this.serialize(txn) };
    }

    let payStatus: UnifiedTransactionLifecycleStatus = 'pending';
    if (payment.status === PaymentStatus.SUCCESS) payStatus = 'success';
    else if (
      payment.status === PaymentStatus.FAILED ||
      payment.status === PaymentStatus.CANCELLED ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      payStatus = 'failed';
    }

    if (payStatus === 'pending') {
      return { status: 'pending', transaction: this.serialize(txn) };
    }

    await this.txnRepo.updateById(transactionId, {
      paymentStatus: payStatus,
      status: payStatus,
      gatewayTransactionRef:
        payment.gatewayTransactionId?.toString() ||
        payment.gatewayPaymentId?.toString() ||
        txn.gatewayTransactionRef,
    });

    txn = (await this.txnRepo.findByIdForUser(transactionId, userId))!;

    if (payStatus === 'failed') {
      return { status: 'failed', transaction: this.serialize(txn) };
    }

    try {
      await this.fulfillDomain(txn, userId, payment);
    } catch (e) {
      logger.error('unified-transaction fulfillDomain failed', {
        transactionId,
        type: txn.type,
        error: String(e),
      });
    }

    txn = (await this.txnRepo.findByIdForUser(transactionId, userId))!;
    return { status: 'success', transaction: this.serialize(txn) };
  }

  private async fulfillDomain(
    txn: IUnifiedTransaction,
    userId: string,
    payment: import('@models/Payment.model').IPayment
  ): Promise<void> {
    switch (txn.type) {
      case 'booking':
        await this.healingService.verifyHealingSessionBooking(userId, txn.referenceId);
        break;
      case 'product':
        if (payment.paymentType === PaymentType.PRODUCT) {
          await this.paymentService.applyProductStockIfNotYetApplied(payment);
        }
        break;
      case 'service':
      case 'vastu':
        if (payment.paymentType === PaymentType.JYOTISH_SERVICE) {
          await this.paymentService.grantServiceAccessForPayment(payment);
        }
        break;
      default:
        break;
    }
  }
}
