import { z } from 'zod';

export const createProductPaymentSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
          quantity: z.number().int().positive('Quantity must be positive'),
        })
      )
      .min(1, 'At least one item is required'),
    shippingAddress: z
      .object({
        fullName: z.string().min(2),
        phone: z.string().regex(/^[0-9]{10}$/),
        address: z.string().min(5),
        city: z.string().min(2),
        state: z.string().min(2),
        pincode: z.string().regex(/^[0-9]{6}$/),
        country: z.string().min(2),
      })
      .optional(),
  }),
});

export const createServicePaymentSchema = z.object({
  body: z.object({
    listingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid listing ID'),
    quantity: z.number().int().positive().default(1),
  }),
  params: z.object({
    type: z.enum(['healing', 'puja']),
  }),
});

export const createBookingPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
    amount: z.number().positive('Amount must be positive'),
  }),
});

export const createJyotishServicePaymentSchema = z.object({
  body: z.object({
    serviceProviderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service provider ID'),
    serviceType: z.enum(['chat', 'call'], {
      errorMap: () => ({ message: 'Service type must be either "chat" or "call"' }),
    }),
    amount: z.number().positive('Amount must be positive'),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    gatewayOrderId: z.string().min(1, 'Order ID is required'),
    gatewayPaymentId: z.string().min(1, 'Payment ID is required'),
    signature: z.string().min(1, 'Signature is required'),
  }),
});

export const paymentIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID'),
  }),
});

export const refundPaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID'),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
  }),
});

// Nabil Bank payment validators
export const createNabilOrderSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID').optional(),
    paymentType: z.enum(['product', 'healing', 'puja', 'jyotish_booking', 'jyotish_service', 'package']),
    // Optional: specific order/booking IDs
    productOrderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product order ID').optional(),
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID').optional(),
    // Required for jyotish_service (Call & Chat)
    serviceProviderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service provider ID').optional(),
    serviceType: z.enum(['chat', 'call']).optional(),
  }).refine(
    (data) => {
      if (data.paymentType === 'jyotish_service') {
        return !!data.serviceProviderId && !!data.serviceType;
      }
      return true;
    },
    { message: 'serviceProviderId and serviceType are required when paymentType is jyotish_service' }
  ),
});

export const nabilCallbackSchema = z.object({
  query: z.object({
    OrderID: z.string().optional(),
    SessionID: z.string().optional(),
    Status: z.string().optional(),
  }),
});

export const nabilVerifySchema = z.object({
  body: z.object({
    orderID: z.string().min(1, 'Order ID is required').optional(),
    sessionID: z.string().min(1, 'Session ID is required').optional(),
  }).refine(
    (data) => data.orderID || data.sessionID,
    {
      message: 'Either orderID or sessionID is required',
    }
  ),
});

// Khalti payment validators
export const createKhaltiOrderSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID').optional(),
    paymentType: z.enum(['product', 'healing', 'puja', 'jyotish_booking', 'jyotish_service', 'package']),
    productOrderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product order ID').optional(),
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID').optional(),
    serviceProviderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service provider ID').optional(),
    serviceType: z.enum(['chat', 'call']).optional(),
    customerInfo: z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }).optional(),
  }).refine(
    (data) => {
      if (data.paymentType === 'jyotish_service') {
        return !!data.serviceProviderId && !!data.serviceType;
      }
      return true;
    },
    { message: 'serviceProviderId and serviceType are required when paymentType is jyotish_service' }
  ),
});export const khaltiCallbackSchema = z.object({
  query: z.object({
    pidx: z.string().optional(),
    paymentId: z.string().optional(),
  }),
});export const khaltiVerifySchema = z.object({
  body: z.object({
    pidx: z.string().min(1, 'pidx is required'),
  }),
});