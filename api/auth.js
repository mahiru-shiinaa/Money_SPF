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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, action } = req.body;

    if (!username || typeof username !== 'string')
      return res.status(400).json({ error: 'Username không hợp lệ' });

    const clean = username.trim().toLowerCase();

    if (clean.length < 3 || clean.length > 20)
      return res.status(400).json({ error: 'Username phải từ 3-20 ký tự' });

    if (!/^[a-z0-9_]+$/.test(clean))
      return res.status(400).json({ error: 'Username chỉ được chứa chữ không dấu, số và dấu _' });

    const db = await connectDB();
    const users = db.collection('users');
    const existing = await users.findOne({ username: clean });

    if (action === 'register') {
      if (existing) return res.status(409).json({ error: 'Username đã tồn tại' });

      await users.insertOne({
        username: clean,
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      // Tạo document dữ liệu rỗng ban đầu cho user
      const data = db.collection('shipflow_data');
      await data.updateOne(
        { username: clean },
        {
          $setOnInsert: {
            username: clean,
            wallets: { app: 0, cash: 0, mb: 0, momo: 0 },
            orders: [],
            transfers: [],
            tipApp: [],
            updatedAt: new Date(),
          }
        },
        { upsert: true }
      );

      return res.status(201).json({ success: true, username: clean, message: 'Đăng ký thành công' });
    } else {
      if (!existing) return res.status(404).json({ error: 'Username không tồn tại' });
      await users.updateOne({ username: clean }, { $set: { lastLogin: new Date() } });
      return res.status(200).json({ success: true, username: clean, message: 'Đăng nhập thành công' });
    }
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(500).json({ error: 'Lỗi server', message: error.message });
  }
}
