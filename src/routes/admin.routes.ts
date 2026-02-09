import { Router } from 'express';
import { AdminController } from '@controllers/admin.controller';
import { validate } from '@middleware/validation.middleware';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { UserRole } from '@types';
import {
  userIdSchema,
  createUserSchema,
  updateUserSchema,
  productIdSchema,
  healingListingIdSchema,
  healingPackageIdSchema,
  pujaListingIdSchema,
  pujaPackageIdSchema,
  bookingIdSchema,
  roleQuerySchema,
  updateOrderStatusSchema,
} from '@validators/admin.validator';
import { orderIdSchema, paymentIdSchema } from '@validators/payment.validator';
import { enquiryIdSchema } from '@validators/product-enquiry.validator';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// User Management
router.get('/users', validate(roleQuerySchema), adminController.getAllUsers);
router.get('/users/:id', validate(userIdSchema), adminController.getUserById);
router.post('/users', validate(createUserSchema), adminController.createUser);
router.put('/users/:id', validate(updateUserSchema), validate(userIdSchema), adminController.updateUser);
router.delete('/users/:id', validate(userIdSchema), adminController.deleteUser);

// Product Management
router.get('/products', adminController.getAllProducts);
router.get('/products/:id', validate(productIdSchema), adminController.getProductById);
router.post('/products', adminController.createProduct);
router.put('/products/:id', validate(productIdSchema), adminController.updateProduct);
router.delete('/products/:id', validate(productIdSchema), adminController.deleteProduct);

// Healing Services Management
router.get('/healing/listings', adminController.getAllHealingListings);
router.get(
  '/healing/listings/:id',
  validate(healingListingIdSchema),
  adminController.getHealingListingById
);
router.post('/healing/listings', adminController.createHealingListing);
router.put(
  '/healing/listings/:id',
  validate(healingListingIdSchema),
  adminController.updateHealingListing
);
router.delete(
  '/healing/listings/:id',
  validate(healingListingIdSchema),
  adminController.deleteHealingListing
);

router.get('/healing/packages', adminController.getAllHealingPackages);
router.get(
  '/healing/packages/:id',
  validate(healingPackageIdSchema),
  adminController.getHealingPackageById
);
router.post('/healing/packages', adminController.createHealingPackage);
router.put(
  '/healing/packages/:id',
  validate(healingPackageIdSchema),
  adminController.updateHealingPackage
);
router.delete(
  '/healing/packages/:id',
  validate(healingPackageIdSchema),
  adminController.deleteHealingPackage
);

// Puja Services Management
router.get('/puja/listings', adminController.getAllPujaListings);
router.get(
  '/puja/listings/:id',
  validate(pujaListingIdSchema),
  adminController.getPujaListingById
);
router.post('/puja/listings', adminController.createPujaListing);
router.put(
  '/puja/listings/:id',
  validate(pujaListingIdSchema),
  adminController.updatePujaListing
);
router.delete(
  '/puja/listings/:id',
  validate(pujaListingIdSchema),
  adminController.deletePujaListing
);

router.get('/puja/packages', adminController.getAllPujaPackages);
router.get(
  '/puja/packages/:id',
  validate(pujaPackageIdSchema),
  adminController.getPujaPackageById
);
router.post('/puja/packages', adminController.createPujaPackage);
router.put(
  '/puja/packages/:id',
  validate(pujaPackageIdSchema),
  adminController.updatePujaPackage
);
router.delete(
  '/puja/packages/:id',
  validate(pujaPackageIdSchema),
  adminController.deletePujaPackage
);

// Booking Management
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/:id', validate(bookingIdSchema), adminController.getBookingById);
router.get('/calls', adminController.getActiveCalls);
router.put('/bookings/:id', validate(bookingIdSchema), adminController.updateBooking);
router.delete('/bookings/:id', validate(bookingIdSchema), adminController.deleteBooking);

// Orders / Payments
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', validate(orderIdSchema), adminController.getOrderById);
router.patch(
  '/orders/:id/status',
  validate(orderIdSchema),
  validate(updateOrderStatusSchema),
  adminController.updateOrderStatus
);

router.get('/payments', adminController.getAllPayments);
router.get('/payments/:id', validate(paymentIdSchema), adminController.getPaymentById);

// Product Enquiry Management
router.get('/enquiries', adminController.getAllEnquiries);
router.get('/enquiries/:id', validate(enquiryIdSchema), adminController.getEnquiryById);
router.put('/enquiries/:id/status', validate(enquiryIdSchema), adminController.updateEnquiryStatus);
router.delete('/enquiries/:id', validate(enquiryIdSchema), adminController.deleteEnquiry);

export default router;












