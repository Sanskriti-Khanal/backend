#!/bin/bash

# Admin token - UPDATE THIS WITH YOUR ACTUAL ADMIN TOKEN
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGMwMzk2ZmEzMTg1NmI0YzY4ZTA2NyIsInJvbGUiOiJhZG1pbiIsInBob25lIjoiOTgwMDAwMDAwMCIsImlhdCI6MTc2NjU4OTM0MSwiZXhwIjoxNzY3MTk0MTQxfQ.T-52JcoBAR5TniD_Vd0Q9seFKq6LmHpSZ687hwp5Z_k"

BASE_URL="http://localhost:3000/api/v1/gem-categories"
JSON_FILE="update_gem_images.json"

echo "Updating Gem Category Images from JSON file..."

if [ ! -f "$JSON_FILE" ]; then
  echo "Error: $JSON_FILE not found!"
  exit 1
fi

# Function to update gem category image by slug
update_gem_image() {
  local slug=$1
  local image_url=$2
  
  if [ -z "$image_url" ] || [ "$image_url" == "YOUR_GOOGLE_IMAGE_URL_HERE" ]; then
    echo "  ⏭️  Skipping $slug (no URL provided)"
    return
  fi
  
  echo "Updating $slug..."
  
  # First, get the category to find its ID
  local category_response=$(curl -s "$BASE_URL/slug/$slug")
  local category_id=$(echo "$category_response" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -z "$category_id" ]; then
    echo "  ⚠️  Category not found: $slug"
    return
  fi
  
  # Update the category with the image URL
  local response=$(curl -s -X PUT "$BASE_URL/$category_id" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"image\": \"$image_url\"
    }")
  
  if echo "$response" | grep -q '"success":true'; then
    echo "  ✓ Updated $slug"
  else
    echo "  ✗ Failed to update $slug"
    echo "    Response: $response"
  fi
  
  sleep 0.3
}

# Read JSON and update images
# Using jq if available, otherwise using basic parsing
if command -v jq &> /dev/null; then
  echo "Using jq to parse JSON..."
  jq -r '.gem_images | to_entries[] | "\(.key)|\(.value)"' "$JSON_FILE" | while IFS='|' read -r slug url; do
    update_gem_image "$slug" "$url"
  done
else
  echo "jq not found. Using basic parsing..."
  echo "Please install jq for better JSON parsing: brew install jq"
  echo "Or manually add URLs to update_gem_category_images.sh script"
fi

echo ""
echo "Done updating gem category images!"









