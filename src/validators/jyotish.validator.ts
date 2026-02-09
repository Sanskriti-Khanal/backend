import { z } from 'zod';
import { BookingType } from '@models/JyotishBooking.model';

export const createBookingSchema = z.object({
  body: z.object({
    jyotishId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid jyotish ID'),
    type: z.nativeEnum(BookingType),
    scheduledAt: z.string().datetime().optional(),
  }),
});

export const bookingIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
  }),
});

export const endBookingSchema = z.object({
  body: z.object({
    duration: z.number().int().positive('Duration must be positive'),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message cannot be empty'),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
  }),
});

export const startCallSchema = z.object({
  body: z.object({
    callType: z.enum(['audio', 'video']).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
  }),
});

export const endCallSchema = z.object({
  body: z.object({
    duration: z.number().int().min(0, 'Duration must be non-negative'),
  }),
  params: z.object({
    callId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid call ID'),
  }),
});

export const createNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Note cannot be empty'),
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    isPrivate: z.boolean().optional(),
  }),
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

export const getNotesSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1).optional(),
    isPrivate: z.boolean().optional(),
  }),
  params: z.object({
    noteId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid note ID'),
  }),
});

export const noteIdSchema = z.object({
  params: z.object({
    noteId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid note ID'),
  }),
});












