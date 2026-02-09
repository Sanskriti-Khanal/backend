import mongoose from 'mongoose';
import {
  JyotishBookingModel,
  IJyotishBooking,
  BookingType,
  BookingStatus,
} from '@models/JyotishBooking.model';
import { ChatMessageModel, IChatMessage } from '@models/ChatMessage.model';
import { CallRecordModel, ICallRecord } from '@models/CallRecord.model';
import {
  JyotishNoteModel,
  IJyotishNote,
} from '@models/JyotishNote.model';

export class JyotishRepository {
  // Booking methods
  async createBooking(
    bookingData: Partial<IJyotishBooking>
  ): Promise<IJyotishBooking> {
    return JyotishBookingModel.create(bookingData);
  }

  async findBookingById(id: string): Promise<IJyotishBooking | null> {
    return JyotishBookingModel.findById(id)
      .populate('user', 'fullName username phone')
      .populate('jyotish', 'fullName username specialtyTitle bio');
  }

  async findBookingsByUser(userId: string): Promise<IJyotishBooking[]> {
    return JyotishBookingModel.find({ user: userId })
      .populate('jyotish', 'fullName username specialtyTitle bio')
      .sort({ createdAt: -1 });
  }

  async findBookingsByJyotish(jyotishId: string): Promise<IJyotishBooking[]> {
    return JyotishBookingModel.find({ jyotish: jyotishId })
      .populate('user', 'fullName username phone')
      .sort({ createdAt: -1 });
  }

  async findAllBookings(): Promise<IJyotishBooking[]> {
    return JyotishBookingModel.find()
      .populate('user', 'fullName username phone')
      .populate('jyotish', 'fullName username specialtyTitle')
      .sort({ createdAt: -1 });
  }

  async findActiveCallForJyotish(jyotishId: string): Promise<ICallRecord | null> {
    // Find call records that are currently active (started but not ended)
    return CallRecordModel.findOne({
      jyotish: jyotishId,
      endedAt: { $exists: false },
    });
  }

  async findAllActiveCalls(): Promise<ICallRecord[]> {
    return CallRecordModel.find({ endedAt: { $exists: false } })
      .populate('user', 'fullName username phone')
      .populate('jyotish', 'fullName username phone')
      .populate('booking')
      .sort({ startedAt: -1 });
  }

  async findActiveBookingForJyotish(jyotishId: string): Promise<IJyotishBooking | null> {
    // Find bookings that are in progress (started but not ended)
    return JyotishBookingModel.findOne({
      jyotish: jyotishId,
      status: BookingStatus.IN_PROGRESS,
      startedAt: { $exists: true },
      endedAt: { $exists: false },
    });
  }

  async findActiveBookingsByJyotish(
    jyotishId: string
  ): Promise<IJyotishBooking[]> {
    return JyotishBookingModel.find({
      jyotish: jyotishId,
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
    })
      .populate('user', 'fullName username phone')
      .sort({ scheduledAt: 1 });
  }

  async updateBooking(
    id: string,
    data: Partial<IJyotishBooking>
  ): Promise<IJyotishBooking | null> {
    return JyotishBookingModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  // Chat message methods
  async createMessage(messageData: Partial<IChatMessage>): Promise<IChatMessage> {
    return ChatMessageModel.create(messageData);
  }

  async findMessagesByBooking(bookingId: string): Promise<IChatMessage[]> {
    return ChatMessageModel.find({ booking: bookingId })
      .populate('sender', 'fullName username')
      .populate('receiver', 'fullName username')
      .sort({ createdAt: 1 });
  }

  async markMessagesAsRead(
    bookingId: string,
    userId: string
  ): Promise<void> {
    await ChatMessageModel.updateMany(
      {
        booking: bookingId,
        receiver: userId,
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return ChatMessageModel.countDocuments({
      receiver: userId,
      read: false,
    });
  }

  async getUnreadCountForBooking(bookingId: string, userId: string): Promise<number> {
    return ChatMessageModel.countDocuments({
      booking: bookingId,
      receiver: userId,
      read: false,
    });
  }

  async getLastMessageForBooking(bookingId: string): Promise<IChatMessage | null> {
    return ChatMessageModel.findOne({ booking: bookingId })
      .populate('sender', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(1);
  }

  async getChatRoomsForUser(userId: string): Promise<any[]> {
    // Get all bookings for the user
    const bookings = await JyotishBookingModel.find({ user: userId })
      .populate('jyotish', 'fullName username specialtyTitle bio profilePicture')
      .sort({ updatedAt: -1 });

    // Get chat rooms with last message and unread counts
    const rooms = await Promise.all(
      bookings.map(async (booking) => {
        const lastMessage = await this.getLastMessageForBooking(booking._id.toString());
        const unreadCount = await this.getUnreadCountForBooking(booking._id.toString(), userId);
        
        const jyotish = booking.jyotish as any;
        const expertId = jyotish?._id?.toString() || jyotish?.toString() || '';
        const expertName = jyotish?.fullName || jyotish?.username || 'Unknown';
        
        return {
          bookingId: booking._id.toString(),
          userId: booking.user.toString(),
          expertId: expertId,
          expertName: expertName,
          expertAvatarUrl: jyotish?.profilePicture || null,
          lastMessage: lastMessage ? {
            message: lastMessage.message,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.sender?.toString() || '',
          } : null,
          unreadCount,
          bookingType: booking.type,
          bookingStatus: booking.status,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        };
      })
    );

    return rooms;
  }

  async getChatRoomsForJyotish(jyotishId: string): Promise<any[]> {
    // Get all bookings for the jyotish
    const bookings = await JyotishBookingModel.find({ jyotish: jyotishId })
      .populate('user', 'fullName username phone profilePicture')
      .sort({ updatedAt: -1 });

    // Get chat rooms with last message and unread counts
    const rooms = await Promise.all(
      bookings.map(async (booking) => {
        const lastMessage = await this.getLastMessageForBooking(booking._id.toString());
        const unreadCount = await this.getUnreadCountForBooking(booking._id.toString(), jyotishId);
        
        const user = booking.user as any;
        const userId = user?._id?.toString() || user?.toString() || '';
        const userName = user?.fullName || user?.username || 'Unknown';
        
        return {
          bookingId: booking._id.toString(),
          userId: userId,
          userName: userName,
          userAvatarUrl: user?.profilePicture || null,
          expertId: booking.jyotish.toString(),
          lastMessage: lastMessage ? {
            message: lastMessage.message,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.sender?.toString() || '',
          } : null,
          unreadCount,
          bookingType: booking.type,
          bookingStatus: booking.status,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        };
      })
    );

    return rooms;
  }

  // Call record methods
  async createCallRecord(
    callData: Partial<ICallRecord>
  ): Promise<ICallRecord> {
    return CallRecordModel.create(callData);
  }

  async findCallRecordById(id: string): Promise<ICallRecord | null> {
    return CallRecordModel.findById(id)
      .populate('user', 'fullName username')
      .populate('jyotish', 'fullName username');
  }

  async findCallRecordsByBooking(bookingId: string): Promise<ICallRecord[]> {
    return CallRecordModel.find({ booking: bookingId })
      .populate('user', 'fullName username')
      .populate('jyotish', 'fullName username')
      .sort({ startedAt: -1 });
  }

  async updateCallRecord(
    id: string,
    data: Partial<ICallRecord>
  ): Promise<ICallRecord | null> {
    return CallRecordModel.findByIdAndUpdate(id, data, { new: true });
  }

  // Note methods
  async createNote(noteData: Partial<IJyotishNote>): Promise<IJyotishNote> {
    return JyotishNoteModel.create(noteData);
  }

  async findNoteById(id: string): Promise<IJyotishNote | null> {
    return JyotishNoteModel.findById(id)
      .populate('user', 'fullName username')
      .populate('jyotish', 'fullName username')
      .populate('booking');
  }

  async findNotesByUser(userId: string): Promise<IJyotishNote[]> {
    return JyotishNoteModel.find({ user: userId })
      .populate('jyotish', 'fullName username specialtyTitle')
      .populate('booking')
      .sort({ createdAt: -1 });
  }

  async findNotesByJyotish(jyotishId: string): Promise<IJyotishNote[]> {
    return JyotishNoteModel.find({ jyotish: jyotishId })
      .populate('user', 'fullName username')
      .populate('booking')
      .sort({ createdAt: -1 });
  }

  async findNotesForJyotishAboutUser(
    userId: string,
    jyotishId: string
  ): Promise<IJyotishNote[]> {
    // Get all notes about this user that this jyotish can read
    // A jyotish can read notes if:
    // 1. They created the note, OR
    // 2. They have a booking with this user (for private notes)
    const hasBooking = await JyotishBookingModel.exists({
      user: userId,
      jyotish: jyotishId,
    });

    if (hasBooking) {
      // Can read all notes (own + private notes from other jyotish)
      return JyotishNoteModel.find({ user: userId })
        .populate('jyotish', 'fullName username specialtyTitle')
        .populate('booking')
        .sort({ createdAt: -1 });
    } else {
      // Can only read own notes
      return JyotishNoteModel.find({ user: userId, jyotish: jyotishId })
        .populate('jyotish', 'fullName username specialtyTitle')
        .populate('booking')
        .sort({ createdAt: -1 });
    }
  }

  async updateNote(
    id: string,
    data: Partial<IJyotishNote>
  ): Promise<IJyotishNote | null> {
    return JyotishNoteModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await JyotishNoteModel.findByIdAndDelete(id);
    return !!result;
  }
}

