// Verification script to check that all 5 required logs are stored separately
const mongoose = require('mongoose');
require('dotenv').config();

async function verifyLogs() {
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
    console.log('🔍 Checking logs for latest transaction:', latestTransactionId);
    console.log('');

    // Get all logs for this transaction
    const allLogs = await TransactionLog.find({ transactionId: latestTransactionId })
      .sort({ receivedAt: 1 })
      .lean();

    // Expected 5 log types
    const requiredLogs = [
      { type: 'CREATE_ORDER_REQUEST', name: '1. CreateOrder Request' },
      { type: 'CREATE_ORDER_RESPONSE', name: '2. CreateOrder Response' },
      { type: 'PAYMENT_XML', name: '3. Payment Response XML' },
      { type: 'GET_ORDER_STATUS_REQUEST', name: '4. GetOrderStatus Request' },
      { type: 'GET_ORDER_STATUS_RESPONSE', name: '5. GetOrderStatus Response' },
    ];

    console.log('📊 VERIFICATION RESULTS:\n');
    console.log('='.repeat(60));
    
    let allPresent = true;
    requiredLogs.forEach((required, index) => {
      const log = allLogs.find(l => l.type === required.type);
      
      if (log) {
        console.log(`✅ ${required.name}`);
        console.log(`   Type: ${log.type}`);
        console.log(`   Document ID: ${log._id}`);
        console.log(`   Stored At: ${new Date(log.receivedAt).toLocaleString()}`);
        console.log(`   OrderId: ${log.orderId || 'N/A'}`);
        console.log(`   SessionId: ${log.sessionId || 'N/A'}`);
        console.log(`   Has XML Data: ${log.xmlData ? 'Yes (' + log.xmlData.length + ' chars)' : 'No'}`);
        console.log('');
      } else {
        console.log(`❌ ${required.name} - MISSING!`);
        console.log('');
        allPresent = false;
      }
    });

    console.log('='.repeat(60));
    console.log(`\nTotal logs found: ${allLogs.length}`);
    console.log(`Expected: 5`);
    
    if (allPresent && allLogs.length >= 5) {
      console.log('\n✅ SUCCESS: All 5 required logs are stored separately in the database!');
    } else {
      console.log('\n❌ FAILURE: Not all 5 logs are present!');
      console.log('\nMissing logs:');
      requiredLogs.forEach(required => {
        const found = allLogs.find(l => l.type === required.type);
        if (!found) {
          console.log(`   - ${required.type}`);
        }
      });
    }

    // Show any extra logs (if more than 5)
    if (allLogs.length > 5) {
      console.log(`\n⚠️ Note: Found ${allLogs.length} logs total (expected 5). Extra logs:`);
      allLogs.forEach(log => {
        if (!requiredLogs.find(r => r.type === log.type)) {
          console.log(`   - ${log.type} (ID: ${log._id})`);
        }
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyLogs();
