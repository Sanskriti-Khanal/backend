# Nabil Bank EPG - Complete Implementation Guide

## ✅ Implementation Status: COMPLETE & READY FOR BANK TESTING

### Access Points

1. **Checkout Page:** `https://api.merosathi.co/nabil/checkout`
2. **API Endpoint:** `POST https://api.merosathi.co/api/v1/payments/nabil/checkout`
3. **Payment Page:** `https://api.compassplus.com:11612/flex?OrderID=...&SessionID=...` (redirected automatically)

---

## Complete Payment Flow

### Step 1: User Visits Checkout Page
**URL:** `GET https://api.merosathi.co/nabil/checkout`

- Simple HTML form
- Collects: Card Number, Expiry (MM/YY), CVV
- Fixed amount: NPR 1.00
- No authentication required

### Step 2: User Submits Payment Form
**Action:** User enters card details and clicks "Pay NPR 1.00"

**Frontend:**
- Validates card details
- Sends POST to `/api/v1/payments/nabil/checkout`
- Receives payment URL
- Redirects to: `https://api.compassplus.com:11612/flex?OrderID=...&SessionID=...`

### Step 3: Backend Creates Order
**Endpoint:** `POST /api/v1/payments/nabil/checkout`

**Process:**
1. ✅ Generate unique `transactionId`
2. ✅ Build CreateOrder XML (matching Nabil Bank format)
3. ✅ **Log CreateOrder Request** to database
4. ✅ Call Nabil Bank: `POST https://api.compassplus.com:11611/Exec`
5. ✅ Receive response with OrderID, SessionID, URL
6. ✅ **Log CreateOrder Response** to database
7. ✅ Build payment URL: `https://api.compassplus.com:11612/flex?OrderID=...&SessionID=...`
8. ✅ Return payment URL to frontend

**XML Request Format:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
<Request><Operation>CreateOrder</Operation>
<Language>EN</Language>
<Order>
<OrderType>Purchase</OrderType>
<Merchant>NABIL106809</Merchant>
<Amount>100</Amount>
<Currency>524</Currency>
<Description>Test Payment NPR 1</Description>
<ApproveURL>https://api.merosathi.co/api/v1/payments/nabil/approve</ApproveURL>
<CancelURL>https://api.merosathi.co/api/v1/payments/nabil/cancel</CancelURL>
<DeclineURL>https://api.merosathi.co/api/v1/payments/nabil/decline</DeclineURL>
<Fee>0</Fee>
</Order>
</Request>
</TKKPG>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://api.compassplus.com:11612/flex?OrderID=@encrypted@1@...&SessionID=@encrypted@1@...",
    "transactionId": "TXN_1234567890_abc123",
    "orderID": "@encrypted@1@...",
    "sessionID": "@encrypted@1@..."
  }
}
```

### Step 4: User Completes Payment on Bank Page
**URL:** `https://api.compassplus.com:11612/flex?OrderID=...&SessionID=...`

- User enters card details on Nabil Bank's secure page
- User clicks Approve/Cancel/Decline
- Bank processes payment

### Step 5: Bank Sends Callback
**Bank → Node.js Endpoints:**

- `POST /api/v1/payments/nabil/approve` (if approved)
- `POST /api/v1/payments/nabil/decline` (if declined)
- `POST /api/v1/payments/nabil/cancel` (if cancelled)

**Request Format:**
```
POST /api/v1/payments/nabil/approve
Content-Type: application/x-www-form-urlencoded

xmlmsg=<?xml version="1.0"?><Message date="...">...</Message>
```

**Backend Processing:**
1. ✅ Extract XML from `req.body.xmlmsg`
2. ✅ Parse XML safely using `nabilService.parseCallbackXml()`
3. ✅ **Log Payment XML (xmlout)** to database
4. ✅ Save callback to `NabilCallback` collection
5. ✅ **Immediately call GetOrderStatus** (async, non-blocking)
6. ✅ **Log GetOrderStatus Request** to database
7. ✅ **Log GetOrderStatus Response** to database
8. ✅ Return `200 OK` to bank

### Step 6: GetOrderStatus Call (Automatic)
**Triggered:** Immediately after callback (async, non-blocking)

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

---

## Complete Logging (All in Database)

### Required Logs Per Transaction

All logs are stored in MongoDB `transactionlogs` collection, linked by `transactionId`, `orderId`, and `sessionId`.

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

#### 3. Payment XML (xmlout) - Bank Callback
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
db.transactionlogs.find({ orderId: "@encrypted@1@..." }).sort({ receivedAt: 1 })
```

**By Session ID:**
```javascript
db.transactionlogs.find({ sessionId: "@encrypted@1@..." }).sort({ receivedAt: 1 })
```

**Get all logs for a transaction:**
```javascript
// This will return all 5 required logs in chronological order
db.transactionlogs.find({ 
  $or: [
    { transactionId: "TXN_..." },
    { orderId: "@encrypted@1@..." },
    { sessionId: "@encrypted@1@..." }
  ]
}).sort({ receivedAt: 1 })
```

---

## XML Parsing Example

### Bank Callback XML
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

**Parsed Result:**
```typescript
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

---

## Configuration

### Environment Variables (Vercel)

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

### Merchant Configuration
- **Merchant ID:** `NABIL106809`
- **API URL:** `https://api.compassplus.com:11611/Exec` (TEST)
- **Payment URL:** `https://api.compassplus.com:11612/flex` (redirected to)
- **SSL Certificates:** `merosathi.co.crt` and `merosathi.key` in `backend/src/cert/`

---

## Testing Checklist

### Pre-Testing
- [ ] SSL certificates are in `backend/src/cert/` directory
- [ ] Certificates match merchant ID `NABIL106809`
- [ ] `BASE_URL` environment variable is set correctly
- [ ] MongoDB connection is working
- [ ] All routes are deployed to Vercel

### Test Flow
1. [ ] Visit `https://api.merosathi.co/nabil/checkout`
2. [ ] Checkout page loads correctly
3. [ ] Enter test card details
4. [ ] Click "Pay NPR 1.00"
5. [ ] Verify redirect to `https://api.compassplus.com:11612/flex?OrderID=...&SessionID=...`
6. [ ] Complete payment on bank page (Approve/Cancel/Decline)
7. [ ] Verify callback is received
8. [ ] Verify all 5 logs are stored in database

### Verify Logs
```javascript
// Get latest transaction
const latest = db.transactionlogs.find().sort({ receivedAt: -1 }).limit(1)[0];
const txnId = latest.transactionId;

// Get all logs for this transaction
db.transactionlogs.find({ transactionId: txnId }).sort({ receivedAt: 1 });

// Should return exactly 5 logs:
// 1. CREATE_ORDER_REQUEST
// 2. CREATE_ORDER_RESPONSE
// 3. PAYMENT_XML
// 4. GET_ORDER_STATUS_REQUEST
// 5. GET_ORDER_STATUS_RESPONSE
```

---

## Key Implementation Details

### 1. XML Format
- Matches exact Nabil Bank format: `<Request><Operation>` on same line
- All fields properly escaped
- Amount in paisa (100 for NPR 1.00)

### 2. Payment URL Construction
```typescript
const paymentUrl = `${nabilResponse.url}?OrderID=${encodeURIComponent(nabilResponse.orderID)}&SessionID=${encodeURIComponent(nabilResponse.sessionID)}`;
```

This creates: `https://api.compassplus.com:11612/flex?OrderID=@encrypted@1@...&SessionID=@encrypted@1@...`

### 3. Immediate GetOrderStatus
Called automatically after callback:
```typescript
this.callGetOrderStatusAsync(
  parsedData.orderIDEncrypted || parsedData.orderId,
  parsedData.sessionId,
  transactionId
).catch((error) => {
  console.error('❌ GetOrderStatus error:', error);
});
```

### 4. Error Handling
- Always returns `200 OK` to bank (even on errors)
- Logs all errors to database
- Continues processing even if logging fails

### 5. Transaction Linking
All logs share the same `transactionId`, making it easy to trace the complete flow from checkout to callback.

---

## File Structure

```
backend/
├── api/
│   └── index.js                    # Vercel serverless entry point
├── src/
│   ├── controllers/
│   │   └── payment.controller.ts  # Checkout & callback handlers
│   ├── services/
│   │   └── nabil.service.ts       # Nabil Bank API client
│   ├── repositories/
│   │   └── transaction-log.repository.ts  # Log storage
│   ├── models/
│   │   └── TransactionLog.model.ts        # Log schema
│   ├── routes/
│   │   └── payment.routes.ts      # API routes
│   ├── public/
│   │   └── checkout.html         # Checkout page
│   └── app.ts                     # Express app setup
├── vercel.json                    # Vercel configuration
└── package.json
```

---

## Success Criteria

✅ **Checkout page accessible at `/nabil/checkout`**
✅ **Card details collected and validated**
✅ **Redirects to `https://api.compassplus.com:11612/flex?OrderID=...&SessionID=...`**
✅ **All 5 required logs stored in database**
✅ **GetOrderStatus called immediately after callback**
✅ **XML parsing handles all callback formats safely**
✅ **Ready for bank testing**

---

**Status:** ✅ **COMPLETE - READY FOR BANK TESTING**





