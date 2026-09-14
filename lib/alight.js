/*
  lib/alight.js — Alight Motion Core Engine
  Direct integration with Google Identity Toolkit & Alight Creative Cloud Functions.
  100% Vercel & Serverless compatible.
  Author logic: zenno
*/

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const cfg = {
  key: 'AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0',
  idt: 'https://www.googleapis.com/identitytoolkit/v3/relyingparty',
  stk: 'https://securetoken.googleapis.com/v1/token',
  vfy: 'https://us-central1-alight-creative.cloudfunctions.net/verifyPurchase'
};

const dip = () => `${crypto.randomInt(1, 255)}.${crypto.randomInt(0, 255)}.${crypto.randomInt(0, 255)}.${crypto.randomInt(1, 255)}`;

const sp = (h = {}) => ({
  ...h,
  'x-forwarded-for': dip(),
  'x-real-ip': dip(),
  'client-ip': dip(),
  'x-client-ip': dip(),
  'x-originating-ip': dip(),
  'x-cluster-client-ip': dip()
});

const h1 = {
  'content-type': 'application/json',
  'x-android-package': 'com.alightcreative.motion',
  'x-android-cert': 'ECA6BF91B8715A6F810ED0BBFC65B6CD578F52A8',
  'user-agent': 'dalvik/2.1.0 (linux; u; android 15; 23127pn0cc build/bp1a.250505.005)'
};

const h2 = {
  'content-type': 'application/json; charset=utf-8',
  'user-agent': 'okhttp/3.12.1',
  'accept-encoding': 'gzip'
};

const bad = e => {
  const d = e.response?.data;
  if (!d) return e.message || 'Unknown error';
  if (typeof d === 'object') {
    if (d.error?.message) return d.error.message;
    if (d.message) return d.message;
    try {
      return JSON.stringify(d);
    } catch {
      return String(d);
    }
  }
  return String(d);
};

function code(raw) {
  if (!raw) return null;
  let s = String(raw).replace(/&amp;/g, '&').trim();
  try { s = decodeURIComponent(s); } catch {}
  try {
    const u = new URL(s);
    let c = u.searchParams.get('oobCode');
    if (!c) {
      const n = u.searchParams.get('link') || u.searchParams.get('q') || u.searchParams.get('url');
      if (n) {
        try {
          const u2 = new URL(n);
          c = u2.searchParams.get('oobCode');
        } catch {}
      }
    }
    if (c) return c.replace(/[^a-zA-Z0-9_-]/g, '');
  } catch {}
  const m = s.match(/oobCode=([a-zA-Z0-9_-]+)/i);
  if (m) return m[1];
  const t = raw.trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(t) && !t.includes('://')) return t;
  return null;
}

async function link(email) {
  try {
    const c2 = {
      requestType: 6,
      email: email,
      androidInstallApp: true,
      canHandleCodeInApp: true,
      continueUrl: 'https://alightcreative.com?ui_sid=0366624874&ui_sd=0',
      iosBundleId: 'com.alightcreative.motion',
      androidPackageName: 'com.alightcreative.motion',
      androidMinimumVersion: '585',
      clientType: 'CLIENT_TYPE_ANDROID'
    };
    const r = await axios.post(`${cfg.idt}/getOobConfirmationCode?key=${cfg.key}`, c2, {
      headers: sp(h1),
      timeout: 15000
    });
    return { ok: true, data: r.data };
  } catch (e) {
    return { ok: false, why: bad(e) };
  }
}

async function auth(email, raw) {
  const c = code(raw);
  if (!c) return { ok: false, why: 'Kode oobCode tidak ditemukan pada link. Pastikan menyalin seluruh link verifikasi dari email.' };
  try {
    const a = await axios.post(`${cfg.idt}/emailLinkSignin?key=${cfg.key}`, {
      email: email,
      oobCode: c,
      clientType: 'CLIENT_TYPE_ANDROID'
    }, { headers: sp(h1), timeout: 15000 });

    let u = null;
    try {
      const b = await axios.post(`${cfg.idt}/getAccountInfo?key=${cfg.key}`, {
        idToken: a.data.idToken
      }, { headers: sp(h1), timeout: 15000 });
      u = b.data?.users?.[0] || null;
    } catch {}

    return {
      ok: true,
      email: email,
      id: a.data.idToken,
      ref: a.data.refreshToken,
      uid: a.data.localId,
      baru: !!a.data.isNewUser,
      user: u
    };
  } catch (e) {
    return { ok: false, why: bad(e) };
  }
}

async function pro(id) {
  const o = 'putzoffc-' + crypto.randomBytes(6).toString('hex');
  const b = {
    data: {
      productId: 'am.full.sub.annual.19q4',
      token: 'mmgaobamlahbbeccfplmbkbb.AO-J1OzqG0or_GJJIx-ms8GrTm-jaglCRfhQSRPUZKpl2YspYS-oN7_94uv8RC5vQbvd_Ios2pPDStZ2n7F0hLE3FiOU7HS3R6Fquulv5xLXFECSv4ctElw',
      skuType: 'subs',
      orderId: o
    }
  };
  const h = {
    ...h2,
    authorization: 'Bearer ' + id,
    'firebase-instance-id-token': 'cSDnCyp3T-uwp07z3tL86T:APA91bFkmvvsHw5nnqa1SBFci-99DRsKClLiETdRrVcJjS5yBx1v_FbCb1d8WhBuea_zmwnYBktyTIzcRhN4b6uNOUur9wPc0gKXmJDoZic0LhNq5V2s0xI'
  };
  try {
    const r = await axios.post(cfg.vfy, b, { headers: sp(h), timeout: 15000 });
    return { ok: true, order: o, r: r.data };
  } catch (e) {
    return { ok: false, why: bad(e) };
  }
}

async function re(ref) {
  try {
    const r = await axios.post(`${cfg.stk}?key=${cfg.key}`, {
      grant_type: 'refresh_token',
      refresh_token: ref
    }, { timeout: 15000 });
    return { ok: true, id: r.data.id_token, ref: r.data.refresh_token };
  } catch (e) {
    return { ok: false, why: bad(e) };
  }
}

// In-memory cache with safe fallback for Vercel /tmp
const memoryDb = new Map();

function getTmpPath() {
  return path.join('/tmp', 'alight-data.json');
}

function initDb() {
  try {
    const f = getTmpPath();
    if (fs.existsSync(f)) {
      const data = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([k, v]) => memoryDb.set(k, v));
      }
    }
  } catch (e) {}
}
initDb();

function saveSession(email, data) {
  if (!email) return;
  const em = email.toLowerCase().trim();
  const existing = memoryDb.get(em) || {};
  const updated = { ...existing, ...data, at: new Date().toISOString() };
  memoryDb.set(em, updated);

  try {
    const obj = {};
    for (const [k, v] of memoryDb.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(getTmpPath(), JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    // Graceful fallback for serverless read-only filesystem
  }
}

function getSession(email) {
  if (!email) return null;
  return memoryDb.get(email.toLowerCase().trim()) || null;
}

module.exports = {
  cfg,
  link,
  auth,
  pro,
  re,
  code,
  saveSession,
  getSession
};
