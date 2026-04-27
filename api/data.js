// api/data.js — Schema mới (collection riêng, userId làm FK)
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

async function connectDB() {
  if (cachedDb) return cachedDb;
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db('spf-management');
  return cachedDb;
}

// Helper: parse userId string thành ObjectId
function parseUserId(raw) {
  if (!raw) return null;
  try { return new ObjectId(raw); } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // userId luôn đến từ frontend sau khi login/register
  const rawUserId = req.method === 'GET'
    ? req.query.userId
    : req.body?.userId;

  const userId = parseUserId(rawUserId);
  if (!userId) return res.status(400).json({ error: 'userId không hợp lệ' });

  try {
    const db = await connectDB();
    const walletsCol   = db.collection('shipflow_wallets');
    const ordersCol    = db.collection('shipflow_orders');
    const transfersCol = db.collection('shipflow_transfers');
    const tipAppCol    = db.collection('shipflow_tipapp');

    // ── GET: tải toàn bộ dữ liệu ──────────────────────────────────────────────
    if (req.method === 'GET') {
      const cashTxCol = db.collection('shipflow_cashtx');
      const [walletDoc, orders, transfers, tipApp, cashTx] = await Promise.all([
        walletsCol.findOne({ userId }),
        ordersCol.find({ userId }).sort({ date: -1 }).toArray(),
        transfersCol.find({ userId }).sort({ date: -1 }).toArray(),
        tipAppCol.find({ userId }).sort({ date: -1 }).toArray(),
        cashTxCol.find({ userId }).sort({ date: -1 }).toArray(),
      ]);

      // Normalize: bỏ userId khỏi từng record trả về, trả _id dạng string
      const stripUserId = ({ userId: _u, ...rest }) => ({
        ...rest,
        _id: rest._id?.toString(),
      });

      return res.status(200).json({
        wallets: walletDoc
          ? { app: walletDoc.app, cash: walletDoc.cash, mb: walletDoc.mb, momo: walletDoc.momo }
          : { app: 0, cash: 0, mb: 0, momo: 0 },
        orders:    orders.map(stripUserId),
        transfers: transfers.map(stripUserId),
        tipApp:    tipApp.map(stripUserId),
        cashTx:    cashTx.map(stripUserId),
      });
    }

    // ── POST: lưu / cập nhật ──────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { action, data } = req.body;

      // action: 'saveWallets' | 'addOrder' | 'updateOrder' | 'deleteOrder'
      //       | 'addTransfer' | 'deleteTransfer'
      //       | 'addTip' | 'deleteTip'
      //       | 'saveAll'  ← dùng cho lúc sync toàn bộ (fallback)

      if (action === 'saveWallets') {
        await walletsCol.updateOne(
          { userId },
          { $set: { userId, ...data.wallets, updatedAt: new Date() } },
          { upsert: true }
        );
        return res.status(200).json({ success: true });
      }

      if (action === 'addOrder') {
        const { _id, ...orderData } = data; // bỏ _id cũ nếu có, MongoDB tự sinh
        const result = await ordersCol.insertOne({ userId, ...orderData });
        return res.status(200).json({ success: true, _id: result.insertedId.toString() });
      }

      if (action === 'updateOrder') {
        const { _id, ...orderData } = data;
        await ordersCol.updateOne(
          { _id: new ObjectId(_id), userId },
          { $set: orderData }
        );
        return res.status(200).json({ success: true });
      }

      if (action === 'deleteOrder') {
        await ordersCol.deleteOne({ _id: new ObjectId(data._id), userId });
        return res.status(200).json({ success: true });
      }

      if (action === 'addTransfer') {
        const { _id, ...tData } = data;
        const result = await transfersCol.insertOne({ userId, ...tData });
        return res.status(200).json({ success: true, _id: result.insertedId.toString() });
      }

      if (action === 'deleteTransfer') {
        await transfersCol.deleteOne({ _id: new ObjectId(data._id), userId });
        return res.status(200).json({ success: true });
      }

      if (action === 'addTip') {
        const { _id, ...tipData } = data;
        const result = await tipAppCol.insertOne({ userId, ...tipData });
        return res.status(200).json({ success: true, _id: result.insertedId.toString() });
      }

      if (action === 'deleteTip') {
        await tipAppCol.deleteOne({ _id: new ObjectId(data._id), userId });
        return res.status(200).json({ success: true });
      }

      if (action === 'addCash') {
        const cashTxCol = db.collection('shipflow_cashtx');
        const { _id, ...txData } = data;
        const result = await cashTxCol.insertOne({ userId, ...txData });
        return res.status(200).json({ success: true, _id: result.insertedId.toString() });
      }

      if (action === 'deleteCash') {
        const cashTxCol = db.collection('shipflow_cashtx');
        await cashTxCol.deleteOne({ _id: new ObjectId(data._id), userId });
        return res.status(200).json({ success: true });
      }

      // saveAll — ghi đè toàn bộ (dùng khi import backup JSON)
      if (action === 'saveAll') {
        const { wallets, orders = [], transfers = [], tipApp = [] } = data;

        const stripAndTag = (arr) =>
          arr.map(({ _id, id, userId: _u, ...rest }) => ({ userId, ...rest }));

        await Promise.all([
          walletsCol.updateOne(
            { userId },
            { $set: { userId, ...wallets, updatedAt: new Date() } },
            { upsert: true }
          ),
          orders.length > 0
            ? ordersCol.insertMany(stripAndTag(orders))
            : Promise.resolve(),
          transfers.length > 0
            ? transfersCol.insertMany(stripAndTag(transfers))
            : Promise.resolve(),
          tipApp.length > 0
            ? tipAppCol.insertMany(stripAndTag(tipApp))
            : Promise.resolve(),
        ]);

        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'action không hợp lệ' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Data Error:', error);
    return res.status(500).json({ error: 'Lỗi server', message: error.message });
  }
}