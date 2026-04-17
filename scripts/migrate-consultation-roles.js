/**
 * One-time Mongo migration: pujari → jyotish, pandit → vaastu.
 * Run: node scripts/migrate-consultation-roles.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const p = await users.updateMany({ role: 'pujari' }, { $set: { role: 'jyotish' } });
  const d = await users.updateMany({ role: 'pandit' }, { $set: { role: 'vaastu' } });
  console.log('Updated pujari → jyotish:', p.modifiedCount);
  console.log('Updated pandit → vaastu:', d.modifiedCount);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
