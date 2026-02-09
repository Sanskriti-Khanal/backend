// Check logs for a specific order
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

// Get orderId from command line or use default
const orderId = process.argv[2] || '13408565';
const sessionId = process.argv[3] || 'xk7warqgl20j';

async function checkTransaction() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services');
    console.log('✅ Connected to MongoDB\n');
    console.log(`🔍 Checking logs for:`);
    console.log(`   OrderId: ${orderId}`);
    console.log(`   SessionId: ${sessionId}\n`);

    // Find payment record to get transactionId
    const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
    const payment = await Payment.findOne({
      $or: [
        { gatewayOrderId: { $regex: orderId } },
        { gatewaySessionId: sessionId },
        { 'metadata.decryptedOrderID': orderId }
      ]
    });

    if (payment && payment.metadata?.transactionId) {
      const transactionId = payment.metadata.transactionId;
      console.log(`✅ Found payment record`);
      console.log(`   TransactionId: ${transactionId}\n`);

      // Find all logs for this transaction
      const logs = await TransactionLog.find({ transactionId })
        .sort({ receivedAt: 1 })
        .lean();

      console.log(`📋 Found ${logs.length} transaction logs:\n`);
      logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.type}`);
        console.log(`   ID: ${log._id}`);
        console.log(`   ReceivedAt: ${log.receivedAt}`);
        if (log.orderId) console.log(`   OrderId: ${log.orderId}`);
        if (log.sessionId) console.log(`   SessionId: ${log.sessionId}`);
        console.log('');
      });

      if (logs.length === 0) {
        console.log('❌ No transaction logs found for this transactionId');
        console.log('   This means the logs were not created when you clicked Pay\n');
      } else if (logs.length < 5) {
        console.log(`⚠️ Only ${logs.length} logs found (expected 5)`);
        console.log('   Missing logs:');
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
            console.log(`   - ${type}`);
          }
        });
      } else {
        console.log('✅ All 5 logs found!');
      }
    } else {
      console.log('❌ Payment record not found');
      console.log('   This means the payment record was not created when you clicked Pay\n');
      
      // Try to find logs by orderId/sessionId directly
      console.log('🔍 Searching for logs by OrderId/SessionId...\n');
      const logs = await TransactionLog.find({
        $or: [
          { orderId: orderId },
          { sessionId: sessionId }
        ]
      }).sort({ receivedAt: 1 }).lean();

      if (logs.length > 0) {
        console.log(`Found ${logs.length} logs:\n`);
        logs.forEach((log, index) => {
          console.log(`${index + 1}. ${log.type} (TransactionId: ${log.transactionId})`);
        });
      } else {
        console.log('❌ No logs found for this OrderId/SessionId');
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTransaction();
