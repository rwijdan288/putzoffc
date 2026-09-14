const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://api.mail.tm";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

// Persistent / In-memory account cache
const CACHE_FILE = path.join(__dirname, "../tempmail_cache.json");
const accountCache = new Map();

// Load cache on startup
try {
  if (fs.existsSync(CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    for (const [k, v] of Object.entries(data)) {
      accountCache.set(k.toLowerCase(), v);
    }
  }
} catch (e) {
  // Ignore cache read errors
}

function saveAccountToCache(address, password, token) {
  if (!address) return;
  const key = address.toLowerCase();
  const entry = {
    address: key,
    password,
    token,
    updatedAt: Date.now()
  };
  accountCache.set(key, entry);

  // Keep cache to maximum 500 entries
  if (accountCache.size > 500) {
    const oldestKey = accountCache.keys().next().value;
    accountCache.delete(oldestKey);
  }

  // Save asynchronously
  try {
    const obj = Object.fromEntries(accountCache);
    fs.writeFile(CACHE_FILE, JSON.stringify(obj), () => {});
  } catch (e) {}
}

function getAccountFromCache(address) {
  if (!address) return null;
  return accountCache.get(address.toLowerCase()) || null;
}

// Cached domains with TTL
let cachedDomains = [];
let lastDomainsFetch = 0;

async function getDomains() {
  const now = Date.now();
  if (cachedDomains.length > 0 && now - lastDomainsFetch < 5 * 60 * 1000) {
    return cachedDomains;
  }

  try {
    const res = await axios.get(`${BASE_URL}/domains`, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json"
      },
      timeout: 10000
    });

    const member = res.data?.["hydra:member"] || res.data || [];
    const activeDomains = member.filter(d => d.isActive !== false).map(d => d.domain);
    if (activeDomains.length > 0) {
      cachedDomains = activeDomains;
      lastDomainsFetch = now;
      return cachedDomains;
    }
  } catch (err) {
    // If request fails but we have stale cache, use it
    if (cachedDomains.length > 0) {
      return cachedDomains;
    }
  }

  // Fallback default domains for mail.tm
  cachedDomains = ["uberip.com", "emalupe.com"];
  lastDomainsFetch = now;
  return cachedDomains;
}

// Create Account on mail.tm
async function createAccount(address, password) {
  const res = await axios.post(`${BASE_URL}/accounts`, {
    address,
    password
  }, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": USER_AGENT
    },
    timeout: 12000
  });
  return res.data;
}

// Get JWT Token from mail.tm
async function getToken(address, password) {
  const res = await axios.post(`${BASE_URL}/token`, {
    address,
    password
  }, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": USER_AGENT
    },
    timeout: 12000
  });
  return res.data?.token;
}

// Resolve token with automatic cache fallback & auto-refresh
async function resolveAuthToken(req) {
  let rawToken = req.query?.token || req.body?.token || req.headers?.authorization;
  if (rawToken && typeof rawToken === "string") {
    const cleanToken = rawToken.replace(/^Bearer\s+/i, "").trim();
    if (cleanToken && cleanToken !== "undefined" && cleanToken !== "null") {
      return { token: cleanToken, email: null, password: null };
    }
  }

  const rawEmail = req.query?.email || req.body?.email || req.query?.address || req.body?.address || req.query?.mail || req.body?.mail;
  const rawPassword = req.query?.password || req.body?.password || req.query?.pass || req.body?.pass;

  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword.trim() : "";

  // 1. Email and password directly provided
  if (email && password) {
    try {
      const freshToken = await getToken(email, password);
      saveAccountToCache(email, password, freshToken);
      return { token: freshToken, email, password };
    } catch (e) {
      // Continue to cache check if token retrieval fails
    }
  }

  // 2. Lookup in account cache by email
  if (email) {
    const cached = getAccountFromCache(email);
    if (cached) {
      if (cached.token) {
        return { token: cached.token, email, password: cached.password };
      }
      if (cached.password) {
        try {
          const freshToken = await getToken(email, cached.password);
          saveAccountToCache(email, cached.password, freshToken);
          return { token: freshToken, email, password: cached.password };
        } catch (e) {}
      }
    }
  }

  return null;
}

// Helper: Make authenticated request with automatic retry if token expired (401)
async function requestWithAuth(options, authInfo) {
  const reqHeaders = {
    ...options.headers,
    "Authorization": `Bearer ${authInfo.token}`,
    "Accept": "application/json",
    "User-Agent": USER_AGENT
  };

  try {
    return await axios({
      ...options,
      headers: reqHeaders,
      timeout: 12000
    });
  } catch (err) {
    // If 401 and we have email + password, attempt 1 automatic token refresh
    if (err.response?.status === 401 && authInfo.email && authInfo.password) {
      try {
        const freshToken = await getToken(authInfo.email, authInfo.password);
        authInfo.token = freshToken;
        saveAccountToCache(authInfo.email, authInfo.password, freshToken);
        reqHeaders["Authorization"] = `Bearer ${freshToken}`;

        return await axios({
          ...options,
          headers: reqHeaders,
          timeout: 12000
        });
      } catch (refreshErr) {
        throw err;
      }
    }
    throw err;
  }
}

// Random string generator
function randomStr(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let str = "";
  for (let i = 0; i < len; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

function parseMailError(err, fallback = "Gagal memproses permintaan") {
  if (err.response?.status === 404) {
    return "Pesan atau data tidak ditemukan / telah dihapus";
  }
  if (err.response?.status === 401) {
    return "Token atau kredensial autentikasi tidak valid atau sudah kadaluarsa";
  }
  if (err.response?.status === 429) {
    return "Layanan email sementara sedang sibuk (Rate Limit). Silakan coba lagi beberapa saat lagi.";
  }

  const data = err.response?.data;
  if (!data) return err.message || fallback;

  if (typeof data === "string") return data.slice(0, 150);
  if (data["hydra:description"]) return data["hydra:description"];
  if (data.message) return data.message;
  if (Array.isArray(data.violations) && data.violations.length > 0) {
    return data.violations.map(v => v.message).join(", ");
  }
  return fallback;
}

module.exports = [
  // 1. Create Random Email
  {
    name: "Create Email",
    desc: "Membuat akun email sementara (disposable temporary email) secara acak lengkap dengan token autentikasi (Mail.tm)",
    category: "TempMail",
    parameters: {
      apikey: { type: "string", example: "ptz" }
    },
    path: "/create-email",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.json({ status: false, creator: "PutzOfficial", error: "Apikey invalid" });
      }

      try {
        const domains = await getDomains();
        const selectedDomain = domains[Math.floor(Math.random() * domains.length)] || "uberip.com";
        const username = randomStr(10);
        const address = `${username}@${selectedDomain}`;
        const password = `pwd_${randomStr(8)}!`;

        const acc = await createAccount(address, password);
        const token = await getToken(address, password);

        saveAccountToCache(address, password, token);

        return res.json({
          status: true,
          creator: "PutzOfficial",
          message: "Akun email sementara berhasil dibuat",
          result: {
            id: acc.id || acc["@id"],
            email: address,
            password: password,
            domain: selectedDomain,
            token: token,
            quota: acc.quota || 40000000,
            createdAt: acc.createdAt || new Date().toISOString()
          }
        });
      } catch (err) {
        const errMsg = parseMailError(err, "Gagal membuat email sementara");
        return res.json({
          status: false,
          creator: "PutzOfficial",
          error: errMsg
        });
      }
    }
  },

  // 2. Create Custom Email
  {
    name: "Custom Email",
    desc: "Membuat akun email sementara dengan custom username (domain dipilih otomatis dari Mail.tm)",
    category: "TempMail",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      username: { type: "string", example: "putzuser" },
      password: { type: "string", example: "Password123!", required: false }
    },
    path: "/custom-email",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      const rawUser = req.query?.username || req.body?.username || req.query?.name || req.body?.name;

      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.json({ status: false, creator: "PutzOfficial", error: "Apikey invalid" });
      }

      if (!rawUser) {
        return res.json({ status: false, creator: "PutzOfficial", error: "Parameter 'username' wajib diisi" });
      }

      try {
        const availableDomains = await getDomains();
        const selectedDomain = availableDomains[0] || "uberip.com";
        const autoPass = req.query?.password || req.body?.password || `pwd_${randomStr(8)}!`;

        // Clean username: lowercase, alphanumeric and dashes
        let cleanUser = String(rawUser).toLowerCase().replace(/[^a-z0-9._-]/g, "");
        if (cleanUser.length < 3) {
          cleanUser = `${cleanUser}${randomStr(4)}`;
        }
        const address = `${cleanUser}@${selectedDomain}`;

        const acc = await createAccount(address, autoPass);
        const token = await getToken(address, autoPass);

        saveAccountToCache(address, autoPass, token);

        return res.json({
          status: true,
          creator: "PutzOfficial",
          message: "Custom email sementara berhasil dibuat",
          result: {
            id: acc.id || acc["@id"],
            email: address,
            password: autoPass,
            domain: selectedDomain,
            token: token,
            quota: acc.quota || 40000000,
            createdAt: acc.createdAt || new Date().toISOString()
          }
        });
      } catch (err) {
        const errMsg = parseMailError(err, "Gagal membuat custom email. Username mungkin sudah digunakan atau tidak valid.");
        return res.json({
          status: false,
          creator: "PutzOfficial",
          error: errMsg
        });
      }
    }
  },

  // 3. Inbox List
  {
    name: "Inbox",
    desc: "Mengambil daftar pesan masuk (inbox) menggunakan token, alamat email yang baru dibuat, atau pasangan email & password (Mail.tm)",
    category: "TempMail",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      token: { type: "string", example: "eyJhbGciOiJIUzUxMiJ9...", required: false },
      email: { type: "string", example: "user@uberip.com", required: false },
      password: { type: "string", example: "Password123!", required: false }
    },
    path: "/inbox",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.json({ status: false, creator: "PutzOfficial", error: "Apikey invalid" });
      }

      try {
        const authInfo = await resolveAuthToken(req);
        if (!authInfo || !authInfo.token) {
          return res.json({
            status: false,
            creator: "PutzOfficial",
            error: "Parameter 'token', 'email' yang dibuat dari sesi ini, atau pasangan 'email' & 'password' wajib disertakan untuk membaca inbox."
          });
        }

        const response = await requestWithAuth({
          method: "GET",
          url: `${BASE_URL}/messages`
        }, authInfo);

        const messages = response.data?.["hydra:member"] || response.data || [];
        const formatted = messages.map(msg => ({
          id: msg.id || msg["@id"],
          from: msg.from || {},
          to: msg.to || [],
          subject: msg.subject || "(No Subject)",
          intro: msg.intro || "",
          seen: Boolean(msg.seen),
          isDeleted: Boolean(msg.isDeleted),
          hasAttachments: Boolean(msg.hasAttachments),
          size: msg.size || 0,
          createdAt: msg.createdAt || null
        }));

        return res.json({
          status: true,
          creator: "PutzOfficial",
          total: formatted.length,
          result: formatted
        });
      } catch (err) {
        const errMsg = parseMailError(err, "Gagal mengambil daftar inbox");
        return res.json({
          status: false,
          creator: "PutzOfficial",
          error: errMsg
        });
      }
    }
  },

  // 4. Message Detail (Mendukung path /massage dan /message)
  {
    name: "Message Detail",
    desc: "Membaca isi lengkap pesan email (konten teks & HTML) berdasarkan message ID (Mail.tm)",
    category: "TempMail",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      id: { type: "string", example: "6a91599451d4c862ec0a4f4d" },
      token: { type: "string", example: "eyJhbGciOiJIUzUxMiJ9...", required: false },
      email: { type: "string", example: "user@uberip.com", required: false },
      password: { type: "string", example: "Password123!", required: false }
    },
    path: "/message",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      const messageId = req.query?.id || req.body?.id;

      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.json({ status: false, creator: "PutzOfficial", error: "Apikey invalid" });
      }

      if (!messageId) {
        return res.json({
          status: false,
          creator: "PutzOfficial",
          error: "Parameter 'id' (Message ID) wajib diisi"
        });
      }

      try {
        const authInfo = await resolveAuthToken(req);
        if (!authInfo || !authInfo.token) {
          return res.json({
            status: false,
            creator: "PutzOfficial",
            error: "Parameter 'token', 'email' dari sesi ini, atau pasangan 'email' & 'password' wajib disertakan untuk membuka pesan."
          });
        }

        const cleanId = String(messageId).replace(/^\/messages\//, "").trim();
        const response = await requestWithAuth({
          method: "GET",
          url: `${BASE_URL}/messages/${cleanId}`
        }, authInfo);

        const d = response.data;
        return res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            id: d.id || d["@id"],
            msgid: d.msgid,
            from: d.from,
            to: d.to,
            subject: d.subject || "(No Subject)",
            intro: d.intro,
            seen: d.seen,
            isDeleted: d.isDeleted,
            hasAttachments: d.hasAttachments,
            size: d.size,
            attachments: d.attachments || [],
            text: d.text || "",
            html: Array.isArray(d.html) ? d.html.join("") : (d.html || ""),
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
          }
        });
      } catch (err) {
        const errMsg = parseMailError(err, "Gagal mengambil isi pesan");
        return res.json({
          status: false,
          creator: "PutzOfficial",
          error: errMsg
        });
      }
    }
  },

  // 5. Message Detail Alias (/massage untuk backward compatibility)
  {
    name: "Message Detail (Legacy)",
    desc: "Alias lama /massage untuk membaca detail pesan email (Mail.tm)",
    category: "TempMail",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      id: { type: "string", example: "6a91599451d4c862ec0a4f4d" },
      token: { type: "string", example: "eyJhbGciOiJIUzUxMiJ9...", required: false },
      email: { type: "string", example: "user@uberip.com", required: false },
      password: { type: "string", example: "Password123!", required: false }
    },
    path: "/massage",
    async run(req, res) {
      // Re-use run handler from /message
      const messageEndpoint = module.exports.find(ep => ep.path === "/message");
      return messageEndpoint.run(req, res);
    }
  },

  // 6. Delete Message
  {
    name: "Delete Message",
    desc: "Menghapus pesan email masuk berdasarkan ID pesan (Mail.tm)",
    category: "TempMail",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      id: { type: "string", example: "6a91599451d4c862ec0a4f4d" },
      token: { type: "string", example: "eyJhbGciOiJIUzUxMiJ9...", required: false },
      email: { type: "string", example: "user@uberip.com", required: false },
      password: { type: "string", example: "Password123!", required: false }
    },
    path: "/delete-message",
    async run(req, res) {
      const apikey = req.query?.apikey || req.body?.apikey;
      const messageId = req.query?.id || req.body?.id;

      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.json({ status: false, creator: "PutzOfficial", error: "Apikey invalid" });
      }

      if (!messageId) {
        return res.json({
          status: false,
          creator: "PutzOfficial",
          error: "Parameter 'id' (Message ID) wajib diisi"
        });
      }

      try {
        const authInfo = await resolveAuthToken(req);
        if (!authInfo || !authInfo.token) {
          return res.json({
            status: false,
            creator: "PutzOfficial",
            error: "Parameter 'token', 'email' dari sesi ini, atau pasangan 'email' & 'password' wajib disertakan untuk menghapus pesan."
          });
        }

        const cleanId = String(messageId).replace(/^\/messages\//, "").trim();
        await requestWithAuth({
          method: "DELETE",
          url: `${BASE_URL}/messages/${cleanId}`
        }, authInfo);

        return res.json({
          status: true,
          creator: "PutzOfficial",
          message: `Pesan dengan ID ${cleanId} berhasil dihapus`
        });
      } catch (err) {
        const errMsg = parseMailError(err, "Gagal menghapus pesan");
        return res.json({
          status: false,
          creator: "PutzOfficial",
          error: errMsg
        });
      }
    }
  }
];
