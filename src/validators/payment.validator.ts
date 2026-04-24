import { z } from 'zod';

/** Healing session checkouts may carry this so we never require a delivery address. */
const hasHealingSessionBookingInBody = (data: {
  paymentType: string;
  customerInfo?: { healingSessionBookingId?: string } | null;
}): boolean => {
  if (data.paymentType === 'healing') return true;
  const id = data.customerInfo?.healingSessionBookingId;
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

export const createProductCheckoutDraftSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
          quantity: z.number().int().positive('Quantity must be positive'),
        })
      )
      .min(1, 'At least one item is required'),
    deliveryLocation: z.object({
      preciseLocation: z.string().min(3).max(500),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      source: z.string().max(32).optional(),
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
  }),
});

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

export const revokeServiceAccessSchema = z.object({
  body: z.object({
    customerUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer user ID'),
    serviceType: z.enum(['chat', 'call'], {
      errorMap: () => ({ message: 'Service type must be either "chat" or "call"' }),
    }),
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
  body: z
    .object({
      gatewayOrderId: z.string().min(1).optional(),
      gatewayPaymentId: z.string().min(1).optional(),
      signature: z.string().min(1).optional(),
      orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID').optional(),
      pidx: z.string().min(1).optional(),
      paymentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID').optional(),
    })
    .superRefine((data, ctx) => {
      const legacy =
        !!data.gatewayOrderId?.trim() &&
        !!data.gatewayPaymentId?.trim() &&
        !!data.signature?.trim();
      const bound = !!data.orderId && !!(data.pidx?.trim() || data.paymentId);
      if (!legacy && !bound) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Provide either (gatewayOrderId, gatewayPaymentId, signature) for legacy verify, or (orderId + pidx|paymentId) for order-bound gateway verify',
        });
      }
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

export const updateOrderLocationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
  }),
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    formattedAddress: z.string().min(3).max(500),
    source: z.enum(['gps', 'manual', 'search']).optional(),
    saveForFuture: z.boolean().optional(),
  }),
});

// Nabil Bank payment validators
const productLineItemsSchema = z
  .array(
    z.object({
      productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    })
  )
  .optional();

export const createNabilOrderSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID').optional(),
    paymentType: z.enum(['product', 'healing', 'puja', 'jyotish_booking', 'jyotish_service', 'package']),
    // Optional: specific order/booking IDs
    productOrderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product order ID').optional(),
    items: productLineItemsSchema,
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID').optional(),
    // Required for jyotish_service (Call & Chat)
    serviceProviderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service provider ID').optional(),
    serviceType: z.enum(['chat', 'call']).optional(),
    customerInfo: z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      sessionMode: z.enum(['online', 'offline']).optional(),
      vaastuMode: z.enum(['online', 'offline']).optional(),
      healingSessionBookingId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
      merosathiTransactionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    }).optional(),
    preciseLocation: z.string().min(3).max(500).optional(),
  }).refine(
    (data) => {
      if (data.paymentType === 'jyotish_service') {
        return !!data.serviceProviderId && !!data.serviceType;
      }
      return true;
    },
    { message: 'serviceProviderId and serviceType are required when paymentType is jyotish_service' }
  ).refine(
    (data) => {
      if (hasHealingSessionBookingInBody(data)) return true;
      const requiresLocation =
        data.paymentType === 'product' ||
        (data.paymentType === 'puja' &&
          data.customerInfo?.sessionMode === 'offline') ||
        (data.paymentType === 'jyotish_service' &&
          data.customerInfo?.vaastuMode === 'offline');
      return !requiresLocation || !!data.preciseLocation?.trim();
    },
    { message: 'preciseLocation is required before payment for product purchase, offline Puja, and offline Vaastu booking' }
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
    items: productLineItemsSchema,
    bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID').optional(),
    serviceProviderId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service provider ID').optional(),
    serviceType: z.enum(['chat', 'call']).optional(),
    customerInfo: z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      sessionMode: z.enum(['online', 'offline']).optional(),
      vaastuMode: z.enum(['online', 'offline']).optional(),
      healingSessionBookingId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
      merosathiTransactionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    }).optional(),
    preciseLocation: z.string().min(3).max(500).optional(),
  }).refine(
    (data) => {
      if (data.paymentType === 'jyotish_service') {
        return !!data.serviceProviderId && !!data.serviceType;
      }
      return true;
    },
    { message: 'serviceProviderId and serviceType are required when paymentType is jyotish_service' }
  ).refine(
    (data) => {
      if (hasHealingSessionBookingInBody(data)) return true;
      const requiresLocation =
        data.paymentType === 'product' ||
        (data.paymentType === 'puja' &&
          data.customerInfo?.sessionMode === 'offline') ||
        (data.paymentType === 'jyotish_service' &&
          data.customerInfo?.vaastuMode === 'offline');
      return !requiresLocation || !!data.preciseLocation?.trim();
    },
    { message: 'preciseLocation is required before payment for product purchase, offline Puja, and offline Vaastu booking' }
  ),
});

export const verifyUnifiedTransactionQuerySchema = z.object({
  query: z.object({
    transactionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid transaction id'),
  }),
});

export const khaltiCallbackSchema = z.object({
  query: z.object({
    pidx: z.string().optional(),
    paymentId: z.string().optional(),
  }),
});

export const khaltiVerifySchema = z.object({
  body: z.object({
    pidx: z.string().min(1, 'pidx is required'),
  }),
});