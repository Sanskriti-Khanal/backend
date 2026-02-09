import { Router } from 'express';
import { JyotishController } from '@controllers/jyotish.controller';
import { validate } from '@middleware/validation.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@types';
import {
  createBookingSchema,
  bookingIdSchema,
  endBookingSchema,
  sendMessageSchema,
  startCallSchema,
  endCallSchema,
  createNoteSchema,
  getNotesSchema,
  updateNoteSchema,
  noteIdSchema,
} from '@validators/jyotish.validator';

const router = Router();
const jyotishController = new JyotishController();

// Protected routes - Bookings
router.post(
  '/bookings',
  authenticate,
  validate(createBookingSchema),
  jyotishController.createBooking
);
router.get(
  '/bookings',
  authenticate,
  jyotishController.getUserBookings
);
router.get(
  '/bookings/active',
  authenticate,
  authorize(UserRole.JYOTISH),
  jyotishController.getActiveBookings
);
router.get(
  '/bookings/jyotish',
  authenticate,
  authorize(UserRole.JYOTISH),
  jyotishController.getJyotishBookings
);
router.get(
  '/bookings/:id',
  authenticate,
  validate(bookingIdSchema),
  jyotishController.getBooking
);
router.post(
  '/bookings/:id/start',
  authenticate,
  validate(bookingIdSchema),
  jyotishController.startBooking
);
router.post(
  '/bookings/:id/end',
  authenticate,
  validate(endBookingSchema),
  jyotishController.endBooking
);
router.post(
  '/bookings/:id/cancel',
  authenticate,
  validate(bookingIdSchema),
  jyotishController.cancelBooking
);

// Protected routes - Chat
router.post(
  '/bookings/:id/messages',
  authenticate,
  validate(sendMessageSchema),
  jyotishController.sendMessage
);
router.get(
  '/bookings/:id/messages',
  authenticate,
  validate(bookingIdSchema),
  jyotishController.getChatMessages
);
router.get(
  '/messages/unread',
  authenticate,
  jyotishController.getUnreadCount
);
router.get(
  '/chat-rooms',
  authenticate,
  jyotishController.getChatRooms
);

// Protected routes - Calls
router.post(
  '/bookings/:id/calls',
  authenticate,
  validate(startCallSchema),
  jyotishController.startCall
);
router.post(
  '/calls/:callId/end',
  authenticate,
  validate(endCallSchema),
  jyotishController.endCall
);
router.get(
  '/bookings/:id/calls',
  authenticate,
  validate(bookingIdSchema),
  jyotishController.getCallRecords
);

// Protected routes - Notes (Jyotish only)
router.post(
  '/notes/user/:userId',
  authenticate,
  authorize(UserRole.JYOTISH),
  validate(createNoteSchema),
  jyotishController.createNote
);
router.get(
  '/notes/user/:userId',
  authenticate,
  authorize(UserRole.JYOTISH),
  validate(getNotesSchema),
  jyotishController.getNotesForUser
);
router.put(
  '/notes/:noteId',
  authenticate,
  authorize(UserRole.JYOTISH),
  validate(updateNoteSchema),
  jyotishController.updateNote
);
router.delete(
  '/notes/:noteId',
  authenticate,
  authorize(UserRole.JYOTISH),
  validate(noteIdSchema),
  jyotishController.deleteNote
);

export default router;












