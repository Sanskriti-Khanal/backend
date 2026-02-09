// Quick script to check transaction logs in database
const mongoose = require('mongoose');
require('dotenv').config();

const TransactionLogSchema = new mongoose.Schema({
  transactionId: String,
  type: String,
  orderId: String,
  sessionId: String,
  xmlData: String,
  metadata: mongoose.Schema.Types.Mixed,
  receivedAt: Date,
}, { timestamps: true });

const TransactionLog = mongoose.model('TransactionLog', TransactionLogSchema);

async function checkLogs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services');
    console.log('✅ Connected to MongoDB\n');

    // Count total logs
    const totalLogs = await TransactionLog.countDocuments();
    console.log(`📊 Total transaction logs: ${totalLogs}\n`);

    // Get recent logs
    const recentLogs = await TransactionLog.find()
      .sort({ receivedAt: -1 })
      .limit(10)
      .lean();

    console.log('📋 Recent 10 logs:');
    recentLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.type}`);
      console.log(`   TransactionId: ${log.transactionId}`);
      console.log(`   OrderId: ${log.orderId || 'N/A'}`);
      console.log(`   SessionId: ${log.sessionId || 'N/A'}`);
      console.log(`   ReceivedAt: ${log.receivedAt}`);
      console.log(`   ID: ${log._id}`);
    });

    // Group by transactionId
    console.log('\n\n📊 Logs grouped by transactionId:');
    const grouped = await TransactionLog.aggregate([
      {
        $group: {
          _id: '$transactionId',
          count: { $sum: 1 },
          types: { $push: '$type' },
          latest: { $max: '$receivedAt' }
        }
      },
      { $sort: { latest: -1 } },
      { $limit: 5 }
    ]);

    grouped.forEach((group, index) => {
      console.log(`\n${index + 1}. TransactionId: ${group._id}`);
      console.log(`   Count: ${group.count} logs`);
      console.log(`   Types: ${group.types.join(', ')}`);
      console.log(`   Latest: ${group.latest}`);
    });

    // Check for logs with exactly 5 entries (complete transaction)
    console.log('\n\n✅ Complete transactions (5 logs):');
    const complete = grouped.filter(g => g.count === 5);
    if (complete.length > 0) {
      complete.forEach(c => {
        console.log(`   ${c._id}: ${c.types.join(', ')}`);
      });
    } else {
      console.log('   No complete transactions found');
    }

    // Check for incomplete transactions
    console.log('\n\n⚠️ Incomplete transactions:');
    const incomplete = grouped.filter(g => g.count < 5);
    if (incomplete.length > 0) {
      incomplete.forEach(c => {
        console.log(`   ${c._id}: ${c.count} logs - ${c.types.join(', ')}`);
      });
    } else {
      console.log('   All transactions are complete');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkLogs();
