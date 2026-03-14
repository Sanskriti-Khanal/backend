import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import connectDatabase from '@config/database';
import env from '@config/env';
import { errorHandler, notFoundHandler } from '@middleware/error.middleware';
import { PaymentController } from '@controllers/payment.controller';
import userRoutes from '@routes/user.routes';
import productRoutes from '@routes/product.routes';
import healingRoutes from '@routes/healing.routes';
import pujaRoutes from '@routes/puja.routes';
import jyotishRoutes from '@routes/jyotish.routes';
import adminRoutes from '@routes/admin.routes';
import paymentRoutes from '@routes/payment.routes';
import notificationRoutes from '@routes/notification.routes';
import uploadRoutes from '@routes/upload.routes';
import rudrakshaCategoryRoutes from '@routes/rudraksha-category.routes';
import gemCategoryRoutes from '@routes/gem-category.routes';
import transactionLogRoutes from '@routes/transaction-log.routes';
import healthRoutes from '@routes/health.routes';
import productEnquiryRoutes from '@routes/product-enquiry.routes';
import astrologyRoutes from '@routes/astrology.routes';
import { apiLimiter } from '@middleware/rateLimit.middleware';
import { sanitizeInput } from '@middleware/sanitize.middleware';
import { validate } from '@middleware/validation.middleware';
import { khaltiCallbackSchema } from '@validators/payment.validator';
import logger from '@utils/logger';
import { initSentry, sentryRequestHandler, sentryErrorHandler } from '@config/sentry';

const paymentController = new PaymentController();

const app = express();

// Trust proxy - required for Vercel/serverless environments
// This allows Express to correctly identify client IPs and handle X-Forwarded-* headers
app.set('trust proxy', true);

// Initialize Sentry before other middleware
initSentry(app);
sentryRequestHandler(app);

// Configure helmet - disable CSP for checkout page (we'll set it manually in the controller)
app.use((req, res, next) => {
  const path = req.path || req.url || '';
  const isCheckoutPage = path === '/nabil/checkout' || path === '/api/v1/payments/nabil/checkout';

  if (isCheckoutPage) {
    // For checkout page, disable CSP (we'll set a permissive CSP in the controller)
    helmet({
      contentSecurityPolicy: false, // Disable default CSP for checkout page
    })(req, res, next);
  } else {
    // For all other routes, use default helmet (strict CSP)
    helmet()(req, res, next);
  }
});

// CORS configuration - support multiple origins
const allowedOrigins = env.CORS_ORIGIN.split(',').map(origin => origin.trim());

// Conditional CORS middleware - payment callbacks get permissive CORS
app.use((req, res, next) => {
  const path = req.path || req.url || '';
  const isPaymentCallback =
    path.startsWith('/api/v1/payments/nabil/approve') ||
    path.startsWith('/api/v1/payments/nabil/cancel') ||
    path.startsWith('/api/v1/payments/nabil/decline') ||
    path.startsWith('/api/v1/payments/nabil/callback') ||
    path.startsWith('/api/v1/payments/nabil/checkout') ||
    path.startsWith('/api/v1/payments/khalti/callback') ||
    path.startsWith('/api/v1/payments/webhook') ||
    path === '/nabil/checkout';

  if (isPaymentCallback) {
    // Apply permissive CORS for payment callbacks (allow all origins)
    return cors({ origin: true })(req, res, next);
  } else {
    // Apply restrictive CORS for other routes
    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    })(req, res, next);
  }
});
app.use(compression());

// Form data parser for Nabil Bank callbacks (bank sends xmlmsg as form data)
// Must be before json parser to handle application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(express.json({ limit: '10mb' }));

// Input sanitization - apply after body parsing
app.use(sanitizeInput);

// Rate limiting - apply to all routes
app.use('/api/v1', apiLimiter);

// Serve static files (for checkout.html)
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploads directory for user avatars and other uploaded files
const uploadsDir = path.join(__dirname, '../uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir));
}

// Root route and health check - should work without database
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MeroSathi Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      documentation: 'See API documentation for available endpoints'
    }
  });
});

// Health check routes
app.use('/api/v1/health', healthRoutes);
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Serve checkout.js file (external JavaScript to avoid CSP issues)
app.get('/checkout.js', async (req, res, next) => {
  try {
    const possiblePaths = [
      path.join(__dirname, '../public/checkout.js'),
      path.join(process.cwd(), 'src/public/checkout.js'),
      path.join(process.cwd(), 'backend/src/public/checkout.js'),
      path.join(__dirname, '../../public/checkout.js'),
    ];

    let jsPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        jsPath = possiblePath;
        break;
      }
    }

    if (jsPath) {
      const jsContent = fs.readFileSync(jsPath, 'utf-8');
      res.setHeader('Content-Type', 'application/javascript');
      res.send(jsContent);
    } else {
      res.status(404).send('// checkout.js not found');
    }
  } catch (error) {
    next(error);
  }
});

// Root-level checkout page route (https://api.merosathi.co/nabil/checkout)
app.get('/nabil/checkout', async (req, res, next) => {
  console.log(`✅ ROOT CHECKOUT PAGE ROUTE HIT (${req.method}) - Public route, no auth required`);
  try {
    await paymentController.serveCheckoutPage(req, res, next);
  } catch (error) {
    next(error);
  }
});

app.post('/nabil/checkout', async (req, res, next) => {
  console.log(`✅ ROOT CHECKOUT PROCESS ROUTE HIT (${req.method}) - Public route, no auth required`);
  try {
    await paymentController.processCheckout(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Database connection handler for serverless environments
let isDatabaseConnected = false;
const ensureDatabaseConnection = async () => {
  if (!isDatabaseConnected) {
    try {
      await connectDatabase();
      isDatabaseConnected = true;
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }
};

// Middleware to ensure database connection on each request (for serverless)
// Place after health/root routes so they work even if DB is down
app.use(async (req, res, next) => {
  // Skip database connection for health check, root, and GET checkout page (static HTML)
  const skipDatabase =
    req.path === '/health' ||
    req.path === '/' ||
    (req.path === '/api/v1/payments/nabil/checkout' && req.method === 'GET') ||
    (req.path === '/nabil/checkout' && req.method === 'GET');

  if (skipDatabase) {
    return next();
  }

  // For payment callbacks and checkout POST, try to connect but don't fail if DB is down
  // (they need DB to save callback data, but should still work if DB fails)
  const isPaymentCallback =
    req.path.startsWith('/api/v1/payments/nabil/approve') ||
    req.path.startsWith('/api/v1/payments/nabil/cancel') ||
    req.path.startsWith('/api/v1/payments/nabil/decline') ||
    req.path.startsWith('/api/v1/payments/nabil/callback') ||
    req.path.startsWith('/api/v1/payments/khalti/callback') ||
    (req.path.startsWith('/api/v1/payments/nabil/checkout') && req.method === 'POST') ||
    (req.path === '/nabil/checkout' && req.method === 'POST');

  try {
    await ensureDatabaseConnection();
    next();
  } catch (error) {
    // For payment callbacks, continue even if DB fails (they'll handle it in the controller)
    if (isPaymentCallback) {
      console.warn('Database connection failed for payment callback, continuing anyway:', error);
      next();
    } else {
      next(error);
    }
  }
});

// Khalti callback: public route (no auth) - must be before payment router so browser redirect never hits authenticate
app.get(
  '/api/v1/payments/khalti/callback',
  validate(khaltiCallbackSchema),
  (req, res, next) => paymentController.handleKhaltiCallback(req, res, next)
);

// API routes
// IMPORTANT: Mount payment routes BEFORE notificationRoutes to ensure checkout route is accessible
// notificationRoutes is mounted at /api/v1 (parent path) and could intercept requests
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/product-enquiries', productEnquiryRoutes);
app.use('/api/v1/healing', healingRoutes);
app.use('/api/v1/puja', pujaRoutes);
app.use('/api/v1/jyotish', jyotishRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes); // Must be before /api/v1 to avoid route conflicts
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/rudraksha-categories', rudrakshaCategoryRoutes);
app.use('/api/v1/gem-categories', gemCategoryRoutes);
app.use('/api/v1/transaction-logs', transactionLogRoutes); // Must be before notificationRoutes to avoid auth
app.use('/api/v1/astrology', astrologyRoutes);
app.use('/api/v1', notificationRoutes); // Mounted last to avoid intercepting specific routes

// Error handling - must be last
app.use(notFoundHandler);
// Sentry error handler must be before your error handler
sentryErrorHandler(app);
app.use(errorHandler);

// Start server only in non-serverless environments
// Vercel sets VERCEL environment variable, and we should not call app.listen()
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const isServerless = isVercel || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isServerless) {
  const startServer = async () => {
    await connectDatabase();
    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
    });
  };
  startServer();
}

export default app;

