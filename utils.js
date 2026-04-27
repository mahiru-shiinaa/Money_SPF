// utils.js — phần api object, cập nhật cho schema mới
// (chỉ thay đổi phần api ở cuối file, giữ nguyên các hàm format/calc)

// ── API ───────────────────────────────────────────────────────────────────────
// Frontend lưu userId vào localStorage sau khi login/register
// và dùng nó cho mọi request thay vì username

export const api = {
  // Tải toàn bộ dữ liệu
  async loadData(userId) {
    const r = await fetch(`/api/data?userId=${encodeURIComponent(userId)}`);
    if (!r.ok) throw new Error('Không tải được dữ liệu');
    return r.json();
  },

  // Cập nhật ví
  async saveWallets(userId, wallets) {
    const r = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'saveWallets', data: { wallets } }),
    });
    if (!r.ok) throw new Error('Không lưu được ví');
  },

  // Thêm 1 order → trả về _id mới từ MongoDB
  async addOrder(userId, order) {
    const r = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'addOrder', data: order }),
    });
    if (!r.ok) throw new Error('Không thêm được order');
    return (await r.json())._id; // string ObjectId
  },

  // Cập nhật 1 order (cần có _id)
  async updateOrder(userId, order) {
    const r = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'updateOrder', data: order }),
    });
    if (!r.ok) throw new Error('Không cập nhật được order');
  },

  // Xóa 1 order
  async deleteOrder(userId, orderId) {
    const r = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'deleteOrder', data: { _id: orderId } }),
    });
    if (!r.ok) throw new Error('Không xóa được order');
  },

  // Thêm transfer
  async addTransfer(userId, transfer) {
    const r = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'addTransfer', data: transfer }),
    });
    if (!r.ok) throw new Error('Không thêm được transfer');
    return (await r.json())._id;
  },

  // Xóa transfer
  async deleteTransfer(userId, transferId) {
    const r = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'deleteTransfer', data: { _id: transferId } }),
    });
    if (!r.ok) throw new Error('Không xóa được transfer');
  },

  // Thêm tip
  async addTip(userId, tip) {
    const r = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'addTip', data: tip }),
    });
    if (!r.ok) throw new Error('Không thêm được tip');
    return (await r.json())._id;
  },

  // Xóa tip
  async deleteTip(userId, tipId) {
    const r = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'deleteTip', data: { _id: tipId } }),
    });
    if (!r.ok) throw new Error('Không xóa được tip');
  },

  // Import toàn bộ từ backup JSON (dùng sau migrate hoặc restore)
  async saveAll(userId, data) {
    const r = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'saveAll', data }),
    });
    if (!r.ok) throw new Error('Không import được dữ liệu');
  },

  // Auth (register / login) — trả về { userId, username }
  async auth(username, action) {
    const r = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, action }),
    });
    return { ok: r.ok, data: await r.json() };
  },
};

// Sau khi login thành công, lưu userId vào localStorage:
// localStorage.setItem('shipflow_userId', data.userId);
// localStorage.setItem('shipflow_username', data.username);
//
// Và khi dùng api:
// const userId = localStorage.getItem('shipflow_userId');
// const data = await api.loadData(userId);