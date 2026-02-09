/**
 * Migrate all collections from local MongoDB -> Atlas (or any target).
 *
 * Safe defaults:
 * - Upserts by _id (idempotent; can re-run)
 * - Does NOT drop any target collections
 * - Supports --dry-run to preview collection counts
 *
 * Usage:
 *   node scripts/migrate-local-to-atlas.js --dry-run
 *   node scripts/migrate-local-to-atlas.js
 *
 * Options:
 *   --source <uri>   default: mongodb://localhost:27017/spiritual_services
 *   --target <uri>   default: process.env.MONGODB_URI
 *   --batch  <n>     default: 500
 *   --collections a,b,c   optional allowlist
 */

require('dotenv').config();
const mongoose = require('mongoose');

function isObjectIdLike(v) {
  return v && typeof v === 'object' && typeof v.toHexString === 'function';
}

function rewriteObjectIdsDeep(value, idMap) {
  if (isObjectIdLike(value)) {
    const key = value.toHexString();
    const mapped = idMap.get(key);
    if (mapped) return mapped;
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => rewriteObjectIdsDeep(v, idMap));
  }

  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = rewriteObjectIdsDeep(v, idMap);
    }
    return out;
  }

  return value;
}

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function redactMongoUri(uri) {
  if (!uri) return uri;
  // mongodb+srv://user:pass@host/db -> mongodb+srv://user:***@host/db
  return uri.replace(/\/\/([^:/@]+):([^@]+)@/g, '//$1:***@');
}

async function connect(uri) {
  const conn = mongoose.createConnection(uri, {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 60000,
  });
  await conn.asPromise();
  return conn;
}

async function safeBulkWrite(col, ops) {
  if (!ops.length) return { ok: true, insertedOrUpserted: 0, errors: 0 };
  try {
    const res = await col.bulkWrite(ops, { ordered: false });
    const upserted = (res.upsertedCount || 0) + (res.modifiedCount || 0) + (res.insertedCount || 0);
    return { ok: true, insertedOrUpserted: upserted, errors: 0 };
  } catch (err) {
    // BulkWriteError still means some ops may have succeeded.
    const writeErrors = err?.writeErrors || err?.result?.writeErrors || [];
    const first = writeErrors[0]?.errmsg || err?.message || 'bulkWrite error';
    console.warn(`⚠️  bulkWrite error: ${first}`);
    return { ok: false, insertedOrUpserted: 0, errors: writeErrors.length || 1 };
  }
}

async function buildUserIdMap(sourceDb, targetDb) {
  const map = new Map();
  const srcUsers = sourceDb.collection('users');
  const tgtUsers = targetDb.collection('users');

  const total = await srcUsers.estimatedDocumentCount();
  console.log(`\n👤 users mapping (${total} docs)`);

  const cursor = srcUsers.find({});
  let processed = 0;
  let reused = 0;
  let created = 0;

  while (await cursor.hasNext()) {
    const u = await cursor.next();
    if (!u) continue;

    const srcId = u._id?.toHexString ? u._id.toHexString() : String(u._id);
    const phone = u.phone;
    const username = typeof u.username === 'string' ? u.username.toLowerCase() : null;

    const existing = await tgtUsers.findOne({
      $or: [
        ...(phone ? [{ phone }] : []),
        ...(username ? [{ username }] : []),
      ],
    });

    if (existing && existing._id) {
      // Map local user -> existing Atlas user, do NOT overwrite target user doc.
      map.set(srcId, existing._id);
      reused += 1;
    } else {
      // Create user in target with same _id (preserves references).
      const ops = [
        {
          replaceOne: {
            filter: { _id: u._id },
            replacement: u,
            upsert: true,
          },
        },
      ];
      await safeBulkWrite(tgtUsers, ops);
      map.set(srcId, u._id);
      created += 1;
    }

    processed += 1;
    if (processed % 50 === 0 || processed === total) {
      console.log(`   … ${processed}/${total}`);
    }
  }

  console.log(`✅ users mapped. reused(existing): ${reused}, created(new): ${created}`);
  return map;
}

async function main() {
  const dryRun = hasFlag('--dry-run');
  const sourceUri =
    getArg('--source') || process.env.SOURCE_MONGODB_URI || 'mongodb://localhost:27017/spiritual_services';
  const targetUri = getArg('--target') || process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI;
  const batchSize = Number(getArg('--batch') || 500);
  const collectionsArg = getArg('--collections');
  const allowlist = collectionsArg
    ? collectionsArg.split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  if (!targetUri) {
    console.error('❌ Missing target MongoDB URI. Set MONGODB_URI or pass --target <uri>.');
    process.exit(1);
  }

  console.log('🔁 Mongo migration (local -> atlas)');
  console.log('  source:', redactMongoUri(sourceUri));
  console.log('  target:', redactMongoUri(targetUri));
  console.log('  batch:', batchSize);
  if (allowlist) console.log('  collections:', allowlist.join(', '));
  if (dryRun) console.log('  mode: DRY RUN');

  const sourceConn = await connect(sourceUri);
  const targetConn = await connect(targetUri);

  try {
    const sourceDb = sourceConn.db;
    const targetDb = targetConn.db;

    const all = await sourceDb.listCollections().toArray();
    let collections = all
      .map((c) => c.name)
      .filter((name) => !name.startsWith('system.'))
      .filter((name) => (allowlist ? allowlist.includes(name) : true));

    console.log(`📦 Found ${collections.length} collections to process.`);

    // Build user id mapping first (unless dry-run or users not requested).
    const shouldProcessUsers = !dryRun && (allowlist ? allowlist.includes('users') : true);
    const userIdMap = shouldProcessUsers ? await buildUserIdMap(sourceDb, targetDb) : new Map();

    // Ensure users are not processed again in generic loop.
    collections = collections.filter((c) => c !== 'users');

    for (const name of collections) {
      const srcCol = sourceDb.collection(name);
      const tgtCol = targetDb.collection(name);

      const total = await srcCol.estimatedDocumentCount();
      console.log(`\n➡️  ${name} (${total} docs)`);

      if (dryRun) continue;

      const cursor = srcCol.find({}, { batchSize });
      let processed = 0;

      while (await cursor.hasNext()) {
        const batch = [];
        while (batch.length < batchSize && (await cursor.hasNext())) {
          batch.push(await cursor.next());
        }

        const ops = batch
          .filter(Boolean)
          .map((doc) => ({
            replaceOne: {
              filter: { _id: doc._id },
              replacement: rewriteObjectIdsDeep(doc, userIdMap),
              upsert: true,
            },
          }));

        await safeBulkWrite(tgtCol, ops);

        processed += ops.length;
        if (processed % (batchSize * 5) === 0 || processed === total) {
          console.log(`   … ${processed}/${total}`);
        }
      }

      console.log(`✅ ${name} migrated: ${processed}`);
    }

    console.log('\n✅ Migration complete.');
  } finally {
    await sourceConn.close().catch(() => {});
    await targetConn.close().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  }
}

main().catch((err) => {
  console.error('❌ Migration failed:', err?.message || err);
  process.exit(1);
});

