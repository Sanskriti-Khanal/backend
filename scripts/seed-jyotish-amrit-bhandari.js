/**
 * Upserts Amrit Bhandari as a normal jyotish expert (active, chat + call).
 *
 * Usage:
 *   node scripts/seed-jyotish-amrit-bhandari.js [phone] [password]
 *
 * Defaults: phone 977980099902, password ChangeMeJyotish123!
 *
 * Requires: MONGODB_URI in .env
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const ROLE = 'jyotish';
const DEFAULT_PHONE = process.argv[2] || '977980099902';
const DEFAULT_PASSWORD = process.argv[3] || 'ChangeMeJyotish123!';

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
  'https://res.cloudinary.com/dowwwaitp/image/upload/v1775833557/08529276-fecf-40ce-8227-f78582451822_yqaq4g.jpg';

const BIO =
  "Amrit Bhandari is a dedicated Vedic astrologer from Nepal with 7 years of professional experience. Holding a Bachelor's degree in Astrology, he offers deep insights into career, relationships, and life's challenges through accurate horoscope analysis and traditional wisdom.\n\n" +
  'Special strength / approach\n' +
  'Rooted in classical Vedic knowledge and academic training, Amrit provides clear, practical, and compassionate guidance to help clients navigate their life path with confidence and clarity.';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const username = 'amrit.bhandari';
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const doc = {
    phone: DEFAULT_PHONE,
    username,
    password: hashedPassword,
    fullName: 'Amrit Bhandari',
    role: ROLE,
    isPhoneVerified: true,
    isActive: true,
    availabilityStatus: 'active',
    isOnline: true,
    avatarUrl: AVATAR_URL,
    specialtyTitle: 'Vedic astrologer · B.A. Astrology',
    bio: BIO,
    experienceYears: 7,
    chatPrice: 200,
    callPrice: 2000,
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
      }
    );
    console.log('Updated jyotish user:', existing._id.toString());
  } else {
    const created = await User.create(doc);
    console.log('Created jyotish user:', created._id.toString());
  }

  console.log('Login: username', username, '| phone', DEFAULT_PHONE);
  console.log('Password:', DEFAULT_PASSWORD);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
