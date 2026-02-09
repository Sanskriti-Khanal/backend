import { z } from 'zod';
import { EnquiryStatus } from '@models/ProductEnquiry.model';

export const createEnquirySchema = z.object({
  body: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
    email: z.string().email('Invalid email address'),
    message: z.string().optional(),
  }),
});

export const enquiryIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid enquiry ID'),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

export const updateEnquiryStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(EnquiryStatus),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid enquiry ID'),
  }),
});

export const enquiryQuerySchema = z.object({
  query: z.object({
    status: z.nativeEnum(EnquiryStatus).optional(),
  }),
});
