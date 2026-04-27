export const api = {
  async loadData(userId) {
    const r = await fetch(`/api/data?userId=${encodeURIComponent(userId)}`);
    if (!r.ok) throw new Error('Không tải được dữ liệu');
    return r.json();
  },
  async saveWallets(userId, wallets) {
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'saveWallets', data: { wallets } }) });
  },
  async addOrder(userId, order) {
    const r = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'addOrder', data: order }) });
    return (await r.json())._id;
  },
  async updateOrder(userId, order) {
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'updateOrder', data: order }) });
  },
  async deleteOrder(userId, orderId) {
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'deleteOrder', data: { _id: orderId } }) });
  },
  
  async addTransfer(userId, transfer) {
    const r = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'addTransfer', data: transfer }) });
    return (await r.json())._id;
  },
  async updateTransfer(userId, transfer) {
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'updateTransfer', data: transfer }) });
  },
  async deleteTransfer(userId, transferId) {
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'deleteTransfer', data: { _id: transferId } }) });
  },
  
  async addTip(userId, tip) {
    const r = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'addTip', data: tip }) });
    return (await r.json())._id;
  },
  async updateTip(userId, tip) {
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'updateTip', data: tip }) });
  },
  async deleteTip(userId, tipId) {
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'deleteTip', data: { _id: tipId } }) });
  },

  async addCash(userId, tx) {
    const r = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'addCash', data: tx }) });
    return (await r.json())._id;
  },
  async updateCash(userId, tx) {
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'updateCash', data: tx }) });
  },
  async deleteCash(userId, txId) {
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'deleteCash', data: { _id: txId } }) });
  },

  async saveAll(userId, data) {
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'saveAll', data }) });
  },
  async auth(username, action) {
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, action }) });
    return { ok: r.ok, data: await r.json() };
  },
};