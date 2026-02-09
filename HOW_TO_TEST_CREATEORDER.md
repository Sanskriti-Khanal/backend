# How to Test CreateOrder Request

This guide explains how to test the Nabil Bank CreateOrder API endpoint.

## Prerequisites

1. **Valid Authentication Token**: You need a valid JWT token to make authenticated requests
2. **Server Running**: Either local server or production server should be accessible

## Step 1: Get Authentication Token

### Option A: Login via API

```bash
curl -X POST https://api.merosathi.co/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Copy the `token` value from the response.

### Option B: Use Existing Token

If you have a valid token from a previous session, you can use it directly.

## Step 2: Test CreateOrder Request

### Method 1: Using the Test Script

```bash
cd backend
export TOKEN="your_token_here"
export BASE_URL="https://api.merosathi.co"  # or "http://localhost:3000" for local
./test_create_order.sh
```

### Method 2: Using cURL Directly

```bash
curl -X POST https://api.merosathi.co/api/v1/payments/nabil/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "amount": 100,
    "description": "Test CreateOrder Request",
    "paymentType": "product"
  }'
```

### Method 3: Using Postman

1. **Method**: POST
2. **URL**: `https://api.merosathi.co/api/v1/payments/nabil/create-order`
3. **Headers**:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN_HERE`
4. **Body** (JSON):
   ```json
   {
     "amount": 100,
     "description": "Test CreateOrder Request",
     "paymentType": "product"
   }
   ```

## Request Parameters

### Required Fields

- **amount** (number): Payment amount in NPR (e.g., 100 for NPR 100.00)
- **description** (string): Order description (1-255 characters)
- **paymentType** (enum): One of:
  - `"product"` - Product purchase
  - `"healing"` - Healing service
  - `"puja"` - Puja service
  - `"jyotish_booking"` - Jyotish booking
  - `"package"` - Package purchase

### Optional Fields

- **orderId** (string): Existing order ID (MongoDB ObjectId format)
- **productOrderId** (string): Product order ID (MongoDB ObjectId format)
- **bookingId** (string): Booking ID (MongoDB ObjectId format)

## Expected Response

### Success Response (HTTP 201)

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "status": "00",
    "orderID": "@encrypted@1@ABC123...",
    "sessionID": "@encrypted@1@XYZ789...",
    "decryptedOrderID": "123456789",
    "decryptedSessionID": "987654321",
    "url": "https://api.compassplus.com:11612/flex?OrderID=@encrypted@1@...&SessionID=@encrypted@1@...",
    "paymentId": "67890abcdef..."
  }
}
```

### Error Responses

#### Invalid Token (HTTP 401)
```json
{
  "success": false,
  "error": {
    "message": "Invalid token"
  }
}
```

#### Validation Error (HTTP 400)
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be positive"
      }
    ]
  }
}
```

#### Nabil Bank Error (HTTP 400/500)
```json
{
  "success": false,
  "error": {
    "message": "Nabil Bank Error: Status 55 - Merchant not found"
  }
}
```

## Response Fields Explained

- **status**: Response status from Nabil Bank (`"00"` = success)
- **orderID**: Encrypted Order ID from Nabil Bank (store this)
- **sessionID**: Encrypted Session ID from Nabil Bank (store this)
- **decryptedOrderID**: Decrypted Order ID (for reference/debugging)
- **decryptedSessionID**: Decrypted Session ID (for reference/debugging)
- **url**: Payment URL - redirect user to this URL to complete payment
- **paymentId**: Internal payment record ID (MongoDB ObjectId)

## Testing Checklist

- [ ] Server is running and accessible
- [ ] Valid authentication token is obtained
- [ ] Request is sent with correct headers
- [ ] Request body contains all required fields
- [ ] Response status code is 201 (success) or appropriate error code
- [ ] Response contains `orderID` and `sessionID`
- [ ] Response contains `url` for payment redirect
- [ ] Check server logs for CreateOrder request details

## Server Logs

When you make a CreateOrder request, check the server logs for:

```
📤 Nabil Bank CreateOrder Request:
  Merchant ID: NABIL106809 (or production merchant ID)
  Amount (NPR): 100
  Amount (Paisa): 10000
  Currency: 524
  Description: Test CreateOrder Request
  Approve URL: https://api.merosathi.co/api/v1/payments/nabil/approve?...
  Cancel URL: https://api.merosathi.co/api/v1/payments/nabil/cancel?...
  Decline URL: https://api.merosathi.co/api/v1/payments/nabil/decline?...
```

## Common Issues

### 1. "Invalid token"
- **Solution**: Get a fresh token by logging in again
- Token may have expired (default expiry: 7 days)

### 2. "Connection refused" (local testing)
- **Solution**: Make sure the server is running: `npm run dev` in backend directory
- Check if server is listening on correct port (default: 3000)

### 3. "Status 55" from Nabil Bank
- **Solution**: This usually means merchant ID issue or configuration problem
- Check Nabil Bank configuration in environment variables
- Verify merchant ID is correct and activated

### 4. "Validation error"
- **Solution**: Check that all required fields are present and valid
- Ensure `amount` is positive number
- Ensure `paymentType` is one of the allowed values
- Ensure `description` is between 1-255 characters

## Next Steps After Successful CreateOrder

1. **Store the response data** (orderID, sessionID, paymentId)
2. **Redirect user to payment URL** from the response
3. **Handle callbacks** - Bank will POST to approve/cancel/decline URLs
4. **Verify payment** - Use `/api/v1/payments/nabil/verify` endpoint

## Example: Complete Test Flow

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST https://api.merosathi.co/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}' \
  | jq -r '.data.token')

# 2. Create order
RESPONSE=$(curl -s -X POST https://api.merosathi.co/api/v1/payments/nabil/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 100,
    "description": "Test Order",
    "paymentType": "product"
  }')

# 3. Extract payment URL
PAYMENT_URL=$(echo "$RESPONSE" | jq -r '.data.url')
echo "Payment URL: $PAYMENT_URL"

# 4. Open in browser (optional)
# open "$PAYMENT_URL"  # macOS
# xdg-open "$PAYMENT_URL"  # Linux
```

---

**Last Updated**: January 25, 2026
