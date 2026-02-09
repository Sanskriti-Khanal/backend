#!/bin/bash

# Script to upload an image and update user's avatarUrl
# Usage: ./upload-user-image.sh <admin_token> <user_id> <image_path>

ADMIN_TOKEN=${1:-""}
USER_ID=${2:-""}
IMAGE_PATH=${3:-""}

if [ -z "$ADMIN_TOKEN" ] || [ -z "$USER_ID" ] || [ -z "$IMAGE_PATH" ]; then
  echo "❌ Error: All parameters are required"
  echo "Usage: ./upload-user-image.sh <admin_token> <user_id> <image_path>"
  echo ""
  echo "Example:"
  echo "  ./upload-user-image.sh <token> 694c0584f98b67d369b0ef78 /path/to/image.jpg"
  exit 1
fi

if [ ! -f "$IMAGE_PATH" ]; then
  echo "❌ Error: Image file not found: $IMAGE_PATH"
  exit 1
fi

echo "📤 Uploading image..."

# Upload image
UPLOAD_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/v1/uploads/image" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "image=@$IMAGE_PATH")

echo "$UPLOAD_RESPONSE" | jq '.'

# Extract URL from response
IMAGE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.url // empty')

if [ -z "$IMAGE_URL" ] || [ "$IMAGE_URL" == "null" ]; then
  echo "❌ Error: Failed to upload image or get URL"
  exit 1
fi

echo ""
echo "✅ Image uploaded successfully!"
echo "📷 Image URL: $IMAGE_URL"
echo ""
echo "🔄 Updating user avatarUrl..."

# Update user with image URL
UPDATE_RESPONSE=$(curl -s -X PUT "http://localhost:3000/api/v1/admin/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"avatarUrl\": \"$IMAGE_URL\"}")

echo "$UPDATE_RESPONSE" | jq '.'

SUCCESS=$(echo "$UPDATE_RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" == "true" ]; then
  echo ""
  echo "✅ User avatar updated successfully!"
else
  echo ""
  echo "❌ Error: Failed to update user avatar"
  exit 1
fi



