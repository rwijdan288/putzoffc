const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const FormData = require('form-data');
const { ImageUploadService } = require('node-upload-images');

// ==========================================
// ORDERKUOTA CORE CLASS
// ==========================================
class OrderKuota {
  static API_URL = 'https://app.orderkuota.com/api/v2';
  static HOST = 'app.orderkuota.com';
  static USER_AGENT = 'okhttp/4.12.0';
  static APP_VERSION_NAME = '26.01.15';
  static APP_VERSION_CODE = '260115';
  static APP_REG_ID = 'cdzXkBynRECkAODZEHwkeV:APA91bHRyLlgNSlpVrC4Yv3xBgRRaePSaCYruHnNwrEK8_pX3kzitxzi0CxIDFc2oztCwcw7-zPgwE-6v_-rJCJdTX8qE_ADiSnWHNeZ5O7_BIlgS_1N8tw';
  static PHONE_MODEL = '23124RA7EO';
  static PHONE_UUID = 'cdzXkBynRECkAODZEHwkeV';
  static PHONE_ANDROID_VERSION = '15';
  static SIGNATURE = '944d749d04f80642bcbffe4e2c3b84ba91b1cfe28d68c0fb51bd90a666ff645cc17281a50b67190c047ed55b541d3ea181bf5606e02ab9275155c8669154fe28';

  constructor(username = null, authToken = null) {
    this.username = username;
    this.authToken = authToken;
    this.axiosInstance = axios.create({
      baseURL: OrderKuota.API_URL,
      timeout: 30000, // Timeout 30 detik
      headers: {
        'Host': OrderKuota.HOST,
        'User-Agent': OrderKuota.USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'gzip'
      }
    });
  }

  // Tahap 1: Request OTP Login
  async loginRequest(username, password) {
    const timestamp = Date.now().toString();
    const data = qs.stringify({
      username: username,
      password: password,
      request_time: timestamp,
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID
    });

    const response = await this.axiosInstance.post('/login', data);
    return response.data;
  }

  // Tahap 2: Verifikasi OTP dan Dapatkan Auth Token
  async getAuthToken(username, otp) {
    const timestamp = Date.now().toString();
    const data = qs.stringify({
      username: username,
      password: otp,
      request_time: timestamp,
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID
    });

    const response = await this.axiosInstance.post('/login', data);
    return response.data;
  }

  // Request QRIS Merchant Terms
  async getQrisMerchantTerms(amount) {
    const timestamp = Date.now().toString();
    const data = qs.stringify({
      request_time: timestamp,
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_merchant_terms][jumlah]': amount.toString(),
      'requests[0]': 'qris_merchant_terms',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      phone_model: OrderKuota.PHONE_MODEL
    });

    const response = await this.axiosInstance.post('/get', data);
    return response.data;
  }

  // Mutasi QRIS
  async getQrisHistory() {
    const timestamp = Date.now().toString();
    const resellerId = this.authToken ? this.authToken.split(':')[0] : '';
    
    const data = qs.stringify({
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_uuid: OrderKuota.PHONE_UUID,
      phone_model: OrderKuota.PHONE_MODEL,
      'requests[qris_history][keterangan]': '',
      'requests[qris_history][jumlah]': '',
      request_time: timestamp,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      auth_username: this.username,
      'requests[qris_history][page]': '1',
      auth_token: this.authToken,
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      'requests[qris_history][dari_tanggal]': '',
      'requests[0]': 'account',
      'requests[qris_history][ke_tanggal]': ''
    });

    const endpoint = resellerId ? `/qris/mutasi/${resellerId}` : '/get';
    const response = await this.axiosInstance.post(endpoint, data, {
      headers: {
        'signature': OrderKuota.SIGNATURE,
        'timestamp': timestamp
      }
    });
    return response.data;
  }

  // Penarikan Saldo QRIS
  async withdrawalQris(amount) {
    const timestamp = Date.now().toString();
    const data = qs.stringify({
      request_time: timestamp,
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      'requests[qris_withdraw][amount]': amount.toString(),
      'requests[0]': 'account',
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: 'light',
      phone_model: OrderKuota.PHONE_MODEL
    });

    const response = await this.axiosInstance.post('/get', data);
    return response.data;
  }
}

// ==========================================
// HELPER FUNCTIONS (CRC16, QR, UPLOADERS)
// ==========================================

// Algoritma CRC16 EMVCo QRIS (Sama persis dengan implementasi PHP)
function convertCRC16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ("000" + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}

// Modifikasi QRIS Static menjadi Dynamic QRIS
function createDynamicQrisString(rawQris, amount) {
  let qrisData = rawQris.slice(0, -4);
  const step1 = qrisData.replace("010211", "010212");
  const step2 = step1.split("5802ID");
  const amountStr = amount.toString();
  const uang = "54" + ("0" + amountStr.length).slice(-2) + amountStr + "5802ID";
  const final = step2[0] + uang + step2[1];
  return final + convertCRC16(final);
}

// Generate Transaction ID format: SKY-XXXXXX
function generateTransactionId() {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SKY-${randomHex}`;
}

// Expiration +30 Menit format: YYYY-MM-DD HH:mm:ss
function generateExpirationTime(minutesToAdd = 30) {
  const d = new Date(Date.now() + minutesToAdd * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Generate QR Image Buffer (400x400, margin 25)
async function generateQrImageBuffer(qrData) {
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=25&data=${encodeURIComponent(qrData)}`;
    const response = await axios.get(qrUrl, { responseType: 'arraybuffer', timeout: 7000 });
    if (response.data) {
      return Buffer.from(response.data);
    }
  } catch (err) {
    // Fallback lokal jika API QRServer offline
  }

  return await QRCode.toBuffer(qrData, {
    width: 400,
    margin: 3,
    errorCorrectionLevel: 'M'
  });
}

// Fallback Uploader 1: Pixhost
async function uploadToPixhost(buffer) {
  try {
    const service = new ImageUploadService('pixhost.to');
    const { directLink } = await service.uploadFromBinary(buffer, 'qris.png');
    if (directLink) return directLink;
  } catch (e) {}

  try {
    const form = new FormData();
    form.append('img', buffer, { filename: 'qris.png', contentType: 'image/png' });
    form.append('content_type', '0');
    form.append('max_th_size', '400');

    const res = await axios.post('https://api.pixhost.to/images', form, {
      headers: form.getHeaders(),
      timeout: 9000
    });

    if (res.data && res.data.show_url) {
      const pageRes = await axios.get(res.data.show_url, { timeout: 7000 });
      const match = pageRes.data.match(/https:\/\/(?:img\d+|t\d+)\.pixhost\.(?:to|cc)\/images\/[^"' ]+/);
      if (match && match[0]) {
        return match[0].replace(/\/t(\d+)\./, '/img$1.');
      }
      if (res.data.th_url) {
        return res.data.th_url.replace(/\/t(\d+)\./, '/img$1.');
      }
    }
  } catch (e) {}

  throw new Error("Pixhost: Gagal mengunggah file");
}

// Fallback Uploader 2: Tmp.ninja
async function uploadToTmpNinja(buffer) {
  try {
    const form = new FormData();
    form.append('file', buffer, { filename: 'qris.png', contentType: 'image/png' });

    const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
      headers: form.getHeaders(),
      timeout: 9000
    });

    if (res.data?.data?.url) {
      return res.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
    }
  } catch (e) {}

  try {
    const form = new FormData();
    form.append('file', buffer, { filename: 'qris.png', contentType: 'image/png' });

    const res = await axios.post('https://tmp.ninja/api.php?d=upload', form, {
      headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
      timeout: 9000
    });

    if (res.data) {
      if (res.data.files && res.data.files[0] && res.data.files[0].url) {
        return res.data.files[0].url;
      }
      if (res.data.url) {
        return res.data.url;
      }
    }
  } catch (e) {}

  throw new Error("Tmp.ninja: Gagal mengunggah file");
}

// Fallback Uploader 3: Catbox
async function uploadToCatbox(buffer) {
  try {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'qris.png', contentType: 'image/png' });

    const res = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 9000
    });

    const url = typeof res.data === 'string' ? res.data.trim() : '';
    if (url.startsWith('http')) {
      return url;
    }
  } catch (e) {}

  throw new Error("Catbox: Gagal mengunggah file");
}

// Multi-Host Fallback Uploader Chain: Pixhost -> Tmp.ninja -> Catbox
async function uploadImage(buffer) {
  const errors = [];

  // 1. Coba Pixhost
  try {
    const url = await uploadToPixhost(buffer);
    if (url) return url;
  } catch (e) {
    errors.push(`Pixhost: ${e.message}`);
  }

  // 2. Coba Tmp.ninja
  try {
    const url = await uploadToTmpNinja(buffer);
    if (url) return url;
  } catch (e) {
    errors.push(`Tmp.ninja: ${e.message}`);
  }

  // 3. Coba Catbox
  try {
    const url = await uploadToCatbox(buffer);
    if (url) return url;
  } catch (e) {
    errors.push(`Catbox: ${e.message}`);
  }

  // Jika semua host gagal
  throw new Error(`Semua host gagal: ${errors.join(', ')}`);
}

// Helper validasi API key
function validateApiKey(req, res) {
  const apikey = req.query?.apikey || req.body?.apikey || req.headers?.['x-api-key'] || req.headers?.['authorization']?.replace('Bearer ', '');
  if (!apikey || !global.apikey.includes(apikey)) {
    res.status(400).json({
      status: false,
      message: "API Key tidak valid."
    });
    return false;
  }
  return true;
}

// ==========================================
// CORE CONTROLLER LOGIC
// ==========================================

async function handleGetOtp(req, res) {
  if (!validateApiKey(req, res)) return;

  const username = (req.query?.username || req.body?.username || '').trim();
  const password = (req.query?.password || req.body?.password || '').trim();

  if (!username) {
    return res.status(400).json({ status: false, message: "Parameter username wajib diisi." });
  }
  if (!password) {
    return res.status(400).json({ status: false, message: "Parameter password wajib diisi." });
  }

  try {
    const ok = new OrderKuota();
    const response = await ok.loginRequest(username, password);
    
    return res.json({
      status: true,
      action: "getotp",
      result: response
    });
  } catch (err) {
    const errMsg = err.response?.data?.message || err.response?.data || err.message;
    return res.status(400).json({
      status: false,
      message: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg
    });
  }
}

async function handleGetToken(req, res) {
  if (!validateApiKey(req, res)) return;

  const username = (req.query?.username || req.body?.username || '').trim();
  const otp = (req.query?.otp || req.body?.otp || '').trim();

  if (!username) {
    return res.status(400).json({ status: false, message: "Parameter username wajib diisi." });
  }
  if (!otp) {
    return res.status(400).json({ status: false, message: "Parameter otp wajib diisi." });
  }

  try {
    const ok = new OrderKuota();
    const response = await ok.getAuthToken(username, otp);

    return res.json({
      status: true,
      action: "gettoken",
      result: response
    });
  } catch (err) {
    const errMsg = err.response?.data?.message || err.response?.data || err.message;
    return res.status(400).json({
      status: false,
      message: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg
    });
  }
}

async function handleCreatePayment(req, res) {
  if (!validateApiKey(req, res)) return;

  const username = (req.query?.username || req.body?.username || '').trim();
  const token = (req.query?.token || req.body?.token || '').trim();
  const rawAmount = req.query?.amount || req.body?.amount;

  if (!username) {
    return res.status(400).json({ status: false, message: "Parameter username wajib diisi." });
  }
  if (!token) {
    return res.status(400).json({ status: false, message: "Parameter token wajib diisi." });
  }
  if (rawAmount === undefined || rawAmount === null || rawAmount === '') {
    return res.status(400).json({ status: false, message: "Parameter amount wajib diisi." });
  }

  const amount = parseInt(rawAmount, 10);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ status: false, message: "Parameter amount harus berupa angka integer positif lebih dari 0." });
  }

  try {
    const ok = new OrderKuota(username, token);
    const merchantResponse = await ok.getQrisMerchantTerms(amount);

    // Ambil qris_data dari response OrderKuota
    let rawQris = null;
    if (merchantResponse?.qris_merchant_terms?.results?.qris_data) {
      rawQris = merchantResponse.qris_merchant_terms.results.qris_data;
    } else if (merchantResponse?.results?.qris_data) {
      rawQris = merchantResponse.results.qris_data;
    } else if (merchantResponse?.qris_data) {
      rawQris = merchantResponse.qris_data;
    }

    if (!rawQris) {
      return res.status(400).json({
        status: false,
        message: "Gagal mendapatkan qris_data dari OrderKuota. Pastikan token dan username valid."
      });
    }

    // Generate Dynamic QRIS
    const dynamicQris = createDynamicQrisString(rawQris, amount);

    // Generate QR Image Buffer
    const imageBuffer = await generateQrImageBuffer(dynamicQris);

    // Upload QR Image dengan Fallback Chain (Pixhost -> Tmp.ninja -> Catbox)
    const qrisImageUrl = await uploadImage(imageBuffer);

    // Transaction ID & Expiration (+30 Menit)
    const trxid = generateTransactionId();
    const expired = generateExpirationTime(30);

    return res.json({
      status: true,
      action: "createpayment",
      result: {
        trxid: trxid,
        nominal: amount,
        expired: expired,
        qris_image: qrisImageUrl
      }
    });
  } catch (err) {
    const errMsg = err.response?.data?.message || err.response?.data || err.message;
    return res.status(400).json({
      status: false,
      message: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg
    });
  }
}

async function handleMutasiQr(req, res) {
  if (!validateApiKey(req, res)) return;

  const username = (req.query?.username || req.body?.username || '').trim();
  const token = (req.query?.token || req.body?.token || '').trim();

  if (!username) {
    return res.status(400).json({ status: false, message: "Parameter username wajib diisi." });
  }
  if (!token) {
    return res.status(400).json({ status: false, message: "Parameter token wajib diisi." });
  }

  try {
    const ok = new OrderKuota(username, token);
    const response = await ok.getQrisHistory();

    // Pertahankan qris_history atau fallback response asli OrderKuota
    let historyResult = response?.qris_history?.results || response?.qris_history || response;

    return res.json({
      status: true,
      action: "mutasiqr",
      result: historyResult
    });
  } catch (err) {
    const errMsg = err.response?.data?.message || err.response?.data || err.message;
    return res.status(400).json({
      status: false,
      message: typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg
    });
  }
}

// Router Dispatcher untuk Endpoint Utama: /api/orderkuota?action=...
async function orderKuotaMainDispatcher(req, res) {
  const action = (req.query?.action || req.body?.action || '').toLowerCase().trim();

  if (action === 'getotp') {
    return await handleGetOtp(req, res);
  } else if (action === 'gettoken') {
    return await handleGetToken(req, res);
  } else if (action === 'createpayment') {
    return await handleCreatePayment(req, res);
  } else if (action === 'mutasiqr') {
    return await handleMutasiQr(req, res);
  } else {
    if (!validateApiKey(req, res)) return;
    return res.status(400).json({
      status: false,
      message: "Action tidak valid. Gunakan salah satu action: getotp, gettoken, createpayment, atau mutasiqr."
    });
  }
}

// ==========================================
// EXPORT ROUTES DEFINITION (PUTZ API COMPLIANT)
// ==========================================

module.exports = [
  // 1. Endpoint Utama: GET /api/orderkuota?action=...
  {
    name: "OrderKuota API (Multi Action)",
    desc: "OrderKuota API Gateway lengkap: getotp, gettoken, createpayment, mutasiqr",
    category: "Orderkuota",
    parameters: {
      action: { type: "select", selection: ["getotp", "gettoken", "createpayment", "mutasiqr"], value: "getotp" },
      apikey: { type: "string", example: "ptz" },
      username: { type: "string", example: "user123" },
      password: { type: "string", example: "pass123" },
      otp: { type: "string", example: "123456" },
      token: { type: "string", example: "2722335:DTF9InW3MUP7jwfSrA5suE06NZhkx8BX" },
      amount: { type: "string", example: "10000" }
    },
    path: "/orderkuota",
    run: orderKuotaMainDispatcher
  },

  // 2. Action Sub-Endpoint: GET /orderkuota/getotp
  {
    name: "OrderKuota - Get OTP (Tahap 1)",
    desc: "Request OTP Login OrderKuota ke nomor akun yang terdaftar",
    category: "Orderkuota",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      username: { type: "string", example: "user123" },
      password: { type: "string", example: "pass123" }
    },
    path: "/orderkuota/getotp",
    run: handleGetOtp
  },

  // 3. Action Sub-Endpoint: GET /orderkuota/gettoken
  {
    name: "OrderKuota - Get Token (Tahap 2)",
    desc: "Verifikasi OTP dan dapatkan Auth Token OrderKuota",
    category: "Orderkuota",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      username: { type: "string", example: "user123" },
      otp: { type: "string", example: "123456" }
    },
    path: "/orderkuota/gettoken",
    run: handleGetToken
  },

  // 4. Action Sub-Endpoint: GET /orderkuota/createpayment
  {
    name: "OrderKuota - Create Payment (Dynamic QRIS)",
    desc: "Generate pembayaran QRIS Dinamis OrderKuota dengan upload gambar ke Pixhost/Tmp.ninja/Catbox",
    category: "Orderkuota",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      username: { type: "string", example: "user123" },
      token: { type: "string", example: "2722335:DTF9InW3MUP7jwfSrA5suE06NZhkx8BX" },
      amount: { type: "string", example: "10000" }
    },
    path: "/orderkuota/createpayment",
    run: handleCreatePayment
  },

  // 5. Action Sub-Endpoint: GET /orderkuota/mutasiqr
  {
    name: "OrderKuota - Cek Mutasi QRIS",
    desc: "Cek riwayat mutasi pembayaran QRIS OrderKuota",
    category: "Orderkuota",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      username: { type: "string", example: "user123" },
      token: { type: "string", example: "2722335:DTF9InW3MUP7jwfSrA5suE06NZhkx8BX" }
    },
    path: "/orderkuota/mutasiqr",
    run: handleMutasiQr
  }
];
