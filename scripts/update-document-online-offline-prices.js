/**
 * Sets onlinePrice + offlinePrice on the first matching document by _id in:
 *   pujalistings → pujapackages → healinglistings → users
 *
 * Usage:
 *   node scripts/update-document-online-offline-prices.js [mongoId] [onlinePrice] [offlinePrice]
 *
 * Example (Vaastu expert user id):
 *   node scripts/update-document-online-offline-prices.js 694c10a2e4772ea954fbd7e2 2000 3000
 *
 * Requires: MONGODB_URI in .env
 */
const mongoose = require('mongoose');
require('dotenv').config();

const DEFAULT_ID = '694c10a2e4772ea954fbd7e2';
const ID = process.argv[2] || DEFAULT_ID;
const ONLINE = Number(process.argv[3] ?? 2000);
const OFFLINE = Number(process.argv[4] ?? 3000);

const COLLECTIONS = ['pujalistings', 'pujapackages', 'healinglistings', 'users'];

async function main() {
  if (!Number.isFinite(ONLINE) || !Number.isFinite(OFFLINE)) {
    console.error('onlinePrice and offlinePrice must be numbers');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/spiritual_services';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  let oid;
  try {
    oid = new mongoose.Types.ObjectId(ID);
  } catch (e) {
    console.error('Invalid ObjectId:', ID);
    process.exit(1);
  }

  const db = mongoose.connection.db;
  for (const collName of COLLECTIONS) {
    const r = await db.collection(collName).updateOne(
      { _id: oid },
      { $set: { onlinePrice: ONLINE, offlinePrice: OFFLINE } }
    );
    if (r.matchedCount > 0) {
      console.log(`Updated ${collName}: modified=${r.modifiedCount}, onlinePrice=${ONLINE}, offlinePrice=${OFFLINE}`);
      await mongoose.disconnect();
      return;
    }
  }

  console.error('No document with that _id in', COLLECTIONS.join(', '));
  await mongoose.disconnect();
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
