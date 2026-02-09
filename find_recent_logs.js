// Find the most recent transaction logs
const mongoose = require('mongoose');
require('dotenv').config();

async function findRecentLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services');
    console.log('✅ Connected to MongoDB\n');

    const TransactionLog = mongoose.model('TransactionLog', new mongoose.Schema({}, { strict: false }));
    
    // Get last 10 logs
    const logs = await TransactionLog.find()
      .sort({ receivedAt: -1 })
      .limit(10)
      .lean();

    console.log('📋 Last 10 Transaction Logs:\n');
    logs.forEach((log, index) => {
      const date = new Date(log.receivedAt).toLocaleString();
      console.log(`${index + 1}. ${log.type}`);
      console.log(`   TransactionId: ${log.transactionId}`);
      console.log(`   Time: ${date}`);
      if (log.orderId) console.log(`   OrderId: ${log.orderId}`);
      if (log.sessionId) console.log(`   SessionId: ${log.sessionId}`);
      console.log('');
    });

    // Group by transactionId
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
      { $limit: 3 }
    ]);

    console.log('\n📊 Last 3 Transactions:\n');
    grouped.forEach((group, index) => {
      const date = new Date(group.latest).toLocaleString();
      console.log(`${index + 1}. TransactionId: ${group._id}`);
      console.log(`   Count: ${group.count} logs`);
      console.log(`   Types: ${group.types.join(', ')}`);
      console.log(`   Latest: ${date}`);
      console.log('');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findRecentLogs();
