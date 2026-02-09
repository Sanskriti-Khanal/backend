#!/bin/bash

# Test CreateOrder Request Script
# This script tests the Nabil Bank CreateOrder API endpoint

# Configuration
BASE_URL="${BASE_URL:-https://api.merosathi.co}"
# BASE_URL="${BASE_URL:-http://localhost:3000}"  # Uncomment for local testing

# IMPORTANT: Replace with a valid authentication token
# You can get a token by:
# 1. Logging in via POST /api/v1/users/login
# 2. Or using an existing valid token
TOKEN="${TOKEN:-YOUR_TOKEN_HERE}"

echo "=========================================="
echo "Testing CreateOrder Request"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

# Test CreateOrder Request
echo "📤 Sending CreateOrder Request..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/payments/nabil/create-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 100,
    "description": "Test CreateOrder Request - '$(date +%Y%m%d_%H%M%S)'",
    "paymentType": "product"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Check response
if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ SUCCESS: Order created successfully!"
  echo ""
  echo "Response Details:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  
  # Extract important fields
  ORDER_ID=$(echo "$BODY" | jq -r '.data.orderID // empty' 2>/dev/null)
  SESSION_ID=$(echo "$BODY" | jq -r '.data.sessionID // empty' 2>/dev/null)
  URL=$(echo "$BODY" | jq -r '.data.url // empty' 2>/dev/null)
  
  if [ -n "$ORDER_ID" ]; then
    echo ""
    echo "📋 Order Details:"
    echo "  Order ID: $ORDER_ID"
    echo "  Session ID: $SESSION_ID"
    echo "  Payment URL: $URL"
  fi
else
  echo "❌ ERROR: Request failed"
  echo ""
  echo "Error Details:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""
echo "=========================================="
