# Nabil Bank EPG Integration - Complete Implementation Guide

## Overview

This document describes the complete Nabil Bank EPG (Electronic Payment Gateway) integration for browser-based test payments, hosted on Vercel.

**Base URL:** `https://api.merosathi.co`

## Architecture

### Technology Stack
- **Runtime:** Node.js + TypeScript
- **Hosting:** Vercel (Serverless Functions)
- **Database:** MongoDB (for transaction logs)
- **Framework:** Express.js

### Folder Structure

```
backend/
├── api/
│   └── index.js                 # Vercel serverless entry point
├── src/
│   ├── controllers/
│   │   └── payment.controller.ts    # Payment & callback handlers
│   ├── services/
│   │   └── nabil.service.ts         # Nabil Bank API client
│   ├── repositories/
│   │   └── transaction-log.repository.ts  # Log storage
│   ├── models/
│   │   └── TransactionLog.model.ts        # Log schema
│   ├── routes/
│   │   └── payment.routes.ts        # API routes
│   ├── public/
│   │   └── checkout.html           # Checkout page
│   └── app.ts                      # Express app setup
├── vercel.json                     # Vercel configuration
└── package.json
```

## End-to-End Payment Flow

### Step 1: User Initiates Payment

**URL:** `GET https://api.merosathi.co/nabil/checkout`

**Response:** HTML checkout page with form to collect:
- Card Number
- Expiry Date (MM/YY)
- CVV

**Note:** Card details are collected for testing purposes. The actual payment is processed on Nabil Bank's secure page.

### Step 2: Create Order Request

**User Action:** Submits checkout form

**API Call:** `POST https://api.merosathi.co/api/v1/payments/nabil/checkout`

**Request Body:**
```json
{
  "cardNumber": "1234567890123456",
  "expiry": "12/25",
  "cvv": "123"
}
```

**Backend Process:**
1. Generate unique `transactionId`
2. Build CreateOrder XML request
3. **Log CreateOrder Request** to database
4. Call Nabil Bank API: `POST https://api.compassplus.com:11611/Exec`
5. Receive response with `OrderID`, `SessionID`, and payment `URL`
6. **Log CreateOrder Response** to database
7. Return payment URL to frontend

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://api.compassplus.com:11612/flex?OrderID=@encrypted@1@...&SessionID=@encrypted@1@...",
    "transactionId": "TXN_1234567890_abc123",
    "orderID": "@encrypted@1@...",
    "sessionID": "@encrypted@1@..."
  },
  "message": "Order created successfully"
}
```

### Step 3: Redirect to Bank Payment Page

**Frontend Action:** `window.location.href = paymentUrl`

**User Action:** Enters card details on Nabil Bank's secure page and completes payment

### Step 4: Bank Processes Payment

Nabil Bank processes the payment and sends XML callback to one of:
- `/api/v1/payments/nabil/approve` (if approved)
- `/api/v1/payments/nabil/decline` (if declined)
- `/api/v1/payments/nabil/cancel` (if cancelled)

### Step 5: Callback Handler Processing

**Callback Request Format:**
```
POST /api/v1/payments/nabil/approve
Content-Type: application/x-www-form-urlencoded

xmlmsg=<?xml version="1.0"?><Message>...</Message>
```

**Backend Process:**
1. Extract XML from `req.body.xmlmsg`
2. Parse XML using `nabilService.parseCallbackXml()`
3. **Log Payment XML (xmlout)** to database
4. Save callback data to `NabilCallback` collection
5. **Immediately call GetOrderStatus** (async, non-blocking)
6. **Log GetOrderStatus Request** to database
7. **Log GetOrderStatus Response** to database
8. Return `200 OK` to bank

### Step 6: GetOrderStatus Call

**Triggered:** Immediately after receiving callback (async)

**API Call:** `POST https://api.compassplus.com:11611/Exec`

**Request XML:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
  <Request>
    <Operation>GetOrderStatus</Operation>
    <Language>EN</Language>
    <Order>
      <Merchant>NABIL106809</Merchant>
      <OrderID>DECRYPTED_ORDER_ID</OrderID>
    </Order>
    <SessionID>DECRYPTED_SESSION_ID</SessionID>
  </Request>
</TKKPG>
```

**Response XML:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
  <Response>
    <Status>00</Status>
    <Order>
      <OrderID>...</OrderID>
      <SessionID>...</SessionID>
      <OrderStatus>2</OrderStatus>
      <ResponseCode>...</ResponseCode>
    </Order>
  </Response>
</TKKPG>
```

**OrderStatus Values:**
- `2` = Approved
- `3` = Declined
- `4` = Cancelled

## API Endpoints

### Public Endpoints (No Authentication)

#### 1. Checkout Page
```
GET /nabil/checkout
```
Returns HTML checkout page.

#### 2. Process Checkout
```
POST /nabil/checkout
POST /api/v1/payments/nabil/checkout
```
Creates order with Nabil Bank and returns payment URL.

**Request:**
```json
{
  "cardNumber": "1234567890123456",
  "expiry": "12/25",
  "cvv": "123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://api.compassplus.com:11612/flex?OrderID=...&SessionID=...",
    "transactionId": "TXN_...",
    "orderID": "@encrypted@1@...",
    "sessionID": "@encrypted@1@..."
  }
}
```

#### 3. Payment Callbacks (Bank → Server)
```
POST /api/v1/payments/nabil/approve
POST /api/v1/payments/nabil/decline
POST /api/v1/payments/nabil/cancel
```

**Request Format:**
```
Content-Type: application/x-www-form-urlencoded

xmlmsg=<?xml version="1.0"?><Message date="...">...</Message>
```

**Response:** `200 OK` (always, even on errors)

## Transaction Logging

### Log Storage Schema (MongoDB)

**Collection:** `transactionlogs`

**Schema:**
```typescript
{
  transactionId: string;      // Unique per transaction
  type: TransactionLogType;    // Log type enum
  orderId?: string;           // Bank OrderID
  sessionId?: string;         // Bank SessionID
  xmlData?: string;           // Full XML request/response
  metadata?: object;           // Additional data
  errorMessage?: string;       // Error if type is ERROR
  receivedAt: Date;           // Timestamp
  createdAt: Date;
  updatedAt: Date;
}
```

### Required Logs Per Transaction

#### 1. CreateOrder Request
```typescript
{
  transactionId: "TXN_...",
  type: "CREATE_ORDER_REQUEST",
  xmlData: "<?xml version=\"1.0\"?>...",  // Full XML request
  metadata: {
    amount: 1,
    amountInPaisa: 100,
    currency: 524,
    description: "Test Payment NPR 1",
    callbackUrls: {...},
    cardDetails: {...}  // Masked card info
  }
}
```

#### 2. CreateOrder Response
```typescript
{
  transactionId: "TXN_...",
  type: "CREATE_ORDER_RESPONSE",
  orderId: "@encrypted@1@...",
  sessionId: "@encrypted@1@...",
  xmlData: "<?xml version=\"1.0\"?>...",  // Full XML response
  metadata: {
    decryptedOrderID: "...",
    decryptedSessionID: "...",
    paymentUrl: "https://api.compassplus.com:11612/flex?..."
  }
}
```

#### 3. Payment XML (xmlout)
```typescript
{
  transactionId: "TXN_...",
  type: "PAYMENT_XML",
  orderId: "...",
  sessionId: "...",
  xmlData: "<?xml version=\"1.0\"?><Message>...</Message>",  // Raw XML from bank
  metadata: {
    callbackType: "approve" | "cancel" | "decline",
    source: "bank_callback"
  }
}
```

#### 4. GetOrderStatus Request
```typescript
{
  transactionId: "TXN_...",
  type: "GET_ORDER_STATUS_REQUEST",
  orderId: "...",
  sessionId: "...",
  xmlData: "<?xml version=\"1.0\"?>...",  // Full XML request
  metadata: {
    decryptedOrderID: "...",
    decryptedSessionID: "..."
  }
}
```

#### 5. GetOrderStatus Response
```typescript
{
  transactionId: "TXN_...",
  type: "GET_ORDER_STATUS_RESPONSE",
  orderId: "...",
  sessionId: "...",
  xmlData: "<?xml version=\"1.0\"?>...",  // Full XML response
  metadata: {
    orderStatus: 2,  // 2=Approved, 3=Declined, 4=Cancelled
    responseCode: "..."
  }
}
```

### Querying Logs

**By Transaction ID:**
```javascript
db.transactionlogs.find({ transactionId: "TXN_..." }).sort({ receivedAt: 1 })
```

**By Order ID:**
```javascript
db.transactionlogs.find({ orderId: "..." }).sort({ receivedAt: 1 })
```

**By Session ID:**
```javascript
db.transactionlogs.find({ sessionId: "..." }).sort({ receivedAt: 1 })
```

**By Type:**
```javascript
db.transactionlogs.find({ type: "CREATE_ORDER_REQUEST" }).sort({ receivedAt: -1 })
```

## XML Parsing Example

### Parsing Bank Callback XML

**Raw XML from Bank:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Message date="2024-01-15 10:30:00">
  <Version>1.0</Version>
  <OrderID>123456789</OrderID>
  <SessionId>987654321</SessionId>
  <OrderStatus>APPROVED</OrderStatus>
  <PurchaseAmount>100</PurchaseAmount>
  <TotalAmount>100</TotalAmount>
  <Currency>524</Currency>
  <TranDateTime>2024-01-15 10:30:00</TranDateTime>
  <OrderIDEncrypted>@encrypted@1@ABC123...</OrderIDEncrypted>
  <OrderDescription>Test Payment</OrderDescription>
  <TransactionType>Purchase</TransactionType>
  <Language>EN</Language>
  <BankName>PSP NABIL</BankName>
  <CurrencyISOAlpha>NPR</CurrencyISOAlpha>
  <OrderStatusScr>Approved</OrderStatusScr>
</Message>
```

**Parsing Code:**
```typescript
const parsedData = await nabilService.parseCallbackXml(rawXml);

// Returns:
{
  orderId: "123456789",
  sessionId: "987654321",
  orderStatus: "APPROVED",
  purchaseAmount: 100,
  totalAmount: 100,
  currency: "524",
  tranDateTime: "2024-01-15 10:30:00",
  orderIDEncrypted: "@encrypted@1@ABC123...",
  orderDescription: "Test Payment",
  transactionType: "Purchase",
  language: "EN",
  version: "1.0",
  bankName: "PSP NABIL",
  currencyISOAlpha: "NPR",
  orderStatusScr: "Approved"
}
```

## Environment Variables

Required environment variables in Vercel:

```bash
# Base URL for callbacks
BASE_URL=https://api.merosathi.co

# Database
MONGODB_URI=mongodb://...

# CORS
CORS_ORIGIN=https://api.merosathi.co,https://merosathi.co

# Optional: Explicit callback URLs
NABIL_APPROVE_URL=https://api.merosathi.co/api/v1/payments/nabil/approve
NABIL_CANCEL_URL=https://api.merosathi.co/api/v1/payments/nabil/cancel
NABIL_DECLINE_URL=https://api.merosathi.co/api/v1/payments/nabil/decline
```

## Testing Flow

### 1. Access Checkout Page
```
https://api.merosathi.co/nabil/checkout
```

### 2. Enter Test Card Details
- **Card Number:** Use test card from Nabil Bank
- **Expiry:** Any future date (MM/YY)
- **CVV:** Any 3-4 digits

### 3. Click "Pay NPR 1.00"
- Creates order with bank
- Redirects to bank's payment page
- Enter card details on bank's page
- Complete payment

### 4. Verify Logs
Query MongoDB to see all transaction logs:
```javascript
// Get all logs for a transaction
db.transactionlogs.find({ transactionId: "TXN_..." }).sort({ receivedAt: 1 })

// Verify all 5 required logs exist:
// 1. CREATE_ORDER_REQUEST
// 2. CREATE_ORDER_RESPONSE
// 3. PAYMENT_XML
// 4. GET_ORDER_STATUS_REQUEST
// 5. GET_ORDER_STATUS_RESPONSE
```

## Key Implementation Details

### 1. Immediate GetOrderStatus Call
After receiving callback, `callGetOrderStatusAsync()` is called immediately (async, non-blocking):
```typescript
// In callback handler
this.callGetOrderStatusAsync(
  parsedData.orderIDEncrypted || parsedData.orderId,
  parsedData.sessionId,
  transactionId
).catch((error) => {
  console.error('❌ GetOrderStatus error:', error);
});
```

### 2. XML Parsing Safety
- Uses `xml2js` with safe parsing options
- Handles missing fields gracefully
- Validates required fields before processing

### 3. Error Handling
- Always returns `200 OK` to bank (even on errors)
- Logs all errors to database
- Continues processing even if logging fails

### 4. Transaction ID Linking
All logs for one transaction share the same `transactionId`, making it easy to trace the complete flow.

## Security Notes

1. **Card Details:** Collected but not stored (only masked version in logs)
2. **CVV:** Never logged or stored
3. **SSL Certificates:** Required for Nabil Bank API calls
4. **Callback URLs:** Must be publicly accessible (HTTPS)
5. **CORS:** Configured to allow payment callbacks from any origin

## Troubleshooting

### Issue: Not redirecting to bank page
- Check browser console for errors
- Verify CreateOrder API call succeeds
- Check server logs for Nabil Bank response

### Issue: Callbacks not received
- Verify callback URLs are publicly accessible
- Check Vercel function logs
- Ensure XML parsing is working

### Issue: Missing logs
- Check MongoDB connection
- Verify transaction log repository is working
- Check for errors in server logs

## Bank Testing Checklist

- [ ] Checkout page loads at `/nabil/checkout`
- [ ] Card form accepts input
- [ ] CreateOrder request is logged
- [ ] CreateOrder response is logged
- [ ] Redirect to bank page works
- [ ] Payment callback is received
- [ ] Payment XML is logged
- [ ] GetOrderStatus is called immediately
- [ ] GetOrderStatus request is logged
- [ ] GetOrderStatus response is logged
- [ ] All logs are queryable by transactionId/orderId

---

**Implementation Status:** ✅ Complete and ready for bank testing





