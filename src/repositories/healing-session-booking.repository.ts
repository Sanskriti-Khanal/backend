import {
  HealingSessionBookingModel,
  IHealingSessionBooking,
  HealingSessionBookingStatus,
  HealingSessionPaymentStatus,
} from '@models/HealingSessionBooking.model';
import mongoose from 'mongoose';

const ACTIVE_PENDING_MS = 10 * 60 * 1000;

export class HealingSessionBookingRepository {
  async create(
    data: Partial<IHealingSessionBooking>
  ): Promise<IHealingSessionBooking> {
    return HealingSessionBookingModel.create(data);
  }

  async findById(id: string): Promise<IHealingSessionBooking | null> {
    return HealingSessionBookingModel.findById(id);
  }

  async findByIdForUser(
    id: string,
    userId: string
  ): Promise<IHealingSessionBooking | null> {
    return HealingSessionBookingModel.findOne({
      _id: id,
      user: new mongoose.Types.ObjectId(userId),
    });
  }

  /**
   * True if another booking holds this slot (confirmed, or pending still within 10 minutes).
   */
  async hasActiveSlotConflict(params: {
    sessionId: string;
    scheduledDate: string;
    timeSlot: string;
    excludeBookingId?: string;
  }): Promise<boolean> {
    const { sessionId, scheduledDate, timeSlot, excludeBookingId } = params;
    const cutoff = new Date(Date.now() - ACTIVE_PENDING_MS);

    const base: Record<string, unknown> = {
      sessionId: new mongoose.Types.ObjectId(sessionId),
      scheduledDate,
      timeSlot,
    };

    if (excludeBookingId) {
      base._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
    }

    const conflict = await HealingSessionBookingModel.findOne({
      ...base,
      $or: [{ status: 'confirmed' }, { status: 'pending', createdAt: { $gte: cutoff } }],
    })
      .select('_id')
      .lean();

    return !!conflict;
  }

  /**
   * Dates (YYYY-MM-DD) shown as booked on the public calendar: **paid/confirmed only**
   * (Khalti, Nabil card, or any path that sets `status: confirmed` + `paymentStatus: success`).
   * Pending holds are still enforced for new bookings by [hasActiveSlotConflict] but are not
   * shown on the calendar until payment succeeds.
   */
  async listActiveOccupiedScheduledDates(sessionId: string): Promise<string[]> {
    const rows = await HealingSessionBookingModel.distinct('scheduledDate', {
      sessionId: new mongoose.Types.ObjectId(sessionId),
      status: 'confirmed',
      paymentStatus: 'success',
    });
    const list = rows as string[];
    return list
      .filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
  }

  async attachGatewayPayment(
    bookingId: string,
    userId: string,
    orderId: string,
    paymentId: string
  ): Promise<IHealingSessionBooking | null> {
    return HealingSessionBookingModel.findOneAndUpdate(
      {
        _id: bookingId,
        user: new mongoose.Types.ObjectId(userId),
        status: 'pending',
      },
      {
        $set: {
          orderId: new mongoose.Types.ObjectId(orderId),
          paymentId: new mongoose.Types.ObjectId(paymentId),
        },
      },
      { new: true }
    );
  }

  async updateById(
    id: string,
    patch: Partial<{
      status: HealingSessionBookingStatus;
      paymentStatus: HealingSessionPaymentStatus;
      transactionId: string;
    }>
  ): Promise<IHealingSessionBooking | null> {
    return HealingSessionBookingModel.findByIdAndUpdate(id, patch, { new: true });
  }
}
