import { Request, Response, NextFunction } from 'express';
import { JyotishService } from '@services/jyotish.service';
import { sendSuccess } from '@utils/response.util';
import { AuthRequest } from '@middleware/auth.middleware';

export class JyotishController {
  private jyotishService: JyotishService;

  constructor() {
    this.jyotishService = new JyotishService();
  }

  // Booking methods
  createBooking = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const booking = await this.jyotishService.createBooking(
        req.body,
        req.user!.id
      );
      sendSuccess(res, booking, 'Booking created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.jyotishService.getBookingById(req.params.id);
      sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  };

  getUserBookings = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const bookings = await this.jyotishService.getUserBookings(req.user!.id);
      sendSuccess(res, bookings);
    } catch (error) {
      next(error);
    }
  };

  getJyotishBookings = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const bookings = await this.jyotishService.getJyotishBookings(req.user!.id);
      sendSuccess(res, bookings);
    } catch (error) {
      next(error);
    }
  };

  getActiveBookings = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const bookings = await this.jyotishService.getActiveBookings(req.user!.id);
      sendSuccess(res, bookings);
    } catch (error) {
      next(error);
    }
  };

  startBooking = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const booking = await this.jyotishService.startBooking(
        req.params.id,
        req.user!.id
      );
      sendSuccess(res, booking, 'Booking started');
    } catch (error) {
      next(error);
    }
  };

  endBooking = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const booking = await this.jyotishService.endBooking(
        req.params.id,
        req.user!.id,
        req.body.duration
      );
      sendSuccess(res, booking, 'Booking ended');
    } catch (error) {
      next(error);
    }
  };

  cancelBooking = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.jyotishService.cancelBooking(req.params.id, req.user!.id);
      sendSuccess(res, null, 'Booking cancelled');
    } catch (error) {
      next(error);
    }
  };

  // Chat methods
  sendMessage = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const message = await this.jyotishService.sendMessage(
        req.params.id,
        req.user!.id,
        req.body.message
      );
      sendSuccess(res, message, 'Message sent', 201);
    } catch (error) {
      next(error);
    }
  };

  getChatMessages = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const messages = await this.jyotishService.getChatMessages(
        req.params.id,
        req.user!.id
      );
      sendSuccess(res, messages);
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const count = await this.jyotishService.getUnreadCount(req.user!.id);
      sendSuccess(res, { unreadCount: count });
    } catch (error) {
      next(error);
    }
  };

  getChatRooms = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const rooms = await this.jyotishService.getChatRooms(
        req.user!.id,
        req.user!.role
      );
      sendSuccess(res, rooms);
    } catch (error) {
      next(error);
    }
  };

  // Call methods
  startCall = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const callRecord = await this.jyotishService.startCall(
        req.params.id,
        req.user!.id,
        req.body.callType || 'audio'
      );
      sendSuccess(res, callRecord, 'Call started', 201);
    } catch (error) {
      next(error);
    }
  };

  endCall = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const callRecord = await this.jyotishService.endCall(
        req.params.callId,
        req.body.duration
      );
      sendSuccess(res, callRecord, 'Call ended');
    } catch (error) {
      next(error);
    }
  };

  getCallRecords = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const callRecords = await this.jyotishService.getCallRecords(
        req.params.id,
        req.user!.id
      );
      sendSuccess(res, callRecords);
    } catch (error) {
      next(error);
    }
  };

  // Note methods
  createNote = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const note = await this.jyotishService.createNote(
        req.params.userId,
        req.user!.id,
        req.body
      );
      sendSuccess(res, note, 'Note created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getNotesForUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notes = await this.jyotishService.getNotesForUser(
        req.params.userId,
        req.user!.id
      );
      sendSuccess(res, notes);
    } catch (error) {
      next(error);
    }
  };

  updateNote = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const note = await this.jyotishService.updateNote(
        req.params.noteId,
        req.user!.id,
        req.body
      );
      sendSuccess(res, note, 'Note updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteNote = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.jyotishService.deleteNote(req.params.noteId, req.user!.id);
      sendSuccess(res, null, 'Note deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}












