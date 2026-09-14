const AlightEngine = require("../lib/alight");

function sanitizeEmail(email) {
  if (!email || typeof email !== "string") return "";
  let clean = email.trim();
  if (clean.includes("%")) {
    try {
      clean = decodeURIComponent(clean).trim();
    } catch (e) {}
  }
  return clean.toLowerCase();
}

function sanitizeLink(link) {
  if (!link || typeof link !== "string") return "";
  let clean = link.trim();
  if (clean.includes("%3A") || clean.includes("%2F") || clean.includes("%3F") || clean.includes("%26")) {
    try {
      clean = decodeURIComponent(clean).trim();
    } catch (e) {}
  }
  return clean;
}

function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

const sendEndpoint = {
  name: "Alight Motion - Send Link",
  desc: "Kirim link verifikasi resmi Alight Creative langsung dari Google Identity Toolkit ke inbox email pengguna.",
  category: "Alight Motion",
  path: "/alight/send",
  method: "ALL",
  parameters: {
    apikey: { type: "string", example: "ptz", required: true },
    email: { type: "string", example: "user@gmail.com", required: true }
  },
  async run(req, res) {
    if (res.headersSent) return;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const apikey = req.query?.apikey || req.body?.apikey || req.headers?.["x-api-key"] || req.headers?.["authorization"]?.replace("Bearer ", "");
    const rawEmail = req.query?.email || req.query?.to || req.body?.email || req.body?.to || "";
    const email = sanitizeEmail(rawEmail);

    const validKeyList = global.apikey || ["skyy", "rz", "ptz", "putz", "piantech", "key123"];
    if (!apikey || (!validKeyList.includes(apikey.trim()) && apikey.trim().toLowerCase() !== "ptz" && apikey.trim().toLowerCase() !== "putz")) {
      return res.status(401).json({
        status: false,
        creator: "PutzOfficial",
        provider: "Alight Creative Official",
        message: "API Key tidak valid atau belum diisi (contoh: ?apikey=ptz)"
      });
    }

    if (!email) {
      return res.status(400).json({
        status: false,
        creator: "PutzOfficial",
        provider: "Alight Creative Official",
        message: "Parameter 'email' wajib diisi (contoh: ?email=user@gmail.com)"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        status: false,
        creator: "PutzOfficial",
        provider: "Alight Creative Official",
        message: `Format alamat email tidak valid: '${email}'`
      });
    }

    try {
      const result = await AlightEngine.link(email);

      if (res.headersSent) return;

      if (result.ok) {
        return res.status(200).json({
          status: true,
          creator: "PutzOfficial",
          provider: "Alight Creative Official",
          message: "Link verifikasi resmi Alight Motion berhasil dikirim ke email!",
          email: email,
          note: "Silakan periksa folder Inbox atau Spam email Anda. Salin tautan resmi Alight Creative lalu kirim ke /api/alight/verify",
          result: {
            email: email,
            action: "Kirim tautan ke /api/alight/verify?link=<LINK_EMAIL>"
          }
        });
      } else {
        return res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          provider: "Alight Creative Official",
          message: "Gagal mengirim link verifikasi: " + (result.why || "Unknown error"),
          error: result.why
        });
      }
    } catch (err) {
      if (res.headersSent) return;
      return res.status(500).json({
        status: false,
        creator: "PutzOfficial",
        provider: "Alight Creative Official",
        message: "Terjadi kesalahan pada sistem pengiriman: " + err.message,
        error: err.message
      });
    }
  }
};

const verifyEndpoint = {
  name: "Alight Motion - Verify Link",
  desc: "Verifikasi magic link resmi Alight Creative dan aktifkan keanggotaan Pro/Premium 1 Tahun di aplikasi HP.",
  category: "Alight Motion",
  path: "/alight/verify",
  method: "ALL",
  parameters: {
    apikey: { type: "string", example: "ptz", required: true },
    email: { type: "string", example: "user@gmail.com", required: true },
    link: { type: "string", example: "https://alightcreative.com?ui_sid=...&oobCode=...", required: true }
  },
  async run(req, res) {
    if (res.headersSent) return;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const apikey = req.query?.apikey || req.body?.apikey || req.headers?.["x-api-key"] || req.headers?.["authorization"]?.replace("Bearer ", "");
    const rawEmail = req.query?.email || req.query?.to || req.body?.email || req.body?.to || "";
    const rawLink = req.query?.link || req.query?.magicLink || req.query?.url || req.body?.link || req.body?.magicLink || req.body?.url || "";
    const email = sanitizeEmail(rawEmail);
    const link = sanitizeLink(rawLink);

    const validKeyList = global.apikey || ["skyy", "rz", "ptz", "putz", "piantech", "key123"];
    if (!apikey || (!validKeyList.includes(apikey.trim()) && apikey.trim().toLowerCase() !== "ptz" && apikey.trim().toLowerCase() !== "putz")) {
      return res.status(401).json({
        status: false,
        creator: "PutzOfficial",
        provider: "Alight Creative Official",
        message: "API Key tidak valid atau belum diisi (contoh: ?apikey=ptz)"
      });
    }

    if (!email) {
      return res.status(400).json({
        status: false,
        creator: "PutzOfficial",
        provider: "Alight Creative Official",
        message: "Parameter 'email' wajib diisi (contoh: ?email=user@gmail.com)"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        status: false,
        creator: "PutzOfficial",
        provider: "Alight Creative Official",
        message: `Format alamat email tidak valid: '${email}'`
      });
    }

    if (!link) {
      return res.status(400).json({
        status: false,
        creator: "PutzOfficial",
        provider: "Alight Creative Official",
        message: "Parameter 'link' wajib diisi (salin seluruh URL magic link dari email Anda)"
      });
    }

    try {
      // 1. Autentikasi dengan Firebase Identity Toolkit Alight Creative
      const authResult = await AlightEngine.auth(email, link);
      if (!authResult.ok) {
        if (res.headersSent) return;
        return res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          provider: "Alight Creative Official",
          message: "Autentikasi link gagal: " + (authResult.why || "Link tidak valid atau telah kedaluwarsa"),
          error: authResult.why
        });
      }

      // 2. Suntikkan lisensi resmi Alight Motion Annual Sub Pro ke Google Cloud Function
      const proResult = await AlightEngine.pro(authResult.id);
      if (!proResult.ok) {
        if (res.headersSent) return;
        return res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          provider: "Alight Creative Official",
          message: "Aktivasi langganan Pro gagal: " + (proResult.why || "Gagal memproses verifyPurchase"),
          error: proResult.why,
          email: email
        });
      }

      // 3. Simpan sesi secara aman (kompatibel Vercel)
      AlightEngine.saveSession(email, {
        id: authResult.id,
        ref: authResult.ref,
        uid: authResult.uid,
        orderId: proResult.order,
        pro: true,
        user: authResult.user
      });

      if (res.headersSent) return;

      return res.status(200).json({
        status: true,
        creator: "PutzOfficial",
        provider: "Alight Creative Official",
        message: "Selamat! Akun Alight Motion Anda berhasil diaktifkan menjadi Premium Pro!",
        premium: true,
        email: email,
        plan: "Annual Subscription (1 Year)",
        orderId: proResult.order,
        uid: authResult.uid,
        isNewUser: authResult.baru,
        result: {
          status: "ACTIVE",
          productId: "am.full.sub.annual.19q4",
          orderId: proResult.order,
          account: authResult.user || { email: email, uid: authResult.uid }
        }
      });
    } catch (err) {
      if (res.headersSent) return;
      return res.status(500).json({
        status: false,
        creator: "PutzOfficial",
        provider: "Alight Creative Official",
        message: "Terjadi kesalahan internal saat memproses verifikasi: " + err.message,
        error: err.message
      });
    }
  }
};

module.exports = [ sendEndpoint, verifyEndpoint ];
