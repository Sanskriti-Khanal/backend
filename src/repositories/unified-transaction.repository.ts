import mongoose, { Types } from 'mongoose';
import {
  IUnifiedTransaction,
  UnifiedTransactionLifecycleStatus,
  UnifiedTransactionModel,
  UnifiedTransactionType,
} from '@models/UnifiedTransaction.model';

export class UnifiedTransactionRepository {
  async create(
    data: Partial<IUnifiedTransaction>
  ): Promise<IUnifiedTransaction> {
    return UnifiedTransactionModel.create(data);
  }

  async findById(id: string): Promise<IUnifiedTransaction | null> {
    return UnifiedTransactionModel.findById(id);
  }

  async findByIdForUser(
    id: string,
    userId: string
  ): Promise<IUnifiedTransaction | null> {
    return UnifiedTransactionModel.findOne({
      _id: new Types.ObjectId(id),
      user: new Types.ObjectId(userId),
    });
  }

  async updateById(
    id: string,
    patch: Partial<{
      status: UnifiedTransactionLifecycleStatus;
      paymentStatus: UnifiedTransactionLifecycleStatus;
      paymentGateway: 'khalti' | 'nabil';
      gatewayTransactionRef: string;
      paymentId: mongoose.Types.ObjectId;
      metadata: Record<string, unknown>;
    }>
  ): Promise<IUnifiedTransaction | null> {
    return UnifiedTransactionModel.findByIdAndUpdate(id, patch, { new: true });
  }

  async findLatestByUserReference(
    userId: string,
    type: UnifiedTransactionType,
    referenceId: string
  ): Promise<IUnifiedTransaction | null> {
    return UnifiedTransactionModel.findOne({
      user: new Types.ObjectId(userId),
      type,
      referenceId,
    }).sort({ createdAt: -1 });
  }
}
