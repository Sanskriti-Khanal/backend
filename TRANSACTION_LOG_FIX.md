# Transaction Log Fix - All 5 Logs Now Use Same TransactionId

## Problem

When making any action (cancel, decline, approve), only one transaction log was being stored in the database instead of all 5 required logs:

1. ✅ CreateOrder Request
2. ✅ CreateOrder Response  
3. ❌ Payment Response XML (from callback)
4. ❌ GetOrderStatus Request
5. ❌ GetOrderStatus Response

**Root Cause:** When bank callbacks (POST requests) arrived, they couldn't retrieve the original `transactionId` because:
- Bank POST callbacks don't include query parameters (transactionId was in callback URL)
- No payment record existed to look up the transactionId
- Each callback generated a new transactionId, breaking the link to CreateOrder logs

## Solution

### 1. Create Payment Record in `processCheckout`

**File:** `backend/src/controllers/payment.controller.ts`

After CreateOrder succeeds, we now create a payment record that stores:
- `gatewayOrderId`: Encrypted OrderID from bank
- `gatewaySessionId`: Encrypted SessionID from bank  
- `metadata.transactionId`: The original transactionId from CreateOrder

```typescript
payment = await this.paymentRepository.createPayment({
  user: req.body.userId || '000000000000000000000000' as any,
  amount,
  currency: 'NPR',
  status: PaymentStatus.PENDING,
  paymentMethod: PaymentMethod.NABIL,
  paymentType: PaymentType.PRODUCT,
  gatewayOrderId: nabilResponse.orderID,
  gatewaySessionId: nabilResponse.sessionID,
  metadata: {
    transactionId, // ✅ Store transactionId here
    decryptedOrderID: nabilResponse.decryptedOrderID,
    decryptedSessionID: nabilResponse.decryptedSessionID,
    description,
    source: 'checkout_page',
  },
});
```

### 2. Update Callback Handlers to Retrieve TransactionId

**Files Updated:**
- `handleNabilApproveCallback`
- `handleNabilCancelCallback`  
- `handleNabilDeclineCallback`

**New Logic:**
1. First try to get transactionId from query params (if available)
2. If not found, find payment record by OrderID/SessionID
3. Retrieve transactionId from `payment.metadata.transactionId`
4. Use that transactionId for all subsequent logs

```typescript
// Method 1: Try query params first
const transactionIdFromQuery = req.query.transactionId as string;

if (transactionIdFromQuery) {
  transactionId = transactionIdFromQuery;
} else {
  // Method 2: Find payment by OrderID/SessionID
  let payment = await this.paymentRepository.findPaymentByGatewayOrderId(
    parsedData.orderIDEncrypted || parsedData.orderId || ''
  );
  
  if (!payment && parsedData.sessionId) {
    payment = await this.paymentRepository.findPaymentByGatewaySessionId(
      parsedData.sessionId
    );
  }
  
  if (payment && payment.metadata?.transactionId) {
    transactionId = payment.metadata.transactionId as string;
  }
}
```

### 3. All Logs Now Use Same TransactionId

Now all 5 transaction logs share the same `transactionId`:

1. **CreateOrder Request** - Uses transactionId from `processCheckout`
2. **CreateOrder Response** - Uses transactionId from `processCheckout`
3. **Payment XML** - Uses transactionId retrieved from payment record
4. **GetOrderStatus Request** - Uses transactionId passed from callback handler
5. **GetOrderStatus Response** - Uses transactionId passed from callback handler

## Flow Diagram

```
User clicks "Pay" on checkout page
    ↓
processCheckout() generates transactionId: "TXN_123..."
    ↓
1. Log CREATE_ORDER_REQUEST (transactionId: "TXN_123...")
    ↓
2. Call Nabil Bank CreateOrder API
    ↓
3. Log CREATE_ORDER_RESPONSE (transactionId: "TXN_123...")
    ↓
4. Create Payment Record (stores transactionId in metadata)
    ↓
User completes payment on bank page
    ↓
Bank sends POST callback to /approve, /cancel, or /decline
    ↓
Callback handler:
  - Finds payment by OrderID/SessionID
  - Retrieves transactionId from payment.metadata
    ↓
5. Log PAYMENT_XML (transactionId: "TXN_123...")
    ↓
6. Call GetOrderStatus API
    ↓
7. Log GET_ORDER_STATUS_REQUEST (transactionId: "TXN_123...")
    ↓
8. Log GET_ORDER_STATUS_RESPONSE (transactionId: "TXN_123...")
```

## Database Query Example

Now you can query all logs for a transaction:

```javascript
// MongoDB query
db.transactionlogs.find({ 
  transactionId: "TXN_1234567890_abc123" 
}).sort({ receivedAt: 1 })

// Should return 5 documents:
// 1. CREATE_ORDER_REQUEST
// 2. CREATE_ORDER_RESPONSE
// 3. PAYMENT_XML
// 4. GET_ORDER_STATUS_REQUEST
// 5. GET_ORDER_STATUS_RESPONSE
```

## Testing

1. **Test Checkout Flow:**
   ```bash
   # Visit checkout page
   https://api.merosathi.co/nabil/checkout
   
   # Click "Pay" button
   # Complete payment (or cancel/decline)
   ```

2. **Verify Logs in Database:**
   ```javascript
   // Find payment by OrderID
   const payment = await PaymentModel.findOne({ 
     gatewayOrderId: "ENCRYPTED_ORDER_ID" 
   });
   
   // Get transactionId
   const transactionId = payment.metadata.transactionId;
   
   // Find all logs for this transaction
   const logs = await TransactionLogModel.find({ 
     transactionId 
   }).sort({ receivedAt: 1 });
   
   console.log(`Found ${logs.length} logs:`);
   logs.forEach(log => {
     console.log(`- ${log.type} at ${log.receivedAt}`);
   });
   
   // Should show 5 logs
   ```

3. **Expected Result:**
   ```
   Found 5 logs:
   - CREATE_ORDER_REQUEST at 2026-01-25T10:00:00.000Z
   - CREATE_ORDER_RESPONSE at 2026-01-25T10:00:01.000Z
   - PAYMENT_XML at 2026-01-25T10:00:30.000Z
   - GET_ORDER_STATUS_REQUEST at 2026-01-25T10:00:33.000Z
   - GET_ORDER_STATUS_RESPONSE at 2026-01-25T10:00:34.000Z
   ```

## Files Modified

1. `backend/src/controllers/payment.controller.ts`
   - Updated `processCheckout()` to create payment record
   - Updated `handleNabilApproveCallback()` to retrieve transactionId
   - Updated `handleNabilCancelCallback()` to retrieve transactionId
   - Updated `handleNabilDeclineCallback()` to retrieve transactionId

## Notes

- Payment record is created even for public checkout page (uses dummy user ID)
- If payment record creation fails, logs will still work (fallback to new transactionId)
- All logs are linked by the same transactionId for easy querying
- TransactionId is stored in payment metadata for easy retrieval

---

**Last Updated:** January 25, 2026
