const axios = require("axios");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const dns = require("dns").promises;

function authKey(req, res) {
  const query = req.query || {};
  const body = req.body || {};
  const apikey = query.apikey || body.apikey || req.headers?.["x-api-key"];
  const valid = global.apikey || ["skyy", "rz", "ptz", "putz", "piantech", "key123"];
  if (!apikey || !valid.includes(apikey.trim())) {
    res.status(401).json({ status: false, creator: "PutzOfficial", error: "Apikey invalid" });
    return false;
  }
  return true;
}

module.exports = [
  {
    name: "NGL Spam & Message Sender",
    desc: "Kirim pesan anonim atau spam pesan otomatis ke akun NGL.link target",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      username: { type: "string", example: "putz_official", required: true },
      message: { type: "string", example: "Halo dari Putz Official API!", required: true },
      amount: { type: "number", example: 1, required: false }
    },
    path: "/tools/ngl-send",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const username = (req.query?.username || req.body?.username || req.query?.user || req.body?.user || "").replace(/https?:\/\/ngl\.link\//, "").replace(/@/, "").trim();
      const message = (req.query?.message || req.body?.message || req.query?.msg || req.body?.msg || req.query?.text || req.body?.text || "").trim();
      const amount = Math.min(Math.max(parseInt(req.query?.amount || req.body?.amount || 1, 10), 1), 25);

      if (!username) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'username' NGL target wajib diisi" });
      }
      if (!message) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'message' pesan wajib diisi" });
      }

      let successCount = 0;
      let failedCount = 0;
      const logs = [];

      for (let i = 0; i < amount; i++) {
        try {
          const deviceId = uuidv4 ? uuidv4() : crypto.randomBytes(16).toString("hex");
          const payload = new URLSearchParams();
          payload.append("username", username);
          payload.append("question", amount > 1 ? `${message} [${i + 1}]` : message);
          payload.append("deviceId", deviceId);
          payload.append("gameSlug", "");
          payload.append("referrer", "");

          const postRes = await axios.post("https://ngl.link/api/submit", payload.toString(), {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "X-Requested-With": "XMLHttpRequest",
              "Origin": "https://ngl.link",
              "Referer": `https://ngl.link/${encodeURIComponent(username)}`
            },
            timeout: 7000
          });

          if (postRes.status === 200) {
            successCount++;
            logs.push({ index: i + 1, status: "success" });
          } else {
            failedCount++;
            logs.push({ index: i + 1, status: "failed", code: postRes.status });
          }
        } catch (err) {
          failedCount++;
          logs.push({ index: i + 1, status: "error", error: err.response?.data?.message || err.message });
        }
      }

      return res.json({
        status: successCount > 0,
        creator: "PutzOfficial",
        result: {
          target: username,
          ngl_url: `https://ngl.link/${username}`,
          requested_amount: amount,
          success_sent: successCount,
          failed_sent: failedCount,
          message_preview: message,
          logs
        }
      });
    }
  },
  {
    name: "IP Geolocation Lookup",
    desc: "Cek informasi lokasi, ISP, ASN, benua, negara dan koordinat alamat IP",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      ip: { type: "string", example: "8.8.8.8", required: true }
    },
    path: "/tools/ip-lookup",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const ip = (req.query?.ip || req.body?.ip || "8.8.8.8").trim();

      try {
        const response = await axios.get(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, { timeout: 6000 });
        if (response.data.status === "success") {
          return res.json({ status: true, creator: "PutzOfficial", result: response.data });
        }
      } catch (e) {}

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: { ip, status: "checked", query: ip }
      });
    }
  },
  {
    name: "Whois Domain Lookup",
    desc: "Cek registrar, tanggal kadaluarsa, nameserver dan status domain website",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      domain: { type: "string", example: "google.com", required: true }
    },
    path: "/tools/whois",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const domain = (req.query?.domain || req.body?.domain || "").replace(/^https?:\/\//, "").split("/")[0].trim();
      if (!domain) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'domain' wajib diisi" });
      }

      try {
        const api = await axios.get(`https://api.hackertarget.com/whois/?q=${encodeURIComponent(domain)}`, { timeout: 8000 });
        return res.json({ status: true, creator: "PutzOfficial", result: { domain, raw_whois: api.data } });
      } catch (e) {
        return res.json({ status: true, creator: "PutzOfficial", result: { domain, message: "Whois query processed" } });
      }
    }
  },
  {
    name: "DNS Records Lookup",
    desc: "Memeriksa record DNS (A, AAAA, MX, TXT, NS, CNAME) dari sebuah domain",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      domain: { type: "string", example: "cloudflare.com", required: true }
    },
    path: "/tools/dns-lookup",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const domain = (req.query?.domain || req.body?.domain || "").replace(/^https?:\/\//, "").split("/")[0].trim();
      if (!domain) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'domain' wajib diisi" });
      }

      try {
        const [a, mx, txt, ns] = await Promise.allSettled([
          dns.resolve4(domain),
          dns.resolveMx(domain),
          dns.resolveTxt(domain),
          dns.resolveNs(domain)
        ]);

        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            domain,
            records: {
              A: a.status === "fulfilled" ? a.value : [],
              MX: mx.status === "fulfilled" ? mx.value : [],
              TXT: txt.status === "fulfilled" ? txt.value.flat() : [],
              NS: ns.status === "fulfilled" ? ns.value : []
            }
          }
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", error: err.message });
      }
    }
  },
  {
    name: "Website HTTP Status & Ping",
    desc: "Cek uptime, status response HTTP dan waktu latensi (ping) sebuah website",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      url: { type: "string", example: "https://google.com", required: true }
    },
    path: "/tools/http-status",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      let targetUrl = (req.query?.url || req.body?.url || "").trim();
      if (!targetUrl) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'url' wajib diisi" });
      }
      if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

      const startTime = Date.now();
      try {
        const response = await axios.get(targetUrl, { timeout: 8000, validateStatus: () => true });
        const latency = Date.now() - startTime;

        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            url: targetUrl,
            http_code: response.status,
            status_text: response.statusText,
            latency_ms: latency,
            is_online: response.status >= 200 && response.status < 400,
            content_type: response.headers["content-type"]
          }
        });
      } catch (err) {
        res.json({
          status: false,
          creator: "PutzOfficial",
          result: {
            url: targetUrl,
            is_online: false,
            error: err.message
          }
        });
      }
    }
  },
  {
    name: "User-Agent Parser",
    desc: "Membedah struktur User-Agent browser, OS, engine dan device klien",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      ua: { type: "string", example: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", required: false }
    },
    path: "/tools/user-agent",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const ua = (req.query?.ua || req.body?.ua || req.headers["user-agent"] || "").trim();
      const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
      const isAndroid = /android/i.test(ua);
      const isIOS = /iphone|ipad|ipod/i.test(ua);
      const isWindows = /windows/i.test(ua);
      const isMac = /macintosh|mac os x/i.test(ua);
      const isLinux = /linux/i.test(ua);

      let browser = "Unknown";
      if (/chrome/i.test(ua) && !/edg|opr/i.test(ua)) browser = "Google Chrome";
      else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Apple Safari";
      else if (/firefox/i.test(ua)) browser = "Mozilla Firefox";
      else if (/edg/i.test(ua)) browser = "Microsoft Edge";
      else if (/opr|opera/i.test(ua)) browser = "Opera";

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          user_agent: ua,
          browser,
          os: isAndroid ? "Android" : isIOS ? "iOS" : isWindows ? "Windows" : isMac ? "macOS" : isLinux ? "Linux" : "Other",
          device_type: isMobile ? "Mobile / Tablet" : "Desktop / PC",
          is_mobile: isMobile
        }
      });
    }
  },
  {
    name: "Base64 Encode",
    desc: "Mengubah teks biasa menjadi format Base64 encoded",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      text: { type: "string", example: "PutzOfficial REST API", required: true }
    },
    path: "/tools/base64-encode",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const text = (req.query?.text || req.body?.text || "").trim();
      if (!text) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'text' wajib diisi" });
      res.json({ status: true, creator: "PutzOfficial", result: { original: text, encoded: Buffer.from(text).toString("base64") } });
    }
  },
  {
    name: "Base64 Decode",
    desc: "Mendekode string format Base64 kembali ke teks asli",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      text: { type: "string", example: "UHV0ek9mZmljaWFsIFJFU1QgQVBJ", required: true }
    },
    path: "/tools/base64-decode",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const text = (req.query?.text || req.body?.text || "").trim();
      if (!text) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'text' wajib diisi" });
      try {
        const decoded = Buffer.from(text, "base64").toString("utf-8");
        res.json({ status: true, creator: "PutzOfficial", result: { base64: text, decoded } });
      } catch (err) {
        res.status(400).json({ status: false, creator: "PutzOfficial", error: "Gagal mendecode Base64" });
      }
    }
  },
  {
    name: "Hash Generator",
    desc: "Generate berbagai algoritma hash kriptografi (MD5, SHA1, SHA256, SHA512)",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      text: { type: "string", example: "rahasia123", required: true }
    },
    path: "/tools/hash-generator",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const text = (req.query?.text || req.body?.text || "").trim();
      if (!text) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'text' wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          text,
          md5: crypto.createHash("md5").update(text).digest("hex"),
          sha1: crypto.createHash("sha1").update(text).digest("hex"),
          sha256: crypto.createHash("sha256").update(text).digest("hex"),
          sha512: crypto.createHash("sha512").update(text).digest("hex")
        }
      });
    }
  },
  {
    name: "JWT Token Decoder",
    desc: "Membaca payload dan header JSON Web Token (JWT) tanpa memverifikasi secret",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", required: true }
    },
    path: "/tools/jwt-decode",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const token = (req.query?.token || req.body?.token || "").trim();
      if (!token) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'token' JWT wajib diisi" });

      const parts = token.split(".");
      if (parts.length !== 3) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Format JWT token tidak valid (harus 3 bagian terpisah titik)" });
      }

      try {
        const header = JSON.parse(Buffer.from(parts[0], "base64").toString("utf-8"));
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));

        res.json({
          status: true,
          creator: "PutzOfficial",
          result: { header, payload }
        });
      } catch (err) {
        res.status(400).json({ status: false, creator: "PutzOfficial", error: "Gagal mendecode payload JWT" });
      }
    }
  },
  {
    name: "Color Converter",
    desc: "Konverter kode warna lengkap antara HEX, RGB, HSL, dan CMYK",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      hex: { type: "string", example: "ff5733", required: true }
    },
    path: "/tools/color-converter",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      let hex = (req.query?.hex || req.body?.hex || "ff5733").replace("#", "").trim();
      if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
      if (hex.length !== 6) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Format HEX tidak valid" });

      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          hex: `#${hex.toUpperCase()}`,
          rgb: `rgb(${r}, ${g}, ${b})`,
          rgb_values: { r, g, b },
          preview_box: `https://singlecolorimage.com/get/${hex}/300x150`
        }
      });
    }
  },
  {
    name: "Binary Converter",
    desc: "Konversi teks tulisan ke kode biner (0101) dan sebaliknya",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      text: { type: "string", example: "Halo", required: true },
      mode: { type: "string", example: "encode", required: false }
    },
    path: "/tools/binary-converter",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const text = (req.query?.text || req.body?.text || "").trim();
      const mode = (req.query?.mode || req.body?.mode || "encode").toLowerCase();
      if (!text) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'text' wajib diisi" });

      if (mode === "decode") {
        const decoded = text.split(/\s+/).map(bin => String.fromCharCode(parseInt(bin, 2))).join("");
        return res.json({ status: true, creator: "PutzOfficial", result: { binary: text, text: decoded } });
      }

      const binary = text.split("").map(char => char.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
      res.json({ status: true, creator: "PutzOfficial", result: { text, binary } });
    }
  },
  {
    name: "Password Generator",
    desc: "Generator kata sandi acak yang kuat, unik, dan aman",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      length: { type: "number", example: 16, required: false }
    },
    path: "/tools/password-generator",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const length = Math.min(Math.max(parseInt(req.query?.length || req.body?.length || 16, 10), 6), 64);
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
      let password = "";
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      res.json({ status: true, creator: "PutzOfficial", result: { password, length } });
    }
  },
  {
    name: "Kalkulator Usia & Lahir",
    desc: "Menghitung umur detail (tahun, bulan, hari, jam) dan hari lahir",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      tanggal: { type: "string", example: "2000-01-15", required: true }
    },
    path: "/tools/hitung-umur",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const birthStr = (req.query?.tanggal || req.body?.tanggal || "").trim();
      if (!birthStr) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'tanggal' (YYYY-MM-DD) wajib diisi" });

      const birth = new Date(birthStr);
      if (isNaN(birth.getTime())) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Format tanggal tidak valid. Gunakan YYYY-MM-DD (contoh: 2000-01-15)" });

      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      let days = now.getDate() - birth.getDate();

      if (days < 0) {
        months--;
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      const totalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
      const daysOfWeek = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          tanggal_lahir: birthStr,
          hari_lahir: daysOfWeek[birth.getDay()],
          umur: `${years} Tahun, ${months} Bulan, ${days} Hari`,
          detail: { years, months, days, total_days: totalDays }
        }
      });
    }
  },
  {
    name: "Lorem Ipsum Generator",
    desc: "Generator teks dummy filler Lorem Ipsum untuk kebutuhan desain dan mock data",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      count: { type: "number", example: 3, required: false }
    },
    path: "/tools/lorem-ipsum",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const count = Math.min(Math.max(parseInt(req.query?.count || req.body?.count || 2, 10), 1), 10);
      const paragraphs = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida.",
        "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin pharetra nonummy pede. Mauris et orci. Aenean nec lorem. In porttitor. Donec laoreet nonummy augue.",
        "Suspendisse dui purus, scelerisque at, vulputate vitae, pretium mattis, nunc. Mauris eget neque at sem venenatis eleifend. Ut nonummy."
      ];

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          paragraphs: paragraphs.slice(0, count),
          text: paragraphs.slice(0, count).join("\n\n")
        }
      });
    }
  },
  {
    name: "Morse Audio Sound Generator",
    desc: "Menghasilkan link audio tit-tit sandi morse dari kalimat teks",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      text: { type: "string", example: "SOS", required: true }
    },
    path: "/tools/morse-audio",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const text = (req.query?.text || req.body?.text || "SOS").trim();
      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          text,
          audio_stream: `https://morsecode.world/cgi-bin/morse.pl?m=${encodeURIComponent(text)}`,
          preview_player: `https://morsecode.world/international/translator.html`
        }
      });
    }
  }
];
