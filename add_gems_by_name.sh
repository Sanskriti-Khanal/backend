#!/bin/bash

# Admin token - UPDATE THIS WITH YOUR ACTUAL ADMIN TOKEN
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGMwMzk2ZmEzMTg1NmI0YzY4ZTA2NyIsInJvbGUiOiJhZG1pbiIsInBob25lIjoiOTgwMDAwMDAwMCIsImlhdCI6MTc2NjU4OTM0MSwiZXhwIjoxNzY3MTk0MTQxfQ.T-52JcoBAR5TniD_Vd0Q9seFKq6LmHpSZ687hwp5Z_k"

BASE_URL="http://localhost:3000/api/v1/gem-categories"

echo "Adding/Updating Gems by Name..."

# Function to create slug from name
create_slug() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g'
}

# Function to check if gem exists by name
gem_exists() {
  local name=$1
  local response=$(curl -s "$BASE_URL" | grep -o "\"name\":\"$name\"" | head -1)
  if [ -n "$response" ]; then
    return 0  # exists
  else
    return 1  # doesn't exist
  fi
}

# Function to create gem category
create_gem() {
  local name=$1
  local slug=$(create_slug "$name")
  
  echo "Creating $name..."
  
  curl -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"name\": \"$name\",
      \"slug\": \"$slug\",
      \"description\": \"$name - A beautiful gemstone with unique properties and healing benefits.\",
      \"detailedDescription\": \"$name is a gemstone valued for its beauty and metaphysical properties. This gemstone has been used for centuries in jewelry and spiritual practices. It is believed to bring positive changes to the wearer's life.\",
      \"spiritualSignificance\": \"$name holds spiritual significance in various traditions. It is believed to carry healing energies and can help balance the chakras, enhance spiritual awareness, and bring harmony to the wearer's life.\",
      \"categoryType\": \"semi-precious\",
      \"displayOrder\": 100,
      \"isActive\": true,
      \"benefits\": [
        \"Brings positive energy\",
        \"Enhances spiritual growth\",
        \"Promotes healing\",
        \"Improves overall well-being\"
      ]
    }"
  
  echo -e "\n"
  sleep 0.3
}

# List of gems to add
declare -a gems=(
  "Amber"
  "Apatite"
  "Aventurine"
  "Azurite"
  "Tourmaline"
  "Bloodstone"
  "Ruby"
  "Carnelian"
  "Quartz"
  "Howlite"
  "Amethyst"
  "Aquamarine"
  "Sapphire"
  "Emerald"
  "Citrine"
  "Opal"
  "Hessonite"
  "Iolite"
  "Jasper"
  "Pearl"
  "Lapis Lazuli"
  "Moonstone"
  "Peridot"
  "Coral"
  "Tigers Eye"
  "Turquoise"
  "Zircon"
)

# Check and add each gem
for gem_name in "${gems[@]}"; do
  if gem_exists "$gem_name"; then
    echo "✓ $gem_name already exists, skipping..."
  else
    create_gem "$gem_name"
  fi
done

echo "Done! All gems have been checked and added if missing."









