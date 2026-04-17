/**
 * Upserts Santosh Vashistha as premium_jyotish (busy; consult via paid session ticket).
 *
 * Usage:
 *   node scripts/seed-premium-jyotish-santosh.js [phone] [password]
 *
 * Defaults: phone 977980099901, password ChangeMePremium123!
 *
 * Requires: MONGODB_URI in .env
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const PREMIUM_ROLE = 'premium_jyotish';
const DEFAULT_PHONE = process.argv[2] || '977980099901';
const DEFAULT_PASSWORD = process.argv[3] || 'ChangeMePremium123!';

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['user', 'healer', 'jyotish', 'premium_jyotish', 'vaastu', 'admin'],
      default: 'user',
    },
    isPhoneVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    availabilityStatus: {
      type: String,
      enum: ['active', 'not_active', 'busy'],
      default: 'not_active',
    },
    specialtyTitle: String,
    bio: String,
    isOnline: { type: Boolean, default: false },
    avatarUrl: String,
    callPrice: { type: Number, min: 0 },
    chatPrice: { type: Number, min: 0 },
    experienceYears: { type: Number, min: 0 },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

const AVATAR_URL =
  'https://res.cloudinary.com/dowwwaitp/image/upload/v1775832022/2023-01-25_onocie.jpg';

const BIO =
  "Santosh Vashistha, the named best astrologer in Asia by the Asian Astrologer Congress and the World Astrology Federation, hails from a little-known town in southeastern part of Nepal called Jhapa. Featured in Bloomberg, he has gained international recognition for his ability to read the stars and make predictions. He believes in research-based astrology and his readings focus more on substantive geopolitical predictions and personal fortunes than hokey horoscope drivel.\n\n" +
  'With immense interest in Astrology, Santosh Vashistha pursued his degree in vedic astrology from Varanasi, India. With his research-based accurate predictions, he has his client base diversified at a global level.\n\n' +
  "His regular clients include Nepal's Prime Minister Sher Bahadur Deuba, Bollywood actress Manisha Koirala, and politicians, movie producers and American celebrities whose names he wouldn't reveal. All of them treat his readings as gospel, so seldom is he wrong.";

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const username = 'santosh.vashistha';
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const doc = {
    phone: DEFAULT_PHONE,
    username,
    password: hashedPassword,
    fullName: 'Santosh Vashistha',
    role: PREMIUM_ROLE,
    isPhoneVerified: true,
    isActive: true,
    availabilityStatus: 'busy',
    isOnline: false,
    avatarUrl: AVATAR_URL,
    specialtyTitle: "Asia's leading research-based Vedic astrologer",
    bio: BIO,
    experienceYears: 25,
    callPrice: 15000,
  };

  const existing = await User.findOne({
    $or: [{ username }, { phone: DEFAULT_PHONE }],
  });

  if (existing) {
    await User.updateOne(
      { _id: existing._id },
      {
        $set: {
          ...doc,
          password: hashedPassword,
        },
        $unset: { chatPrice: '' },
      }
    );
    console.log('Updated premium jyotish user:', existing._id.toString());
  } else {
    const created = await User.create(doc);
    console.log('Created premium jyotish user:', created._id.toString());
  }

  console.log('Login: username', username, '| phone', DEFAULT_PHONE);
  console.log('Password:', DEFAULT_PASSWORD);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
