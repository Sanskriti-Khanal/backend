// Verify that all 5 logs are stored as SEPARATE documents in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

async function verifySeparateDocuments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services');
    console.log('✅ Connected to MongoDB\n');

    const TransactionLog = mongoose.model('TransactionLog', new mongoose.Schema({}, { strict: false }));

    // Get latest transaction
    const latestLog = await TransactionLog.findOne().sort({ receivedAt: -1 }).lean();
    
    if (!latestLog) {
      console.log('❌ No transaction logs found');
      return;
    }

    const latestTransactionId = latestLog.transactionId;
    console.log('🔍 Checking transaction:', latestTransactionId);
    console.log('');

    // Get all logs for this transaction
    const allLogs = await TransactionLog.find({ transactionId: latestTransactionId })
      .sort({ receivedAt: 1 })
      .lean();

    console.log('='.repeat(80));
    console.log('VERIFICATION: Are logs stored as SEPARATE documents?');
    console.log('='.repeat(80));
    console.log('');

    const expectedTypes = [
      'CREATE_ORDER_REQUEST',
      'CREATE_ORDER_RESPONSE',
      'PAYMENT_XML',
      'GET_ORDER_STATUS_REQUEST',
      'GET_ORDER_STATUS_RESPONSE'
    ];

    let allSeparate = true;
    const documentIds = new Set();

    allLogs.forEach((log, index) => {
      const expectedType = expectedTypes[index];
      const isCorrectType = log.type === expectedType;
      const isUniqueId = !documentIds.has(log._id.toString());
      
      documentIds.add(log._id.toString());

      console.log(`📄 Document ${index + 1}:`);
      console.log(`   ✅ Type: ${log.type} ${isCorrectType ? '✓' : '✗'}`);
      console.log(`   ✅ _id: ${log._id} ${isUniqueId ? '(UNIQUE)' : '(DUPLICATE!)'}`);
      console.log(`   ✅ Collection: transactionlogs`);
      console.log(`   ✅ TransactionId: ${log.transactionId}`);
      console.log(`   ✅ Created At: ${new Date(log.createdAt).toISOString()}`);
      console.log(`   ✅ Updated At: ${new Date(log.updatedAt).toISOString()}`);
      console.log(`   ✅ This is a SEPARATE document in MongoDB`);
      console.log('');

      if (!isCorrectType || !isUniqueId) {
        allSeparate = false;
      }
    });

    console.log('='.repeat(80));
    console.log('');

    if (allSeparate && allLogs.length === 5) {
      console.log('✅ SUCCESS: All 5 logs are stored as SEPARATE documents!');
      console.log('');
      console.log('📊 Summary:');
      console.log(`   • Total documents: ${allLogs.length}`);
      console.log(`   • Unique _ids: ${documentIds.size}`);
      console.log(`   • Collection: transactionlogs`);
      console.log(`   • Each log is a separate MongoDB document`);
      console.log(`   • Each document has its own _id, createdAt, updatedAt`);
      console.log('');
      console.log('💡 In MongoDB Compass/Atlas:');
      console.log('   1. Open collection: transactionlogs');
      console.log(`   2. Filter: { "transactionId": "${latestTransactionId}" }`);
      console.log('   3. You will see 5 SEPARATE documents (rows)');
      console.log('   4. Each document has its own _id and fields');
    } else {
      console.log('❌ ERROR: Logs are NOT stored separately!');
      console.log(`   Expected 5 separate documents, found: ${allLogs.length}`);
      console.log(`   Unique _ids: ${documentIds.size}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifySeparateDocuments();
