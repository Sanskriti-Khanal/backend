// Script to view all 5 transaction logs in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

async function viewLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services');
    console.log('✅ Connected to MongoDB\n');

    const TransactionLog = mongoose.model('TransactionLog', new mongoose.Schema({}, { strict: false }));

    // Get latest transaction
    const latestLog = await TransactionLog.findOne().sort({ receivedAt: -1 }).lean();
    
    if (!latestLog) {
      console.log('❌ No transaction logs found in database');
      return;
    }

    const latestTransactionId = latestLog.transactionId;
    console.log('🔍 Latest Transaction ID:', latestTransactionId);
    console.log('');

    // Get all logs for this transaction
    const allLogs = await TransactionLog.find({ transactionId: latestTransactionId })
      .sort({ receivedAt: 1 })
      .lean();

    console.log('📊 ALL 5 TRANSACTION LOGS IN transactionlogs COLLECTION:\n');
    console.log('='.repeat(80));
    
    const logNames = [
      '1. CREATE_ORDER_REQUEST',
      '2. CREATE_ORDER_RESPONSE',
      '3. PAYMENT_XML',
      '4. GET_ORDER_STATUS_REQUEST',
      '5. GET_ORDER_STATUS_RESPONSE'
    ];

    allLogs.forEach((log, index) => {
      console.log(`\n${logNames[index] || `${index + 1}. ${log.type}`}`);
      console.log('-'.repeat(80));
      console.log('Document ID (_id):', log._id);
      console.log('Type:', log.type);
      console.log('TransactionId:', log.transactionId);
      console.log('OrderId:', log.orderId || 'N/A');
      console.log('SessionId:', log.sessionId || 'N/A');
      console.log('Received At:', new Date(log.receivedAt).toLocaleString());
      console.log('Has XML Data:', log.xmlData ? `Yes (${log.xmlData.length} characters)` : 'No');
      if (log.metadata) {
        console.log('Metadata:', JSON.stringify(log.metadata, null, 2));
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Total: ${allLogs.length} logs found in transactionlogs collection`);
    console.log(`\n📝 MongoDB Query to view these logs:`);
    console.log(`   Collection: transactionlogs`);
    console.log(`   Filter: { transactionId: "${latestTransactionId}" }`);
    console.log(`   Sort: { receivedAt: 1 }`);
    console.log(`\n💡 In MongoDB Compass/Atlas:`);
    console.log(`   1. Select database: ${process.env.MONGODB_URI?.split('/').pop() || 'spiritual_services'}`);
    console.log(`   2. Select collection: transactionlogs`);
    console.log(`   3. Filter: { "transactionId": "${latestTransactionId}" }`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

viewLogs();
