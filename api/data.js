import { MongoClient } from 'mongodb';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const username = req.method === 'GET'
    ? req.query.username
    : req.body?.username;

  if (!username)
    return res.status(400).json({ error: 'Thiếu username' });

  const clean = username.trim().toLowerCase();

  try {
    const db = await connectDB();
    const col = db.collection('shipflow_data');

    // GET — tải toàn bộ dữ liệu của user
    if (req.method === 'GET') {
      const doc = await col.findOne({ username: clean });
      if (!doc) {
        return res.status(200).json({
          wallets: { app: 0, cash: 0, mb: 0, momo: 0 },
          orders: [],
          transfers: [],
          tipApp: [],
        });
      }
      const { _id, username: _u, updatedAt: _t, ...data } = doc;
      return res.status(200).json(data);
    }

    // POST — lưu toàn bộ dữ liệu (upsert)
    if (req.method === 'POST') {
      const { wallets, orders, transfers, tipApp } = req.body;

      if (!wallets || !orders || !transfers || !tipApp)
        return res.status(400).json({ error: 'Thiếu dữ liệu' });

      await col.updateOne(
        { username: clean },
        {
          $set: {
            username: clean,
            wallets,
            orders,
            transfers,
            tipApp,
            updatedAt: new Date(),
          }
        },
        { upsert: true }
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Data Error:', error);
    return res.status(500).json({ error: 'Lỗi server', message: error.message });
  }
}
