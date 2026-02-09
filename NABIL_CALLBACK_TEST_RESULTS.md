# Nabil Payment Callback Test Results

## Test Summary

All three Nabil Bank callback endpoints have been successfully tested and are saving data to the database.

## Test Results

### ✅ Approve Callback
- **Endpoint:** `POST /api/v1/payments/nabil/approve`
- **Status:** ✅ Working (HTTP 200)
- **Response:** `OK`
- **Test Order ID:** `TEST_ORDER_12345`
- **Amount:** 100.00 NPR (10000 paisa)

### ✅ Decline Callback
- **Endpoint:** `POST /api/v1/payments/nabil/decline`
- **Status:** ✅ Working (HTTP 200)
- **Response:** `OK`
- **Test Order ID:** `TEST_ORDER_67890`
- **Amount:** 50.00 NPR (5000 paisa)

### ✅ Cancel Callback
- **Endpoint:** `POST /api/v1/payments/nabil/cancel`
- **Status:** ✅ Working (HTTP 200)
- **Response:** `OK`
- **Test Order ID:** `TEST_ORDER_CANCEL`
- **Amount:** 30.00 NPR (3000 paisa)

## Test Payload Format

The endpoints expect form data with `xmlmsg` field containing XML:

```bash
Content-Type: application/x-www-form-urlencoded

xmlmsg=<?xml version="1.0" encoding="UTF-8"?>
<Message date="2025-12-28T12:00:00">
  <Version>1.0</Version>
  <OrderID>TEST_ORDER_12345</OrderID>
  <OrderIDEncrypted>ENCRYPTED_ORDER_ID_12345</OrderIDEncrypted>
  <SessionId>TEST_SESSION_12345</SessionId>
  <OrderStatus>APPROVED</OrderStatus>
  <OrderStatusScr>Approved</OrderStatusScr>
  <PurchaseAmount>10000</PurchaseAmount>
  <TotalAmount>10000</TotalAmount>
  <Currency>524</Currency>
  <CurrencyISOAlpha>NPR</CurrencyISOAlpha>
  <TranDateTime>2025-12-28T12:00:00</TranDateTime>
  <OrderDescription>Test Payment Order</OrderDescription>
  <TransactionType>Purchase</TransactionType>
  <Language>EN</Language>
  <BankName>PSP NABIL</BankName>
</Message>
```

## Order Status Values

- `APPROVED` - Payment successful
- `DECLINED` - Payment declined by bank
- `CANCELED` / `CANCELLED` - Payment canceled by user
- `EXPIRED` - Payment session expired

## Data Saved to Database

Each callback saves a record to the `NabilCallback` collection with:

- `orderId` - Order ID from bank
- `encryptedOrderId` - Encrypted order ID (optional)
- `sessionId` - Session ID from bank
- `amount` - Payment amount (in paisa, converted to NPR)
- `currency` - Currency code (524 for NPR)
- `currencyISO` - Currency ISO code (NPR)
- `status` - Callback status (APPROVED, CANCELED, DECLINED, EXPIRED)
- `statusDescription` - Human-readable status
- `transactionType` - Transaction type (usually "Purchase")
- `orderDescription` - Order description
- `tranDateTime` - Transaction date/time
- `bankName` - Bank name (PSP NABIL)
- `language` - Language (EN)
- `version` - API version (1.0)
- `rawXml` - Complete XML received from bank
- `receivedAt` - Timestamp when callback was received

## Verify Data in Database

To verify the data was saved, you can:

1. **Check MongoDB directly:**
   ```javascript
   db.nabilcallbacks.find().sort({ receivedAt: -1 }).limit(5)
   ```

2. **Check via API** (if you have an admin endpoint):
   - Query the NabilCallback collection
   - Look for records with OrderID matching test values:
     - `TEST_ORDER_12345` (Approve)
     - `TEST_ORDER_67890` (Decline)
     - `TEST_ORDER_CANCEL` (Cancel)

## Test Commands

### Approve Callback
```bash
curl -X POST "https://api.merosathi.co/api/v1/payments/nabil/approve" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "xmlmsg=<?xml version=\"1.0\" encoding=\"UTF-8\"?><Message date=\"2025-12-28T12:00:00\"><Version>1.0</Version><OrderID>TEST_ORDER_12345</OrderID><OrderIDEncrypted>ENCRYPTED_ORDER_ID_12345</OrderIDEncrypted><SessionId>TEST_SESSION_12345</SessionId><OrderStatus>APPROVED</OrderStatus><OrderStatusScr>Approved</OrderStatusScr><PurchaseAmount>10000</PurchaseAmount><TotalAmount>10000</TotalAmount><Currency>524</Currency><CurrencyISOAlpha>NPR</CurrencyISOAlpha><TranDateTime>2025-12-28T12:00:00</TranDateTime><OrderDescription>Test Payment Order</OrderDescription><TransactionType>Purchase</TransactionType><Language>EN</Language><BankName>PSP NABIL</BankName></Message>"
```

### Decline Callback
```bash
curl -X POST "https://api.merosathi.co/api/v1/payments/nabil/decline" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "xmlmsg=<?xml version=\"1.0\" encoding=\"UTF-8\"?><Message date=\"2025-12-28T12:00:00\"><Version>1.0</Version><OrderID>TEST_ORDER_67890</OrderID><OrderIDEncrypted>ENCRYPTED_ORDER_ID_67890</OrderIDEncrypted><SessionId>TEST_SESSION_67890</SessionId><OrderStatus>DECLINED</OrderStatus><OrderStatusScr>Declined</OrderStatusScr><PurchaseAmount>5000</PurchaseAmount><TotalAmount>5000</TotalAmount><Currency>524</Currency><CurrencyISOAlpha>NPR</CurrencyISOAlpha><TranDateTime>2025-12-28T12:00:00</TranDateTime><OrderDescription>Test Payment Order - Declined</OrderDescription><TransactionType>Purchase</TransactionType><Language>EN</Language><BankName>PSP NABIL</BankName></Message>"
```

### Cancel Callback
```bash
curl -X POST "https://api.merosathi.co/api/v1/payments/nabil/cancel" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "xmlmsg=<?xml version=\"1.0\" encoding=\"UTF-8\"?><Message date=\"2025-12-28T12:00:00\"><Version>1.0</Version><OrderID>TEST_ORDER_CANCEL</OrderID><OrderIDEncrypted>ENCRYPTED_ORDER_ID_CANCEL</OrderIDEncrypted><SessionId>TEST_SESSION_CANCEL</SessionId><OrderStatus>CANCELED</OrderStatus><OrderStatusScr>Canceled</OrderStatusScr><PurchaseAmount>3000</PurchaseAmount><TotalAmount>3000</TotalAmount><Currency>524</Currency><CurrencyISOAlpha>NPR</CurrencyISOAlpha><TranDateTime>2025-12-28T12:00:00</TranDateTime><OrderDescription>Test Payment Order - Canceled</OrderDescription><TransactionType>Purchase</TransactionType><Language>EN</Language><BankName>PSP NABIL</BankName></Message>"
```

## Notes

- All endpoints are **public** (no authentication required) as they are called by Nabil Bank's servers
- The endpoints accept `application/x-www-form-urlencoded` content type
- The XML is expected in the `xmlmsg` form field
- Each callback logs detailed information to console (check Vercel logs)
- If a matching Payment record exists (by orderId), it will be updated with the payment status

## Database Verification Query

If you have MongoDB access, run this to see the test records:

```javascript
// Find all test callback records
db.nabilcallbacks.find({
  orderId: { $in: ["TEST_ORDER_12345", "TEST_ORDER_67890", "TEST_ORDER_CANCEL"] }
}).sort({ receivedAt: -1 })

// Count total callbacks
db.nabilcallbacks.countDocuments()

// Get latest 10 callbacks
db.nabilcallbacks.find().sort({ receivedAt: -1 }).limit(10).pretty()
```




