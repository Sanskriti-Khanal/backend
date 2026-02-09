#!/bin/bash

# Admin token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGMwMzk2ZmEzMTg1NmI0YzY4ZTA2NyIsInJvbGUiOiJhZG1pbiIsInBob25lIjoiOTgwMDAwMDAwMCIsImlhdCI6MTc2NjU4OTM0MSwiZXhwIjoxNzY3MTk0MTQxfQ.T-52JcoBAR5TniD_Vd0Q9seFKq6LmHpSZ687hwp5Z_k"

BASE_URL="http://localhost:3000/api/v1/rudraksha-categories"

echo "Updating Rudraksha Categories with Images..."

# Function to update category image by slug
update_image() {
  local slug=$1
  local image_path=$2
  
  echo "Updating $slug with image: $image_path"
  
  # First, get the category by slug to get its ID
  CATEGORY_RESPONSE=$(curl -s -X GET "$BASE_URL/slug/$slug")
  
  # Try to extract ID using different methods
  CATEGORY_ID=$(echo $CATEGORY_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
  
  # If that didn't work, try extracting from data._id
  if [ -z "$CATEGORY_ID" ]; then
    CATEGORY_ID=$(echo $CATEGORY_RESPONSE | grep -o '"data":{[^}]*"_id":"[^"]*' | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
  fi
  
  if [ -z "$CATEGORY_ID" ]; then
    echo "Error: Could not find category with slug: $slug"
    echo "Response: $CATEGORY_RESPONSE"
    return 1
  fi
  
  # Update the category with image
  UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/$CATEGORY_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"image\": \"$image_path\"
    }")
  
  # Check if update was successful
  if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
    echo "✓ Successfully updated $slug"
  else
    echo "✗ Failed to update $slug"
    echo "Response: $UPDATE_RESPONSE"
  fi
  
  echo ""
  sleep 0.3
}

# Update 0 to 26 Mukhi Rudraksha with asset paths
for i in {0..26}; do
  # Using asset path format: assets/images/rudraksha/categories/{mukhi}_mukhi.png
  update_image "$i-mukhi" "assets/images/rudraksha/categories/${i}_mukhi.png"
done

# Update Special Categories
update_image "gaurishankar" "assets/images/rudraksha/categories/gaurishankar.png"
update_image "trijuti-rudraksha" "assets/images/rudraksha/categories/trijuti.png"
update_image "ganesh-rudraksha" "assets/images/rudraksha/categories/ganesh.png"
update_image "garbha-gauri-rudraksha" "assets/images/rudraksha/categories/garbha_gauri.png"

echo "All images updated successfully!"
echo ""
echo "Note: If you want to use URLs instead of asset paths, modify the image paths in this script."
echo "Example URL format: https://yourdomain.com/images/rudraksha/5-mukhi.jpg"

