import crypto from 'crypto';
import { JyotishRepository } from '@repositories/jyotish.repository';
import { UserRepository } from '@repositories/user.repository';
import { ServiceAccessRepository } from '@repositories/service-access.repository';
import {
  IJyotishBooking,
  BookingType,
  BookingStatus,
} from '@models/JyotishBooking.model';
import { IChatMessage } from '@models/ChatMessage.model';
import { ICallRecord } from '@models/CallRecord.model';
import { IJyotishNote } from '@models/JyotishNote.model';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '@errors/AppError';
import { UserRole, isConsultationExpertRole } from '@types';
import { NotificationService } from './notification.service';
import { NotificationType } from '@models/Notification.model';
import logger from '@utils/logger';

const FREE_MINUTES = 1; // 1 minute free chat/call

export class JyotishService {
  private jyotishRepository: JyotishRepository;
  private userRepository: UserRepository;
  private serviceAccessRepository: ServiceAccessRepository;
  private notificationService: NotificationService;

  constructor() {
    this.jyotishRepository = new JyotishRepository();
    this.userRepository = new UserRepository();
    this.serviceAccessRepository = new ServiceAccessRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Helper function to extract ID from populated or non-populated field
   * Handles both cases: when field is populated (User object) or ObjectId
   */
  private getUserOrJyotishId(field: any): string | null {
    if (!field) return null;
    // If populated (object with _id)
    if (typeof field === 'object' && field._id) {
      return field._id.toString();
    }
    // If populated (object with id property)
    if (typeof field === 'object' && field.id) {
      return field.id.toString();
    }
    // If ObjectId or string
    return field.toString();
  }

  // Booking methods
  async createBooking(
    data: {
      jyotishId: string;
      type: BookingType;
      scheduledAt?: Date;
    },
    userId: string
  ): Promise<IJyotishBooking> {
    // Verify jyotish exists and is active
    const jyotish = await this.userRepository.findById(data.jyotishId);
    if (!jyotish || !isConsultationExpertRole(jyotish.role) || !jyotish.isActive) {
      throw new NotFoundError('Expert not found or inactive');
    }

    // Premium jyotish: allow booking after session ticket (payment) even if offline/busy
    const isPremiumJyotish = jyotish.role === UserRole.PREMIUM_JYOTISH;
    if (isPremiumJyotish && data.type === BookingType.CHAT) {
      throw new BadRequestError('This expert offers call-only consultations.');
    }
    if (!data.scheduledAt && !jyotish.isOnline && !isPremiumJyotish) {
      throw new BadRequestError('Expert is currently offline');
    }

    return this.jyotishRepository.createBooking({
      user: userId as any,
      jyotish: data.jyotishId as any,
      type: data.type,
      status: data.scheduledAt ? BookingStatus.PENDING : BookingStatus.CONFIRMED,
      scheduledAt: data.scheduledAt,
      freeMinutesUsed: 0,
      totalAmount: 0,
      paid: false,
    });
  }

  async getBookingById(id: string): Promise<IJyotishBooking> {
    const booking = await this.jyotishRepository.findBookingById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    return booking;
  }

  async getUserBookings(userId: string): Promise<IJyotishBooking[]> {
    return this.jyotishRepository.findBookingsByUser(userId);
  }

  async getJyotishBookings(jyotishId: string): Promise<IJyotishBooking[]> {
    return this.jyotishRepository.findBookingsByJyotish(jyotishId);
  }

  async getActiveBookings(jyotishId: string): Promise<IJyotishBooking[]> {
    return this.jyotishRepository.findActiveBookingsByJyotish(jyotishId);
  }

  async startBooking(bookingId: string, userId: string): Promise<IJyotishBooking> {
    const booking = await this.jyotishRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Verify user has permission
    const bookingUserId = this.getUserOrJyotishId(booking.user);
    const bookingJyotishId = this.getUserOrJyotishId(booking.jyotish);
    
    if (
      bookingUserId !== userId &&
      bookingJyotishId !== userId
    ) {
      throw new BadRequestError('You do not have permission to start this booking');
    }

    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING) {
      throw new BadRequestError('Booking cannot be started');
    }

    const updatedBooking = await this.jyotishRepository.updateBooking(bookingId, {
      status: BookingStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    if (!updatedBooking) {
      throw new NotFoundError('Booking not found');
    }

    return updatedBooking;
  }

  async endBooking(
    bookingId: string,
    userId: string,
    duration: number
  ): Promise<IJyotishBooking> {
    const booking = await this.jyotishRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Verify user has permission
    const bookingUserId = this.getUserOrJyotishId(booking.user);
    const bookingJyotishId = this.getUserOrJyotishId(booking.jyotish);
    
    if (
      bookingUserId !== userId &&
      bookingJyotishId !== userId
    ) {
      throw new BadRequestError('You do not have permission to end this booking');
    }

    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestError('Booking is not in progress');
    }

    // Calculate free minutes used and charges
    const freeMinutesUsed = Math.min(duration, FREE_MINUTES);
    const chargeableMinutes = Math.max(0, duration - FREE_MINUTES);
    void chargeableMinutes; // reserved for future metered billing
    // Preserve amount already stored when the session was paid upfront (JYOTISH_SERVICE / booking payment)
    const totalAmountToStore =
      booking.paid === true && typeof booking.totalAmount === 'number'
        ? booking.totalAmount
        : 0;

    const updatedBooking = await this.jyotishRepository.updateBooking(bookingId, {
      status: BookingStatus.COMPLETED,
      endedAt: new Date(),
      duration,
      freeMinutesUsed,
      totalAmount: totalAmountToStore,
    });

    if (!updatedBooking) {
      throw new NotFoundError('Booking not found');
    }

    return updatedBooking;
  }

  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    const booking = await this.jyotishRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Verify user has permission
    if (
      this.getUserOrJyotishId(booking.user) !== userId &&
      this.getUserOrJyotishId(booking.jyotish) !== userId
    ) {
      throw new BadRequestError('You do not have permission to cancel this booking');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestError('Cannot cancel a completed booking');
    }

    await this.jyotishRepository.updateBooking(bookingId, {
      status: BookingStatus.CANCELLED,
    });
  }

  // Chat methods
  async sendMessage(
    bookingId: string,
    senderId: string,
    message: string
  ): Promise<IChatMessage> {
    const booking = await this.jyotishRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const bookingUserId = this.getUserOrJyotishId(booking.user);
    const bookingJyotishId = this.getUserOrJyotishId(booking.jyotish);

    // Verify sender is part of the booking
    if (
      bookingUserId !== senderId &&
      bookingJyotishId !== senderId
    ) {
      throw new BadRequestError('You are not part of this booking');
    }

    if (bookingUserId === senderId && bookingJyotishId) {
      const hasAccess = await this.serviceAccessRepository.hasAccess(
        senderId,
        bookingJyotishId,
        'chat'
      );
      if (!hasAccess) {
        throw new ForbiddenError(
          'Payment required to continue chatting. The astrologer ended this session — pay again to send messages.'
        );
      }
    }

    const receiverId =
      bookingUserId === senderId
        ? bookingJyotishId
        : bookingUserId;

    const chatMessage = await this.jyotishRepository.createMessage({
      booking: bookingId as any,
      sender: senderId as any,
      receiver: receiverId as any,
      message,
    });

    if (receiverId) {
      void this.notifyReceiverOfChatMessage(
        receiverId,
        senderId,
        bookingId,
        message
      ).catch((err: unknown) => {
        logger.error('notifyReceiverOfChatMessage failed', {
          error: err instanceof Error ? err.message : err,
          bookingId,
          receiverId,
        });
      });
    }

    return chatMessage;
  }

  /** In-app + push for the other party so mobile bell / notifications list update. */
  private async notifyReceiverOfChatMessage(
    receiverId: string,
    senderId: string,
    bookingId: string,
    message: string
  ): Promise<void> {
    const sender = await this.userRepository.findById(senderId);
    const senderName =
      (sender?.fullName && String(sender.fullName).trim()) ||
      sender?.username ||
      'Someone';
    const preview =
      message.length > 120 ? `${message.slice(0, 117)}...` : message;

    await this.notificationService.createNotification(receiverId, {
      type: NotificationType.MESSAGE,
      title: `New message from ${senderName}`,
      message: preview,
      metadata: {
        kind: 'jyotish_chat',
        bookingId,
        senderId,
      },
    });
  }

  async getChatMessages(bookingId: string, userId: string): Promise<IChatMessage[]> {
    const booking = await this.jyotishRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const bookingUserId = this.getUserOrJyotishId(booking.user);
    const bookingJyotishId = this.getUserOrJyotishId(booking.jyotish);

    // Verify user is part of the booking
    if (
      bookingUserId !== userId &&
      bookingJyotishId !== userId
    ) {
      throw new BadRequestError('You are not part of this booking');
    }

    // Mark messages as read
    await this.jyotishRepository.markMessagesAsRead(bookingId, userId);

    return this.jyotishRepository.findMessagesByBooking(bookingId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.jyotishRepository.getUnreadCount(userId);
  }

  async getChatRooms(userId: string, userRole: UserRole): Promise<any[]> {
    if (isConsultationExpertRole(userRole)) {
      return this.jyotishRepository.getChatRoomsForJyotish(userId);
    } else {
      return this.jyotishRepository.getChatRoomsForUser(userId);
    }
  }

  // Call methods
  async startCall(
    bookingId: string,
    userId: string,
    callType: 'audio' | 'video' = 'audio'
  ): Promise<ICallRecord> {
    const booking = await this.jyotishRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const bookingUserId = this.getUserOrJyotishId(booking.user);
    const bookingJyotishId = this.getUserOrJyotishId(booking.jyotish);

    // Verify user is part of the booking
    if (
      bookingUserId !== userId &&
      bookingJyotishId !== userId
    ) {
      throw new BadRequestError('You are not part of this booking');
    }

    if (bookingUserId === userId && bookingJyotishId) {
      const hasAccess = await this.serviceAccessRepository.hasAccess(
        userId,
        bookingJyotishId,
        'call'
      );
      if (!hasAccess) {
        throw new ForbiddenError(
          'Payment required to start a call. The previous call session was ended — pay again to continue.'
        );
      }
    }

    // Jitsi room name for admin/expert join link (meet.jit.si/{roomName})
    const shortId = crypto.randomBytes(4).toString('hex');
    const roomName = `merosathi-call-${bookingId}-${shortId}`;

    return this.jyotishRepository.createCallRecord({
      booking: bookingId as any,
      user: bookingUserId as any,
      jyotish: bookingJyotishId as any,
      roomName,
      startedAt: new Date(),
      callType,
    });
  }

  async endCall(callId: string, userId: string, duration: number): Promise<ICallRecord> {
    const callRecord = await this.jyotishRepository.findCallRecordById(callId);
    if (!callRecord) {
      throw new NotFoundError('Call record not found');
    }

    const bookingUserId = this.getUserOrJyotishId(callRecord.user);
    const bookingJyotishId = this.getUserOrJyotishId(callRecord.jyotish);

    if (bookingUserId !== userId && bookingJyotishId !== userId) {
      throw new BadRequestError('You are not part of this call');
    }

    const updatedCall = await this.jyotishRepository.updateCallRecord(callId, {
      endedAt: new Date(),
      duration,
    });

    if (!updatedCall) {
      throw new NotFoundError('Call record not found');
    }

    if (bookingUserId && bookingJyotishId) {
      await this.serviceAccessRepository.revokeAccess(
        bookingUserId,
        bookingJyotishId,
        'call'
      );
    }

    return updatedCall;
  }

  async getCallRecords(bookingId: string, userId: string): Promise<ICallRecord[]> {
    const booking = await this.jyotishRepository.findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const bookingUserId = this.getUserOrJyotishId(booking.user);
    const bookingJyotishId = this.getUserOrJyotishId(booking.jyotish);

    // Verify user is part of the booking
    if (
      bookingUserId !== userId &&
      bookingJyotishId !== userId
    ) {
      throw new BadRequestError('You are not part of this booking');
    }

    return this.jyotishRepository.findCallRecordsByBooking(bookingId);
  }

  // Note methods
  async createNote(
    userId: string,
    jyotishId: string,
    data: { note: string; bookingId?: string; isPrivate?: boolean }
  ): Promise<IJyotishNote> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify jyotish exists and is the current user
    const jyotish = await this.userRepository.findById(jyotishId);
    if (!jyotish || !isConsultationExpertRole(jyotish.role)) {
      throw new NotFoundError('Expert not found');
    }

    return this.jyotishRepository.createNote({
      user: userId as any,
      jyotish: jyotishId as any,
      booking: data.bookingId as any,
      note: data.note,
      isPrivate: data.isPrivate ?? true,
    });
  }

  async getNotesForUser(
    userId: string,
    jyotishId: string
  ): Promise<IJyotishNote[]> {
    // Verify jyotish exists
    const jyotish = await this.userRepository.findById(jyotishId);
    if (!jyotish || !isConsultationExpertRole(jyotish.role)) {
      throw new NotFoundError('Expert not found');
    }

    // This method returns notes that the expert can read
    // (own notes + private notes from other jyotish if they have a booking)
    return this.jyotishRepository.findNotesForJyotishAboutUser(userId, jyotishId);
  }

  async updateNote(
    noteId: string,
    jyotishId: string,
    data: { note?: string; isPrivate?: boolean }
  ): Promise<IJyotishNote> {
    const note = await this.jyotishRepository.findNoteById(noteId);
    if (!note) {
      throw new NotFoundError('Note not found');
    }

    // Only the jyotish who created it can update
    if (note.jyotish.toString() !== jyotishId) {
      throw new BadRequestError('You do not have permission to update this note');
    }

    const updatedNote = await this.jyotishRepository.updateNote(noteId, data);
    if (!updatedNote) {
      throw new NotFoundError('Note not found');
    }

    return updatedNote;
  }

  async deleteNote(noteId: string, jyotishId: string): Promise<void> {
    const note = await this.jyotishRepository.findNoteById(noteId);
    if (!note) {
      throw new NotFoundError('Note not found');
    }

    // Only the jyotish who created it can delete
    if (note.jyotish.toString() !== jyotishId) {
      throw new BadRequestError('You do not have permission to delete this note');
    }

    const deleted = await this.jyotishRepository.deleteNote(noteId);
    if (!deleted) {
      throw new NotFoundError('Note not found');
    }
  }
}












