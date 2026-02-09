#!/bin/bash

# Admin token - UPDATE THIS WITH YOUR ACTUAL ADMIN TOKEN
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGMwMzk2ZmEzMTg1NmI0YzY4ZTA2NyIsInJvbGUiOiJhZG1pbiIsInBob25lIjoiOTgwMDAwMDAwMCIsImlhdCI6MTc2NjU4OTM0MSwiZXhwIjoxNzY3MTk0MTQxfQ.T-52JcoBAR5TniD_Vd0Q9seFKq6LmHpSZ687hwp5Z_k"

BASE_URL="http://localhost:3000/api/v1/gem-categories"

echo "Updating Gem Category Images..."

# Function to update gem category image by slug
update_gem_image() {
  local slug=$1
  local image_url=$2
  
  echo "Updating $slug with image: $image_url"
  
  # First, get the category to find its ID
  local category_response=$(curl -s "$BASE_URL/slug/$slug")
  local category_id=$(echo "$category_response" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -z "$category_id" ]; then
    echo "  ⚠️  Category not found: $slug"
    return
  fi
  
  # Update the category with the image URL
  curl -X PUT "$BASE_URL/$category_id" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"image\": \"$image_url\"
    }" > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "  ✓ Updated $slug"
  else
    echo "  ✗ Failed to update $slug"
  fi
  
  sleep 0.3
}

# ============================================
# ADD YOUR GOOGLE IMAGE URLS HERE
# Format: update_gem_image "slug" "https://image-url.com/image.jpg"
# ============================================

# Example format (replace with your actual Google image URLs):
# update_gem_image "amber" "https://example.com/amber.jpg"
# update_gem_image "apatite" "https://example.com/apatite.jpg"
# update_gem_image "aventurine" "https://example.com/aventurine.jpg"
# ... and so on for all 53 gems

# ============================================
# TEMPLATE - Copy and fill in your URLs:
# ============================================

# Precious Gems
# update_gem_image "ruby" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "pearl" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "coral" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "emerald" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "yellow-sapphire" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "blue-sapphire" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "hessonite" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "cat-s-eye" "YOUR_GOOGLE_IMAGE_URL_HERE"

# Semi-Precious Gems
# update_gem_image "amber" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "apatite" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "aventurine" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "azurite" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "tourmaline" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "bloodstone" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "carnelian" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "quartz" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "howlite" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "amethyst" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "aquamarine" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "citrine" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "opal" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "iolite" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "jasper" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "lapis-lazuli" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "moonstone" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "peridot" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "tigers-eye" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "turquoise" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "zircon" "YOUR_GOOGLE_IMAGE_URL_HERE"

# Additional variants
# update_gem_image "sapphire" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "red-coral" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "opal-stone" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "bi-color-tourmaline" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "brazilian-emerald" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "burmese-ruby" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "chrome-tourmaline" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "colombian-emerald" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "fire-opal" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "green-tourmaline" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "keshi-pearl" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "panjshir-emerald" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "pink-tourmaline" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "pitambari-neelam" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "rubellite" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "russian-emerald" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "south-sea-pearl" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "star-ruby" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "swat-emerald" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "zambian-emerald" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "zircon-jarkan" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "african-ruby" "YOUR_GOOGLE_IMAGE_URL_HERE"
# update_gem_image "bangkok-yellow-sapphire" "YOUR_GOOGLE_IMAGE_URL_HERE"

echo ""
echo "Done! Add your image URLs to the script and run it again."









