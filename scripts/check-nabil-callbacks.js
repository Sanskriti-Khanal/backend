/**
 * Script to check Nabil Bank callbacks stored in database
 * Run with: node scripts/check-nabil-callbacks.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import the NabilCallback model
const { NabilCallbackModel } = require('../dist/models/NabilCallback.model');

async function checkCallbacks() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all callbacks, sorted by most recent first
    const callbacks = await NabilCallbackModel.find()
      .sort({ receivedAt: -1 })
      .limit(10)
      .lean();

    console.log('========================================');
    console.log(`📊 Found ${callbacks.length} callback(s) in database`);
    console.log('========================================\n');

    if (callbacks.length === 0) {
      console.log('⚠️  No callbacks found in database.');
      console.log('   Make sure you have sent test POST requests to the endpoints.');
    } else {
      callbacks.forEach((callback, index) => {
        console.log(`\n--- Callback #${index + 1} ---`);
        console.log(`Order ID: ${callback.orderId}`);
        console.log(`Session ID: ${callback.sessionId}`);
        console.log(`Status: ${callback.status}`);
        console.log(`Amount: ${callback.amount} ${callback.currencyISO}`);
        console.log(`Received At: ${callback.receivedAt}`);
        console.log(`Order Description: ${callback.orderDescription || 'N/A'}`);
        console.log(`Transaction Type: ${callback.transactionType}`);
        console.log(`Bank Name: ${callback.bankName}`);
        if (callback.encryptedOrderId) {
          console.log(`Encrypted Order ID: ${callback.encryptedOrderId}`);
        }
      });
    }

    // Get count by status
    const statusCounts = await NabilCallbackModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n========================================');
    console.log('📈 Status Summary:');
    console.log('========================================');
    statusCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count}`);
    });

    // Get total count
    const totalCount = await NabilCallbackModel.countDocuments();
    console.log(`\n  Total: ${totalCount}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkCallbacks();





