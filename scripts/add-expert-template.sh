#!/bin/bash

# Template for adding astrologers and vaastu experts
# Replace the variables below with actual data

# Configuration
ADMIN_TOKEN="YOUR_ADMIN_JWT_TOKEN_HERE"
BASE_URL="http://localhost:3000"  # Change if using different URL
API_URL="${BASE_URL}/api/v1/admin/users"

# Example: Add an Astrologer
# Replace the values below with real data
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "phone": "9812345678",
    "username": "astrologer1",
    "fullName": "Pandit Ram Sharan",
    "role": "jyotish",
    "specialtyTitle": "Vedic Astrology Expert",
    "bio": "Experienced Vedic astrologer with 15+ years of experience in horoscope reading, matchmaking, and remedies.",
    "isPhoneVerified": true,
    "isActive": true,
    "isOnline": true
  }'

echo ""
echo "---"
echo ""

# Example: Add a Vaastu Expert
# Note: Vaastu experts might also use role "jyotish" or we may need to add a new role
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "phone": "9812345679",
    "username": "vaastu1",
    "fullName": "Acharya Krishna Das",
    "role": "jyotish",
    "specialtyTitle": "Vaastu Shastra Consultant",
    "bio": "Expert Vaastu consultant specializing in home and office design, energy flow optimization, and space planning.",
    "isPhoneVerified": true,
    "isActive": true,
    "isOnline": true
  }'

echo ""
echo "=========================================="
echo "Copy the curl commands above and replace:"
echo "1. ADMIN_TOKEN with your admin JWT token"
echo "2. BASE_URL if different from localhost:3000"
echo "3. All the data fields with real expert information"
echo "=========================================="



