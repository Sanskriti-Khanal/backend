// Script to create the first admin user
// Usage: node scripts/create-admin-user.js <phone> <username> <password> <fullName>
// Example: node scripts/create-admin-user.js 9800000000 admin admin123 "Admin User"

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['user', 'healer', 'jyotish', 'pujari', 'pandit', 'admin'], default: 'user' },
  isPhoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  specialtyTitle: String,
  bio: String,
  isOnline: { type: Boolean, default: false },
  dob: Date,
  birthTime: String,
  birthPlace: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdminUser(phone, username, password, fullName) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services');
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ phone }, { username: username.toLowerCase() }] 
    });

    if (existingUser) {
      console.log(`❌ User already exists with phone: ${phone} or username: ${username}`);
      if (existingUser.role === 'admin') {
        console.log('ℹ️  User is already an admin');
      } else {
        console.log(`ℹ️  Updating existing user to admin role...`);
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
          { _id: existingUser._id },
          { 
            $set: { 
              role: 'admin',
              password: hashedPassword,
              isPhoneVerified: true,
              isActive: true
            } 
          }
        );
        console.log('✅ Updated user to admin role');
      }
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await User.create({
      phone,
      username: username.toLowerCase(),
      password: hashedPassword,
      fullName,
      role: 'admin',
      isPhoneVerified: true,
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Phone: ${adminUser.phone}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Full Name: ${adminUser.fullName}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   User ID: ${adminUser._id}`);
    console.log('');
    console.log('You can now login with:');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Password: ${password}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - phone or username already exists');
    }
    process.exit(1);
  }
}

const phone = process.argv[2];
const username = process.argv[3];
const password = process.argv[4];
const fullName = process.argv[5];

if (!phone || !username || !password || !fullName) {
  console.log('Usage: node scripts/create-admin-user.js <phone> <username> <password> <fullName>');
  console.log('Example: node scripts/create-admin-user.js 9800000000 admin admin123 "Admin User"');
  console.log('');
  console.log('Requirements:');
  console.log('  - Phone: 10 digits (e.g., 9800000000)');
  console.log('  - Username: at least 3 characters');
  console.log('  - Password: at least 6 characters');
  console.log('  - Full Name: at least 2 characters');
  process.exit(1);
}

// Validate phone
if (!/^[0-9]{10}$/.test(phone)) {
  console.error('❌ Error: Phone must be exactly 10 digits');
  process.exit(1);
}

// Validate username
if (username.length < 3) {
  console.error('❌ Error: Username must be at least 3 characters');
  process.exit(1);
}

// Validate password
if (password.length < 6) {
  console.error('❌ Error: Password must be at least 6 characters');
  process.exit(1);
}

// Validate fullName
if (fullName.length < 2) {
  console.error('❌ Error: Full name must be at least 2 characters');
  process.exit(1);
}

createAdminUser(phone, username, password, fullName);

