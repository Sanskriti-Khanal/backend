#!/bin/bash

# Admin token - UPDATE THIS WITH YOUR ACTUAL ADMIN ADMIN TOKEN
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGMwMzk2ZmEzMTg1NmI0YzY4ZTA2NyIsInJvbGUiOiJhZG1pbiIsInBob25lIjoiOTgwMDAwMDAwMCIsImlhdCI6MTc2NjU4OTM0MSwiZXhwIjoxNzY3MTk0MTQxfQ.T-52JcoBAR5TniD_Vd0Q9seFKq6LmHpSZ687hwp5Z_k"

BASE_URL="http://localhost:3000/api/v1/gem-categories"

echo "Adding Missing Gem Categories..."

# Function to create slug from name
create_slug() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g'
}

# Function to create gem category
create_gem() {
  local name=$1
  local planet=$2
  local color=$3
  local category_type=$4
  local benefits=$5
  local description=$6
  local detailed_description=$7
  local spiritual_significance=$8
  local display_order=$9
  
  local slug=$(create_slug "$name")
  
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
  
  echo "Creating $name..."
  
  curl -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"name\": \"$name\",
      \"slug\": \"$slug\",
      \"description\": \"$description\",
      \"detailedDescription\": \"$detailed_description\",
      \"spiritualSignificance\": \"$spiritual_significance\",
      \"associatedPlanet\": \"$planet\",
      \"categoryType\": \"$category_type\",
      \"displayOrder\": $display_order,
      \"isActive\": true,
      \"benefits\": $BENEFITS_JSON
    }"
  
  echo -e "\n"
  sleep 0.5
}

display_order=30

# Red Coral (variant of Coral)
create_gem \
  "Red Coral" \
  "Mars" \
  "Red" \
  "precious" \
  "Increases courage and strength|Enhances vitality|Protects from enemies|Improves health" \
  "Red Coral (Moonga) - A precious gemstone associated with Mars, known for its beautiful red color and powerful astrological properties." \
  "Red Coral, also known as Moonga in Sanskrit, is a precious gemstone that holds significant importance in Vedic astrology. Associated with the planet Mars, this beautiful red gemstone is believed to bring numerous benefits to the wearer. It is highly valued for its spiritual and astrological properties, making it a popular choice for those seeking to enhance their life through gemstone therapy." \
  "Red Coral is deeply rooted in Vedic astrology and is associated with Mars. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Opal Stone (variant of Opal)
create_gem \
  "Opal Stone" \
  "Venus" \
  "Various" \
  "semi-precious" \
  "Brings emotional balance|Enhances creativity|Promotes love|Improves relationships" \
  "Opal Stone - A beautiful semi-precious gemstone known for its various colors and healing properties." \
  "Opal Stone is a semi-precious gemstone valued for its beauty and metaphysical properties. With its distinctive play of colors, this gemstone has been used for centuries in jewelry and spiritual practices. It is associated with Venus and is believed to bring positive changes to the wearer's life." \
  "Opal Stone holds spiritual significance in various traditions. It is believed to carry healing energies and can help balance the chakras, enhance spiritual awareness, and bring harmony to the wearer's life." \
  $((display_order++))

# Bi-Color Tourmaline
create_gem \
  "Bi-Color Tourmaline" \
  "Multiple" \
  "Multi-Color" \
  "semi-precious" \
  "Provides protection|Brings balance|Enhances energy|Promotes healing" \
  "Bi-Color Tourmaline - A beautiful semi-precious gemstone known for its unique two-tone coloring and healing properties." \
  "Bi-Color Tourmaline is a semi-precious gemstone valued for its unique appearance with two distinct colors in a single stone. This gemstone has been used for centuries in jewelry and spiritual practices. It is associated with various planetary energies and is believed to bring positive changes to the wearer's life." \
  "Bi-Color Tourmaline holds spiritual significance in various traditions. It is believed to carry healing energies and can help balance the chakras, enhance spiritual awareness, and bring harmony to the wearer's life." \
  $((display_order++))

# Brazilian Emerald
create_gem \
  "Brazilian Emerald" \
  "Mercury" \
  "Green" \
  "precious" \
  "Enhances intelligence and communication|Brings financial success|Improves memory|Promotes creativity" \
  "Brazilian Emerald - A precious emerald gemstone from Brazil, known for its vibrant green color and powerful astrological properties." \
  "Brazilian Emerald is a precious gemstone that holds significant importance in Vedic astrology. Originating from Brazil, this beautiful green gemstone is associated with the planet Mercury and is believed to bring numerous benefits to the wearer. It is highly valued for its spiritual and astrological properties." \
  "Brazilian Emerald is deeply rooted in Vedic astrology and is associated with Mercury. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Burmese Ruby
create_gem \
  "Burmese Ruby" \
  "Sun" \
  "Red" \
  "precious" \
  "Enhances leadership qualities|Brings passion and energy|Improves confidence|Attracts wealth and prosperity" \
  "Burmese Ruby - A precious ruby gemstone from Myanmar (Burma), known for its exceptional red color and powerful astrological properties." \
  "Burmese Ruby is a precious gemstone that holds significant importance in Vedic astrology. Originating from Myanmar (Burma), this beautiful red gemstone is associated with the planet Sun and is believed to bring numerous benefits to the wearer. It is highly valued for its spiritual and astrological properties." \
  "Burmese Ruby is deeply rooted in Vedic astrology and is associated with Sun. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Chrome Tourmaline
create_gem \
  "Chrome Tourmaline" \
  "Multiple" \
  "Green" \
  "semi-precious" \
  "Provides protection|Brings balance|Enhances energy|Promotes healing" \
  "Chrome Tourmaline - A beautiful semi-precious gemstone known for its vibrant green color and healing properties." \
  "Chrome Tourmaline is a semi-precious gemstone valued for its beauty and metaphysical properties. With its distinctive vibrant green color, this gemstone has been used for centuries in jewelry and spiritual practices. It is associated with various planetary energies and is believed to bring positive changes to the wearer's life." \
  "Chrome Tourmaline holds spiritual significance in various traditions. It is believed to carry healing energies and can help balance the chakras, enhance spiritual awareness, and bring harmony to the wearer's life." \
  $((display_order++))

# Colombian Emerald
create_gem \
  "Colombian Emerald" \
  "Mercury" \
  "Green" \
  "precious" \
  "Enhances intelligence and communication|Brings financial success|Improves memory|Promotes creativity" \
  "Colombian Emerald - A precious emerald gemstone from Colombia, known for its exceptional green color and powerful astrological properties." \
  "Colombian Emerald is a precious gemstone that holds significant importance in Vedic astrology. Originating from Colombia, this beautiful green gemstone is associated with the planet Mercury and is believed to bring numerous benefits to the wearer. It is highly valued for its spiritual and astrological properties." \
  "Colombian Emerald is deeply rooted in Vedic astrology and is associated with Mercury. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Fire Opal
create_gem \
  "Fire Opal" \
  "Sun" \
  "Orange/Red" \
  "semi-precious" \
  "Brings emotional balance|Enhances creativity|Promotes passion|Improves vitality" \
  "Fire Opal - A beautiful semi-precious gemstone known for its fiery orange-red color and healing properties." \
  "Fire Opal is a semi-precious gemstone valued for its beauty and metaphysical properties. With its distinctive fiery orange-red color, this gemstone has been used for centuries in jewelry and spiritual practices. It is associated with Sun and is believed to bring positive changes to the wearer's life." \
  "Fire Opal holds spiritual significance in various traditions. It is believed to carry healing energies and can help balance the chakras, enhance spiritual awareness, and bring harmony to the wearer's life." \
  $((display_order++))

# Green Tourmaline
create_gem \
  "Green Tourmaline" \
  "Mercury" \
  "Green" \
  "semi-precious" \
  "Provides protection|Brings balance|Enhances energy|Promotes healing" \
  "Green Tourmaline - A beautiful semi-precious gemstone known for its vibrant green color and healing properties." \
  "Green Tourmaline is a semi-precious gemstone valued for its beauty and metaphysical properties. With its distinctive green color, this gemstone has been used for centuries in jewelry and spiritual practices. It is associated with Mercury and is believed to bring positive changes to the wearer's life." \
  "Green Tourmaline holds spiritual significance in various traditions. It is believed to carry healing energies and can help balance the chakras, enhance spiritual awareness, and bring harmony to the wearer's life." \
  $((display_order++))

# Keshi Pearl
create_gem \
  "Keshi Pearl" \
  "Moon" \
  "White" \
  "precious" \
  "Promotes emotional balance|Enhances peace and calm|Improves relationships|Brings prosperity" \
  "Keshi Pearl - A precious pearl variety known for its unique baroque shape and powerful astrological properties." \
  "Keshi Pearl is a precious gemstone that holds significant importance in Vedic astrology. These unique pearls are formed without a nucleus and have a distinctive baroque shape. Associated with the planet Moon, this beautiful white gemstone is believed to bring numerous benefits to the wearer." \
  "Keshi Pearl is deeply rooted in Vedic astrology and is associated with Moon. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Panjshir Emerald
create_gem \
  "Panjshir Emerald" \
  "Mercury" \
  "Green" \
  "precious" \
  "Enhances intelligence and communication|Brings financial success|Improves memory|Promotes creativity" \
  "Panjshir Emerald - A precious emerald gemstone from Panjshir Valley, Afghanistan, known for its exceptional green color and powerful astrological properties." \
  "Panjshir Emerald is a precious gemstone that holds significant importance in Vedic astrology. Originating from the Panjshir Valley in Afghanistan, this beautiful green gemstone is associated with the planet Mercury and is believed to bring numerous benefits to the wearer. It is highly valued for its spiritual and astrological properties." \
  "Panjshir Emerald is deeply rooted in Vedic astrology and is associated with Mercury. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Pink Tourmaline
create_gem \
  "Pink Tourmaline" \
  "Venus" \
  "Pink" \
  "semi-precious" \
  "Provides protection|Brings balance|Enhances energy|Promotes love and relationships" \
  "Pink Tourmaline - A beautiful semi-precious gemstone known for its soft pink color and healing properties." \
  "Pink Tourmaline is a semi-precious gemstone valued for its beauty and metaphysical properties. With its distinctive pink color, this gemstone has been used for centuries in jewelry and spiritual practices. It is associated with Venus and is believed to bring positive changes to the wearer's life." \
  "Pink Tourmaline holds spiritual significance in various traditions. It is believed to carry healing energies and can help balance the chakras, enhance spiritual awareness, and bring harmony to the wearer's life." \
  $((display_order++))

# Pitambari Neelam
create_gem \
  "Pitambari Neelam" \
  "Saturn" \
  "Blue/Yellow" \
  "precious" \
  "Removes obstacles|Brings discipline and focus|Enhances career growth|Protects from negative energies" \
  "Pitambari Neelam - A rare variety of sapphire with blue and yellow colors, associated with Saturn and powerful astrological properties." \
  "Pitambari Neelam is a precious gemstone that holds significant importance in Vedic astrology. This rare variety of sapphire displays both blue and yellow colors in a single stone. Associated with the planet Saturn, this beautiful gemstone is believed to bring numerous benefits to the wearer." \
  "Pitambari Neelam is deeply rooted in Vedic astrology and is associated with Saturn. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Rubellite
create_gem \
  "Rubellite" \
  "Sun" \
  "Pink/Red" \
  "semi-precious" \
  "Provides protection|Brings balance|Enhances energy|Promotes passion and vitality" \
  "Rubellite - A beautiful tourmaline variety known for its pink to red color and healing properties." \
  "Rubellite is a semi-precious gemstone valued for its beauty and metaphysical properties. This variety of tourmaline displays beautiful pink to red colors. It has been used for centuries in jewelry and spiritual practices and is believed to bring positive changes to the wearer's life." \
  "Rubellite holds spiritual significance in various traditions. It is believed to carry healing energies and can help balance the chakras, enhance spiritual awareness, and bring harmony to the wearer's life." \
  $((display_order++))

# Russian Emerald
create_gem \
  "Russian Emerald" \
  "Mercury" \
  "Green" \
  "precious" \
  "Enhances intelligence and communication|Brings financial success|Improves memory|Promotes creativity" \
  "Russian Emerald - A precious emerald gemstone from Russia, known for its exceptional green color and powerful astrological properties." \
  "Russian Emerald is a precious gemstone that holds significant importance in Vedic astrology. Originating from Russia, this beautiful green gemstone is associated with the planet Mercury and is believed to bring numerous benefits to the wearer. It is highly valued for its spiritual and astrological properties." \
  "Russian Emerald is deeply rooted in Vedic astrology and is associated with Mercury. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# South Sea Pearl
create_gem \
  "South Sea Pearl" \
  "Moon" \
  "White/Golden" \
  "precious" \
  "Promotes emotional balance|Enhances peace and calm|Improves relationships|Brings prosperity" \
  "South Sea Pearl - A precious pearl variety from the South Pacific, known for its large size and powerful astrological properties." \
  "South Sea Pearl is a precious gemstone that holds significant importance in Vedic astrology. These large pearls are cultivated in the warm waters of the South Pacific. Associated with the planet Moon, this beautiful white or golden gemstone is believed to bring numerous benefits to the wearer." \
  "South Sea Pearl is deeply rooted in Vedic astrology and is associated with Moon. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Star Ruby
create_gem \
  "Star Ruby" \
  "Sun" \
  "Red" \
  "precious" \
  "Enhances leadership qualities|Brings passion and energy|Improves confidence|Attracts wealth and prosperity" \
  "Star Ruby - A precious ruby variety with asterism (star effect), known for its exceptional red color and powerful astrological properties." \
  "Star Ruby is a precious gemstone that holds significant importance in Vedic astrology. This rare variety of ruby displays a star-like effect (asterism) when viewed under light. Associated with the planet Sun, this beautiful red gemstone is believed to bring numerous benefits to the wearer." \
  "Star Ruby is deeply rooted in Vedic astrology and is associated with Sun. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Swat Emerald
create_gem \
  "Swat Emerald" \
  "Mercury" \
  "Green" \
  "precious" \
  "Enhances intelligence and communication|Brings financial success|Improves memory|Promotes creativity" \
  "Swat Emerald - A precious emerald gemstone from Swat Valley, Pakistan, known for its exceptional green color and powerful astrological properties." \
  "Swat Emerald is a precious gemstone that holds significant importance in Vedic astrology. Originating from the Swat Valley in Pakistan, this beautiful green gemstone is associated with the planet Mercury and is believed to bring numerous benefits to the wearer. It is highly valued for its spiritual and astrological properties." \
  "Swat Emerald is deeply rooted in Vedic astrology and is associated with Mercury. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Zambian Emerald
create_gem \
  "Zambian Emerald" \
  "Mercury" \
  "Green" \
  "precious" \
  "Enhances intelligence and communication|Brings financial success|Improves memory|Promotes creativity" \
  "Zambian Emerald - A precious emerald gemstone from Zambia, known for its exceptional green color and powerful astrological properties." \
  "Zambian Emerald is a precious gemstone that holds significant importance in Vedic astrology. Originating from Zambia, this beautiful green gemstone is associated with the planet Mercury and is believed to bring numerous benefits to the wearer. It is highly valued for its spiritual and astrological properties." \
  "Zambian Emerald is deeply rooted in Vedic astrology and is associated with Mercury. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Zircon - Jarkan
create_gem \
  "Zircon - Jarkan" \
  "Jupiter" \
  "Various" \
  "semi-precious" \
  "Enhances wisdom|Brings prosperity|Improves relationships|Promotes spiritual growth" \
  "Zircon - Jarkan - A beautiful zircon gemstone variety, known for its various colors and healing properties." \
  "Zircon - Jarkan is a semi-precious gemstone valued for its beauty and metaphysical properties. Also known as Jarkan, this gemstone displays various colors and has been used for centuries in jewelry and spiritual practices. It is associated with Jupiter and is believed to bring positive changes to the wearer's life." \
  "Zircon - Jarkan holds spiritual significance in various traditions. It is believed to carry healing energies and can help balance the chakras, enhance spiritual awareness, and bring harmony to the wearer's life." \
  $((display_order++))

# African Ruby
create_gem \
  "African Ruby" \
  "Sun" \
  "Red" \
  "precious" \
  "Enhances leadership qualities|Brings passion and energy|Improves confidence|Attracts wealth and prosperity" \
  "African Ruby - A precious ruby gemstone from Africa, known for its exceptional red color and powerful astrological properties." \
  "African Ruby is a precious gemstone that holds significant importance in Vedic astrology. Originating from various African countries, this beautiful red gemstone is associated with the planet Sun and is believed to bring numerous benefits to the wearer. It is highly valued for its spiritual and astrological properties." \
  "African Ruby is deeply rooted in Vedic astrology and is associated with Sun. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

# Bangkok Yellow Sapphire
create_gem \
  "Bangkok Yellow Sapphire" \
  "Jupiter" \
  "Yellow" \
  "precious" \
  "Brings wisdom and knowledge|Attracts wealth and prosperity|Enhances spirituality|Improves relationships" \
  "Bangkok Yellow Sapphire - A precious yellow sapphire gemstone from Bangkok, known for its beautiful yellow color and powerful astrological properties." \
  "Bangkok Yellow Sapphire is a precious gemstone that holds significant importance in Vedic astrology. Originating from Bangkok, this beautiful yellow gemstone is associated with the planet Jupiter and is believed to bring numerous benefits to the wearer. It is highly valued for its spiritual and astrological properties." \
  "Bangkok Yellow Sapphire is deeply rooted in Vedic astrology and is associated with Jupiter. It is believed to balance planetary energies, enhance spiritual growth, and bring positive transformations in life." \
  $((display_order++))

echo "All missing gem categories have been added successfully!"









