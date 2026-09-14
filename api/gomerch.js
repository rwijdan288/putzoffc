const path = require('path');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const GoMerchant = require('../GoMerchant');

const sdk = new GoMerchant();

// ================= FUNGSI UPLOAD GAMBAR =================
async function toUrl(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Input harus berupa buffer gambar.");
  }

  // 1. Coba Pixhost
  try {
    const form = new FormData();
    form.append("img", buffer, {
      filename: "qris_putz.png",
      contentType: "image/png"
    });
    form.append("content_type", "0");
    form.append("max_th_size", "420");

    const res = await fetch("https://api.pixhost.cc/images", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
      timeout: 7000
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.show_url) {
        const html = await (await fetch(json.show_url, { timeout: 7000 })).text();
        const match = html.match(/https:\/\/img\d+\.pixhost\.(?:to|cc)\/images\/[^"' ]+/);
        if (match && match[0]) {
          return match[0];
        }
      }
    }
  } catch (err) {
    // Pixhost fallback
  }

  // 2. Fallback Catbox
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, {
      filename: "qris_putz.png",
      contentType: "image/png"
    });

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
      timeout: 7000
    });

    if (res.ok) {
      const text = (await res.text()).trim();
      if (text.startsWith("http")) {
        return text;
      }
    }
  } catch (err) {
    // Catbox fallback
  }

  // 3. Fallback Base64 Data URL (Garansi 100% selalu berfungsi tanpa server luar)
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

module.exports = [
  {
    name: "GoMerch Request OTP",
    desc: "Mengirim kode OTP login GoBiz / GoPay Merchant via SMS ke nomor HP terdaftar",
    category: "Gopay Merchant",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      phone: { type: "string", example: "6281234567890" }
    },
    path: "/gomerch/auth-otp",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      let phone = req.query?.phone || req.body?.phone;
      if (!phone) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'phone' wajib diisi (contoh: 6281234567890)" });
      }

      if (phone.startsWith("62")) phone = phone.slice(2);
      if (phone.startsWith("0")) phone = phone.slice(1);

      try {
        const data = await sdk.requestOtp(phone);
        res.json({
          status: true,
          creator: "PutzOfficial",
          success: true,
          data: {
            otp_token: data?.data?.otp_token || data?.otp_token,
            message: "Kode OTP Berhasil Dikirim Via SMS"
          }
        });
      } catch (e) {
        res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          success: false,
          error: e.response?.data || e.message
        });
      }
    }
  },
  {
    name: "GoMerch Verify OTP",
    desc: "Memverifikasi kode OTP yang diterima melalui SMS untuk mendapatkan Access Token & Refresh Token GoBiz",
    category: "Gopay Merchant",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      otp: { type: "string", example: "1234" },
      otp_token: { type: "string", example: "token_dari_request_otp" }
    },
    path: "/gomerch/auth-verify",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const otp = req.query?.otp || req.body?.otp;
      const otp_token = req.query?.otp_token || req.body?.otp_token;

      if (!otp || !otp_token) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'otp' dan 'otp_token' wajib diisi" });
      }

      try {
        const data = await sdk.verifyOtp(otp, otp_token);
        res.json({
          status: true,
          creator: "PutzOfficial",
          success: true,
          data
        });
      } catch (e) {
        res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          success: false,
          error: e.response?.data || e.message
        });
      }
    }
  },
  {
    name: "GoMerch Refresh Token",
    desc: "Memperbarui masa aktif Access Token GoPay Merchant menggunakan Refresh Token",
    category: "Gopay Merchant",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      refresh_token: { type: "string", example: "refresh_token_anda" }
    },
    path: "/gomerch/auth-refresh",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const refreshToken = req.query?.refresh_token || req.body?.refresh_token;
      if (!refreshToken) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'refresh_token' wajib diisi" });
      }

      try {
        const data = await sdk.refreshToken(refreshToken);
        res.json({
          status: true,
          creator: "PutzOfficial",
          success: true,
          data
        });
      } catch (e) {
        res.status(401).json({
          status: false,
          creator: "PutzOfficial",
          success: false,
          error: e.response?.data || e.message
        });
      }
    }
  },
  {
    name: "GoMerch Validasi Token & Profil",
    desc: "Memvalidasi Access Token GoBiz dan menampilkan data profil user pemilik toko",
    category: "Gopay Merchant",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      token: { type: "string", example: "access_token_anda" }
    },
    path: "/gomerch/validate",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const token = req.query?.token || req.body?.token;
      if (!token) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'token' wajib diisi" });
      }

      try {
        const data = await sdk.getMe(token);
        res.json({
          status: true,
          creator: "PutzOfficial",
          success: true,
          user: data?.user || data,
          access_token: token
        });
      } catch (e) {
        res.status(401).json({
          status: false,
          creator: "PutzOfficial",
          success: false,
          error: e.response?.data || e.message
        });
      }
    }
  },
  {
    name: "GoMerch Profil Merchant (Me)",
    desc: "Melihat detail informasi akun merchant GoPay/GoBiz yang sedang login",
    category: "Gopay Merchant",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      token: { type: "string", example: "access_token_anda" }
    },
    path: "/gomerch/me",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const token = req.query?.token || req.body?.token;
      if (!token) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'token' wajib diisi" });
      }

      try {
        const data = await sdk.getMe(token);
        res.json({
          status: true,
          creator: "PutzOfficial",
          success: true,
          data
        });
      } catch (e) {
        res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          success: false,
          error: e.response?.data || e.message
        });
      }
    }
  },
  {
    name: "GoMerch Riwayat Transaksi QRIS",
    desc: "Melihat riwayat transaksi pembayaran QRIS yang masuk ke merchant GoBiz",
    category: "Gopay Merchant",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      token: { type: "string", example: "access_token_anda" },
      start_time: { type: "string", example: "2026-08-01" }
    },
    path: "/gomerch/history",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const token = req.query?.token || req.body?.token;
      if (!token) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'token' wajib diisi" });
      }

      try {
        const user = await sdk.getMe(token);
        const merchantId = user?.user?.merchant_id || user?.merchant_id;
        const defaultStartTime = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString();
        const startTime = req.query?.start_time || req.body?.start_time || defaultStartTime;

        const result = await sdk.getJournals(token, merchantId, startTime);
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

        res.json({
          status: true,
          creator: "PutzOfficial",
          success: true,
          total: data.length,
          data
        });
      } catch (e) {
        res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          success: false,
          error: e.response?.data || e.message
        });
      }
    }
  },
  {
    name: "GoMerch Daftar Payouts",
    desc: "Melihat riwayat pencairan dana (payouts / settlement) ke rekening bank toko",
    category: "Gopay Merchant",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      token: { type: "string", example: "access_token_anda" }
    },
    path: "/gomerch/payouts",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const token = req.query?.token || req.body?.token;
      if (!token) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'token' wajib diisi" });
      }

      try {
        const data = await sdk.getPayouts(token);
        res.json({
          status: true,
          creator: "PutzOfficial",
          success: true,
          data
        });
      } catch (e) {
        res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          success: false,
          error: e.response?.data || e.message
        });
      }
    }
  },
  {
    name: "GoMerch Create Dynamic QRIS",
    desc: "Mengonversi Static QRIS toko menjadi Dynamic QRIS dengan nominal pembayaran otomatis & upload gambar ke cloud",
    category: "Gopay Merchant",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      amount: { type: "string", example: "50000" },
      static_qr: { type: "string", example: "00020101021226590014ID.LINKAJA.WWW011893600911002230101702152002130000000000005204581253033605802ID5913PutzOfficial6007JAKARTA61051011062070703A01630487D4" }
    },
    path: "/gomerch/qris-create",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const amount = req.query?.amount || req.body?.amount;
      const static_qr = req.query?.static_qr || req.body?.static_qr;

      if (!amount || !static_qr) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'amount' dan 'static_qr' wajib diisi" });
      }

      try {
        const data = await sdk.createDynamicQRIS(amount, static_qr);
        const qrBuffer = Buffer.isBuffer(data.qr_buffer) ? data.qr_buffer : Buffer.from(data.qr_buffer.data || data.qr_buffer);
        const imageUrl = await toUrl(qrBuffer);

        res.json({
          status: true,
          creator: "PutzOfficial",
          success: true,
          image_url: imageUrl,
          amount: data.amount,
          qr_string: data.qr_string,
          created_at: data.created_at
        });
      } catch (e) {
        res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          success: false,
          error: e.response?.data || e.message
        });
      }
    }
  },
  {
    name: "GoMerch Cek Status Pembayaran QRIS",
    desc: "Memeriksa secara otomatis apakah QRIS dinamis dengan nominal dan waktu tertentu sudah dibayar (PAID / PENDING)",
    category: "Gopay Merchant",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      token: { type: "string", example: "access_token_anda" },
      amount: { type: "string", example: "50000" },
      created_at: { type: "string", example: "2026-08-27T00:00:00.000Z" }
    },
    path: "/gomerch/qris-status",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const token = req.query?.token || req.body?.token;
      const amount = req.query?.amount || req.body?.amount;
      const created_at = req.query?.created_at || req.body?.created_at;

      if (!token || !amount || !created_at) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'token', 'amount', dan 'created_at' wajib diisi" });
      }

      try {
        const user = await sdk.getMe(token);
        const merchantId = user?.user?.merchant_id || user?.merchant_id;
        const logs = await sdk.getJournals(token, merchantId, created_at);
        const amountSearch = parseInt(amount) * 100;
        const found = (logs.hits || []).find(h => {
          const txTime = new Date(h.time).getTime();
          const qrisTime = new Date(created_at).getTime();
          return (h.amount === amountSearch || h.metadata?.provider_metadata?.aspi?.data?.amount === parseInt(amount)) && txTime >= qrisTime;
        });

        res.json({
          status: true,
          creator: "PutzOfficial",
          success: true,
          payment_status: found ? 'PAID' : 'PENDING',
          data: found || null
        });
      } catch (e) {
        res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          success: false,
          error: e.response?.data || e.message
        });
      }
    }
  },
  {
    name: "GoMerch Detail Transaksi",
    desc: "Melihat detail lengkap satu transaksi berdasarkan ID transaksi",
    category: "Gopay Merchant",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      token: { type: "string", example: "access_token_anda" },
      transaction_id: { type: "string", example: "trx_12345" }
    },
    path: "/gomerch/trx-detail",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const token = req.query?.token || req.body?.token;
      const transaction_id = req.query?.transaction_id || req.body?.transaction_id;

      if (!token || !transaction_id) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'token' dan 'transaction_id' wajib diisi" });
      }

      try {
        const data = await sdk.getTransactionDetail(token, transaction_id);
        const aspi = data?.metadata?.provider_metadata?.aspi;

        res.json({
          status: true,
          creator: "PutzOfficial",
          success: true,
          data: {
            id: data.id,
            reference_id: data.reference_id,
            status: data.status,
            time: data.time,
            amount: aspi?.data?.amount || data.amount || 0,
            issuer: aspi?.issuer || null,
            acquirer: aspi?.acquirer || null,
            merchant_name: aspi?.data?.merchant_name || null,
            merchant_id: aspi?.data?.merchant_id || null,
            merchant_city: aspi?.data?.merchant_city || null,
            terminal_label: aspi?.data?.additional_data?.terminal_label || null
          }
        });
      } catch (e) {
        res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          success: false,
          error: e.response?.data || e.message
        });
      }
    }
  },
  {
    name: "GoMerch Batalkan Transaksi",
    desc: "Membatalkan (void / cancel) transaksi QRIS yang belum selesai",
    category: "Gopay Merchant",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      token: { type: "string", example: "access_token_anda" },
      transaction_id: { type: "string", example: "trx_12345" }
    },
    path: "/gomerch/trx-cancel",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const token = req.query?.token || req.body?.token;
      const transaction_id = req.query?.transaction_id || req.body?.transaction_id;

      if (!token || !transaction_id) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'token' dan 'transaction_id' wajib diisi" });
      }

      try {
        const data = await sdk.cancelTransaction(token, transaction_id);
        const aspi = data?.metadata?.provider_metadata?.aspi;

        res.json({
          status: true,
          creator: "PutzOfficial",
          success: true,
          data: {
            id: data.id,
            reference_id: data.reference_id,
            status: "CANCELLED",
            time: data.time,
            amount: aspi?.data?.amount || data.amount || 0,
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
        res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          success: false,
          error: e.response?.data || e.message
        });
      }
    }
  }
];
