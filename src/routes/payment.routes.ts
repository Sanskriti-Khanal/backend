import { Router } from 'express';
import { PaymentController } from '@controllers/payment.controller';
import { validate } from '@middleware/validation.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@types';
import { paymentLimiter, webhookLimiter } from '@middleware/rateLimit.middleware';
import {
  createProductPaymentSchema,
  createServicePaymentSchema,
  createBookingPaymentSchema,
  createJyotishServicePaymentSchema,
  verifyPaymentSchema,
  paymentIdSchema,
  refundPaymentSchema,
  createNabilOrderSchema,
  nabilCallbackSchema,
  nabilVerifySchema,
  createKhaltiOrderSchema,
  khaltiCallbackSchema,
  khaltiVerifySchema,
  revokeServiceAccessSchema,
  updateOrderLocationSchema,
} from '@validators/payment.validator';

const router = Router();
const paymentController = new PaymentController();

// Public checkout page and processing
// CRITICAL: These routes MUST be public (no authentication) - called by users without tokens
router.get('/nabil/checkout', async (req, res, next) => {
  console.log(`✅ CHECKOUT PAGE ROUTE HIT (${req.method}) - Public route, no auth required`);
  try {
    await paymentController.serveCheckoutPage(req, res, next);
  } catch (error) {
    next(error);
  }
});
router.post('/nabil/checkout', async (req, res, next) => {
  console.log(`✅ CHECKOUT PROCESS ROUTE HIT (${req.method}) - Public route, no auth required`);
  try {
    await paymentController.processCheckout(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Public webhook endpoint (no auth, but should verify webhook signature)
router.post('/webhook', webhookLimiter, paymentController.handleWebhook);

// Nabil Bank Payment Gateway Routes
// Callback endpoint (public - called by bank)
router.get(
  '/nabil/callback',
  validate(nabilCallbackSchema),
  paymentController.handleNabilCallback
);

// Nabil Bank XML callback endpoints (public - called by bank via POST with XML)
// CRITICAL: These routes MUST be public (no authentication) - bank sends POST requests without tokens
// These endpoints accept form data with xmlmsg field (application/x-www-form-urlencoded)
// Also handle GET requests for browser redirects after payment
router.all('/nabil/approve', async (req, res, next) => {
  console.log(`✅ NABIL APPROVE ROUTE HIT (${req.method}) - Public route, no auth required`);
  try {
    await paymentController.handleNabilApproveCallback(req, res, next);
  } catch (error) {
    next(error);
  }
});
router.all('/nabil/cancel', async (req, res, next) => {
  console.log(`✅ NABIL CANCEL ROUTE HIT (${req.method}) - Public route, no auth required`);
  try {
    await paymentController.handleNabilCancelCallback(req, res, next);
  } catch (error) {
    next(error);
  }
});
router.all('/nabil/decline', async (req, res, next) => {
  console.log(`✅ NABIL DECLINE ROUTE HIT (${req.method}) - Public route, no auth required`);
  try {
    await paymentController.handleNabilDeclineCallback(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Nabil Bank verify payment (PUBLIC - for UAT / Postman without auth token)
// Uses same controller logic as the protected verify route, but without authenticate middleware
router.post(
  '/nabil/verify-uat',
  validate(nabilVerifySchema),
  paymentController.verifyNabilPayment
);

// Khalti Payment Gateway Routes
// Callback endpoint (public - called by Khalti after payment)
router.get(
  '/khalti/callback',
  validate(khaltiCallbackSchema),
  paymentController.handleKhaltiCallback
);

// Protected routes - require authentication
router.use(authenticate);

// Nabil Bank create order (protected)
router.post(
  '/nabil/create-order',
  validate(createNabilOrderSchema),
  paymentController.createNabilOrder
);

// Nabil Bank verify payment (protected)
router.post(
  '/nabil/verify',
  validate(nabilVerifySchema),
  paymentController.verifyNabilPayment
);

// Khalti create order (protected)
router.post(
  '/khalti/create-order',
  validate(createKhaltiOrderSchema),
  paymentController.createKhaltiOrder
);

// Khalti verify payment (protected)
router.post(
  '/khalti/verify',
  validate(khaltiVerifySchema),
  paymentController.verifyKhaltiPayment
);

// Product payments
router.post(
  '/products',
  validate(createProductPaymentSchema),
  paymentController.createProductPayment
);

// Service payments (healing/puja)
router.post(
  '/services/:type',
  validate(createServicePaymentSchema),
  paymentController.createServicePayment
);

// Booking payments
router.post(
  '/bookings',
  validate(createBookingPaymentSchema),
  paymentController.createBookingPayment
);

// Jyotish service payments (chat/call)
router.post(
  '/jyotish-service',
  paymentLimiter,
  validate(createJyotishServicePaymentSchema),
  paymentController.createJyotishServicePayment
);

// Payment verification
router.post(
  '/verify',
  validate(verifyPaymentSchema),
  paymentController.verifyPayment
);

// Get payments
router.get('/payments', paymentController.getUserPayments);
router.get('/payments/:id', validate(paymentIdSchema), paymentController.getPayment);

// Get orders
router.get('/orders', paymentController.getUserOrders);
router.get('/orders/service-provider', paymentController.getServiceProviderOrders);
router.patch(
  '/orders/:id/location',
  validate(updateOrderLocationSchema),
  paymentController.updateOrderLocation
);

// Service access (Call & Chat unlock after payment)
router.get('/service-access', paymentController.getUserServiceAccesses);
router.get('/service-access/check', paymentController.checkServiceAccess);
router.post(
  '/service-access/revoke',
  validate(revokeServiceAccessSchema),
  paymentController.revokeCustomerServiceAccess
);

// Refund (Admin only)
router.post(
  '/refund/:id',
  authorize(UserRole.ADMIN),
  validate(refundPaymentSchema),
  paymentController.refundPayment
);

export default router;

