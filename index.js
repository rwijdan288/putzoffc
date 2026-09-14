require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const multer = require('multer');

require('./lib/tools');

const app = express();
const PORT = 3000;

const upload = multer();

app.enable("trust proxy");
app.set("json spaces", 2);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

global.getBuffer = async (url, options = {}) => {
  try {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      throw new Error("Invalid URL for getBuffer");
    }
    const res = await axios({
      method: 'get',
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DNT': '1',
        'Upgrade-Insecure-Request': '1'
      },
      ...options,
      responseType: 'arraybuffer'
    });
    return Buffer.from(res.data);
  } catch (err) {
    throw new Error(err.response?.data ? String(err.response.data).slice(0, 150) : err.message);
  }
};

global.fetchJson = async (url, options = {}) => {
  try {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      throw new Error("Invalid URL for fetchJson");
    }
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      ...options
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data ? (typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : String(err.response.data).slice(0, 150)) : err.message);
  }
};

const settings = {
  name: "Putz Api",
  description: "Putz Api is a simple and lightweight REST API built with Express.js",
  apiSettings: { creator: "PutzOfficial" },
  linkWhatsapp: "https://t.me/putzpay",
  linkChannel: "https://t.me/putzpay", 
  linkGithub: "https://github.com", 
  linkYoutube: "https://t.me/putzpay"
};

global.apikey = ["ptz"];

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    if (!this.headersSent) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const responseData = { status: data.status !== undefined ? data.status : true, creator: settings.apiSettings.creator || "PutzOfficial", ...data };
      return originalJson.call(this, responseData);
    }
    return originalJson.call(this, data);
  };
  next();
});

let totalRoutes = 0;
let rawEndpoints = {};

const apiFolder = path.join(__dirname, './api');

// Fungsi helper untuk mengonversi parameter ke format frontend
function convertParametersForFrontend(parameters) {
  if (!parameters) return {};
  
  const converted = {};
  for (const [paramName, paramConfig] of Object.entries(parameters)) {
    converted[paramName] = {
      type: paramConfig.type || "string",
      ...(paramConfig.required !== undefined && { required: paramConfig.required }),
      ...(paramConfig.example && { example: paramConfig.example }),
      ...(paramConfig.value && { value: paramConfig.value }),
      ...(paramConfig.selection && { selection: paramConfig.selection })
    };
  }
  return converted;
}

const multerHandler = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.any()(req, res, next);
  }
  next();
};

const register = (ep, file) => {
  if (ep && ep.name && ep.category && ep.path && typeof ep.run === "function") {
    const cleanPath = ep.path.split("?")[0];
    const method = (ep.method || 'ALL').toUpperCase();

    const handler = async (req, res, next) => {
      let isCompleted = false;
      const timeoutDuration = ep.timeout || 45000;
      const timeoutTimer = setTimeout(() => {
        if (!isCompleted && !res.headersSent) {
          isCompleted = true;
          res.status(504).json({
            status: false,
            creator: settings.apiSettings.creator || "PutzOfficial",
            error: "Permintaan waktu habis (Upstream Timeout). Server upstream sedang tidak merespons, silakan coba lagi."
          });
        }
      }, timeoutDuration);

      try {
        await ep.run(req, res, next);
        isCompleted = true;
      } catch (err) {
        isCompleted = true;
        if (!res.headersSent) {
          const errMsg = err?.message || "Internal server error";
          let cleanMessage = errMsg;
          if (errMsg.includes('429') || errMsg.toLowerCase().includes('rate limit')) {
            cleanMessage = "Layanan upstream sedang sibuk (Rate Limit). Silakan coba lagi beberapa saat lagi.";
          } else if (errMsg.includes('409') || errMsg.toLowerCase().includes('conflict')) {
            cleanMessage = "Terjadi konflik data pada request. Silakan periksa kembali parameter input.";
          } else if (errMsg.includes('ECONNREFUSED') || errMsg.includes('ETIMEDOUT') || errMsg.includes('EPROTO') || errMsg.includes('socket hang up')) {
            cleanMessage = "Gagal terhubung ke layanan eksternal upstream. Silakan coba kembali.";
          }
          res.json({
            status: false,
            creator: settings.apiSettings.creator || "PutzOfficial",
            error: cleanMessage
          });
        }
      } finally {
        clearTimeout(timeoutTimer);
      }
    };

    // Register main path and prefix variant (/api/... and /...)
    let norm = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    const pathsToRegister = new Set();
    pathsToRegister.add(norm);
    if (norm.startsWith('/api/')) {
      pathsToRegister.add(norm.replace(/^\/api/, ''));
    } else if (norm.startsWith('/api')) {
      const stripped = norm.replace(/^\/api/, '');
      if (stripped) {
        pathsToRegister.add(stripped.startsWith('/') ? stripped : `/${stripped}`);
        pathsToRegister.add(`/api/${stripped.replace(/^\//, '')}`);
      }
    } else {
      pathsToRegister.add('/api' + norm);
    }

    pathsToRegister.forEach(p => {
      // Support both GET and POST or ALL for maximum compatibility
      app.all(p, multerHandler, handler);
    });

    if (!rawEndpoints[ep.category]) rawEndpoints[ep.category] = [];
    
    // Data endpoint untuk frontend
    const displayPath = ep.path.startsWith('/api') ? ep.path : (ep.path.startsWith('/') ? `/api${ep.path}` : `/api/${ep.path}`);
    const endpointData = {
      name: ep.name,
      description: ep?.description || ep?.desc || null,
      path: displayPath,
      method: ep.method || 'GET',
      parameters: convertParametersForFrontend(ep.parameters),
      ...(ep.innerDesc ? { innerDesc: ep.innerDesc } : {}),
      ...(ep.body ? { body: ep.body } : {})
    };
    
    rawEndpoints[ep.category].push(endpointData);
    totalRoutes++;
    console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` Loaded Route: ${file} → ${ep.name} (${method}) [${cleanPath}] `));
  }
};

if (fs.existsSync(apiFolder)) {
  fs.readdirSync(apiFolder).forEach((file) => {
    const filePath = path.join(apiFolder, file);
    if (path.extname(file) === '.js') {
      try {
        delete require.cache[require.resolve(filePath)];
        const routeModule = require(filePath);
        if (Array.isArray(routeModule)) {
          routeModule.forEach(ep => register(ep, file));
        } else if (routeModule.endpoint) {
          register(routeModule.endpoint, file);
        } else if (typeof routeModule === "function") {
          routeModule(app);
        } else {
          register(routeModule, file);
        }
      } catch (err) {
        console.error(chalk.red(`Error loading ${file}:`), err.message);
      }
    }
  });
}

console.log(chalk.bgHex('#90EE90').hex('#333').bold(' Load Complete! ✓ '));
console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Total Routes Loaded: ${totalRoutes} `));

// Endpoint settings untuk frontend
app.get('/settings', (req, res) => {
  const endpoints = {
    categories: Object.keys(rawEndpoints)
      .sort((a, b) => a.localeCompare(b))
      .map(category => ({
        name: category,
        items: rawEndpoints[category]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(endpoint => ({
            name: endpoint.name,
            method: endpoint.method || 'GET',
            path: endpoint.path,
            description: endpoint.description || endpoint.desc,
            parameters: endpoint.parameters || {}
          }))
      }))
  };
  
  const fullSettings = {
    ...settings,
    categories: endpoints.categories,
    metadata: {
      totalEndpoints: totalRoutes,
      totalCategories: endpoints.categories.length,
      lastUpdated: new Date().toISOString()
    }
  };
  
  res.json(fullSettings);
});

// Endpoint per kategori
Object.keys(rawEndpoints).forEach(category => {
  const slug = '/' + category.toLowerCase().replace(/\s+/g, '-');
  app.get(slug, (req, res) => {
    const items = rawEndpoints[category].map(endpoint => ({
      name: endpoint.name,
      method: endpoint.method || 'GET',
      path: endpoint.path,
      description: endpoint.description || endpoint.desc,
      parameters: endpoint.parameters || {}
    }));
    res.json({
      success: true,
      category,
      items
    });
  });
});

// ================= GOMERCH ROUTES & UI =================
const GoMerchant = require('./GoMerchant');
const gomerchSdk = new GoMerchant();
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function toUrlPixhost(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new Error("Input harus buffer");
  try {
    const form = new FormData();
    form.append("img", buffer, { filename: "putz.png", contentType: "image/png" });
    form.append("content_type", "0");
    form.append("max_th_size", "420");
    const res = await fetch("https://api.pixhost.cc/images", { method: "POST", body: form, headers: form.getHeaders(), timeout: 7000 });
    if (res.ok) {
      const json = await res.json();
      if (json && json.show_url) {
        const html = await (await fetch(json.show_url, { timeout: 7000 })).text();
        const match = html.match(/https:\/\/img\d+\.pixhost\.(?:to|cc)\/images\/[^"' ]+/);
        if (match && match[0]) return match[0];
      }
    }
  } catch (e) {}

  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, { filename: "putz.png", contentType: "image/png" });
    const res = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: form, headers: form.getHeaders(), timeout: 7000 });
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text.startsWith("http")) return text;
    }
  } catch (e) {}

  return `data:image/png;base64,${buffer.toString('base64')}`;
}

// GoMerch UI Explorer Page
app.get('/gomerch', (req, res) => {
  res.render('index');
});
app.get('/gomerch-ui', (req, res) => {
  res.render('index');
});

// Direct GoMerch Auth Routes
app.get('/auth/otp', async (req, res) => {
  try {
    let phone = req.query.phone;
    if (!phone) return res.status(400).json({ success: false, error: 'phone wajib diisi' });
    if (phone.startsWith("62")) phone = phone.slice(2);
    if (phone.startsWith("0")) phone = phone.slice(1);
    const data = await gomerchSdk.requestOtp(phone);
    res.json({ success: true, data: { otp_token: data.data?.otp_token || data.otp_token, message: "Kode OTP Berhasil Dikirim Via SMS" } });
  } catch (e) {
    res.status(400).json({ success: false, error: e.response?.data || e.message });
  }
});

app.get('/auth/verify', async (req, res) => {
  try {
    const { otp, otp_token } = req.query;
    if (!otp || !otp_token) return res.status(400).json({ success: false, error: 'otp dan otp_token wajib diisi' });
    const data = await gomerchSdk.verifyOtp(otp, otp_token);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.response?.data || e.message });
  }
});

app.get('/auth/refresh/token', async (req, res) => {
  try {
    const refreshToken = req.query.refresh_token;
    if (!refreshToken) return res.status(400).json({ success: false, error: 'refresh_token wajib diisi' });
    const data = await gomerchSdk.refreshToken(refreshToken);
    res.json({ success: true, data });
  } catch (e) {
    res.status(401).json({ success: false, error: e.response?.data || e.message });
  }
});

// Direct GoMerch API Routes
app.get('/api/validate', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ success: false, error: 'token wajib diisi' });
    const data = await gomerchSdk.getMe(token);
    res.json({ success: true, user: data.user || data, access_token: token });
  } catch (e) {
    res.status(401).json({ success: false, error: e.response?.data || e.message });
  }
});

app.get('/api/me', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ success: false, error: 'token wajib diisi' });
    const data = await gomerchSdk.getMe(token);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.response?.data || e.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ success: false, error: 'token wajib diisi' });
    const user = await gomerchSdk.getMe(token);
    const defaultStartTime = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString();
    const startTime = req.query.start_time || defaultStartTime;
    const merchantId = user.user?.merchant_id || user.merchant_id;
    const result = await gomerchSdk.getJournals(token, merchantId, startTime);
    const data = (result.hits || [])
      .filter(item => item?.metadata?.transaction?.payment_type === 'qris' || item?.metadata?.provider_metadata?.aspi)
      .map(item => {
        const aspi = item.metadata?.provider_metadata?.aspi;
        return {
          id: item.id,
          reference_id: item.reference_id,
          status: item.status,
          time: item.time,
          amount: aspi?.data?.amount || item.amount || 0,
          issuer: aspi?.issuer || null,
          acquirer: aspi?.acquirer || null,
          merchant_name: aspi?.data?.merchant_name || null,
          merchant_id: aspi?.data?.merchant_id || null,
          merchant_city: aspi?.data?.merchant_city || null,
          terminal_label: aspi?.data?.additional_data?.terminal_label || null
        };
      });
    res.json({ success: true, total: data.length, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.response?.data || e.message });
  }
});

app.get('/api/payouts', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ success: false, error: 'token wajib diisi' });
    const data = await gomerchSdk.getPayouts(token);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.response?.data || e.message });
  }
});

app.get('/api/qris/create', async (req, res) => {
  try {
    const { amount, static_qr } = req.query;
    if (!amount || !static_qr) {
      return res.status(400).json({ success: false, error: 'Parameter amount dan static_qr wajib diisi' });
    }
    const data = await gomerchSdk.createDynamicQRIS(amount, static_qr);
    const qrBuffer = Buffer.isBuffer(data.qr_buffer) ? data.qr_buffer : Buffer.from(data.qr_buffer.data || data.qr_buffer);
    const imageUrl = await toUrlPixhost(qrBuffer);
    res.json({
      success: true,
      image_url: imageUrl,
      amount: data.amount,
      qr_string: data.qr_string,
      created_at: data.created_at
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.response?.data || e.message });
  }
});

app.get('/api/qris/status', async (req, res) => {
  try {
    const { token, amount, created_at } = req.query;
    if (!token || !amount || !created_at) {
      return res.status(400).json({ success: false, error: 'token, amount, dan created_at wajib diisi' });
    }
    const user = await gomerchSdk.getMe(token);
    const merchantId = user.user?.merchant_id || user.merchant_id;
    const logs = await gomerchSdk.getJournals(token, merchantId, created_at);
    const amountSearch = parseInt(amount) * 100;
    const found = (logs.hits || []).find(h => {
      const txTime = new Date(h.time).getTime();
      const qrisTime = new Date(created_at).getTime();
      return (h.amount === amountSearch || h.metadata?.provider_metadata?.aspi?.data?.amount === parseInt(amount)) && txTime >= qrisTime;
    });
    res.json({ success: true, status: found ? 'PAID' : 'PENDING', data: found || null });
  } catch (e) {
    res.status(400).json({ success: false, error: e.response?.data || e.message });
  }
});

app.get('/api/trx/cancel', async (req, res) => {
  try {
    const { token, transaction_id } = req.query;
    if (!token) return res.status(400).json({ success: false, error: 'token wajib diisi' });
    const data = await gomerchSdk.cancelTransaction(token, transaction_id);
    const aspi = data?.metadata?.provider_metadata?.aspi;
    res.json({
      success: true,
      data: {
        id: data.id,
        reference_id: data.reference_id,
        status: "CANCELLED",
        time: data.time,
        amount: aspi?.data?.amount || 0,
        issuer: aspi?.issuer || null,
        acquirer: aspi?.acquirer || null,
        merchant_name: aspi?.data?.merchant_name || null,
        merchant_id: aspi?.data?.merchant_id || null,
        merchant_city: aspi?.data?.merchant_city || null,
        terminal_label: aspi?.data?.additional_data?.terminal_label || null,
        message: "Transaksi berhasil dibatalkan"
      }
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.response?.data || e.message });
  }
});

app.get('/api/trx/detail', async (req, res) => {
  try {
    const { token, transaction_id } = req.query;
    if (!token) return res.status(400).json({ success: false, error: 'token wajib diisi' });
    const data = await gomerchSdk.getTransactionDetail(token, transaction_id);
    const aspi = data?.metadata?.provider_metadata?.aspi;
    res.json({
      success: true,
      data: {
        id: data.id,
        reference_id: data.reference_id,
        status: data.status,
        time: data.time,
        amount: aspi?.data?.amount || 0,
        issuer: aspi?.issuer || null,
        acquirer: aspi?.acquirer || null,
        merchant_name: aspi?.data?.merchant_name || null,
        merchant_id: aspi?.data?.merchant_id || null,
        merchant_city: aspi?.data?.merchant_city || null,
        terminal_label: aspi?.data?.additional_data?.terminal_label || null
      }
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.response?.data || e.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/docs.html'));
});

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/docs.html'));
});

// 404 Handler untuk request API atau umum (Selalu return JSON kecuali root docs)
app.use((req, res) => {
  if (req.path === '/' || req.path === '/docs') {
    return res.sendFile(path.join(__dirname, 'src/docs.html'));
  }
  return res.status(404).json({
    status: false,
    creator: settings.apiSettings.creator || "PutzOfficial",
    message: `Endpoint ${req.method} ${req.path} tidak ditemukan. Silakan periksa daftar endpoint di dokumentasi.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(chalk.red('Server Error:'), err);
  if (!res.headersSent) {
    res.status(500).json({
      status: false,
      message: err.message || 'Terjadi kesalahan internal pada server.'
    });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(chalk.bgHex('#90EE90').hex('#333').bold(` Server is running on port ${PORT} `));
    console.log(chalk.cyan(`  Documentation: http://localhost:${PORT}`));
    console.log(chalk.cyan(`  Settings API: http://localhost:${PORT}/settings`));
  });
}

module.exports = app;
