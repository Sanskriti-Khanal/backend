#!/bin/bash

# Admin token - UPDATE THIS WITH YOUR ACTUAL ADMIN TOKEN
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGMwMzk2ZmEzMTg1NmI0YzY4ZTA2NyIsInJvbGUiOiJhZG1pbiIsInBob25lIjoiOTgwMDAwMDAwMCIsImlhdCI6MTc2NjU4OTM0MSwiZXhwIjoxNzY3MTk0MTQxfQ.T-52JcoBAR5TniD_Vd0Q9seFKq6LmHpSZ687hwp5Z_k"

BASE_URL="http://localhost:3000/api/v1/gem-categories"

echo "Creating Gem Categories..."

# Function to create slug from name
create_slug() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g'
}

# Precious Gems (First List)
declare -a precious_gems=(
  "Ruby:Sun:Red:Manikya:Enhances leadership qualities|Brings passion and energy|Improves confidence|Attracts wealth and prosperity"
  "Pearl:Moon:White:Moti:Promotes emotional balance|Enhances peace and calm|Improves relationships|Brings prosperity"
  "Coral:Mars:Red:Moonga:Increases courage and strength|Enhances vitality|Protects from enemies|Improves health"
  "Emerald:Mercury:Green:Panna:Enhances intelligence and communication|Brings financial success|Improves memory|Promotes creativity"
  "Yellow Sapphire:Jupiter:Yellow:Pukhraj:Brings wisdom and knowledge|Attracts wealth and prosperity|Enhances spirituality|Improves relationships"
  "Blue Sapphire:Saturn:Blue:Neelam:Removes obstacles|Brings discipline and focus|Enhances career growth|Protects from negative energies"
  "Hessonite:Rahu:Orange:Gomed:Removes negative effects of Rahu|Brings success in career|Enhances intuition|Protects from enemies"
  "Cat's Eye:Ketu:Yellow:Lehsunia:Removes negative effects of Ketu|Brings spiritual growth|Enhances intuition|Protects from accidents"
)

display_order=0

echo "Creating Precious Gems..."
for gem_info in "${precious_gems[@]}"; do
  IFS=':' read -r name planet color hindi_name benefits <<< "$gem_info"
  slug=$(create_slug "$name")
  display_order=$((display_order + 1))
  
  echo "Creating $name..."
  
  # Convert benefits string to JSON array
  IFS='|' read -ra BENEFIT_ARRAY <<< "$benefits"
  BENEFITS_JSON="["
  for i in "${!BENEFIT_ARRAY[@]}"; do
    if [ $i -gt 0 ]; then
      BENEFITS_JSON+=", "
    fi
    BENEFITS_JSON+="\"${BENEFIT_ARRAY[$i]}\""
  done
  BENEFITS_JSON+="]"
  
  curl -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"name\": \"$name\",
      \"slug\": \"$slug\",
      \"description\": \"$name ($hindi_name) - A precious gemstone associated with $planet, known for its beautiful $color color and powerful astrological properties.\",
      \"detailedDescription\": \"$name, also known as $hindi_name in Sanskrit, is a precious gemstone that holds significant importance in Vedic astrology. Associated with the planet $planet, this beautiful $color gemstone is believed to bring numerous benefits to the wearer. It is highly valued for its spiritual and astrological properties, making it a popular choice for those seeking to enhance their life through gemstone therapy.\",
      \"spiritualSignificance\": \"$name is deeply rooted in Vedic astrology and is associated with $planet. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life. This gemstone has been used for centuries in spiritual practices and is considered highly auspicious.\",
      \"associatedPlanet\": \"$planet\",
      \"categoryType\": \"precious\",
      \"displayOrder\": $display_order,
      \"isActive\": true,
      \"benefits\": $BENEFITS_JSON
    }"
  
  echo -e "\n"
  sleep 0.5
done

# Semi-Precious Gems (Second List)
declare -a semi_precious_gems=(
  "Amber:Sun:Amber:Amber:Promotes vitality and energy|Brings good luck|Enhances creativity|Improves health"
  "Apatite:Mercury:Blue/Green:Apatite:Enhances communication|Improves learning|Brings clarity|Promotes self-expression"
  "Aventurine:Venus:Green:Aventurine:Attracts wealth and prosperity|Brings opportunities|Enhances creativity|Promotes emotional healing"
  "Azurite:Jupiter:Blue:Azurite:Enhances intuition|Improves mental clarity|Brings wisdom|Promotes spiritual growth"
  "Tourmaline:Multiple:Various:Tourmaline:Provides protection|Brings balance|Enhances energy|Promotes healing"
  "Bloodstone:Mars:Green/Red:Bloodstone:Increases courage|Brings strength|Enhances vitality|Protects from negative energies"
  "Carnelian:Sun:Orange:Carnelian:Enhances confidence|Brings motivation|Improves creativity|Promotes courage"
  "Quartz:Multiple:Various:Quartz:Amplifies energy|Brings clarity|Enhances healing|Promotes balance"
  "Howlite:Moon:White:Howlite:Promotes calmness|Brings peace|Enhances patience|Improves sleep"
  "Amethyst:Saturn:Purple:Amethyst:Enhances spirituality|Brings peace|Improves intuition|Promotes healing"
  "Aquamarine:Mercury:Blue:Aquamarine:Enhances communication|Brings courage|Improves clarity|Promotes emotional balance"
  "Citrine:Sun:Yellow:Citrine:Attracts wealth|Brings success|Enhances creativity|Promotes joy"
  "Opal:Venus:Various:Opal:Brings emotional balance|Enhances creativity|Promotes love|Improves relationships"
  "Iolite:Saturn:Blue/Violet:Iolite:Enhances intuition|Brings clarity|Improves vision|Promotes spiritual growth"
  "Jasper:Multiple:Various:Jasper:Provides protection|Brings stability|Enhances grounding|Promotes healing"
  "Lapis Lazuli:Jupiter:Blue:Lapis Lazuli:Enhances wisdom|Brings truth|Improves communication|Promotes spiritual awareness"
  "Moonstone:Moon:White/Blue:Moonstone:Promotes emotional balance|Brings intuition|Enhances femininity|Improves relationships"
  "Peridot:Mercury:Green:Peridot:Enhances communication|Brings prosperity|Improves health|Promotes growth"
  "Tiger's Eye:Sun:Golden Brown:Tiger's Eye:Enhances courage|Brings protection|Improves focus|Promotes confidence"
  "Turquoise:Venus:Blue/Green:Turquoise:Provides protection|Brings good fortune|Enhances communication|Promotes healing"
  "Zircon:Jupiter:Various:Zircon:Enhances wisdom|Brings prosperity|Improves relationships|Promotes spiritual growth"
)

echo "Creating Semi-Precious Gems..."
for gem_info in "${semi_precious_gems[@]}"; do
  IFS=':' read -r name planet color hindi_name benefits <<< "$gem_info"
  slug=$(create_slug "$name")
  display_order=$((display_order + 1))
  
  echo "Creating $name..."
  
  # Convert benefits string to JSON array
  IFS='|' read -ra BENEFIT_ARRAY <<< "$benefits"
  BENEFITS_JSON="["
  for i in "${!BENEFIT_ARRAY[@]}"; do
    if [ $i -gt 0 ]; then
      BENEFITS_JSON+=", "
    fi
    BENEFITS_JSON+="\"${BENEFIT_ARRAY[$i]}\""
  done
  BENEFITS_JSON+="]"
  
  curl -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"name\": \"$name\",
      \"slug\": \"$slug\",
      \"description\": \"$name - A beautiful semi-precious gemstone known for its $color color and healing properties.\",
      \"detailedDescription\": \"$name is a semi-precious gemstone valued for its beauty and metaphysical properties. With its distinctive $color color, this gemstone has been used for centuries in jewelry and spiritual practices. It is associated with various planetary energies and is believed to bring positive changes to the wearer's life.\",
      \"spiritualSignificance\": \"$name holds spiritual significance in various traditions. It is believed to carry healing energies and can help balance the chakras, enhance spiritual awareness, and bring harmony to the wearer's life.\",
      \"associatedPlanet\": \"$planet\",
      \"categoryType\": \"semi-precious\",
      \"displayOrder\": $display_order,
      \"isActive\": true,
      \"benefits\": $BENEFITS_JSON
    }"
  
  echo -e "\n"
  sleep 0.5
done

echo "All Gem categories created successfully!"

