
# Spiritual Services Backend

Production-level Node.js backend with N-tier architecture for a spiritual services platform.

## Features

- ✅ User Management (User, Healer, Jyotish, Pujari, Admin roles)
- ✅ Authentication & Authorization (JWT, OTP verification)
- ✅ E-commerce (Products, Reviews)
- ✅ Healing Services (Listings, Packages, Reviews)
- ✅ Puja Services (Listings, Packages, Reviews)
- ✅ Jyotish Booking System (Calls, Chats, Notes)
- ✅ Payment System Integration
- ✅ Notification System (Daily Forecasts, Push Notifications)
- ✅ Admin Panel (Full CRUD access)
- ⏳ Kundali Generation (To be added later)

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **Validation:** Zod
- **Push Notifications:** FCM, OneSignal

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/spiritual_services
JWT_PRIVATE_KEY=<PEM-private-key>
JWT_PUBLIC_KEY=<PEM-public-key>
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Server
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Project Structure

```
src/
├── config/          # Configuration (database, env, logger)
├── controllers/     # Presentation layer
├── services/        # Business logic layer
├── repositories/    # Data access layer
├── models/          # Mongoose schemas
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── types/           # TypeScript types
├── validators/      # Request validation schemas
├── errors/          # Custom error classes
└── routes/          # Route definitions
```

## API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register user
- `POST /api/v1/users/verify-otp` - Verify OTP
- `POST /api/v1/users/login` - Login
- `GET /api/v1/users/profile` - Get profile
- `PUT /api/v1/users/profile` - Update profile

### Products
- `GET /api/v1/products` - Get all products
- `POST /api/v1/products` - Create product (Admin)
- `GET /api/v1/products/:id` - Get product
- `POST /api/v1/products/:id/reviews` - Create review

### Healing Services
- `GET /api/v1/healing/listings` - Get listings
- `POST /api/v1/healing/listings` - Create listing (Healer/Admin)
- `GET /api/v1/healing/packages` - Get packages

### Puja Services
- `GET /api/v1/puja/listings` - Get listings
- `POST /api/v1/puja/listings` - Create listing (Pujari/Admin)
- `GET /api/v1/puja/packages` - Get packages

### Jyotish
- `POST /api/v1/jyotish/bookings` - Create booking
- `POST /api/v1/jyotish/bookings/:id/messages` - Send message
- `POST /api/v1/jyotish/bookings/:id/calls` - Start call

### Payments
- `POST /api/v1/payments/products` - Create product payment
- `POST /api/v1/payments/services/:type` - Create service payment
- `GET /api/v1/payments/payments` - Get user payments

### Notifications
- `GET /api/v1/forecasts/today` - Get today's forecast
- `GET /api/v1/notifications` - Get notifications
- `GET /api/v1/preferences` - Get preferences
- `PUT /api/v1/preferences` - Update preferences

### Admin
- `GET /api/v1/admin/dashboard/stats` - Dashboard stats
- `GET /api/v1/admin/users` - Get all users
- `POST /api/v1/admin/users` - Create user

## Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing instructions.

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Environment Variables

See `.env.example` for all available environment variables.

## License

ISC












