import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '@services/payment.service';
import { NabilService } from '@services/nabil.service';
import { KhaltiService } from '@services/khalti.service';
import { sendSuccess } from '@utils/response.util';
import { AuthRequest } from '@middleware/auth.middleware';
import env from '@config/env';
import { PaymentRepository } from '@repositories/payment.repository';
import { NabilCallbackRepository } from '@repositories/nabil-callback.repository';
import { JyotishRepository } from '@repositories/jyotish.repository';
import { PaymentStatus, PaymentMethod, PaymentType } from '@models/Payment.model';
import { OrderStatus } from '@models/Order.model';
import { NabilCallbackStatus, NabilLogType } from '@models/NabilCallback.model';
import { BadRequestError, NotFoundError } from '@errors/AppError';
import { TransactionLogRepository } from '@repositories/transaction-log.repository';
import { TransactionLogType } from '@models/TransactionLog.model';
import path from 'path';
import fs from 'fs';

export class PaymentController {
  private paymentService: PaymentService;
  private nabilService: NabilService;
  private khaltiService: KhaltiService;
  private paymentRepository: PaymentRepository;
  private nabilCallbackRepository: NabilCallbackRepository;
  private transactionLogRepository: TransactionLogRepository;
  private jyotishRepository: JyotishRepository;
  private static readonly SUPPORT_EMAIL = 'support@merosathi.co';
  private static readonly PAYMENT_SUCCESS_SUBTITLE =
    'Your transaction has been processed successfully. You can close this page and return to the app.';
  private static readonly PAYMENT_CANCELLED_SUBTITLE =
    'Your transaction was cancelled. No amount was deducted.';
  private static readonly PAYMENT_CANCELLED_REASON = 'Cancelled by user';
  private static readonly PAYMENT_CANCELLED_GUIDANCE =
    'You can try again or choose another payment method.';
  private static readonly PAYMENT_DECLINED_SUBTITLE =
    'We could not process your transaction.';
  private static readonly PAYMENT_DECLINED_GUIDANCE =
    'If details are correct, please try again.';
  private static readonly PAYMENT_DECLINED_REASONS: string[] = [
    'Incorrect card details',
    'Incorrect OTP / verification code',
    'Card issuer declined the transaction',
    'Online payments not enabled',
  ];
  // Backward-compatible HTML string used by existing rendering paths.
  private static readonly TRANSACTION_FAILED_DETAILS_HTML =
    `${PaymentController.PAYMENT_DECLINED_SUBTITLE}<br><br>` +
    `• ${PaymentController.PAYMENT_DECLINED_REASONS[0]}<br>` +
    `• ${PaymentController.PAYMENT_DECLINED_REASONS[1]}<br>` +
    `• ${PaymentController.PAYMENT_DECLINED_REASONS[2]}<br>` +
    `• ${PaymentController.PAYMENT_DECLINED_REASONS[3]}<br><br>` +
    `${PaymentController.PAYMENT_DECLINED_GUIDANCE}`;

  constructor() {
    this.paymentService = new PaymentService();
    this.nabilService = new NabilService();
    this.khaltiService = new KhaltiService();
    this.paymentRepository = new PaymentRepository();
    this.nabilCallbackRepository = new NabilCallbackRepository();
    this.transactionLogRepository = new TransactionLogRepository();
    this.jyotishRepository = new JyotishRepository();
  }

  /**
   * Serve checkout page (HTML)
   * GET /api/v1/payments/nabil/checkout
   */
  serveCheckoutPage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Try multiple possible paths for production builds
      const possiblePaths = [
        path.join(__dirname, '../public/checkout.html'), // Development
        path.join(process.cwd(), 'src/public/checkout.html'), // Production (Vercel)
        path.join(process.cwd(), 'backend/src/public/checkout.html'), // Alternative
        path.join(__dirname, '../../public/checkout.html'), // Alternative
      ];
      
      let checkoutHtmlPath: string | null = null;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          checkoutHtmlPath = possiblePath;
          break;
        }
      }
      
      if (checkoutHtmlPath) {
        // Read the HTML file
        let htmlContent = fs.readFileSync(checkoutHtmlPath, 'utf-8');
        
        // Determine API base URL
        // Always use BASE_URL from env (e.g., https://api.merosathi.co)
        // This ensures the API URL is correct even if checkout page is accessed from a different domain
        const apiBaseUrl = env.BASE_URL || `http://localhost:${env.PORT}`;
        
        // Replace placeholder with actual API URL (replace all occurrences in HTML)
        htmlContent = htmlContent.replace(/\{\{API_BASE_URL\}\}/g, apiBaseUrl);
        
        // Set permissive CSP header to allow inline scripts for checkout page
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.merosathi.co https://api.compassplus.com; frame-src 'self' https://api.compassplus.com;"
        );
        
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
      } else {
        console.error('Checkout.html not found. Tried paths:', possiblePaths);
        res.status(404).send('Checkout page not found');
      }
    } catch (error) {
      console.error('Error serving checkout page:', error);
      next(error);
    }
  };

  /**
   * Process payment checkout (create order and return payment URL)
   * POST /api/v1/payments/nabil/checkout
   * Public endpoint - no authentication required
   */
  processCheckout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Generate unique transaction ID at the start
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('========================================');
    console.log('CHECKOUT PROCESS STARTED');
    console.log('========================================');
    console.log('TransactionId:', transactionId);
    console.log('Time:', new Date().toISOString());
    console.log('========================================');
    
    try {
      // Configuration
      // Note: NabilService expects amount in NPR (not paisa), it will convert to paisa internally
      const amount = 1; // NPR 1.00 (service will convert to 100 paisa)
      const currency = 524; // NPR
      const description = `MeroSathi Payment NPR ${amount} - ${transactionId}`;

      // Build callback URLs
      // Always use BASE_URL from env (e.g., https://api.merosathi.co)
      // This ensures callback URLs are correct even if request comes from different domain
      const apiBaseUrl = env.BASE_URL || `http://localhost:${env.PORT}`;
      
      // Log BASE_URL for debugging
      console.log('🔍 Configuration Check:');
      console.log('  BASE_URL from env:', env.BASE_URL || 'NOT SET (using fallback)');
      console.log('  Using apiBaseUrl:', apiBaseUrl);
      
      const callbackUrls = {
        approve: `${apiBaseUrl}/api/v1/payments/nabil/approve`,
        cancel: `${apiBaseUrl}/api/v1/payments/nabil/cancel`,
        decline: `${apiBaseUrl}/api/v1/payments/nabil/decline`,
      };
      
      // Validate callback URLs
      if (!apiBaseUrl.startsWith('https://')) {
        console.warn('⚠️ WARNING: BASE_URL does not use HTTPS! Callback URLs must use HTTPS for production.');
      }
      if (apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1')) {
        console.warn('⚠️ WARNING: BASE_URL is using localhost! This will not work for production callbacks.');
      }

      // Card details are no longer collected on checkout page
      // User will enter card details on Nabil Bank's payment page

      // Amount in paisa for XML (1 NPR = 100 paisa)
      const amountInPaisa = amount * 100;

      // Build XML request for logging (amount must be in paisa, matching Nabil Bank format)
      const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
<Request><Operation>CreateOrder</Operation>
<Language>EN</Language>
<Order>
<OrderType>Purchase</OrderType>
<Merchant>NABIL106809</Merchant>
<Amount>${amountInPaisa}</Amount>
<Currency>${currency}</Currency>
<Description>${description}</Description>
<ApproveURL>${callbackUrls.approve}</ApproveURL>
<CancelURL>${callbackUrls.cancel}</CancelURL>
<DeclineURL>${callbackUrls.decline}</DeclineURL>
<Fee>0</Fee>
</Order>
</Request>
</TKKPG>`;

      // Log create order request (non-blocking - continue even if logging fails)
      console.log('📝 Logging CREATE_ORDER_REQUEST...');
      console.log('  TransactionId:', transactionId);
      try {
        const logResult = await this.transactionLogRepository.createLog({
          transactionId,
          type: TransactionLogType.CREATE_ORDER_REQUEST,
          xmlData: xmlRequest,
          metadata: {
            amount,
            amountInPaisa,
            currency,
            description,
            callbackUrls,
          },
          receivedAt: new Date(),
        });
        console.log('✅ CREATE_ORDER_REQUEST logged successfully:', logResult._id);
      } catch (logError) {
        console.error('❌ Failed to log create order request:', logError);
      }

      // Save CREATE_ORDER_REQUEST to nabilcallbacks table
      try {
        await this.nabilCallbackRepository.createCallback({
          logType: NabilLogType.CREATE_ORDER_REQUEST,
          transactionId,
          rawXml: xmlRequest,
          receivedAt: new Date(),
        });
        console.log('✅ CREATE_ORDER_REQUEST saved to nabilcallbacks');
      } catch (dbError) {
        console.error('❌ Failed to save CREATE_ORDER_REQUEST to nabilcallbacks:', dbError);
      }

      // Create order with Nabil Bank
      console.log('========================================');
      console.log('PROCESSING CHECKOUT - CREATING ORDER');
      console.log('========================================');
      console.log('Amount:', amount);
      console.log('Currency:', currency);
      console.log('Callback URLs:', callbackUrls);
      console.log('========================================');

      let nabilResponse: any;
      let orderError: any;
      try {
        nabilResponse = await this.nabilService.createOrder({
          amount,
          currency,
          description,
          approveURL: callbackUrls.approve,
          cancelURL: callbackUrls.cancel,
          declineURL: callbackUrls.decline,
        });
        
        console.log('========================================');
        console.log('NABIL ORDER CREATED SUCCESSFULLY');
        console.log('========================================');
        console.log('Status:', nabilResponse.status);
        console.log('OrderID:', nabilResponse.orderID);
        console.log('SessionID:', nabilResponse.sessionID);
        console.log('URL from bank:', nabilResponse.url);
        console.log('========================================');
      } catch (error: any) {
        orderError = error;
        console.error('========================================');
        console.error('NABIL ORDER CREATION FAILED');
        console.error('========================================');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('========================================');
        
        // Even if CreateOrder fails, we should log the error response
        // Extract error details if available
        let errorStatus = 'ERROR';
        let errorMessage = error.message || 'Unknown error';
        
        // Try to extract status from error if it's a structured error
        if (error.response?.data?.TKKPG?.Response?.Status) {
          errorStatus = error.response.data.TKKPG.Response.Status;
        } else if (error.status) {
          errorStatus = error.status;
        }
        
        // Create a synthetic response for logging
        nabilResponse = {
          status: errorStatus,
          orderID: undefined,
          sessionID: undefined,
          url: undefined,
          decryptedOrderID: undefined,
          decryptedSessionID: undefined,
          error: errorMessage,
        };
      }

      // Build XML response for logging (even if it failed)
      const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
  <Response>
    <Status>${nabilResponse.status}</Status>
    ${nabilResponse.orderID ? `<Order>
      <OrderID>${nabilResponse.orderID}</OrderID>
      <SessionID>${nabilResponse.sessionID || ''}</SessionID>
      ${nabilResponse.url ? `<URL>${nabilResponse.url}</URL>` : ''}
    </Order>` : ''}
    ${nabilResponse.error ? `<Error>${nabilResponse.error}</Error>` : ''}
  </Response>
</TKKPG>`;

      // Log create order response (ALWAYS log, even on error)
      // CRITICAL: This must complete before throwing error
      console.log('📝 Logging CREATE_ORDER_RESPONSE...');
      console.log('  TransactionId:', transactionId);
      console.log('  Status:', nabilResponse.status);
      console.log('  Has Error:', !!nabilResponse.error);
      let responseLogCreated = false;
      try {
        const logResult = await this.transactionLogRepository.createLog({
          transactionId,
          type: TransactionLogType.CREATE_ORDER_RESPONSE,
          orderId: nabilResponse.orderID,
          sessionId: nabilResponse.sessionID,
          xmlData: xmlResponse,
          metadata: {
            decryptedOrderID: nabilResponse.decryptedOrderID,
            decryptedSessionID: nabilResponse.decryptedSessionID,
            paymentUrl: nabilResponse.url,
            error: nabilResponse.error,
            status: nabilResponse.status,
            errorCode: orderError?.code,
          },
          errorMessage: nabilResponse.error,
          receivedAt: new Date(),
        });
        console.log('✅ CREATE_ORDER_RESPONSE logged successfully:', logResult._id);
        responseLogCreated = true;
      } catch (logError: any) {
        console.error('❌ Failed to log create order response:', logError);
        console.error('  Error details:', logError.message);
        console.error('  Stack:', logError.stack);
        // Still continue - don't fail the whole request if logging fails
      }
      
      if (!responseLogCreated) {
        console.error('⚠️ WARNING: CREATE_ORDER_RESPONSE log was NOT created!');
      }

      // Save CREATE_ORDER_RESPONSE to nabilcallbacks table
      try {
        await this.nabilCallbackRepository.createCallback({
          logType: NabilLogType.CREATE_ORDER_RESPONSE,
          transactionId,
          orderId: nabilResponse.orderID,
          sessionId: nabilResponse.sessionID,
          encryptedOrderId: nabilResponse.orderID,
          rawXml: xmlResponse,
          receivedAt: new Date(),
        });
        console.log('✅ CREATE_ORDER_RESPONSE saved to nabilcallbacks');
      } catch (dbError) {
        console.error('❌ Failed to save CREATE_ORDER_RESPONSE to nabilcallbacks:', dbError);
      }

      // Create payment record to store transactionId for callback handlers
      // IMPORTANT: Create payment record EVEN if CreateOrder failed
      // This ensures callbacks can always find the transactionId
      console.log('📝 Creating payment record with transactionId...');
      let payment;
      try {
        // Use a valid ObjectId format for user (required field)
        // If no userId provided, use a dummy ObjectId that should exist or be created
        const userId = req.body.userId || new (require('mongoose')).Types.ObjectId('000000000000000000000000');
        
        payment = await this.paymentRepository.createPayment({
          user: userId,
          amount,
          currency: 'NPR',
          status: orderError ? PaymentStatus.FAILED : PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.NABIL,
          paymentType: PaymentType.PRODUCT, // Default for checkout page
          gatewayOrderId: nabilResponse.orderID || undefined, // May be undefined if CreateOrder failed
          gatewaySessionId: nabilResponse.sessionID || undefined, // May be undefined if CreateOrder failed
          metadata: {
            transactionId, // ALWAYS store transactionId - this is critical for linking logs
            decryptedOrderID: nabilResponse.decryptedOrderID,
            decryptedSessionID: nabilResponse.decryptedSessionID,
            description,
            source: 'checkout_page',
            createOrderStatus: nabilResponse.status,
            createOrderError: nabilResponse.error,
          },
        });
        console.log('✅ Payment record created:');
        console.log('  Payment ID:', payment._id);
        console.log('  TransactionId:', payment.metadata?.transactionId);
        console.log('  GatewayOrderId:', payment.gatewayOrderId || 'N/A (CreateOrder failed)');
        console.log('  GatewaySessionId:', payment.gatewaySessionId || 'N/A (CreateOrder failed)');
        console.log('  Status:', payment.status);
      } catch (paymentError: any) {
        console.error('❌ Failed to create payment record:', paymentError);
        console.error('  Error details:', paymentError.message);
        console.error('  Stack:', paymentError.stack);
        console.error('  Payment data attempted:', JSON.stringify({
          amount,
          currency: 'NPR',
          status: orderError ? PaymentStatus.FAILED : PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.NABIL,
          gatewayOrderId: nabilResponse.orderID || undefined,
          gatewaySessionId: nabilResponse.sessionID || undefined,
          metadata: { transactionId },
        }, null, 2));
        // Continue - but this will break callback linking
        // CRITICAL: Without payment record, callbacks cannot find transactionId
        console.error('⚠️ WARNING: Payment record NOT created - callbacks will generate NEW transactionId!');
      }
      
      // Verify payment was created
      if (!payment) {
        console.error('========================================');
        console.error('CRITICAL ERROR: Payment record was NOT created!');
        console.error('========================================');
        console.error('TransactionId:', transactionId);
        console.error('This means callbacks cannot link to CreateOrder logs.');
        console.error('========================================');
      }

      // Verify logs were created before throwing error
      if (orderError) {
        console.log('========================================');
        console.log('VERIFYING LOGS BEFORE THROWING ERROR');
        console.log('========================================');
        console.log('TransactionId:', transactionId);
        
        // Quick verification - check if logs exist
        try {
          const verifyLogs = await this.transactionLogRepository.getLogsByTransactionId(transactionId);
          console.log(`Found ${verifyLogs.length} logs for this transactionId:`);
          verifyLogs.forEach(log => {
            console.log(`  - ${log.type}`);
          });
          
          if (verifyLogs.length < 2) {
            console.error('⚠️ WARNING: Expected at least 2 logs (REQUEST + RESPONSE), but found:', verifyLogs.length);
          }
        } catch (verifyError) {
          console.error('❌ Error verifying logs:', verifyError);
        }
        
        console.log('========================================');
        throw orderError;
      }

      // Validate that we got a URL from the bank (only if successful)
      if (!nabilResponse.url || nabilResponse.url.trim() === '') {
        console.error('========================================');
        console.error('ERROR: No URL received from Nabil Bank');
        console.error('========================================');
        console.error('Response:', JSON.stringify(nabilResponse, null, 2));
        console.error('========================================');
        throw new BadRequestError('No payment URL received from Nabil Bank. Please check bank response.');
      }

      // Build payment URL with OrderID and SessionID
      // IMPORTANT:
      // For TEST CreateOrder (CompassPlus), the payment page is:
      //   https://api.compassplus.com:11612/flex
      // For PRODUCTION, use:
      //   https://hpp.nabilbank.com/flex
      const isTestGateway =
        !env.NABIL_API_URL || env.NABIL_API_URL.includes('compassplus.com');
      const paymentBaseUrl = isTestGateway
        ? 'https://api.compassplus.com:11612/flex'
        : 'https://hpp.nabilbank.com/flex';
      const paymentUrl = `${paymentBaseUrl}?OrderID=${encodeURIComponent(nabilResponse.orderID)}&SessionID=${encodeURIComponent(nabilResponse.sessionID)}`;
      
      console.log('========================================');
      console.log('FINAL PAYMENT URL');
      console.log('========================================');
      console.log('Payment URL:', paymentUrl);
      console.log('Transaction ID:', transactionId);
      console.log('');
      console.log('📋 LOGS CREATED SO FAR (2 of 5):');
      console.log('   1. ✅ CREATE_ORDER_REQUEST - Stored separately');
      console.log('   2. ✅ CREATE_ORDER_RESPONSE - Stored separately');
      console.log('');
      console.log('📋 REMAINING LOGS (will be created after payment):');
      console.log('   3. ⏳ PAYMENT_XML - Will be stored when callback received');
      console.log('   4. ⏳ GET_ORDER_STATUS_REQUEST - Will be stored after callback');
      console.log('   5. ⏳ GET_ORDER_STATUS_RESPONSE - Will be stored after callback');
      console.log('');
      console.log('All 5 logs will be stored SEPARATELY in transactionlogs collection');
      console.log('Each log has its own document with unique _id');
      console.log('All logs share the same transactionId:', transactionId);
      console.log('========================================');

      sendSuccess(res, {
        paymentUrl,
        transactionId,
        orderID: nabilResponse.orderID,
        sessionID: nabilResponse.sessionID,
      }, 'Order created successfully');
    } catch (error: any) {
      // Final summary before error
      console.log('========================================');
      console.log('CHECKOUT PROCESSING - FINAL SUMMARY');
      console.log('========================================');
      console.log('TransactionId:', transactionId);
      console.log('Error occurred:', error.message);
      console.log('Expected logs:');
      console.log('  1. CREATE_ORDER_REQUEST (should be logged)');
      console.log('  2. CREATE_ORDER_RESPONSE (should be logged even on error)');
      console.log('  3. Payment record (should be created with transactionId)');
      console.log('========================================');
      next(error);
    }
  };

  createProductPayment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.paymentService.createProductPayment(
        req.user!.id,
        req.body.items,
        req.body.shippingAddress
      );
      sendSuccess(res, result, 'Payment intent created', 201);
    } catch (error) {
      next(error);
    }
  };

  createServicePayment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.paymentService.createServicePayment(
        req.user!.id,
        req.params.type as 'healing' | 'puja',
        req.body.listingId,
        req.body.quantity
      );
      sendSuccess(res, result, 'Payment intent created', 201);
    } catch (error) {
      next(error);
    }
  };

  createBookingPayment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.paymentService.createBookingPayment(
        req.user!.id,
        req.body.bookingId,
        req.body.amount
      );
      sendSuccess(res, result, 'Payment intent created', 201);
    } catch (error) {
      next(error);
    }
  };

  createJyotishServicePayment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.paymentService.createJyotishServicePayment(
        req.user!.id,
        req.body.serviceProviderId,
        req.body.serviceType,
        req.body.amount,
        req.body.idempotencyKey // Optional idempotency key from client
      );
      sendSuccess(res, result, 'Payment intent created', 201);
    } catch (error) {
      next(error);
    }
  };

  verifyPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const payment = await this.paymentService.verifyPayment(
        req.body.gatewayOrderId,
        req.body.gatewayPaymentId,
        req.body.signature
      );
      sendSuccess(res, payment, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  };

  getPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.paymentService.getPaymentById(req.params.id);
      sendSuccess(res, payment);
    } catch (error) {
      next(error);
    }
  };

  getUserPayments = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const payments = await this.paymentService.getUserPayments(req.user!.id);
      sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  };

  getUserOrders = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const orders = await this.paymentService.getUserOrders(req.user!.id);
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  };

  getServiceProviderOrders = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const orders = await this.paymentService.getServiceProviderOrders(req.user!.id);
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  };

  /** Check if current user has access to chat/call for an expert (after payment). */
  checkServiceAccess = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { serviceProviderId, serviceType } = req.query;
      if (!serviceProviderId || !serviceType || (serviceType !== 'chat' && serviceType !== 'call')) {
        return sendSuccess(res, { hasAccess: false }, 'Invalid or missing query params');
      }
      const hasAccess = await this.paymentService.hasServiceAccess(
        req.user!.id,
        serviceProviderId as string,
        serviceType as 'chat' | 'call'
      );
      sendSuccess(res, { hasAccess });
    } catch (error) {
      next(error);
    }
  };

  /** Get current user's service accesses (unlocked call/chat per expert). */
  getUserServiceAccesses = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const accesses = await this.paymentService.getUserServiceAccesses(req.user!.id);
      sendSuccess(res, accesses);
    } catch (error) {
      next(error);
    }
  };

  refundPayment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const payment = await this.paymentService.refundPayment(
        req.params.id,
        req.body.amount
      );
      sendSuccess(res, payment, 'Refund processed successfully');
    } catch (error) {
      next(error);
    }
  };

  // Webhook handler for payment gateway callbacks
  handleWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract payment details from webhook payload
      const { order_id, payment_id, signature, status } = req.body;

      if (status === 'paid' || status === 'captured') {
        const payment = await this.paymentService.verifyPayment(
          order_id,
          payment_id,
          signature
        );
        sendSuccess(res, payment, 'Webhook processed');
      } else {
        // Handle failed payments
        const payment = await this.paymentService.getPaymentById(
          req.body.payment_id
        );
        // Update payment status to failed
        sendSuccess(res, payment, 'Webhook processed');
      }
    } catch (error) {
      next(error);
    }
  };

  // Nabil Bank Payment Methods
  /**
   * Create Nabil Bank payment order
   * POST /api/v1/payments/nabil/create-order
   */
  createNabilOrder = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { amount, description, orderId, paymentType, productOrderId, bookingId, serviceProviderId, serviceType } = req.body;
      const userId = req.user!.id;

      // For jyotish_service (Call & Chat): create order+payment first, then link Nabil to that payment
      if (paymentType === 'jyotish_service' && serviceProviderId && serviceType) {
        const result = await this.paymentService.createJyotishServicePayment(
          userId,
          serviceProviderId,
          serviceType,
          amount,
          undefined
        );
        const { order, payment } = result;
        const baseUrl = env.BASE_URL && !env.BASE_URL.includes('localhost')
          ? env.BASE_URL
          : process.env.PRODUCTION_API_URL || 'https://api.merosathi.co';
        const approveURL = env.NABIL_APPROVE_URL || `${baseUrl}/api/v1/payments/nabil/approve`;
        const cancelURL = env.NABIL_CANCEL_URL || `${baseUrl}/api/v1/payments/nabil/cancel`;
        const declineURL = env.NABIL_DECLINE_URL || `${baseUrl}/api/v1/payments/nabil/decline`;
        const appendPaymentId = (url: string) => (url.includes('?') ? `${url}&` : `${url}?`) + `paymentId=${payment._id}`;
        const finalApproveURL = appendPaymentId(approveURL);
        const finalCancelURL = appendPaymentId(cancelURL);
        const finalDeclineURL = appendPaymentId(declineURL);
        const uniqueDescription = description ? `${description} - ${payment._id}` : `Call/Chat Service - ${payment._id}`;
        const nabilResponse = await this.nabilService.createOrder({
          amount,
          currency: 524,
          description: uniqueDescription,
          approveURL: finalApproveURL,
          cancelURL: finalCancelURL,
          declineURL: finalDeclineURL,
        });
        await this.paymentRepository.updatePayment(payment._id.toString(), {
          gatewayOrderId: nabilResponse.orderID,
          gatewaySessionId: nabilResponse.sessionID,
          status: PaymentStatus.PROCESSING,
          metadata: {
            ...payment.metadata,
            decryptedOrderID: nabilResponse.decryptedOrderID,
            decryptedSessionID: nabilResponse.decryptedSessionID,
          },
        });
        const paymentBaseUrl = (!env.NABIL_API_URL || env.NABIL_API_URL.includes('compassplus.com'))
          ? 'https://api.compassplus.com:11612/flex'
          : 'https://hpp.nabilbank.com/flex';
        const paymentUrl = `${paymentBaseUrl}?OrderID=${encodeURIComponent(nabilResponse.orderID)}&SessionID=${encodeURIComponent(nabilResponse.sessionID)}`;
        return sendSuccess(res, {
          status: nabilResponse.status,
          orderID: nabilResponse.orderID,
          sessionID: nabilResponse.sessionID,
          decryptedOrderID: nabilResponse.decryptedOrderID,
          decryptedSessionID: nabilResponse.decryptedSessionID,
          url: paymentUrl,
          paymentId: payment._id,
        }, 'Order created successfully', 201);
      }

      // Build callback URLs (POST XML endpoints)
      // IMPORTANT: These URLs must be publicly accessible (not localhost) for the bank to POST to them
      // For mobile apps, use production URL - localhost won't work
      let baseUrl = env.BASE_URL;
      if (!baseUrl || baseUrl.includes('localhost')) {
        // Default to production API URL if BASE_URL is not set or is localhost
        baseUrl = process.env.PRODUCTION_API_URL || 'https://api.merosathi.co';
        console.warn('⚠️ BASE_URL is localhost or not set. Using:', baseUrl);
        console.warn('⚠️ For production, set BASE_URL in .env to your production API URL');
      }
      const approveURL = env.NABIL_APPROVE_URL || `${baseUrl}/api/v1/payments/nabil/approve`;
      const cancelURL = env.NABIL_CANCEL_URL || `${baseUrl}/api/v1/payments/nabil/cancel`;
      const declineURL = env.NABIL_DECLINE_URL || `${baseUrl}/api/v1/payments/nabil/decline`;
      
      // Log callback URLs for verification
      console.log('========================================');
      console.log('NABIL ORDER CREATION - CALLBACK URLs');
      console.log('========================================');
      console.log('Approve URL:', approveURL);
      console.log('Cancel URL:', cancelURL);
      console.log('Decline URL:', declineURL);
      console.log('========================================');

      // Create payment record first
      const paymentData: any = {
        user: userId,
        amount,
        currency: 'NPR',
        status: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.NABIL,
        paymentType: paymentType as PaymentType,
        metadata: {
          description,
        },
      };

      if (orderId) {
        paymentData.orderId = orderId;
      }
      if (productOrderId) {
        paymentData.orderId = productOrderId;
      }
      if (bookingId) {
        paymentData.bookingId = bookingId;
      }

      const payment = await this.paymentRepository.createPayment(paymentData);

      // Generate unique transaction ID for logging
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('========================================');
      console.log('NABIL ORDER CREATION STARTED');
      console.log('========================================');
      console.log('TransactionId:', transactionId);
      console.log('Payment ID:', payment._id);
      console.log('Amount:', amount);
      console.log('Time:', new Date().toISOString());
      console.log('========================================');

      const appendPaymentId = (url: string) => {
        // If the base URL already has query params, append with '&', otherwise start with '?'
        const delimiter = url.includes('?') ? '&' : '?';
        return `${url}${delimiter}paymentId=${payment._id}`;
      };

      // Unique description per request (payment._id is unique; append to client description if provided)
      const uniqueDescription = description
        ? `${description} - ${payment._id}`
        : `MeroSathi Order - ${payment._id}`;

      // Build callback URLs with payment ID
      const finalApproveURL = appendPaymentId(approveURL);
      const finalCancelURL = appendPaymentId(cancelURL);
      const finalDeclineURL = appendPaymentId(declineURL);

      // Amount in paisa for XML (1 NPR = 100 paisa)
      const amountInPaisa = Math.round(amount * 100);
      const currency = 524; // NPR

      // Build XML request for logging (amount must be in paisa, matching Nabil Bank format)
      const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
<Request><Operation>CreateOrder</Operation>
<Language>EN</Language>
<Order>
<OrderType>Purchase</OrderType>
<Merchant>${env.NABIL_MERCHANT_ID || 'NABIL106809'}</Merchant>
<Amount>${amountInPaisa}</Amount>
<Currency>${currency}</Currency>
<Description>${uniqueDescription.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Description>
<ApproveURL>${finalApproveURL.replace(/&/g, '&amp;')}</ApproveURL>
<CancelURL>${finalCancelURL.replace(/&/g, '&amp;')}</CancelURL>
<DeclineURL>${finalDeclineURL.replace(/&/g, '&amp;')}</DeclineURL>
<Fee>0</Fee>
</Order>
</Request>
</TKKPG>`;

      // Save CREATE_ORDER_REQUEST to nabilcallbacks table
      console.log('📝 Saving CREATE_ORDER_REQUEST to database...');
      try {
        await this.nabilCallbackRepository.createCallback({
          logType: NabilLogType.CREATE_ORDER_REQUEST,
          transactionId,
          rawXml: xmlRequest,
          receivedAt: new Date(),
        });
        console.log('✅ CREATE_ORDER_REQUEST saved to nabilcallbacks');
      } catch (dbError) {
        console.error('❌ Failed to save CREATE_ORDER_REQUEST to nabilcallbacks:', dbError);
        // Continue even if logging fails
      }

      // Create order with Nabil Bank
      let nabilResponse: any;
      let orderError: any;
      try {
        nabilResponse = await this.nabilService.createOrder({
          amount,
          currency: 524, // NPR
          description: uniqueDescription,
          approveURL: finalApproveURL,
          cancelURL: finalCancelURL,
          declineURL: finalDeclineURL,
        });
        
        console.log('========================================');
        console.log('NABIL ORDER CREATED SUCCESSFULLY');
        console.log('========================================');
        console.log('Status:', nabilResponse.status);
        console.log('OrderID:', nabilResponse.orderID);
        console.log('SessionID:', nabilResponse.sessionID);
        console.log('URL from bank:', nabilResponse.url);
        console.log('========================================');
      } catch (error: any) {
        orderError = error;
        console.error('========================================');
        console.error('NABIL ORDER CREATION FAILED');
        console.error('========================================');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('========================================');
        
        // Even if CreateOrder fails, we should log the error response
        // Extract error details if available
        let errorStatus = 'ERROR';
        let errorMessage = error.message || 'Unknown error';
        
        // Try to extract status from error if it's a structured error
        if (error.response?.data?.TKKPG?.Response?.Status) {
          errorStatus = error.response.data.TKKPG.Response.Status;
        } else if (error.status) {
          errorStatus = error.status;
        }
        
        // Create a synthetic response for logging
        nabilResponse = {
          status: errorStatus,
          orderID: undefined,
          sessionID: undefined,
          url: undefined,
          decryptedOrderID: undefined,
          decryptedSessionID: undefined,
          error: errorMessage,
        };
      }

      // Build XML response for logging (even if it failed)
      const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
  <Response>
    <Status>${nabilResponse.status}</Status>
    ${nabilResponse.orderID ? `<Order>
      <OrderID>${nabilResponse.orderID}</OrderID>
      <SessionID>${nabilResponse.sessionID || ''}</SessionID>
      ${nabilResponse.url ? `<URL>${nabilResponse.url}</URL>` : ''}
    </Order>` : ''}
    ${nabilResponse.error ? `<Error>${nabilResponse.error.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Error>` : ''}
  </Response>
</TKKPG>`;

      // Save CREATE_ORDER_RESPONSE to nabilcallbacks table (ALWAYS save, even on error)
      console.log('📝 Saving CREATE_ORDER_RESPONSE to database...');
      try {
        await this.nabilCallbackRepository.createCallback({
          logType: NabilLogType.CREATE_ORDER_RESPONSE,
          transactionId,
          orderId: nabilResponse.decryptedOrderID,
          sessionId: nabilResponse.decryptedSessionID,
          encryptedOrderId: nabilResponse.orderID,
          rawXml: xmlResponse,
          receivedAt: new Date(),
        });
        console.log('✅ CREATE_ORDER_RESPONSE saved to nabilcallbacks');
      } catch (dbError) {
        console.error('❌ Failed to save CREATE_ORDER_RESPONSE to nabilcallbacks:', dbError);
        // Continue even if logging fails
      }

      // If order creation failed, throw error after logging
      if (orderError) {
        throw orderError;
      }

      // Update payment with gateway order ID and session ID (store encrypted, but also save decrypted for GetOrderStatus)
      await this.paymentRepository.updatePayment(payment._id.toString(), {
        gatewayOrderId: nabilResponse.orderID, // Encrypted OrderID
        gatewaySessionId: nabilResponse.sessionID, // Encrypted SessionID
        status: PaymentStatus.PROCESSING,
        metadata: {
          ...paymentData.metadata,
          transactionId, // Store transactionId for linking logs
          decryptedOrderID: nabilResponse.decryptedOrderID,
          decryptedSessionID: nabilResponse.decryptedSessionID,
        },
      });

      // Check if XML format is requested (for UAT with Swikar Sir)
      const acceptHeader = req.headers.accept || '';
      const format = req.query.format as string;

      const isTestGateway =
        !env.NABIL_API_URL || env.NABIL_API_URL.includes('compassplus.com');
      const paymentBaseUrl = isTestGateway
        ? 'https://api.compassplus.com:11612/flex'
        : 'https://hpp.nabilbank.com/flex';
      const paymentUrl = `${paymentBaseUrl}?OrderID=${encodeURIComponent(nabilResponse.orderID)}&SessionID=${encodeURIComponent(nabilResponse.sessionID)}`;
      
      if (format === 'xml' || acceptHeader.includes('application/xml')) {
        // Return XML format for UAT
        res.setHeader('Content-Type', 'application/xml');
        res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
  <Response>
    <Status>${nabilResponse.status}</Status>
    <OrderID>${nabilResponse.orderID}</OrderID>
    <SessionID>${nabilResponse.sessionID}</SessionID>
    <URL>${paymentUrl}</URL>
  </Response>
</TKKPG>`.trim());
      } else {
        // Return JSON format for Flutter app (default)
        sendSuccess(res, {
          status: nabilResponse.status,
          orderID: nabilResponse.orderID, // Encrypted OrderID
          sessionID: nabilResponse.sessionID, // Encrypted SessionID
          decryptedOrderID: nabilResponse.decryptedOrderID, // Decrypted OrderID
          decryptedSessionID: nabilResponse.decryptedSessionID, // Decrypted SessionID
          url: paymentUrl,
          paymentId: payment._id,
        }, 'Order created successfully', 201);
      }
    } catch (error) {
      next(error);
    }
  };

  // Khalti Payment Methods
  /**
   * Create Khalti payment order
   * POST /api/v1/payments/khalti/create-order
   */
  createKhaltiOrder = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { amount, description, orderId, paymentType, productOrderId, bookingId, serviceProviderId, serviceType, customerInfo } = req.body;
      const userId = req.user!.id;

      // For jyotish_service (Call & Chat): create order+payment first, then link Khalti to that payment
      if (paymentType === 'jyotish_service' && serviceProviderId && serviceType) {
        const result = await this.paymentService.createJyotishServicePayment(
          userId,
          serviceProviderId,
          serviceType,
          amount,
          undefined
        );
        const { payment } = result;
        let baseUrl = env.BASE_URL;
        if (!baseUrl || baseUrl.includes('localhost') || !baseUrl.startsWith('https://')) {
          baseUrl = process.env.PRODUCTION_API_URL || 'https://api.merosathi.co';
        }
        if (!baseUrl.startsWith('https://')) baseUrl = baseUrl.replace(/^http:\/\//, 'https://');
        const returnUrl = `${baseUrl}/api/v1/payments/khalti/callback?paymentId=${payment._id}`;
        const purchaseOrderId = `ORDER_${payment._id}_${Date.now()}`;
        const purchaseOrderName = description && description.trim().length >= 3 ? description.trim() : `Call/Chat Service - ${payment._id}`;
        const amountInPaisa = this.khaltiService.nprToPaisa(amount);
        const paymentRequest: any = {
          return_url: returnUrl,
          website_url: baseUrl,
          amount: amountInPaisa,
          purchase_order_id: purchaseOrderId,
          purchase_order_name: purchaseOrderName,
        };
        if (customerInfo && typeof customerInfo === 'object' && Object.keys(customerInfo).length > 0) {
          paymentRequest.customer_info = customerInfo;
        }
        const khaltiResponse = await this.khaltiService.initiatePayment(paymentRequest);
        await this.paymentRepository.updatePayment(payment._id.toString(), {
          gatewayTransactionId: khaltiResponse.pidx,
          status: PaymentStatus.PROCESSING,
          metadata: {
            ...payment.metadata,
            pidx: khaltiResponse.pidx,
            expires_at: khaltiResponse.expires_at,
            expires_in: khaltiResponse.expires_in,
          },
        });
        return sendSuccess(res, {
          pidx: khaltiResponse.pidx,
          payment_url: khaltiResponse.payment_url,
          url: khaltiResponse.payment_url,
          expires_at: khaltiResponse.expires_at,
          expires_in: khaltiResponse.expires_in,
          paymentId: payment._id,
        }, 'Khalti payment initiated successfully', 201);
      }

      // Build return URL
      // For mobile apps, use production URL - localhost won't work
      // Khalti requires publicly accessible HTTPS URLs
      let baseUrl = env.BASE_URL;
      if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || !baseUrl.startsWith('https://')) {
        // Default to production API URL if BASE_URL is not set, is localhost, or not HTTPS
        baseUrl = process.env.PRODUCTION_API_URL || 'https://api.merosathi.co';
        console.warn('⚠️ BASE_URL is invalid (localhost, HTTP, or not set). Using:', baseUrl);
        console.warn('⚠️ Khalti requires publicly accessible HTTPS URLs. Set BASE_URL=https://api.merosathi.co in .env');
      }
      
      // Ensure URLs are HTTPS
      if (!baseUrl.startsWith('https://')) {
        baseUrl = baseUrl.replace(/^http:\/\//, 'https://');
        console.warn('⚠️ Converted HTTP to HTTPS:', baseUrl);
      }
      
      const returnUrl = `${baseUrl}/api/v1/payments/khalti/callback`;
      const websiteUrl = baseUrl;
      
      // Log URLs for debugging
      console.log('🔗 Khalti Callback URLs:');
      console.log('  Return URL:', returnUrl);
      console.log('  Website URL:', websiteUrl);

      // Create payment record first
      const paymentData: any = {
        user: userId,
        amount,
        currency: 'NPR',
        status: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.KHALTI,
        paymentType: paymentType as PaymentType,
        metadata: {
          description,
        },
      };

      if (orderId) {
        paymentData.orderId = orderId;
      }
      if (productOrderId) {
        paymentData.orderId = productOrderId;
      }
      if (bookingId) {
        paymentData.bookingId = bookingId;
      }

      const payment = await this.paymentRepository.createPayment(paymentData);

      // Unique purchase order ID
      const purchaseOrderId = `ORDER_${payment._id}_${Date.now()}`;
      const purchaseOrderName = (description && description.trim().length >= 3) 
        ? description.trim() 
        : `MeroSathi Order - ${payment._id}`;

      // Validate amount
      if (!amount || amount <= 0) {
        throw new BadRequestError('Amount must be greater than 0');
      }

      // Convert NPR to paisa (Khalti uses paisa)
      const amountInPaisa = this.khaltiService.nprToPaisa(amount);
      
      // Ensure minimum amount (100 paisa = NPR 1.00)
      if (amountInPaisa < 100) {
        throw new BadRequestError('Amount must be at least NPR 1.00');
      }

      // Build payment request - only include customer_info if it has values
      const paymentRequest: any = {
        return_url: `${returnUrl}?paymentId=${payment._id}`,
        website_url: websiteUrl,
        amount: amountInPaisa,
        purchase_order_id: purchaseOrderId,
        purchase_order_name: purchaseOrderName,
      };
      
      // Only include customer_info if it exists and has at least one property
      if (customerInfo && typeof customerInfo === 'object' && Object.keys(customerInfo).length > 0) {
        paymentRequest.customer_info = customerInfo;
      }

      // Initiate payment with Khalti
      const khaltiResponse = await this.khaltiService.initiatePayment(paymentRequest);

      // Update payment with gateway transaction ID (pidx)
      await this.paymentRepository.updatePayment(payment._id.toString(), {
        gatewayTransactionId: khaltiResponse.pidx,
        status: PaymentStatus.PROCESSING,
        metadata: {
          ...paymentData.metadata,
          pidx: khaltiResponse.pidx,
          expires_at: khaltiResponse.expires_at,
          expires_in: khaltiResponse.expires_in,
        },
      });

      sendSuccess(res, {
        pidx: khaltiResponse.pidx,
        payment_url: khaltiResponse.payment_url,
        expires_at: khaltiResponse.expires_at,
        expires_in: khaltiResponse.expires_in,
        paymentId: payment._id,
      }, 'Khalti payment initiated successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle Khalti payment callback
   * GET /api/v1/payments/khalti/callback
   */
  handleKhaltiCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { pidx, paymentId } = req.query;

      console.log('🔔 Khalti callback received:', { pidx, paymentId });

      if (!pidx && !paymentId) {
        throw new BadRequestError('pidx or paymentId is required');
      }

      // Find payment
      let payment;
      if (paymentId) {
        payment = await this.paymentRepository.findPaymentById(paymentId as string);
        console.log('📋 Found payment by ID:', payment?._id.toString());
      } else if (pidx) {
        payment = await this.paymentRepository.findPaymentByGatewayTransactionId(pidx as string);
        console.log('📋 Found payment by pidx:', payment?._id.toString());
      }

      if (!payment) {
        console.error('❌ Payment not found for callback:', { pidx, paymentId });
        throw new NotFoundError('Payment not found');
      }

      console.log('🔍 Verifying payment with Khalti...', {
        paymentId: payment._id.toString(),
        gatewayTransactionId: payment.gatewayTransactionId,
        pidx: pidx || payment.gatewayTransactionId,
        paymentType: payment.paymentType,
        metadata: payment.metadata,
      });

      // Verify payment with Khalti
      const verifyResponse = await this.khaltiService.verifyPayment(payment.gatewayTransactionId || pidx as string);

      console.log('✅ Khalti verification response:', {
        status: verifyResponse.status,
        transaction_id: verifyResponse.transaction_id,
      });

      // Update payment status based on Khalti response
      let paymentStatus = PaymentStatus.PENDING;
      if (verifyResponse.status === 'Completed') {
        paymentStatus = PaymentStatus.SUCCESS;
      } else if (verifyResponse.status === 'Failed' || verifyResponse.status === 'Expired') {
        paymentStatus = PaymentStatus.FAILED;
      }

      console.log('💾 Updating payment status to:', paymentStatus);

      const updatedPayment = await this.paymentRepository.updatePayment(
        payment._id.toString(),
        {
          status: paymentStatus,
          gatewayPaymentId: verifyResponse.transaction_id,
          receipt: verifyResponse.transaction_id,
          metadata: {
            ...payment.metadata,
            verification_status: verifyResponse.status,
            total_amount: verifyResponse.total_amount,
            fee: verifyResponse.fee,
            refunded: verifyResponse.refunded,
          },
        }
      );

      // Update related order/booking if payment successful
      if (paymentStatus === PaymentStatus.SUCCESS && updatedPayment?.orderId) {
        console.log('✅ Payment successful! Updating order and granting service access...', {
          paymentId: updatedPayment._id.toString(),
          orderId: updatedPayment.orderId.toString(),
          paymentType: updatedPayment.paymentType,
          metadata: updatedPayment.metadata,
        });

        await this.paymentRepository.updateOrder(
          updatedPayment.orderId.toString(),
          {
            status: OrderStatus.CONFIRMED,
          }
        );
        
        if (updatedPayment.paymentType === PaymentType.JYOTISH_SERVICE) {
          console.log('🔓 Granting service access for payment...');
          await this.paymentService.grantServiceAccessForPayment(updatedPayment);
          console.log('✅ Service access granted successfully');
        } else {
          console.log('⚠️ Payment type is not JYOTISH_SERVICE, skipping service access grant');
        }
      } else {
        console.log('⚠️ Payment not successful or missing orderId:', {
          paymentStatus,
          hasOrderId: !!updatedPayment?.orderId,
        });
      }

      // Return success page
      const isSuccess = paymentStatus === PaymentStatus.SUCCESS;
      const title = isSuccess ? 'Payment Successful' : 'Payment Failed';
      const subtitle = isSuccess 
        ? PaymentController.PAYMENT_SUCCESS_SUBTITLE
        : 'Your payment could not be processed.';

      res.status(200).send(this._renderPaymentResultPage(title, subtitle, isSuccess));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify Khalti payment
   * POST /api/v1/payments/khalti/verify
   */
  verifyKhaltiPayment = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { pidx } = req.body;
      const userId = req.user!.id;

      console.log('🔍 Manual payment verification requested:', { pidx, userId });

      if (!pidx) {
        throw new BadRequestError('pidx is required');
      }

      // Find payment by pidx
      const payment = await this.paymentRepository.findPaymentByGatewayTransactionId(pidx);
      if (!payment) {
        console.error('❌ Payment not found for pidx:', pidx);
        throw new NotFoundError('Payment not found');
      }

      // Verify user owns this payment
      if (payment.user.toString() !== userId) {
        console.error('❌ Unauthorized: User does not own this payment');
        throw new BadRequestError('Unauthorized');
      }

      console.log('📋 Found payment:', {
        paymentId: payment._id.toString(),
        currentStatus: payment.status,
        paymentType: payment.paymentType,
        metadata: payment.metadata,
      });

      // Verify payment with Khalti
      const verifyResponse = await this.khaltiService.verifyPayment(pidx);

      console.log('✅ Khalti verification response:', {
        status: verifyResponse.status,
        transaction_id: verifyResponse.transaction_id,
      });

      // Update payment status
      let paymentStatus = PaymentStatus.PENDING;
      if (verifyResponse.status === 'Completed') {
        paymentStatus = PaymentStatus.SUCCESS;
      } else if (verifyResponse.status === 'Failed' || verifyResponse.status === 'Expired') {
        paymentStatus = PaymentStatus.FAILED;
      }

      const updatedPayment = await this.paymentRepository.updatePayment(payment._id.toString(), {
        status: paymentStatus,
        gatewayPaymentId: verifyResponse.transaction_id,
        receipt: verifyResponse.transaction_id,
        metadata: {
          ...payment.metadata,
          verification_status: verifyResponse.status,
          total_amount: verifyResponse.total_amount,
          fee: verifyResponse.fee,
          refunded: verifyResponse.refunded,
        },
      });

      // Grant service access if payment successful (same logic as callback)
      if (paymentStatus === PaymentStatus.SUCCESS && updatedPayment?.orderId) {
        console.log('✅ Payment successful! Updating order and granting service access...', {
          paymentId: updatedPayment._id.toString(),
          orderId: updatedPayment.orderId.toString(),
          paymentType: updatedPayment.paymentType,
        });

        await this.paymentRepository.updateOrder(
          updatedPayment.orderId.toString(),
          {
            status: OrderStatus.CONFIRMED,
          }
        );

        if (updatedPayment.paymentType === PaymentType.JYOTISH_SERVICE) {
          console.log('🔓 Granting service access for payment...');
          await this.paymentService.grantServiceAccessForPayment(updatedPayment);
          console.log('✅ Service access granted successfully');
        }
      }

      sendSuccess(res, {
        paymentId: payment._id,
        status: paymentStatus,
        pidx: verifyResponse.pidx,
        transaction_id: verifyResponse.transaction_id,
        amount: verifyResponse.total_amount,
      }, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle Nabil Bank payment callback
   * GET /api/v1/payments/nabil/callback
   */
  handleNabilCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { OrderID, SessionID, Status } = req.query;
      const { paymentId, status } = req.query;

      // Find payment by ID or gateway order ID
      let payment;
      if (paymentId) {
        payment = await this.paymentRepository.findPaymentById(paymentId as string);
      } else if (OrderID) {
        payment = await this.paymentRepository.findPaymentByGatewayOrderId(OrderID as string);
      } else if (SessionID) {
        payment = await this.paymentRepository.findPaymentByGatewaySessionId(SessionID as string);
      }

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      // Determine status from query param or callback status
      let paymentStatus: PaymentStatus;
      if (status === 'success' || Status === '00') {
        paymentStatus = PaymentStatus.SUCCESS;
      } else if (status === 'cancelled' || Status === '4') {
        paymentStatus = PaymentStatus.CANCELLED;
      } else {
        paymentStatus = PaymentStatus.FAILED;
      }

      // Update payment status
      await this.paymentRepository.updatePayment(payment._id.toString(), {
        status: paymentStatus,
      });

      // Return HTML response for Flutter WebView redirect
      const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <title>Payment ${paymentStatus === PaymentStatus.SUCCESS ? 'Success' : paymentStatus === PaymentStatus.CANCELLED ? 'Cancelled' : 'Failed'}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <h1>Payment ${paymentStatus === PaymentStatus.SUCCESS ? 'Success' : paymentStatus === PaymentStatus.CANCELLED ? 'Cancelled' : 'Failed'}</h1>
  <p>Order ID: ${OrderID || payment.gatewayOrderId}</p>
  <p>Status: ${paymentStatus}</p>
  <script>
    // Send message to Flutter WebView
    if (window.flutter_inappwebview) {
      window.flutter_inappwebview.callHandler('paymentCallback', {
        status: '${paymentStatus}',
        orderID: '${OrderID || payment.gatewayOrderId}',
        sessionID: '${SessionID || payment.gatewaySessionId}',
        paymentId: '${payment._id}'
      });
    }
    // Fallback: redirect after 2 seconds
    setTimeout(() => {
      window.location.href = 'flutter://payment-callback?status=${paymentStatus}&orderID=${OrderID || payment.gatewayOrderId}';
    }, 2000);
  </script>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(htmlResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify Nabil Bank payment status
   * POST /api/v1/payments/nabil/verify
   */
  verifyNabilPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderID, sessionID } = req.body;

      // Find payment record - try multiple methods:
      // 1. Try by provided values (could be encrypted or decrypted)
      // 2. Try by decrypted values in metadata
      // 3. Try by encrypted values if provided values look encrypted
      let payment;
      
      // First, try to find by provided values (could be encrypted)
      if (orderID) {
        payment = await this.paymentRepository.findPaymentByGatewayOrderId(orderID);
      }
      if (!payment && sessionID) {
        payment = await this.paymentRepository.findPaymentByGatewaySessionId(sessionID);
      }
      
      // If not found, try by decrypted values in metadata
      if (!payment) {
        payment = await this.paymentRepository.findPaymentByDecryptedId(orderID, sessionID);
      }
      
      // If still not found and values look encrypted, try decrypting and searching
      if (!payment && orderID && orderID.startsWith('@encrypted@')) {
        try {
          const decrypted = this.nabilService.decryptNabilId(orderID);
          payment = await this.paymentRepository.findPaymentByDecryptedId(decrypted, undefined);
        } catch (e) {
          // Ignore decryption errors
        }
      }
      
      if (!payment && sessionID && sessionID.startsWith('@encrypted@')) {
        try {
          const decrypted = this.nabilService.decryptNabilId(sessionID);
          payment = await this.paymentRepository.findPaymentByDecryptedId(undefined, decrypted);
        } catch (e) {
          // Ignore decryption errors
        }
      }

      if (!payment) {
        throw new NotFoundError('Payment not found. Make sure you use the OrderID/SessionID from a payment you created.');
      }

      // Use decrypted values for GetOrderStatus request
      // If decrypted values are stored in metadata, use them; otherwise decrypt
      let decryptedOrderID = orderID;
      let decryptedSessionID = sessionID;

      // If provided values are encrypted, decrypt them
      if (orderID && orderID.startsWith('@encrypted@')) {
        try {
          decryptedOrderID = this.nabilService.decryptNabilId(orderID);
        } catch (decryptError) {
          throw new BadRequestError('Failed to decrypt OrderID');
        }
      }
      
      if (sessionID && sessionID.startsWith('@encrypted@')) {
        try {
          decryptedSessionID = this.nabilService.decryptNabilId(sessionID);
        } catch (decryptError) {
          throw new BadRequestError('Failed to decrypt SessionID');
        }
      }

      // If payment has stored decrypted values, use those (they're more reliable)
      if (payment.metadata?.decryptedOrderID && payment.metadata?.decryptedSessionID) {
        decryptedOrderID = payment.metadata.decryptedOrderID;
        decryptedSessionID = payment.metadata.decryptedSessionID;
      } else if (payment.gatewayOrderId && payment.gatewaySessionId) {
        // Decrypt the stored encrypted values
        try {
          decryptedOrderID = this.nabilService.decryptNabilId(payment.gatewayOrderId);
          decryptedSessionID = this.nabilService.decryptNabilId(payment.gatewaySessionId);
        } catch (decryptError) {
          throw new BadRequestError('Failed to decrypt OrderID/SessionID for verification');
        }
      }

      // Get order status from Nabil Bank using DECRYPTED values
      const statusResponse = await this.nabilService.getOrderStatus({
        orderID: decryptedOrderID,
        sessionID: decryptedSessionID,
      });

      // Map Nabil order status to payment status
      const paymentStatus = this.nabilService.mapOrderStatusToPaymentStatus(
        statusResponse.orderStatus
      );

      // Update payment status
      const updatedPayment = await this.paymentRepository.updatePayment(
        payment._id.toString(),
        {
          status: paymentStatus as PaymentStatus,
          gatewayPaymentId: statusResponse.responseCode,
        }
      );

      // Update related order/booking if payment is successful
      if (paymentStatus === 'success' && updatedPayment) {
        if (updatedPayment.orderId) {
          await this.paymentRepository.updateOrder(updatedPayment.orderId.toString(), {
            status: OrderStatus.CONFIRMED,
          });
          if (updatedPayment.paymentType === PaymentType.JYOTISH_SERVICE) {
            await this.paymentService.grantServiceAccessForPayment(updatedPayment);
          }
        }
        if (updatedPayment.bookingId) {
          // Update booking status if needed
        }
      }

      // Check if XML format is requested
      const acceptHeader = req.headers.accept || '';
      const format = req.query.format as string;
      
      if (format === 'xml' || acceptHeader.includes('application/xml')) {
        // Return XML format
        res.setHeader('Content-Type', 'application/xml');
        res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
  <Response>
    <Status>${statusResponse.status}</Status>
    <Order>
      <OrderID>${statusResponse.orderID}</OrderID>
      <SessionID>${statusResponse.sessionID}</SessionID>
      <OrderStatus>${statusResponse.orderStatus}</OrderStatus>
      ${statusResponse.responseCode ? `<ResponseCode>${statusResponse.responseCode}</ResponseCode>` : ''}
    </Order>
  </Response>
</TKKPG>`.trim());
      } else {
        // Return JSON format (default)
        sendSuccess(res, {
          payment: updatedPayment,
          orderStatus: statusResponse.orderStatus,
          status: paymentStatus,
          orderID: statusResponse.orderID,
          sessionID: statusResponse.sessionID,
        }, 'Payment status verified');
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle Nabil Bank approve callback
   * POST /api/v1/payments/nabil/approve (bank callback)
   * GET /api/v1/payments/nabil/approve (browser redirect)
   * 
   * Public endpoint - no authentication required
   * No CORS validation
   * Saves callback data to database
   */
  handleNabilApproveCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      let browserRedirectUrl: string | undefined;

      // Handle GET requests (browser redirects)
      if (req.method === 'GET') {
        const OrderID = req.query.OrderID || req.query.orderID || req.query.OrderId || req.query.orderId;
        const SessionID = req.query.SessionID || req.query.sessionID || req.query.SessionId || req.query.sessionId;
        
        if (!OrderID && !SessionID) {
          return this.renderStatusPage(res, 'Error', 'Missing OrderID and SessionID', '#F44336', '❌');
        }

        // Call GetOrderStatus immediately
        try {
          let decryptedOrderID = String(OrderID || '');
          let decryptedSessionID = String(SessionID || '');

          // Decrypt if needed
          if (decryptedOrderID.startsWith('@encrypted@')) {
            decryptedOrderID = this.nabilService.decryptNabilId(decryptedOrderID);
          }
          if (decryptedSessionID.startsWith('@encrypted@')) {
            decryptedSessionID = this.nabilService.decryptNabilId(decryptedSessionID);
          }

          const statusResponse = await this.nabilService.getOrderStatus({
            orderID: decryptedOrderID,
            sessionID: decryptedSessionID,
          });

          // Map order status (numeric code) to message
          const statusMap: Record<number, { message: string; color: string; icon: string; details?: string }> = {
            2: { message: 'Payment Successful', color: '#4CAF50', icon: '✅', details: PaymentController.PAYMENT_SUCCESS_SUBTITLE },
            3: { 
              message: 'Payment Declined', 
              color: '#F44336', 
              icon: '❌',
              details: PaymentController.TRANSACTION_FAILED_DETAILS_HTML
            },
            4: { message: 'Payment Cancelled', color: '#FF9800', icon: '⚠️', details: PaymentController.PAYMENT_CANCELLED_SUBTITLE },
          };

          const orderStatusCode = Number(statusResponse.orderStatus);
          const status = statusMap[orderStatusCode] || {
            message: 'Payment Successful',
            color: '#4CAF50',
            icon: '✅',
            details: PaymentController.PAYMENT_SUCCESS_SUBTITLE,
          };

          // Approve URL: always show success UI (green checkmark, transaction details, Done / View Receipt)
          this.renderStatusPage(
            res,
            status.message,
            status.details || PaymentController.PAYMENT_SUCCESS_SUBTITLE,
            status.color,
            status.icon,
            String(OrderID || ''),
            2 // force success variant on /nabil/approve
          );
        } catch (error: any) {
          this.renderStatusPage(
            res,
            'Payment Successful',
            PaymentController.PAYMENT_SUCCESS_SUBTITLE,
            '#4CAF50',
            '✅',
            String(OrderID || ''),
            2 // force success variant
          );
        }
        return;
      }

      // Handle POST requests (bank callbacks)
      console.log('NABIL APPROVE CALLBACK - POST REQUEST');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      
      // Extract XML from form data (bank sends xmlmsg field)
      const rawXml = req.body.xmlmsg || req.body.toString('utf8');
      
      if (rawXml && typeof rawXml === 'string' && rawXml.trim().length > 0) {
        try {
          // Parse XML
          const parsedData = await this.nabilService.parseCallbackXml(rawXml);

          // If this callback came via browser POST-redirect, prepare a GET redirect URL
          // so the user sees the status page (instead of plain "OK") without refreshing.
          if (!browserRedirectUrl && this.isBrowserHtmlNavigation(req)) {
            const orderIdForRedirect = parsedData.orderId || parsedData.orderIDEncrypted;
            const sessionIdForRedirect = parsedData.sessionId;
            if (orderIdForRedirect && sessionIdForRedirect) {
              browserRedirectUrl =
                `${req.baseUrl || ''}${req.path || ''}` +
                `?OrderID=${encodeURIComponent(String(orderIdForRedirect))}` +
                `&SessionID=${encodeURIComponent(String(sessionIdForRedirect))}`;
            }
          }
          
          // Map order status to callback status
          const callbackStatus = this.nabilService.mapOrderStatusToCallbackStatus(
            parsedData.orderStatus
          ) as NabilCallbackStatus;

          // Use totalAmount if available, otherwise purchaseAmount
          const amount = parsedData.totalAmount || parsedData.purchaseAmount;

          // Get transactionId from payment record to ensure all logs share the same transactionId
          // Try multiple methods to find the payment and retrieve transactionId:
          // 1. Try query params (if available from callback URL)
          // 2. Find payment by OrderID/SessionID and get transactionId from metadata
          let transactionId: string | undefined;
          
          // Method 1: Try query params first (if callback URL had transactionId)
          const transactionIdFromQuery =
            (req.query.transactionId as string) ||
            (req.query.txnId as string) ||
            (req.query.txnid as string);
          
          if (transactionIdFromQuery) {
            transactionId = transactionIdFromQuery;
            console.log('✅ Found transactionId from query params:', transactionId);
          } else {
            // Method 2: Find payment by OrderID/SessionID and get transactionId from metadata
            try {
              let payment = await this.paymentRepository.findPaymentByGatewayOrderId(
                parsedData.orderIDEncrypted || parsedData.orderId || ''
              );
              
              if (!payment && parsedData.sessionId) {
                payment = await this.paymentRepository.findPaymentByGatewaySessionId(
                  parsedData.sessionId
                );
              }
              
              if (!payment && parsedData.orderId) {
                // Try by decrypted OrderID/SessionID
                payment = await this.paymentRepository.findPaymentByDecryptedId(
                  parsedData.orderId,
                  parsedData.sessionId
                );
              }
              
              if (payment && payment.metadata?.transactionId) {
                transactionId = payment.metadata.transactionId as string;
                console.log('✅ Found transactionId from payment record:', transactionId);
              }
            } catch (paymentError) {
              console.error('❌ Error finding payment for transactionId:', paymentError);
            }
          }
          
          // Method 3: If payment record not found, try to find transactionId from CreateOrder logs
          if (!transactionId) {
            try {
              const createOrderLogs = await this.transactionLogRepository.getLogsByOrderAndSession(
                parsedData.orderIDEncrypted || parsedData.orderId || '',
                parsedData.sessionId || ''
              );
              
              // Look for CREATE_ORDER_REQUEST or CREATE_ORDER_RESPONSE logs
              const createOrderLog = createOrderLogs.find(
                log => log.type === 'CREATE_ORDER_REQUEST' || log.type === 'CREATE_ORDER_RESPONSE'
              );
              
              if (createOrderLog && createOrderLog.transactionId) {
                transactionId = createOrderLog.transactionId;
                console.log('✅ Found transactionId from CreateOrder logs:', transactionId);
              }
            } catch (logError) {
              console.error('❌ Error searching transaction logs for transactionId:', logError);
            }
          }
          
          // If still no transactionId found, generate a new one (fallback)
          if (!transactionId) {
            transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.warn('⚠️ No transactionId found, generated new one:', transactionId);
            console.warn('   This will create unlinked logs!');
          }

          // Log payment XML (this is log #3)
          console.log('📝 Logging PAYMENT_XML (approve callback)...');
          console.log('  TransactionId:', transactionId);
          try {
            const logResult = await this.transactionLogRepository.createLog({
              transactionId,
              type: TransactionLogType.PAYMENT_XML,
              orderId: parsedData.orderId,
              sessionId: parsedData.sessionId,
              xmlData: rawXml,
              metadata: {
                callbackType: 'approve',
                source: 'bank_callback',
              },
              receivedAt: new Date(),
            });
            console.log('✅ PAYMENT_XML logged successfully:', logResult._id);
          } catch (logError) {
            console.error('❌ Failed to log PAYMENT_XML:', logError);
          }

          // Save callback to database (PAYMENT_XML - log #3)
          try {
            const callbackTransaction = await this.nabilCallbackRepository.createCallback({
              logType: NabilLogType.PAYMENT_XML,
              transactionId,
              orderId: parsedData.orderId,
              encryptedOrderId: parsedData.orderIDEncrypted || undefined,
              sessionId: parsedData.sessionId,
              amount,
              currency: parsedData.currency,
              currencyISO: parsedData.currencyISOAlpha || 'NPR',
              status: callbackStatus,
              statusDescription: parsedData.orderStatusScr || parsedData.orderStatus,
              transactionType: parsedData.transactionType || 'Purchase',
              orderDescription: parsedData.orderDescription || '',
              tranDateTime: parsedData.tranDateTime,
              bankName: parsedData.bankName || 'PSP NABIL',
              language: parsedData.language || 'EN',
              version: parsedData.version || '1.0',
              rawXml,
              receivedAt: new Date(),
            });

            console.log('✅ PAYMENT_XML saved to nabilcallbacks:', callbackTransaction._id);
          } catch (dbError) {
            console.error('❌ Failed to save PAYMENT_XML to nabilcallbacks:', dbError);
            // Continue - still return OK to bank even if DB save fails
          }

          // Call GetOrderStatus immediately after callback.
          // IMPORTANT: We await this in serverless (Vercel) so that the
          // request/response logs are reliably written before the
          // function is frozen.
          if (parsedData.orderIDEncrypted || parsedData.orderId) {
            try {
              console.log('🔄 Calling GetOrderStatus for approve callback...');
              await this.callGetOrderStatusAsync(
                parsedData.orderIDEncrypted || parsedData.orderId,
                parsedData.sessionId,
                transactionId
              );
              console.log('✅ GetOrderStatus completed for approve callback');
            } catch (error) {
              console.error('❌ GetOrderStatus error (approve callback):', error);
              // Do not rethrow – still return OK to bank
            }
          } else {
            console.warn('⚠️ Cannot call GetOrderStatus - missing OrderID/SessionID');
          }
          
          // Summary: Verify all logs were created
          console.log('========================================');
          console.log('CALLBACK PROCESSING SUMMARY');
          console.log('========================================');
          console.log('TransactionId:', transactionId);
          console.log('OrderId:', parsedData.orderId);
          console.log('SessionId:', parsedData.sessionId);
          console.log('');
          console.log('📋 Expected 5 logs for this transaction:');
          console.log('   1. ✅ CREATE_ORDER_REQUEST (logged during checkout)');
          console.log('   2. ✅ CREATE_ORDER_RESPONSE (logged during checkout)');
          console.log('   3. ✅ PAYMENT_XML (just logged above)');
          console.log('   4. ⏳ GET_ORDER_STATUS_REQUEST (will be logged next)');
          console.log('   5. ⏳ GET_ORDER_STATUS_RESPONSE (will be logged next)');
          console.log('');
          console.log('All 5 logs are stored SEPARATELY in transactionlogs collection');
          console.log('Each log has its own document with unique _id');
          console.log('========================================');
          console.log('Expected logs:');
          console.log('  1. CREATE_ORDER_REQUEST (from checkout)');
          console.log('  2. CREATE_ORDER_RESPONSE (from checkout)');
          console.log('  3. PAYMENT_XML (just created)');
          console.log('  4. GET_ORDER_STATUS_REQUEST (from GetOrderStatus)');
          console.log('  5. GET_ORDER_STATUS_RESPONSE (from GetOrderStatus)');
          console.log('========================================');
        } catch (xmlError) {
          console.error('❌ Failed to parse XML:', xmlError);
          // Continue - still return OK to bank even if XML parsing fails
        }
      } else {
        console.warn('⚠️ No XML data found in request body');
      }

      // Fallback: if the browser POST includes OrderID/SessionID in query/body, redirect using those.
      if (!browserRedirectUrl && this.isBrowserHtmlNavigation(req)) {
        const orderIdFromReq =
          (req.query.OrderID as string) ||
          (req.query.orderID as string) ||
          (req.query.OrderId as string) ||
          (req.query.orderId as string) ||
          (req.body?.OrderID as string) ||
          (req.body?.orderID as string) ||
          (req.body?.OrderId as string) ||
          (req.body?.orderId as string);
        const sessionIdFromReq =
          (req.query.SessionID as string) ||
          (req.query.sessionID as string) ||
          (req.query.SessionId as string) ||
          (req.query.sessionId as string) ||
          (req.body?.SessionID as string) ||
          (req.body?.sessionID as string) ||
          (req.body?.SessionId as string) ||
          (req.body?.sessionId as string);
        if (orderIdFromReq || sessionIdFromReq) {
          const qs =
            `${orderIdFromReq ? `OrderID=${encodeURIComponent(String(orderIdFromReq))}` : ''}` +
            `${orderIdFromReq && sessionIdFromReq ? '&' : ''}` +
            `${sessionIdFromReq ? `SessionID=${encodeURIComponent(String(sessionIdFromReq))}` : ''}`;
          browserRedirectUrl = `${req.baseUrl || ''}${req.path || ''}${qs ? `?${qs}` : ''}`;
        }
      }

      // If this POST was initiated by a browser, redirect to GET for a status page.
      if (browserRedirectUrl) {
        return res.redirect(303, browserRedirectUrl);
      }

      // Always return OK to bank
      res.status(200).send('OK');
    } catch (error: any) {
      console.error('Error in approve callback:', error);
      // Always return OK even on error
      res.status(200).send('OK');
    }
  };

  /**
   * Handle Nabil Bank cancel callback
   * POST /api/v1/payments/nabil/cancel (bank callback)
   * GET /api/v1/payments/nabil/cancel (browser redirect)
   * 
   * Public endpoint - no authentication required
   * No CORS validation
   * Saves callback data to database
   */
  handleNabilCancelCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      let browserRedirectUrl: string | undefined;

      // Handle GET requests (browser redirects)
      if (req.method === 'GET') {
        const OrderID = req.query.OrderID || req.query.orderID || req.query.OrderId || req.query.orderId;
        const SessionID = req.query.SessionID || req.query.sessionID || req.query.SessionId || req.query.sessionId;
        
        if (!OrderID && !SessionID) {
          return this.renderStatusPage(res, 'Error', 'Missing OrderID and SessionID', '#F44336', '❌');
        }

        // Call GetOrderStatus immediately
        try {
          let decryptedOrderID = String(OrderID || '');
          let decryptedSessionID = String(SessionID || '');

          // Decrypt if needed
          if (decryptedOrderID.startsWith('@encrypted@')) {
            decryptedOrderID = this.nabilService.decryptNabilId(decryptedOrderID);
          }
          if (decryptedSessionID.startsWith('@encrypted@')) {
            decryptedSessionID = this.nabilService.decryptNabilId(decryptedSessionID);
          }

          const statusResponse = await this.nabilService.getOrderStatus({
            orderID: decryptedOrderID,
            sessionID: decryptedSessionID,
          });

          // Map order status (numeric code) to message
          const statusMap: Record<number, { message: string; color: string; icon: string; details?: string }> = {
            2: { message: 'Payment Successful', color: '#4CAF50', icon: '✅', details: PaymentController.PAYMENT_SUCCESS_SUBTITLE },
            3: { 
              message: 'Payment Declined', 
              color: '#F44336', 
              icon: '❌',
              details: PaymentController.TRANSACTION_FAILED_DETAILS_HTML
            },
            4: { message: 'Payment Cancelled', color: '#FF9800', icon: '⚠️', details: PaymentController.PAYMENT_CANCELLED_SUBTITLE },
          };

          const orderStatusCode = Number(statusResponse.orderStatus);
          const status = statusMap[orderStatusCode] || {
            message: 'Payment Cancelled',
            color: '#F28C28',
            icon: '⚠️',
            details: PaymentController.PAYMENT_CANCELLED_SUBTITLE,
          };

          // Cancel URL: always show cancelled UI (title, icon, buttons) regardless of gateway code
          this.renderStatusPage(
            res,
            status.message,
            status.details || PaymentController.PAYMENT_CANCELLED_SUBTITLE,
            status.color,
            status.icon,
            String(OrderID || ''),
            4 // force cancelled variant on /nabil/cancel
          );
        } catch (error: any) {
          this.renderStatusPage(
            res,
            'Payment Cancelled',
            PaymentController.PAYMENT_CANCELLED_SUBTITLE,
            '#F28C28',
            '⚠️',
            String(OrderID || ''),
            4 // force cancelled variant
          );
        }
        return;
      }

      // Handle POST requests (bank callbacks)
      console.log('NABIL CANCEL CALLBACK - POST REQUEST');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      
      // Extract XML from form data (bank sends xmlmsg field)
      const rawXml = req.body.xmlmsg || req.body.toString('utf8');
      
      if (rawXml && typeof rawXml === 'string' && rawXml.trim().length > 0) {
        try {
          // Parse XML
          const parsedData = await this.nabilService.parseCallbackXml(rawXml);

          // If this callback came via browser POST-redirect, prepare a GET redirect URL.
          if (!browserRedirectUrl && this.isBrowserHtmlNavigation(req)) {
            const orderIdForRedirect = parsedData.orderId || parsedData.orderIDEncrypted;
            const sessionIdForRedirect = parsedData.sessionId;
            if (orderIdForRedirect && sessionIdForRedirect) {
              browserRedirectUrl =
                `${req.baseUrl || ''}${req.path || ''}` +
                `?OrderID=${encodeURIComponent(String(orderIdForRedirect))}` +
                `&SessionID=${encodeURIComponent(String(sessionIdForRedirect))}`;
            }
          }
          
          // Map order status to callback status
          const callbackStatus = this.nabilService.mapOrderStatusToCallbackStatus(
            parsedData.orderStatus
          ) as NabilCallbackStatus;

          // Use totalAmount if available, otherwise purchaseAmount
          const amount = parsedData.totalAmount || parsedData.purchaseAmount;

          // Get transactionId from payment record to ensure all logs share the same transactionId
          let transactionId: string | undefined;
          
          // Method 1: Try query params first
          const transactionIdFromQuery =
            (req.query.transactionId as string) ||
            (req.query.txnId as string) ||
            (req.query.txnid as string);
          
          if (transactionIdFromQuery) {
            transactionId = transactionIdFromQuery;
            console.log('✅ Found transactionId from query params:', transactionId);
          } else {
            // Method 2: Find payment by OrderID/SessionID and get transactionId from metadata
            try {
              let payment = await this.paymentRepository.findPaymentByGatewayOrderId(
                parsedData.orderIDEncrypted || parsedData.orderId || ''
              );
              
              if (!payment && parsedData.sessionId) {
                payment = await this.paymentRepository.findPaymentByGatewaySessionId(
                  parsedData.sessionId
                );
              }
              
              if (!payment && parsedData.orderId) {
                payment = await this.paymentRepository.findPaymentByDecryptedId(
                  parsedData.orderId,
                  parsedData.sessionId
                );
              }
              
              if (payment && payment.metadata?.transactionId) {
                transactionId = payment.metadata.transactionId as string;
                console.log('✅ Found transactionId from payment record:', transactionId);
              }
            } catch (paymentError) {
              console.error('❌ Error finding payment for transactionId:', paymentError);
            }
          }
          
          // Method 3: If payment record not found, try to find transactionId from CreateOrder logs
          if (!transactionId) {
            try {
              const createOrderLogs = await this.transactionLogRepository.getLogsByOrderAndSession(
                parsedData.orderIDEncrypted || parsedData.orderId || '',
                parsedData.sessionId || ''
              );
              
              // Look for CREATE_ORDER_REQUEST or CREATE_ORDER_RESPONSE logs
              const createOrderLog = createOrderLogs.find(
                log => log.type === 'CREATE_ORDER_REQUEST' || log.type === 'CREATE_ORDER_RESPONSE'
              );
              
              if (createOrderLog && createOrderLog.transactionId) {
                transactionId = createOrderLog.transactionId;
                console.log('✅ Found transactionId from CreateOrder logs:', transactionId);
              }
            } catch (logError) {
              console.error('❌ Error searching transaction logs for transactionId:', logError);
            }
          }
          
          // If still no transactionId found, generate a new one (fallback)
          if (!transactionId) {
            transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.warn('⚠️ No transactionId found, generated new one:', transactionId);
            console.warn('   This will create unlinked logs!');
          }

          // Log payment XML (this is log #3)
          console.log('📝 Logging PAYMENT_XML (cancel callback)...');
          console.log('  TransactionId:', transactionId);
          try {
            const logResult = await this.transactionLogRepository.createLog({
              transactionId,
              type: TransactionLogType.PAYMENT_XML,
              orderId: parsedData.orderId,
              sessionId: parsedData.sessionId,
              xmlData: rawXml,
              metadata: {
                callbackType: 'cancel',
                source: 'bank_callback',
              },
              receivedAt: new Date(),
            });
            console.log('✅ PAYMENT_XML logged successfully:', logResult._id);
          } catch (logError) {
            console.error('❌ Failed to log PAYMENT_XML:', logError);
          }

          // Save callback to database (PAYMENT_XML - log #3)
          try {
            const callbackTransaction = await this.nabilCallbackRepository.createCallback({
              logType: NabilLogType.PAYMENT_XML,
              transactionId,
              orderId: parsedData.orderId,
              encryptedOrderId: parsedData.orderIDEncrypted || undefined,
              sessionId: parsedData.sessionId,
              amount,
              currency: parsedData.currency,
              currencyISO: parsedData.currencyISOAlpha || 'NPR',
              status: callbackStatus,
              statusDescription: parsedData.orderStatusScr || parsedData.orderStatus,
              transactionType: parsedData.transactionType || 'Purchase',
              orderDescription: parsedData.orderDescription || '',
              tranDateTime: parsedData.tranDateTime,
              bankName: parsedData.bankName || 'PSP NABIL',
              language: parsedData.language || 'EN',
              version: parsedData.version || '1.0',
              rawXml,
              receivedAt: new Date(),
            });

            console.log('✅ PAYMENT_XML saved to nabilcallbacks:', callbackTransaction._id);
          } catch (dbError) {
            console.error('❌ Failed to save PAYMENT_XML to nabilcallbacks:', dbError);
            // Continue - still return OK to bank even if DB save fails
          }

          // Call GetOrderStatus immediately after callback.
          // Await to ensure logs are written before serverless freeze.
          if (parsedData.orderIDEncrypted || parsedData.orderId) {
            try {
              console.log('🔄 Calling GetOrderStatus for cancel callback...');
              await this.callGetOrderStatusAsync(
                parsedData.orderIDEncrypted || parsedData.orderId,
                parsedData.sessionId,
                transactionId
              );
              console.log('✅ GetOrderStatus completed for cancel callback');
            } catch (error) {
              console.error('❌ GetOrderStatus error (cancel callback):', error);
              // Do not rethrow – still return OK to bank
            }
          } else {
            console.warn('⚠️ Cannot call GetOrderStatus - missing OrderID/SessionID');
          }
          
          // Summary: Verify all logs were created
          console.log('========================================');
          console.log('CALLBACK PROCESSING SUMMARY');
          console.log('========================================');
          console.log('TransactionId:', transactionId);
          console.log('OrderId:', parsedData.orderId);
          console.log('SessionId:', parsedData.sessionId);
          console.log('');
          console.log('📋 Expected 5 logs for this transaction:');
          console.log('   1. ✅ CREATE_ORDER_REQUEST (logged during checkout)');
          console.log('   2. ✅ CREATE_ORDER_RESPONSE (logged during checkout)');
          console.log('   3. ✅ PAYMENT_XML (just logged above)');
          console.log('   4. ⏳ GET_ORDER_STATUS_REQUEST (will be logged next)');
          console.log('   5. ⏳ GET_ORDER_STATUS_RESPONSE (will be logged next)');
          console.log('');
          console.log('All 5 logs are stored SEPARATELY in transactionlogs collection');
          console.log('Each log has its own document with unique _id');
          console.log('========================================');
          console.log('Expected logs:');
          console.log('  1. CREATE_ORDER_REQUEST (from checkout)');
          console.log('  2. CREATE_ORDER_RESPONSE (from checkout)');
          console.log('  3. PAYMENT_XML (just created)');
          console.log('  4. GET_ORDER_STATUS_REQUEST (from GetOrderStatus)');
          console.log('  5. GET_ORDER_STATUS_RESPONSE (from GetOrderStatus)');
          console.log('========================================');
        } catch (xmlError) {
          console.error('❌ Failed to parse XML:', xmlError);
          // Continue - still return OK to bank even if XML parsing fails
        }
      } else {
        console.warn('⚠️ No XML data found in request body');
      }

      // Fallback: if the browser POST includes OrderID/SessionID in query/body, redirect using those.
      if (!browserRedirectUrl && this.isBrowserHtmlNavigation(req)) {
        const orderIdFromReq =
          (req.query.OrderID as string) ||
          (req.query.orderID as string) ||
          (req.query.OrderId as string) ||
          (req.query.orderId as string) ||
          (req.body?.OrderID as string) ||
          (req.body?.orderID as string) ||
          (req.body?.OrderId as string) ||
          (req.body?.orderId as string);
        const sessionIdFromReq =
          (req.query.SessionID as string) ||
          (req.query.sessionID as string) ||
          (req.query.SessionId as string) ||
          (req.query.sessionId as string) ||
          (req.body?.SessionID as string) ||
          (req.body?.sessionID as string) ||
          (req.body?.SessionId as string) ||
          (req.body?.sessionId as string);
        if (orderIdFromReq || sessionIdFromReq) {
          const qs =
            `${orderIdFromReq ? `OrderID=${encodeURIComponent(String(orderIdFromReq))}` : ''}` +
            `${orderIdFromReq && sessionIdFromReq ? '&' : ''}` +
            `${sessionIdFromReq ? `SessionID=${encodeURIComponent(String(sessionIdFromReq))}` : ''}`;
          browserRedirectUrl = `${req.baseUrl || ''}${req.path || ''}${qs ? `?${qs}` : ''}`;
        }
      }

      // If this POST was initiated by a browser, redirect to GET for a status page.
      if (browserRedirectUrl) {
        return res.redirect(303, browserRedirectUrl);
      }

      // Always return OK to bank
      res.status(200).send('OK');
    } catch (error: any) {
      console.error('Error in cancel callback:', error);
      // Always return OK even on error
      res.status(200).send('OK');
    }
  };

  /**
   * Handle Nabil Bank decline callback
   * POST /api/v1/payments/nabil/decline (bank callback)
   * GET /api/v1/payments/nabil/decline (browser redirect)
   * 
   * Public endpoint - no authentication required
   * No CORS validation
   * Saves callback data to database
   */
  handleNabilDeclineCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      let browserRedirectUrl: string | undefined;

      // Handle GET requests (browser redirects)
      if (req.method === 'GET') {
        const OrderID = req.query.OrderID || req.query.orderID || req.query.OrderId || req.query.orderId;
        const SessionID = req.query.SessionID || req.query.sessionID || req.query.SessionId || req.query.sessionId;
        
        if (!OrderID && !SessionID) {
          // If someone opens the decline URL directly (no query params), show a friendly decline message.
          // This matches the expected behavior for browser redirects and manual testing.
          return this.renderStatusPage(
            res,
            'Payment Declined',
            PaymentController.TRANSACTION_FAILED_DETAILS_HTML,
            '#F44336',
            '❌'
            ,
            undefined,
            3
          );
        }

        // Call GetOrderStatus immediately
        try {
          let decryptedOrderID = String(OrderID || '');
          let decryptedSessionID = String(SessionID || '');

          // Decrypt if needed
          if (decryptedOrderID.startsWith('@encrypted@')) {
            decryptedOrderID = this.nabilService.decryptNabilId(decryptedOrderID);
          }
          if (decryptedSessionID.startsWith('@encrypted@')) {
            decryptedSessionID = this.nabilService.decryptNabilId(decryptedSessionID);
          }

          const statusResponse = await this.nabilService.getOrderStatus({
            orderID: decryptedOrderID,
            sessionID: decryptedSessionID,
          });

          // Map order status to message
          const statusMap: Record<number, { message: string; color: string; icon: string; details?: string }> = {
            2: { message: 'Payment Successful', color: '#4CAF50', icon: '✅', details: PaymentController.PAYMENT_SUCCESS_SUBTITLE },
            3: { 
              message: 'Payment Declined', 
              color: '#F44336', 
              icon: '❌',
              details: PaymentController.TRANSACTION_FAILED_DETAILS_HTML
            },
            4: { message: 'Payment Cancelled', color: '#FF9800', icon: '⚠️', details: PaymentController.PAYMENT_CANCELLED_SUBTITLE },
          };

          const orderStatusCode = Number(statusResponse.orderStatus);
          const status = statusMap[orderStatusCode] || {
            message: 'Payment Declined',
            color: '#F44336',
            icon: '❌',
            details: PaymentController.TRANSACTION_FAILED_DETAILS_HTML,
          };

          // Decline URL: always show declined UI (red icon, reasons list, Try Again / Change Payment Method / Contact Support)
          this.renderStatusPage(
            res,
            status.message,
            status.details || PaymentController.PAYMENT_DECLINED_SUBTITLE,
            status.color,
            status.icon,
            String(OrderID || ''),
            3 // force declined variant on /nabil/decline
          );
        } catch (error: any) {
          this.renderStatusPage(
            res,
            'Payment Declined',
            PaymentController.TRANSACTION_FAILED_DETAILS_HTML,
            '#F44336',
            '❌',
            String(OrderID || ''),
            3 // force declined variant
          );
        }
        return;
      }

      // Handle POST requests (bank callbacks)
      console.log('NABIL DECLINE CALLBACK - POST REQUEST');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      
      // Extract XML from form data (bank sends xmlmsg field)
      const rawXml = req.body.xmlmsg || req.body.toString('utf8');
      
      if (rawXml && typeof rawXml === 'string' && rawXml.trim().length > 0) {
        try {
          // Parse XML
          const parsedData = await this.nabilService.parseCallbackXml(rawXml);

          // If this callback came via browser POST-redirect, prepare a GET redirect URL.
          if (!browserRedirectUrl && this.isBrowserHtmlNavigation(req)) {
            const orderIdForRedirect = parsedData.orderId || parsedData.orderIDEncrypted;
            const sessionIdForRedirect = parsedData.sessionId;
            if (orderIdForRedirect && sessionIdForRedirect) {
              browserRedirectUrl =
                `${req.baseUrl || ''}${req.path || ''}` +
                `?OrderID=${encodeURIComponent(String(orderIdForRedirect))}` +
                `&SessionID=${encodeURIComponent(String(sessionIdForRedirect))}`;
            }
          }
          
          // Map order status to callback status
          const callbackStatus = this.nabilService.mapOrderStatusToCallbackStatus(
            parsedData.orderStatus
          ) as NabilCallbackStatus;

          // Use totalAmount if available, otherwise purchaseAmount
          const amount = parsedData.totalAmount || parsedData.purchaseAmount;

          // Get transactionId from payment record to ensure all logs share the same transactionId
          let transactionId: string | undefined;
          
          // Method 1: Try query params first
          const transactionIdFromQuery =
            (req.query.transactionId as string) ||
            (req.query.txnId as string) ||
            (req.query.txnid as string);
          
          if (transactionIdFromQuery) {
            transactionId = transactionIdFromQuery;
            console.log('✅ Found transactionId from query params:', transactionId);
          } else {
            // Method 2: Find payment by OrderID/SessionID and get transactionId from metadata
            try {
              let payment = await this.paymentRepository.findPaymentByGatewayOrderId(
                parsedData.orderIDEncrypted || parsedData.orderId || ''
              );
              
              if (!payment && parsedData.sessionId) {
                payment = await this.paymentRepository.findPaymentByGatewaySessionId(
                  parsedData.sessionId
                );
              }
              
              if (!payment && parsedData.orderId) {
                payment = await this.paymentRepository.findPaymentByDecryptedId(
                  parsedData.orderId,
                  parsedData.sessionId
                );
              }
              
              if (payment && payment.metadata?.transactionId) {
                transactionId = payment.metadata.transactionId as string;
                console.log('✅ Found transactionId from payment record:', transactionId);
              }
            } catch (paymentError) {
              console.error('❌ Error finding payment for transactionId:', paymentError);
            }
          }
          
          // Method 3: If payment record not found, try to find transactionId from CreateOrder logs
          if (!transactionId) {
            try {
              const createOrderLogs = await this.transactionLogRepository.getLogsByOrderAndSession(
                parsedData.orderIDEncrypted || parsedData.orderId || '',
                parsedData.sessionId || ''
              );
              
              // Look for CREATE_ORDER_REQUEST or CREATE_ORDER_RESPONSE logs
              const createOrderLog = createOrderLogs.find(
                log => log.type === 'CREATE_ORDER_REQUEST' || log.type === 'CREATE_ORDER_RESPONSE'
              );
              
              if (createOrderLog && createOrderLog.transactionId) {
                transactionId = createOrderLog.transactionId;
                console.log('✅ Found transactionId from CreateOrder logs:', transactionId);
              }
            } catch (logError) {
              console.error('❌ Error searching transaction logs for transactionId:', logError);
            }
          }
          
          // If still no transactionId found, generate a new one (fallback)
          if (!transactionId) {
            transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.warn('⚠️ No transactionId found, generated new one:', transactionId);
            console.warn('   This will create unlinked logs!');
          }

          // Log payment XML (this is log #3)
          console.log('📝 Logging PAYMENT_XML (decline callback)...');
          console.log('  TransactionId:', transactionId);
          try {
            const logResult = await this.transactionLogRepository.createLog({
              transactionId,
              type: TransactionLogType.PAYMENT_XML,
              orderId: parsedData.orderId,
              sessionId: parsedData.sessionId,
              xmlData: rawXml,
              metadata: {
                callbackType: 'decline',
                source: 'bank_callback',
              },
              receivedAt: new Date(),
            });
            console.log('✅ PAYMENT_XML logged successfully:', logResult._id);
          } catch (logError) {
            console.error('❌ Failed to log PAYMENT_XML:', logError);
          }

          // Save callback to database (PAYMENT_XML - log #3)
          try {
            const callbackTransaction = await this.nabilCallbackRepository.createCallback({
              logType: NabilLogType.PAYMENT_XML,
              transactionId,
              orderId: parsedData.orderId,
              encryptedOrderId: parsedData.orderIDEncrypted || undefined,
              sessionId: parsedData.sessionId,
              amount,
              currency: parsedData.currency,
              currencyISO: parsedData.currencyISOAlpha || 'NPR',
              status: callbackStatus,
              statusDescription: parsedData.orderStatusScr || parsedData.orderStatus,
              transactionType: parsedData.transactionType || 'Purchase',
              orderDescription: parsedData.orderDescription || '',
              tranDateTime: parsedData.tranDateTime,
              bankName: parsedData.bankName || 'PSP NABIL',
              language: parsedData.language || 'EN',
              version: parsedData.version || '1.0',
              rawXml,
              receivedAt: new Date(),
            });

            console.log('✅ PAYMENT_XML saved to nabilcallbacks:', callbackTransaction._id);
          } catch (dbError) {
            console.error('❌ Failed to save PAYMENT_XML to nabilcallbacks:', dbError);
            // Continue - still return OK to bank even if DB save fails
          }

          // Call GetOrderStatus immediately after callback.
          // Await to ensure logs are written before serverless freeze.
          if (parsedData.orderIDEncrypted || parsedData.orderId) {
            try {
              console.log('🔄 Calling GetOrderStatus for decline callback...');
              await this.callGetOrderStatusAsync(
                parsedData.orderIDEncrypted || parsedData.orderId,
                parsedData.sessionId,
                transactionId
              );
              console.log('✅ GetOrderStatus completed for decline callback');
            } catch (error) {
              console.error('❌ GetOrderStatus error (decline callback):', error);
              // Do not rethrow – still return OK to bank
            }
          } else {
            console.warn('⚠️ Cannot call GetOrderStatus - missing OrderID/SessionID');
          }
          
          // Summary: Verify all logs were created
          console.log('========================================');
          console.log('CALLBACK PROCESSING SUMMARY');
          console.log('========================================');
          console.log('TransactionId:', transactionId);
          console.log('OrderId:', parsedData.orderId);
          console.log('SessionId:', parsedData.sessionId);
          console.log('');
          console.log('📋 Expected 5 logs for this transaction:');
          console.log('   1. ✅ CREATE_ORDER_REQUEST (logged during checkout)');
          console.log('   2. ✅ CREATE_ORDER_RESPONSE (logged during checkout)');
          console.log('   3. ✅ PAYMENT_XML (just logged above)');
          console.log('   4. ⏳ GET_ORDER_STATUS_REQUEST (will be logged next)');
          console.log('   5. ⏳ GET_ORDER_STATUS_RESPONSE (will be logged next)');
          console.log('');
          console.log('All 5 logs are stored SEPARATELY in transactionlogs collection');
          console.log('Each log has its own document with unique _id');
          console.log('========================================');
          console.log('Expected logs:');
          console.log('  1. CREATE_ORDER_REQUEST (from checkout)');
          console.log('  2. CREATE_ORDER_RESPONSE (from checkout)');
          console.log('  3. PAYMENT_XML (just created)');
          console.log('  4. GET_ORDER_STATUS_REQUEST (from GetOrderStatus)');
          console.log('  5. GET_ORDER_STATUS_RESPONSE (from GetOrderStatus)');
          console.log('========================================');
        } catch (xmlError) {
          console.error('❌ Failed to parse XML:', xmlError);
          // Continue - still return OK to bank even if XML parsing fails
        }
      } else {
        console.warn('⚠️ No XML data found in request body');
      }

      // Fallback: if the browser POST includes OrderID/SessionID in query/body, redirect using those.
      if (!browserRedirectUrl && this.isBrowserHtmlNavigation(req)) {
        const orderIdFromReq =
          (req.query.OrderID as string) ||
          (req.query.orderID as string) ||
          (req.query.OrderId as string) ||
          (req.query.orderId as string) ||
          (req.body?.OrderID as string) ||
          (req.body?.orderID as string) ||
          (req.body?.OrderId as string) ||
          (req.body?.orderId as string);
        const sessionIdFromReq =
          (req.query.SessionID as string) ||
          (req.query.sessionID as string) ||
          (req.query.SessionId as string) ||
          (req.query.sessionId as string) ||
          (req.body?.SessionID as string) ||
          (req.body?.sessionID as string) ||
          (req.body?.SessionId as string) ||
          (req.body?.sessionId as string);
        if (orderIdFromReq || sessionIdFromReq) {
          const qs =
            `${orderIdFromReq ? `OrderID=${encodeURIComponent(String(orderIdFromReq))}` : ''}` +
            `${orderIdFromReq && sessionIdFromReq ? '&' : ''}` +
            `${sessionIdFromReq ? `SessionID=${encodeURIComponent(String(sessionIdFromReq))}` : ''}`;
          browserRedirectUrl = `${req.baseUrl || ''}${req.path || ''}${qs ? `?${qs}` : ''}`;
        }
      }

      // If this POST was initiated by a browser, redirect to GET for a status page.
      if (browserRedirectUrl) {
        return res.redirect(303, browserRedirectUrl);
      }

      // Always return OK to bank
      res.status(200).send('OK');
    } catch (error: any) {
      console.error('Error in decline callback:', error);
      // Always return OK even on error
      res.status(200).send('OK');
    }
  };

  /**
   * Render payment result page HTML
   */
  private _renderPaymentResultPage(
    title: string,
    subtitle: string,
    isSuccess: boolean
  ): string {
    const variant: 'success' | 'declined' = isSuccess ? 'success' : 'declined';
    const dateText = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date());

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isSuccess ? 'Payment Successful' : 'Payment Failed'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif;
      background: #E9EAEC;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      color: #111827;
    }
    .phone {
      width: 390px;
      max-width: 94vw;
      background: #FFFFFF;
      border-radius: 26px;
      box-shadow: 0 18px 40px rgba(0,0,0,0.12);
      overflow: hidden;
      padding: 18px 18px 22px;
    }
    .content {
      text-align: center;
      padding: 8px 6px 0;
    }
    .status-icon {
      margin: 14px auto 12px;
      width: 64px;
      height: 64px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #1F2937;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 13px;
      color: #6B7280;
      line-height: 1.5;
      margin: 0 auto 14px;
      max-width: 280px;
    }
    .btn {
      height: 44px;
      border-radius: 6px;
      border: 1px solid transparent;
      font-size: 15px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
    }
    .btn-success { background: #4F8F3D; color: #FFFFFF; }
    .btn-outline {
      background: #FFFFFF;
      border-color: #D1D5DB;
      color: #374151;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="phone" role="main">
    <div class="content">
      <div class="status-icon" aria-hidden="true">
        ${
          variant === 'success'
            ? `<svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="22" fill="#4F8F3D"/>
                <path d="M22 33.5l6 6 15-17" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>`
            : `<svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="22" fill="#E53935"/>
                <path d="M24 24l16 16M40 24L24 40" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>
              </svg>`
        }
      </div>
      <div class="title">${this.escapeHtml(title)}</div>
      <div class="subtitle">${this.escapeHtml(subtitle)}</div>
      <div class="actions" aria-label="Actions">
        <a class="btn ${variant === 'success' ? 'btn-success' : 'btn-outline'}" href="/">${isSuccess ? 'Return to app' : 'Close'}</a>
      </div>
    </div>
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Render status page HTML
   */
  private renderStatusPage(
    res: Response,
    message: string,
    details: string,
    color: string,
    icon: string,
    transactionId?: string,
    orderStatus?: number
  ): void {
    type Variant = 'success' | 'cancelled' | 'declined' | 'generic';
    const variant: Variant =
      orderStatus === 2
        ? 'success'
        : orderStatus === 4
          ? 'cancelled'
          : orderStatus === 3
            ? 'declined'
            : 'generic';

    const amountText = 'NPR 1.00';
    const dateText = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date());

    const safeMessage = message.includes('<br>') ? message : this.escapeHtml(message);
    const safeDetails = details && details.includes('<br>') ? details : this.escapeHtml(details || '');

    const declinedReasons = PaymentController.PAYMENT_DECLINED_REASONS.map(
      (r) => `<li>${this.escapeHtml(r)}</li>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${
    variant === 'success'
      ? 'Payment Successful'
      : variant === 'cancelled'
        ? 'Payment Cancelled'
        : variant === 'declined'
          ? 'Payment Declined'
          : 'Payment Status'
  }</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, 'SF Pro Text', 'SF Pro Display', sans-serif;
      background: #E9EAEC;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      color: #111827;
    }
    .phone {
      width: 390px;
      max-width: 94vw;
      background: #FFFFFF;
      border-radius: 26px;
      box-shadow: 0 18px 40px rgba(0,0,0,0.12);
      overflow: hidden;
      padding: 18px 18px 22px;
    }
    .topbar {
      display: flex;
      align-items: center;
      height: 32px;
    }
    .back {
      width: 32px;
      height: 32px;
      border: 0;
      background: transparent;
      padding: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .content {
      text-align: center;
      padding: 8px 6px 0;
    }
    .status-icon {
      margin: 14px auto 12px;
      width: 64px;
      height: 64px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #1F2937;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 13px;
      color: #6B7280;
      line-height: 1.5;
      margin: 0 auto 14px;
      max-width: 280px;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      padding: 0;
      margin: 12px 0 14px;
      text-align: left;
      overflow: hidden;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border-top: 1px solid #EEF2F7;
      align-items: center;
    }
    .row:first-child { border-top: 0; }
    .label { font-size: 13px; color: #6B7280; font-weight: 500; }
    .value { font-size: 13px; color: #111827; font-weight: 600; text-align: right; }
    .mid-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 18px 0 14px;
      color: #374151;
      font-weight: 600;
      font-size: 14px;
    }
    .mid-divider .line {
      height: 1px;
      background: #E5E7EB;
      flex: 1;
    }
    ul.reason-list {
      list-style: disc;
      padding: 12px 28px 12px 30px;
      margin: 0;
      color: #374151;
      font-size: 13px;
      line-height: 1.7;
    }
    ul.reason-list li { margin: 6px 0; }
    .hint {
      font-size: 13px;
      color: #6B7280;
      margin: 12px 0 18px;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 6px;
      padding: 0 2px;
    }
    .btn {
      height: 44px;
      border-radius: 6px;
      border: 1px solid transparent;
      font-size: 15px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      cursor: pointer;
    }
    .btn-outline {
      background: #FFFFFF;
      border-color: #D1D5DB;
      color: #374151;
      font-weight: 600;
    }
    .btn-success { background: #4F8F3D; color: #FFFFFF; }
    .btn-cancel { background: #F28C28; color: #FFFFFF; }
    .btn-decline { background: #E53935; color: #FFFFFF; }
    .link {
      display: inline-block;
      margin-top: 8px;
      font-size: 13px;
      color: #1D4ED8;
      text-decoration: underline;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="phone" role="main">
    <div class="topbar">
      <button class="back" type="button" aria-label="Back" onclick="history.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="content">
      <div class="status-icon" aria-hidden="true">
        ${
          variant === 'success'
            ? `<svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="22" fill="#4F8F3D"/>
                <path d="M22 33.5l6 6 15-17" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>`
            : variant === 'cancelled'
              ? `<svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="22" fill="none" stroke="#F28C28" stroke-width="6"/>
                  <path d="M22 42l20-20" stroke="#F28C28" stroke-width="6" stroke-linecap="round"/>
                </svg>`
              : variant === 'declined'
                ? `<svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="22" fill="#E53935"/>
                    <path d="M24 24l16 16M40 24L24 40" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>
                  </svg>`
                : `<svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="22" fill="none" stroke="${this.escapeHtml(color)}" stroke-width="6"/>
                  </svg>`
        }
      </div>

      <div class="title">${
        variant === 'success'
          ? 'Payment Successful'
          : variant === 'cancelled'
            ? 'Payment Cancelled'
            : variant === 'declined'
              ? 'Payment Declined'
              : 'Payment Status'
      }</div>

      <div class="subtitle">${
        variant === 'success'
          ? this.escapeHtml(PaymentController.PAYMENT_SUCCESS_SUBTITLE)
          : variant === 'cancelled'
            ? this.escapeHtml(PaymentController.PAYMENT_CANCELLED_SUBTITLE)
            : variant === 'declined'
              ? this.escapeHtml(PaymentController.PAYMENT_DECLINED_SUBTITLE)
              : (safeDetails || safeMessage)
      }</div>

      ${
        variant === 'success'
          ? `<div class="card" aria-label="Transaction details">
              <div class="row"><span class="label">Amount</span><span class="value">${this.escapeHtml(amountText)}</span></div>
              <div class="row"><span class="label">Date</span><span class="value">${this.escapeHtml(dateText)}</span></div>
              <div class="row"><span class="label">Payment Method</span><span class="value">NABIL</span></div>
              <div class="row"><span class="label">Transaction ID</span><span class="value">${transactionId ? this.escapeHtml(transactionId) : '-'}</span></div>
            </div>`
          : ''
      }

      ${
        variant === 'cancelled'
          ? `<div class="mid-divider" aria-label="Cancelled reason">
              <span class="line"></span>
              <span>${this.escapeHtml(PaymentController.PAYMENT_CANCELLED_REASON)}</span>
              <span class="line"></span>
            </div>
            <div class="subtitle" style="max-width:320px;margin-bottom:18px;">${this.escapeHtml(PaymentController.PAYMENT_CANCELLED_GUIDANCE)}</div>`
          : ''
      }

      ${
        variant === 'declined'
          ? `<div class="card" aria-label="Decline reasons">
              <ul class="reason-list">
                ${declinedReasons}
              </ul>
            </div>
            <div class="hint">${this.escapeHtml(PaymentController.PAYMENT_DECLINED_GUIDANCE)}</div>`
          : ''
      }

      <div class="actions" aria-label="Actions">
        ${
          variant === 'success'
            ? `<a class="btn btn-success" href="/">Done</a>
               <a class="btn btn-outline" href="#" onclick="return false;">View Receipt</a>`
            : variant === 'cancelled'
              ? `<a class="btn btn-cancel" href="/nabil/checkout">Retry Payment</a>
                 <a class="btn btn-outline" href="/nabil/checkout">Change Payment Method</a>`
              : variant === 'declined'
                ? `<a class="btn btn-decline" href="/nabil/checkout">Try Again</a>
                   <a class="btn btn-outline" href="/nabil/checkout">Change Payment Method</a>
                   <a class="link" href="mailto:${this.escapeHtml(PaymentController.SUPPORT_EMAIL)}">Contact Support</a>`
                : `<a class="btn btn-outline" href="/nabil/checkout">Back to Checkout</a>`
        }
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  }

  /**
   * Some gateways POST-redirect users back to the callback URLs. In that case, the user will
   * see a plain "OK" response unless we redirect them to the GET status page.
   */
  private isBrowserHtmlNavigation(req: Request): boolean {
    const accept = String(req.headers.accept || '');
    const secFetchDest = req.headers['sec-fetch-dest'];
    const secFetchSite = req.headers['sec-fetch-site'];
    const userAgent = String(req.headers['user-agent'] || '');

    const hasSecFetch = typeof secFetchDest === 'string' || typeof secFetchSite === 'string';
    const wantsHtml = accept.includes('text/html');
    const looksLikeBrowser = userAgent.includes('Mozilla');

    return wantsHtml || hasSecFetch || looksLikeBrowser;
  }

  /**
   * Call GetOrderStatus asynchronously and log the result
   */
  private async callGetOrderStatusAsync(
    orderID: string,
    sessionID: string,
    transactionId: string
  ): Promise<void> {
    console.log('========================================');
    console.log('CALLING GETORDERSTATUS ASYNC');
    console.log('========================================');
    console.log('Transaction ID:', transactionId);
    console.log('OrderID:', orderID);
    console.log('SessionID:', sessionID);
    console.log('========================================');

    try {
      // Small delay before calling GetOrderStatus to give the bank time
      // to finalize the transaction state and avoid hammering the API.
      // This also reduces the chance of intermittent "No response from server"
      // if multiple requests are made in very quick succession.
      const delayMs = 3000; // 3 seconds (tuneable if needed)
      console.log(`⏱️ Waiting ${delayMs}ms before calling GetOrderStatus...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      console.log('⏱️ Delay complete, proceeding with GetOrderStatus call.');

      let decryptedOrderID = orderID;
      let decryptedSessionID = sessionID;

      // Decrypt if needed
      if (orderID && orderID.startsWith('@encrypted@')) {
        try {
          decryptedOrderID = this.nabilService.decryptNabilId(orderID);
          console.log('✅ Decrypted OrderID:', decryptedOrderID);
        } catch (decryptError: any) {
          console.error('❌ Failed to decrypt OrderID:', decryptError.message);
          throw new Error(`Failed to decrypt OrderID: ${decryptError.message}`);
        }
      }
      if (sessionID && sessionID.startsWith('@encrypted@')) {
        try {
          decryptedSessionID = this.nabilService.decryptNabilId(sessionID);
          console.log('✅ Decrypted SessionID:', decryptedSessionID);
        } catch (decryptError: any) {
          console.error('❌ Failed to decrypt SessionID:', decryptError.message);
          throw new Error(`Failed to decrypt SessionID: ${decryptError.message}`);
        }
      }

      // Build XML request (matching Nabil Bank format)
      const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
<Request>
<Operation>GetOrderStatus</Operation>
<Language>EN</Language>
<Order>
<Merchant>NABIL106809</Merchant>
${decryptedOrderID ? `<OrderID>${decryptedOrderID}</OrderID>` : ''}
</Order>
${decryptedSessionID ? `<SessionID>${decryptedSessionID}</SessionID>` : ''}
</Request>
</TKKPG>`;

      // Log request
      console.log('📝 Logging GET_ORDER_STATUS_REQUEST...');
      try {
        await this.transactionLogRepository.createLog({
          transactionId,
          type: TransactionLogType.GET_ORDER_STATUS_REQUEST,
          orderId: orderID,
          sessionId: sessionID,
          xmlData: xmlRequest,
          metadata: {
            decryptedOrderID,
            decryptedSessionID,
          },
          receivedAt: new Date(),
        });
        console.log('✅ GET_ORDER_STATUS_REQUEST logged successfully');
      } catch (logError: any) {
        console.error('❌ Failed to log GET_ORDER_STATUS_REQUEST:', logError);
        // Continue - don't fail the whole operation if logging fails
      }

      // Save GET_ORDER_STATUS_REQUEST to nabilcallbacks table
      try {
        await this.nabilCallbackRepository.createCallback({
          logType: NabilLogType.GET_ORDER_STATUS_REQUEST,
          transactionId,
          orderId: orderID,
          sessionId: sessionID,
          encryptedOrderId: orderID,
          rawXml: xmlRequest,
          receivedAt: new Date(),
        });
        console.log('✅ GET_ORDER_STATUS_REQUEST saved to nabilcallbacks');
      } catch (dbError) {
        console.error('❌ Failed to save GET_ORDER_STATUS_REQUEST to nabilcallbacks:', dbError);
      }

      // Call GetOrderStatus
      console.log('🔄 Calling NabilService.getOrderStatus...');
      let statusResponse: any;
      try {
        statusResponse = await this.nabilService.getOrderStatus({
          orderID: decryptedOrderID,
          sessionID: decryptedSessionID,
        });
        console.log('✅ GetOrderStatus response received:', JSON.stringify(statusResponse, null, 2));
      } catch (getStatusError: any) {
        console.error('❌ GetOrderStatus API call failed:', getStatusError.message);
        console.error('Stack:', getStatusError.stack);

        // Always create a synthetic response so that GET_ORDER_STATUS_RESPONSE
        // log is still written even when the API call fails.
        statusResponse = {
          status: 'ERROR',
          orderID: decryptedOrderID || orderID,
          sessionID: decryptedSessionID || sessionID,
          orderStatus: `ERROR: ${getStatusError.message}`,
          responseCode: undefined,
        };
      }

      // Build XML response
      const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
  <Response>
    <Status>${statusResponse.status}</Status>
    <Order>
      <OrderID>${statusResponse.orderID}</OrderID>
      <SessionID>${statusResponse.sessionID}</SessionID>
      <OrderStatus>${statusResponse.orderStatus}</OrderStatus>
      ${statusResponse.responseCode ? `<ResponseCode>${statusResponse.responseCode}</ResponseCode>` : ''}
    </Order>
  </Response>
</TKKPG>`;

      // Update payment and order status based on GetOrderStatus response
      // OrderStatus 2 = Approved, 3 = Declined, 4 = Cancelled
      const orderStatusCode = Number(statusResponse.orderStatus);
      if (orderStatusCode === 2) {
        // Payment approved - update payment and order status
        try {
          // Find payment by OrderID or SessionID
          let payment = await this.paymentRepository.findPaymentByGatewayOrderId(
            orderID
          );
          
          if (!payment && sessionID) {
            payment = await this.paymentRepository.findPaymentByGatewaySessionId(
              sessionID
            );
          }

          // Also try finding by decrypted IDs stored in metadata
          if (!payment) {
            payment = await this.paymentRepository.findPaymentByDecryptedId(
              decryptedOrderID,
              decryptedSessionID
            );
          }

          if (payment) {
            // Update payment status to SUCCESS
            const updatedPayment = await this.paymentRepository.updatePayment(
              payment._id.toString(),
              {
                status: PaymentStatus.SUCCESS,
                gatewayPaymentId: statusResponse.responseCode || payment.gatewayPaymentId,
                receipt: `receipt_${statusResponse.orderID || payment.gatewayOrderId}`,
              }
            );

            console.log('✅ Payment status updated to SUCCESS:', payment._id.toString());

            // Update order status to CONFIRMED if payment has an order
            if (updatedPayment && updatedPayment.orderId) {
              await this.paymentRepository.updateOrder(
                updatedPayment.orderId.toString(),
                {
                  status: OrderStatus.CONFIRMED,
                }
              );
              console.log('✅ Order status updated to CONFIRMED:', updatedPayment.orderId.toString());
              // Unlock call/chat service for jyotish_service payments
              if (updatedPayment.paymentType === PaymentType.JYOTISH_SERVICE) {
                await this.paymentService.grantServiceAccessForPayment(updatedPayment);
              }
            }

            // Update booking if payment has a booking
            if (updatedPayment && updatedPayment.bookingId) {
              await this.jyotishRepository.updateBooking(
                updatedPayment.bookingId.toString(),
                {
                  paid: true,
                }
              );
              console.log('✅ Booking marked as paid:', updatedPayment.bookingId.toString());
            }
          } else {
            console.warn('⚠️ Payment not found for OrderID:', orderID, 'SessionID:', sessionID);
          }
        } catch (updateError: any) {
          console.error('❌ Failed to update payment/order status:', updateError);
          // Don't throw - continue with logging
        }
      } else if (orderStatusCode === 3 || orderStatusCode === 4) {
        // Payment declined or cancelled
        try {
          let payment = await this.paymentRepository.findPaymentByGatewayOrderId(orderID);
          if (!payment && sessionID) {
            payment = await this.paymentRepository.findPaymentByGatewaySessionId(sessionID);
          }
          if (!payment) {
            payment = await this.paymentRepository.findPaymentByDecryptedId(
              decryptedOrderID,
              decryptedSessionID
            );
          }

          if (payment) {
            await this.paymentRepository.updatePayment(payment._id.toString(), {
              status: orderStatusCode === 3 ? PaymentStatus.FAILED : PaymentStatus.CANCELLED,
            });
            console.log(`✅ Payment status updated to ${orderStatusCode === 3 ? 'FAILED' : 'CANCELLED'}`);
          }
        } catch (updateError: any) {
          console.error('❌ Failed to update payment status:', updateError);
        }
      }

      // Log response
      console.log('📝 Logging GET_ORDER_STATUS_RESPONSE...');
      try {
        await this.transactionLogRepository.createLog({
          transactionId,
          type: TransactionLogType.GET_ORDER_STATUS_RESPONSE,
          orderId: statusResponse.orderID || orderID,
          sessionId: statusResponse.sessionID || sessionID,
          xmlData: xmlResponse,
          metadata: {
            orderStatus: statusResponse.orderStatus,
            responseCode: statusResponse.responseCode,
            status: statusResponse.status,
          },
          receivedAt: new Date(),
        });
        console.log('✅ GET_ORDER_STATUS_RESPONSE logged successfully');
      } catch (logError: any) {
        console.error('❌ Failed to log GET_ORDER_STATUS_RESPONSE:', logError);
      }

      // Save GET_ORDER_STATUS_RESPONSE to nabilcallbacks table
      try {
        await this.nabilCallbackRepository.createCallback({
          logType: NabilLogType.GET_ORDER_STATUS_RESPONSE,
          transactionId,
          orderId: statusResponse.orderID || orderID,
          sessionId: statusResponse.sessionID || sessionID,
          encryptedOrderId: statusResponse.orderID || orderID,
          rawXml: xmlResponse,
          receivedAt: new Date(),
        });
        console.log('✅ GET_ORDER_STATUS_RESPONSE saved to nabilcallbacks');
      } catch (dbError) {
        console.error('❌ Failed to save GET_ORDER_STATUS_RESPONSE to nabilcallbacks:', dbError);
      }
        
      // Final verification: All 5 logs should now be in database
      console.log('========================================');
      console.log('GETORDERSTATUS COMPLETED - ALL 5 LOGS STORED');
      console.log('========================================');
      console.log('TransactionId:', transactionId);
      console.log('');
      console.log('📋 ALL 5 LOGS ARE NOW STORED SEPARATELY:');
      console.log('   1. ✅ CREATE_ORDER_REQUEST - Separate document');
      console.log('   2. ✅ CREATE_ORDER_RESPONSE - Separate document');
      console.log('   3. ✅ PAYMENT_XML - Separate document');
      console.log('   4. ✅ GET_ORDER_STATUS_REQUEST - Separate document');
      console.log('   5. ✅ GET_ORDER_STATUS_RESPONSE - Separate document');
      console.log('');
      console.log('Each log is a SEPARATE document in transactionlogs collection');
      console.log('All logs share the same transactionId for linking');
      console.log('========================================');
    } catch (error: any) {
      console.error('========================================');
      console.error('ERROR IN CALLGETORDERSTATUSASYNC');
      console.error('========================================');
      console.error('Transaction ID:', transactionId);
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('========================================');

      // Log error - wrap in try-catch to ensure we don't fail silently
      try {
        await this.transactionLogRepository.createLog({
          transactionId,
          type: TransactionLogType.ERROR,
          orderId: orderID,
          sessionId: sessionID,
          errorMessage: error.message || 'GetOrderStatus failed',
          metadata: {
            error: error.toString(),
            stack: error.stack,
            errorName: error.name,
          },
          receivedAt: new Date(),
        });
        console.log('✅ ERROR log created successfully');
      } catch (errorLogError: any) {
        console.error('❌ CRITICAL: Failed to log error:', errorLogError);
        // Last resort - at least log to console
        console.error('Original error that could not be logged:', error);
      }
      // Don't re-throw - this is async and we don't want to crash the callback handler
    }
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

}

