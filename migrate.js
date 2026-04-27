/**
 * migrate.js — Chuyển dữ liệu từ shipflow_data (monolithic) sang các collection riêng
 *
 * Chạy: node migrate.js
 *
 * Schema mới:
 *   users              — giữ nguyên, _id dùng làm FK
 *   shipflow_wallets   — { userId, app, cash, mb, momo, updatedAt }
 *   shipflow_orders    — { userId, ...orderFields, createdAt }
 *   shipflow_transfers — { userId, ...transferFields }
 *   shipflow_tipapp    — { userId, ...tipFields }
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function migrate() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('spf-management');

  const usersCol     = db.collection('users');
  const oldCol       = db.collection('shipflow_data');
  const walletsCol   = db.collection('shipflow_wallets');
  const ordersCol    = db.collection('shipflow_orders');
  const transfersCol = db.collection('shipflow_transfers');
  const tipAppCol    = db.collection('shipflow_tipapp');

  // Tạo indexes cho các collection mới
  await walletsCol.createIndex({ userId: 1 }, { unique: true });
  await ordersCol.createIndex({ userId: 1 });
  await transfersCol.createIndex({ userId: 1 });
  await tipAppCol.createIndex({ userId: 1 });

  const allOldDocs = await oldCol.find({}).toArray();
  console.log(`Tìm thấy ${allOldDocs.length} user cần migrate...`);

  let success = 0;
  let skipped = 0;

  for (const doc of allOldDocs) {
    const user = await usersCol.findOne({ username: doc.username });

    if (!user) {
      console.warn(`  ⚠ Không tìm thấy user "${doc.username}" trong collection users — bỏ qua`);
      skipped++;
      continue;
    }

    const userId = user._id; // ObjectId — dùng làm FK

    // 1. Wallets (upsert — mỗi user chỉ có 1 doc)
    await walletsCol.updateOne(
      { userId },
      {
        $set: {
          userId,
          app:  doc.wallets?.app  ?? 0,
          cash: doc.wallets?.cash ?? 0,
          mb:   doc.wallets?.mb   ?? 0,
          momo: doc.wallets?.momo ?? 0,
          updatedAt: doc.updatedAt ?? new Date(),
        }
      },
      { upsert: true }
    );

    // 2. Orders — mỗi order thành 1 document riêng, MongoDB tự đánh _id
    if (doc.orders?.length > 0) {
      const orderDocs = doc.orders.map(order => {
        // Bỏ id cũ (nếu có), để MongoDB tự sinh _id mới
        const { id, _id, ...rest } = order;
        return { userId, ...rest };
      });
      await ordersCol.insertMany(orderDocs, { ordered: false });
    }

    // 3. Transfers
    if (doc.transfers?.length > 0) {
      const transferDocs = doc.transfers.map(t => {
        const { id, _id, ...rest } = t;
        return { userId, ...rest };
      });
      await transfersCol.insertMany(transferDocs, { ordered: false });
    }

    // 4. TipApp
    if (doc.tipApp?.length > 0) {
      const tipDocs = doc.tipApp.map(t => {
        const { id, _id, ...rest } = t;
        return { userId, ...rest };
      });
      await tipAppCol.insertMany(tipDocs, { ordered: false });
    }

    console.log(`  ✓ "${doc.username}" — orders: ${doc.orders?.length ?? 0}, transfers: ${doc.transfers?.length ?? 0}, tipApp: ${doc.tipApp?.length ?? 0}`);
    success++;
  }

  console.log(`\nMigrate xong: ${success} thành công, ${skipped} bỏ qua`);
  console.log('⚠ Giữ nguyên collection shipflow_data cũ cho đến khi xác nhận dữ liệu mới ổn.');
  await client.close();
}

migrate().catch(err => {
  console.error('Migration thất bại:', err);
  process.exit(1);
});