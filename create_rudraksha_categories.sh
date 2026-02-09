#!/bin/bash

# Admin token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGMwMzk2ZmEzMTg1NmI0YzY4ZTA2NyIsInJvbGUiOiJhZG1pbiIsInBob25lIjoiOTgwMDAwMDAwMCIsImlhdCI6MTc2NjU4OTM0MSwiZXhwIjoxNzY3MTk0MTQxfQ.T-52JcoBAR5TniD_Vd0Q9seFKq6LmHpSZ687hwp5Z_k"

BASE_URL="http://localhost:3000/api/v1/rudraksha-categories"

echo "Creating Rudraksha Categories..."

# Create 0 to 26 Mukhi Rudraksha
for i in {0..26}; do
  echo "Creating $i Mukhi Rudraksha..."
  
  curl -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"name\": \"$i Mukhi Rudraksha\",
      \"slug\": \"$i-mukhi\",
      \"description\": \"$i Mukhi Rudraksha - Sacred bead with $i natural lines (mukhis) on its surface.\",
      \"detailedDescription\": \"The $i Mukhi Rudraksha is a sacred bead with $i natural lines (mukhis) on its surface. It is associated with Lord Shiva and symbolizes health, wealth, and overall well-being. Wearing this bead can reduce stress, improve focus, enhance confidence, and attract positive vibrations in daily life. It is often used in meditation to strengthen spiritual growth and mental clarity.\",
      \"spiritualSignificance\": \"The $i Mukhi Rudraksha represents Lord Shiva's energy, promoting wisdom, inner peace, and spiritual development. It helps in balancing the chakras and enhancing spiritual awareness.\",
      \"associatedPlanet\": \"Jupiter\",
      \"associatedDeity\": \"Lord Shiva\",
      \"categoryType\": \"mukhi\",
      \"mukhiCount\": $i,
      \"displayOrder\": $i,
      \"isActive\": true,
      \"benefits\": [
        \"Promotes spiritual growth\",
        \"Enhances mental clarity\",
        \"Brings peace and harmony\",
        \"Improves focus and concentration\"
      ]
    }"
  
  echo -e "\n"
  sleep 0.5
done

# Create Special Categories
echo "Creating Special Rudraksha Categories..."

# Gaurishankar Rudraksha
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Gaurishankar Rudraksha\",
    \"slug\": \"gaurishankar\",
    \"description\": \"Gaurishankar Rudraksha - A rare and powerful combination of two naturally joined beads.\",
    \"detailedDescription\": \"Gaurishankar Rudraksha is a rare and powerful rudraksha formed when two beads naturally join together. It represents the divine union of Lord Shiva (Shankar) and Goddess Parvati (Gauri). This sacred bead is believed to bring harmony in relationships, enhance marital bliss, and promote unity. It is highly valued for its ability to balance masculine and feminine energies.\",
    \"spiritualSignificance\": \"Gaurishankar Rudraksha symbolizes the divine union of Shiva and Parvati, representing perfect harmony and balance. It helps in strengthening relationships, promoting love, and bringing peace to the household.\",
    \"associatedPlanet\": \"Venus\",
    \"associatedDeity\": \"Lord Shiva and Goddess Parvati\",
    \"categoryType\": \"special\",
    \"displayOrder\": 27,
    \"isActive\": true,
    \"benefits\": [
      \"Enhances marital harmony\",
      \"Strengthens relationships\",
      \"Brings balance in life\",
      \"Promotes love and unity\"
    ]
  }"

echo -e "\n"

# Trijuti Rudraksha
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Trijuti Rudraksha\",
    \"slug\": \"trijuti-rudraksha\",
    \"description\": \"Trijuti Rudraksha - A rare three-bead combination representing the divine trinity.\",
    \"detailedDescription\": \"Trijuti Rudraksha is an extremely rare rudraksha formed when three beads naturally join together. It represents the divine trinity of Brahma, Vishnu, and Mahesh (Shiva). This powerful bead is believed to provide protection from negative energies, enhance spiritual power, and bring divine blessings. It is considered one of the most auspicious rudrakshas.\",
    \"spiritualSignificance\": \"Trijuti Rudraksha represents the trinity of creation, preservation, and destruction. It helps in achieving spiritual enlightenment, provides divine protection, and brings the blessings of all three major deities.\",
    \"associatedPlanet\": \"Jupiter\",
    \"associatedDeity\": \"Brahma, Vishnu, and Shiva\",
    \"categoryType\": \"special\",
    \"displayOrder\": 28,
    \"isActive\": true,
    \"benefits\": [
      \"Provides divine protection\",
      \"Enhances spiritual power\",
      \"Brings blessings of trinity\",
      \"Removes negative energies\"
    ]
  }"

echo -e "\n"

# Ganesh Rudraksha
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Ganesh Rudraksha\",
    \"slug\": \"ganesh-rudraksha\",
    \"description\": \"Ganesh Rudraksha - A special rudraksha with a natural trunk-like formation.\",
    \"detailedDescription\": \"Ganesh Rudraksha is a unique rudraksha that naturally resembles the form of Lord Ganesha with a trunk-like formation. This sacred bead is believed to remove obstacles, bring success in endeavors, and enhance wisdom. It is particularly beneficial for students, professionals, and those seeking to overcome challenges in life.\",
    \"spiritualSignificance\": \"Ganesh Rudraksha represents the remover of obstacles and the god of wisdom. It helps in clearing path to success, enhancing intelligence, and bringing prosperity. Wearing this rudraksha is believed to invoke the blessings of Lord Ganesha.\",
    \"associatedPlanet\": \"Mercury\",
    \"associatedDeity\": \"Lord Ganesha\",
    \"categoryType\": \"special\",
    \"displayOrder\": 29,
    \"isActive\": true,
    \"benefits\": [
      \"Removes obstacles\",
      \"Enhances wisdom and intelligence\",
      \"Brings success in endeavors\",
      \"Promotes prosperity\"
    ]
  }"

echo -e "\n"

# Garbha Gauri Rudraksha
curl -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Garbha Gauri Rudraksha\",
    \"slug\": \"garbha-gauri-rudraksha\",
    \"description\": \"Garbha Gauri Rudraksha - A sacred bead representing the divine mother and fertility.\",
    \"detailedDescription\": \"Garbha Gauri Rudraksha is a special rudraksha associated with Goddess Parvati in her form as Garbha Gauri, the goddess of fertility and motherhood. This sacred bead is believed to bless couples with children, protect during pregnancy, and promote maternal health. It is highly revered by those seeking blessings for fertility and family happiness.\",
    \"spiritualSignificance\": \"Garbha Gauri Rudraksha represents the divine mother's power of creation and fertility. It helps in blessing couples with children, protecting mothers and children, and promoting family harmony. It is believed to invoke the blessings of Goddess Parvati.\",
    \"associatedPlanet\": \"Moon\",
    \"associatedDeity\": \"Goddess Parvati (Garbha Gauri)\",
    \"categoryType\": \"special\",
    \"displayOrder\": 30,
    \"isActive\": true,
    \"benefits\": [
      \"Blesses with fertility\",
      \"Protects during pregnancy\",
      \"Promotes maternal health\",
      \"Brings family harmony\"
    ]
  }"

echo -e "\n"
echo "All Rudraksha categories created successfully!"


