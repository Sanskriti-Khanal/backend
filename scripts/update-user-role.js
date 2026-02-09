// Script to update a user's role to 'healer'
// Usage: node scripts/update-user-role.js <phone-number>

const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  phone: String,
  username: String,
  password: String,
  fullName: String,
  role: String,
  isPhoneVerified: Boolean,
  isActive: Boolean,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function updateUserRole(phone) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services');
    console.log('Connected to MongoDB');

    const result = await User.updateOne(
      { phone: phone },
      { $set: { role: 'healer' } }
    );

    if (result.matchedCount === 0) {
      console.log(`❌ No user found with phone: ${phone}`);
    } else if (result.modifiedCount === 0) {
      console.log(`ℹ️  User with phone ${phone} already has role 'healer'`);
    } else {
      console.log(`✅ Successfully updated user ${phone} to role 'healer'`);
      console.log('⚠️  Please log out and log back in to get a new JWT token with the updated role');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const phone = process.argv[2];
if (!phone) {
  console.log('Usage: node scripts/update-user-role.js <phone-number>');
  console.log('Example: node scripts/update-user-role.js 9841234567');
  process.exit(1);
}

updateUserRole(phone);



