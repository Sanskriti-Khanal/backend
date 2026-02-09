#!/bin/bash

# Script to add Kalyan Kharel as a Jyotish expert
# Usage: ./add-kalyan-kharel.sh <admin_token>

ADMIN_TOKEN=${1:-""}

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Error: Admin token is required"
  echo "Usage: ./add-kalyan-kharel.sh <admin_token>"
  echo ""
  echo "To get admin token, login first:"
  echo "curl -X POST \"http://localhost:3000/api/v1/users/login\" \\"
  echo "  -H \"Content-Type: application/json\" \\"
  echo "  -d '{\"username\": \"admin\", \"password\": \"admin123\"}'"
  exit 1
fi

echo "📝 Adding Kalyan Kharel as Jyotish expert..."

curl -X POST "http://localhost:3000/api/v1/admin/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "phone": "9806071022",
    "username": "kalyan_kharel",
    "password": "temp123456",
    "fullName": "Kalyan Kharel",
    "role": "jyotish",
    "specialtyTitle": "Vedic Astrology & Vaastu Shastra Expert",
    "bio": "My journey into astrology and Vaastu began at Uttarmadhyama Sanskrit Secondary School, where I first explored the foundations of Jyotish (Vedic Astrology). This early experience ignited a deep spiritual curiosity, inspiring me to pursue higher education at Shastri Valmiki, where astrology and Vaastu became my primary fields of study.\n\nOver the past six years, I have been deeply engaged in researching various aspects of Vedic astrology, Vaastu Shastra, and remedial practices such as Rudraksha and Gemstone guidance and consultation. I have been offering personalized astrological insights and spiritual counseling to clients in Nepal and abroad.\n\nI am also affiliated with the South Asian Astro-Federation, through which I stay connected with modern approaches and ongoing developments in the field.\n\nMy mission is rooted in lifelong learning, sincere practice, and providing transformative guidance to help individuals align their lives with cosmic balance, spiritual harmony, and divine principles.",
    "experienceYears": 7,
    "callPrice": 3000,
    "chatPrice": 200,
    "isPhoneVerified": true,
    "isActive": true,
    "isOnline": true
  }' | jq '.'

echo ""
echo "✅ Done! Note: You can update the avatarUrl later using the update user endpoint."
