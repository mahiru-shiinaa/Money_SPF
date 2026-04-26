// ── Formatters ────────────────────────────────────────────────────────────────
export const fmt = (n) => {
  const abs = Math.abs(n);
  const s = abs >= 1000 ? (abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1) + 'k' : abs.toString();
  return (n < 0 ? '-' : '') + s;
};

export const fmtFull = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export const today = () => new Date().toISOString().split('T')[0];

export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

// ── Constants ─────────────────────────────────────────────────────────────────
export const INITIAL = {
  wallets: { app: 0, cash: 0, mb: 0, momo: 0 },
  orders: [],
  transfers: [],
  tipApp: [],
};

// ── Wallet delta calculation ───────────────────────────────────────────────────
export const calcChenhLech = (subOrders) =>
  subOrders.reduce((a, s) => {
    if (s.type === '2') return a + (s.collectCustomer || 0);
    if (s.type === '3') return a + (s.collectCustomer || 0) - (s.payShop || 0);
    if (s.type === '4') return a - (s.payShop || 0);
    return a;
  }, 0);

export const applySubWallet = (w, s, sign = 1) => {
  if (s.collectMethod === 'cash') w.cash += sign * (s.collectCustomer || 0);
  if (s.collectMethod === 'mb')   w.mb   += sign * (s.collectCustomer || 0);
  if (s.payShopMethod === 'cash') w.cash -= sign * (s.payShop || 0);
  if (s.payShopMethod === 'momo') w.momo -= sign * (s.payShop || 0);
  if (s.payShopMethod === 'mb')   w.mb   -= sign * (s.payShop || 0);
  if (s.refundMethod === 'cash')  w.cash -= sign * (s.refund || 0);
  if (s.refundMethod === 'momo')  w.momo -= sign * (s.refund || 0);
};

export const applyOrderToWallets = (wallets, order, sign = 1) => {
  const w = { ...wallets };
  w.app += sign * (order.shipTotal - calcChenhLech(order.subOrders) + (order.tipApp || 0));
  order.subOrders.forEach((s) => applySubWallet(w, s, sign));
  return w;
};

// ── API ───────────────────────────────────────────────────────────────────────
export const api = {
  async loadData(username) {
    const r = await fetch(`/api/data?username=${encodeURIComponent(username)}`);
    if (!r.ok) throw new Error('Không tải được dữ liệu');
    return r.json();
  },

  async saveData(username, data) {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, ...data }),
    });
  },

  async auth(username, action) {
    const r = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, action }),
    });
    return { ok: r.ok, data: await r.json() };
  },
};
