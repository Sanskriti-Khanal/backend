#!/bin/bash

# Script to add astrologers and vaastu experts
# Usage: ./add-experts.sh <admin_token> <base_url>
# Example: ./add-experts.sh "your-admin-jwt-token" "http://localhost:3000"

ADMIN_TOKEN="${1:-}"
BASE_URL="${2:-http://localhost:3000}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "Error: Admin token is required"
  echo "Usage: ./add-experts.sh <admin_token> [base_url]"
  echo "Example: ./add-experts.sh 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 'http://localhost:3000'"
  exit 1
fi

API_URL="${BASE_URL}/api/v1/admin/users"

echo "=========================================="
echo "Adding Experts to MeroSathi"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

# Function to add an expert
add_expert() {
  local name=$1
  local phone=$2
  local role=$3
  local specialty=$4
  local bio=$5
  local username=$6
  
  echo "Adding: $name ($role)..."
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
      \"phone\": \"$phone\",
      \"username\": \"$username\",
      \"fullName\": \"$name\",
      \"role\": \"$role\",
      \"specialtyTitle\": \"$specialty\",
      \"bio\": \"$bio\",
      \"isPhoneVerified\": true,
      \"isActive\": true,
      \"isOnline\": true
    }")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" -eq 201 ] || [ "$http_code" -eq 200 ]; then
    echo "✅ Successfully added: $name"
    echo "$body" | jq -r '.data._id // .data.id // "ID not found"' 2>/dev/null || echo "   (Response received)"
  else
    echo "❌ Failed to add: $name (HTTP $http_code)"
    echo "$body" | jq -r '.error.message // .message // .error // "Unknown error"' 2>/dev/null || echo "$body"
  fi
  echo ""
}

echo "Ready to add experts!"
echo "Please provide the data for each expert when prompted."
echo "Press Ctrl+C to exit at any time."
echo ""
echo "=========================================="
echo ""

# Interactive mode - user will provide data one by one
while true; do
  echo "Enter expert details (or 'done' to finish):"
  read -p "Name: " name
  [ "$name" = "done" ] && break
  
  read -p "Phone (10 digits): " phone
  read -p "Username (unique): " username
  read -p "Role (jyotish for astrologer/vaastu): " role
  read -p "Specialty/Headline: " specialty
  read -p "Bio/Description: " bio
  
  add_expert "$name" "$phone" "$role" "$specialty" "$bio" "$username"
  
  echo "---"
done

echo "Done adding experts!"



