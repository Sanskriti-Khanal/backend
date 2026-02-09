// Diagnostic script to find why only one log is stored
const mongoose = require('mongoose');
require('dotenv').config();

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services');
    console.log('✅ Connected to MongoDB\n');

    const TransactionLog = mongoose.model('TransactionLog', new mongoose.Schema({}, { strict: false }));
    const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
    const NabilCallback = mongoose.model('NabilCallback', new mongoose.Schema({}, { strict: false }));

    // Get latest callback
    const latestCallback = await NabilCallback.findOne().sort({ receivedAt: -1 }).lean();
    
    if (!latestCallback) {
      console.log('❌ No callbacks found in database');
      return;
    }

    console.log('📋 Latest Callback:');
    console.log('  OrderId:', latestCallback.orderId);
    console.log('  SessionId:', latestCallback.sessionId);
    console.log('  EncryptedOrderId:', latestCallback.encryptedOrderId);
    console.log('  Status:', latestCallback.status);
    console.log('  ReceivedAt:', latestCallback.receivedAt);
    console.log('');

    // Try to find payment record
    console.log('🔍 Searching for payment record...');
    let payment = await Payment.findOne({
      gatewayOrderId: latestCallback.encryptedOrderId
    }).lean();

    if (!payment && latestCallback.sessionId) {
      payment = await Payment.findOne({
        gatewaySessionId: latestCallback.sessionId
      }).lean();
    }

    if (!payment && latestCallback.orderId) {
      payment = await Payment.findOne({
        'metadata.decryptedOrderID': latestCallback.orderId
      }).lean();
    }

    if (payment) {
      console.log('✅ Payment record found:');
      console.log('  Payment ID:', payment._id);
      console.log('  TransactionId:', payment.metadata?.transactionId || '❌ MISSING!');
      console.log('  GatewayOrderId:', payment.gatewayOrderId);
      console.log('  GatewaySessionId:', payment.gatewaySessionId);
      console.log('  Status:', payment.status);
      console.log('');

      const transactionId = payment.metadata?.transactionId;
      if (transactionId) {
        console.log('📊 Checking transaction logs for transactionId:', transactionId);
        const logs = await TransactionLog.find({ transactionId }).sort({ receivedAt: 1 }).lean();
        
        console.log(`\nFound ${logs.length} logs:\n`);
        logs.forEach((log, i) => {
          console.log(`${i + 1}. ${log.type}`);
          console.log(`   ID: ${log._id}`);
          console.log(`   Time: ${new Date(log.receivedAt).toLocaleString()}`);
          if (log.orderId) console.log(`   OrderId: ${log.orderId}`);
          if (log.sessionId) console.log(`   SessionId: ${log.sessionId}`);
          console.log('');
        });

        if (logs.length < 5) {
          console.log('⚠️ Missing logs:');
          const expected = [
            'CREATE_ORDER_REQUEST',
            'CREATE_ORDER_RESPONSE',
            'PAYMENT_XML',
            'GET_ORDER_STATUS_REQUEST',
            'GET_ORDER_STATUS_RESPONSE'
          ];
          const found = logs.map(l => l.type);
          expected.forEach(type => {
            if (!found.includes(type)) {
              console.log(`   ❌ ${type}`);
            } else {
              console.log(`   ✅ ${type}`);
            }
          });
        } else {
          console.log('✅ All 5 logs found!');
        }
      } else {
        console.log('❌ Payment record exists but has NO transactionId in metadata!');
        console.log('   This means callbacks cannot link to CreateOrder logs.');
      }
    } else {
      console.log('❌ Payment record NOT FOUND!');
      console.log('   This means:');
      console.log('   1. CreateOrder failed before payment record was created');
      console.log('   2. OR payment record creation failed');
      console.log('   3. Callbacks cannot find transactionId, so logs are split');
      console.log('');
      
      // Check if there are any CreateOrder logs
      const createOrderLogs = await TransactionLog.find({
        $or: [
          { orderId: latestCallback.orderId },
          { sessionId: latestCallback.sessionId }
        ]
      }).sort({ receivedAt: 1 }).lean();
      
      if (createOrderLogs.length > 0) {
        console.log(`Found ${createOrderLogs.length} CreateOrder logs (but payment record missing):`);
        createOrderLogs.forEach(log => {
          console.log(`  - ${log.type} (TransactionId: ${log.transactionId})`);
        });
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnose();
