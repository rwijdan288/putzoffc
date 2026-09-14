const dns = require("dns").promises;
const https = require("https");
const tls = require("tls");
const net = require("net");
const crypto = require("crypto");
const axios = require("axios");

module.exports = [
  {
    name: "DNS Lookup & Records",
    desc: "Mengecek catatan DNS lengkap suatu domain (A, AAAA, MX, TXT, NS, CNAME)",
    category: "Developer Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      domain: { type: "string", example: "google.com" }
    },
    path: "/dev/dns",
    async run(req, res) {
      const { apikey, domain } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!domain) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'domain' wajib diisi" });
      }

      const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0].trim();

      try {
        const [a, aaaa, mx, txt, ns] = await Promise.allSettled([
          dns.resolve4(cleanDomain),
          dns.resolve6(cleanDomain),
          dns.resolveMx(cleanDomain),
          dns.resolveTxt(cleanDomain),
          dns.resolveNs(cleanDomain)
        ]);

        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            domain: cleanDomain,
            records: {
              A: a.status === "fulfilled" ? a.value : [],
              AAAA: aaaa.status === "fulfilled" ? aaaa.value : [],
              MX: mx.status === "fulfilled" ? mx.value : [],
              TXT: txt.status === "fulfilled" ? txt.value.flat() : [],
              NS: ns.status === "fulfilled" ? ns.value : []
            }
          }
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "HTTP & Latency Checker",
    desc: "Mengecek status kode HTTP, respon latency (ms), dan header server website",
    category: "Developer Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      url: { type: "string", example: "https://google.com" }
    },
    path: "/dev/http-check",
    async run(req, res) {
      const { apikey, url } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'url' wajib diisi" });
      }

      const targetUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
      const startTime = Date.now();

      try {
        const response = await axios.get(targetUrl, {
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: () => true,
          headers: { "User-Agent": "PutzAPI-Uptime-Monitor/2.0" }
        });

        const latencyMs = Date.now() - startTime;

        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            url: targetUrl,
            statusCode: response.status,
            statusText: response.statusText,
            latency: `${latencyMs} ms`,
            server: response.headers["server"] || "Hidden",
            contentType: response.headers["content-type"] || "Unknown",
            headers: response.headers
          }
        });
      } catch (err) {
        res.status(500).json({
          status: false,
          creator: "PutzOfficial",
          message: `Gagal menghubungi target: ${err.message}`,
          latency: `${Date.now() - startTime} ms`
        });
      }
    }
  },
  {
    name: "SSL / TLS Certificate Inspector",
    desc: "Memeriksa validitas sertifikat SSL/TLS, masa aktif, penerbit (issuer), dan tanggal kedaluwarsa",
    category: "Developer Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      domain: { type: "string", example: "google.com" }
    },
    path: "/dev/ssl-check",
    async run(req, res) {
      const { apikey, domain } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!domain) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'domain' wajib diisi" });
      }

      const host = domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0].trim();

      try {
        const socket = tls.connect(443, host, { servername: host }, () => {
          const cert = socket.getPeerCertificate();
          socket.destroy();

          if (!cert || Object.keys(cert).length === 0) {
            return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Sertifikat SSL tidak ditemukan." });
          }

          const validTo = new Date(cert.valid_to);
          const now = new Date();
          const daysRemaining = Math.ceil((validTo - now) / (1000 * 60 * 60 * 24));

          res.json({
            status: true,
            creator: "PutzOfficial",
            result: {
              domain: host,
              subject: cert.subject?.CN || host,
              issuer: cert.issuer?.O || cert.issuer?.CN || "Unknown Issuer",
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
              daysRemaining: `${daysRemaining} hari`,
              isExpired: daysRemaining <= 0,
              serialNumber: cert.serialNumber,
              fingerprint256: cert.fingerprint256
            }
          });
        });

        socket.setTimeout(6000, () => {
          socket.destroy();
          res.status(504).json({ status: false, creator: "PutzOfficial", message: "Timeout saat memeriksa sertifikat SSL." });
        });

        socket.on("error", (err) => {
          res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "User-Agent Parser",
    desc: "Mendeteksi detail sistem operasi, browser, device, dan arsitektur dari string User-Agent",
    category: "Developer Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      ua: { type: "string", example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" }
    },
    path: "/dev/parse-ua",
    async run(req, res) {
      const { apikey, ua } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const userAgent = ua || req.headers["user-agent"] || "";
      if (!userAgent) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'ua' wajib diisi" });
      }

      let browser = "Unknown";
      if (/edg/i.test(userAgent)) browser = "Microsoft Edge";
      else if (/opr|opera/i.test(userAgent)) browser = "Opera";
      else if (/chrome|crios/i.test(userAgent)) browser = "Google Chrome";
      else if (/firefox|fxios/i.test(userAgent)) browser = "Mozilla Firefox";
      else if (/safari/i.test(userAgent)) browser = "Apple Safari";
      else if (/bot|crawler|spider/i.test(userAgent)) browser = "Bot / Web Crawler";

      let os = "Unknown";
      if (/windows nt 10/i.test(userAgent)) os = "Windows 10 / 11";
      else if (/windows nt 6.3/i.test(userAgent)) os = "Windows 8.1";
      else if (/windows nt 6.1/i.test(userAgent)) os = "Windows 7";
      else if (/android/i.test(userAgent)) os = "Android";
      else if (/iphone|ipad|ipod/i.test(userAgent)) os = "iOS";
      else if (/mac os x/i.test(userAgent)) os = "macOS";
      else if (/linux/i.test(userAgent)) os = "Linux";

      const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
      const isBot = /bot|googlebot|bingbot|crawler|spider/i.test(userAgent);

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          userAgent,
          browser,
          os,
          device: isMobile ? "Mobile / Smartphone" : "Desktop / Laptop",
          isBot,
          isMobile
        }
      });
    }
  },
  {
    name: "TCP Port Checker",
    desc: "Mengecek apakah port jaringan tertentu pada host/IP terbuka (open) atau tertutup (closed)",
    category: "Developer Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      host: { type: "string", example: "1.1.1.1" },
      port: { type: "string", example: "80" }
    },
    path: "/dev/port-check",
    async run(req, res) {
      const { apikey, host, port } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!host || !port) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'host' dan 'port' wajib diisi" });
      }

      const targetPort = parseInt(port);
      if (isNaN(targetPort) || targetPort < 1 || targetPort > 65535) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Port harus bernilai 1 - 65535" });
      }

      const cleanHost = host.replace(/^https?:\/\//, "").split("/")[0].trim();
      const socket = new net.Socket();
      let statusResult = "closed";

      socket.setTimeout(3500);

      socket.on("connect", () => {
        statusResult = "open";
        socket.destroy();
        res.json({
          status: true,
          creator: "PutzOfficial",
          result: { host: cleanHost, port: targetPort, state: "OPEN", message: `Port ${targetPort} terbuka & dapat dihubungi.` }
        });
      });

      socket.on("timeout", () => {
        socket.destroy();
        res.json({
          status: true,
          creator: "PutzOfficial",
          result: { host: cleanHost, port: targetPort, state: "FILTERED / TIMEOUT", message: `Koneksi ke port ${targetPort} timeout (Firewall / Filtered).` }
        });
      });

      socket.on("error", (err) => {
        res.json({
          status: true,
          creator: "PutzOfficial",
          result: { host: cleanHost, port: targetPort, state: "CLOSED", message: `Port ${targetPort} tertutup (${err.message}).` }
        });
      });

      socket.connect(targetPort, cleanHost);
    }
  },
  {
    name: "Hash & Checksum Generator",
    desc: "Menghasilkan berbagai format hash kriptografi (MD5, SHA-1, SHA-256, SHA-512, Base64) dari teks",
    category: "Developer Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      text: { type: "string", example: "PutzOfficial2026" }
    },
    path: "/dev/hash",
    async run(req, res) {
      const { apikey, text } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!text) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'text' wajib diisi" });
      }

      const md5 = crypto.createHash("md5").update(text).digest("hex");
      const sha1 = crypto.createHash("sha1").update(text).digest("hex");
      const sha256 = crypto.createHash("sha256").update(text).digest("hex");
      const sha512 = crypto.createHash("sha512").update(text).digest("hex");
      const base64 = Buffer.from(text).toString("base64");

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          originalText: text,
          hashes: {
            md5,
            sha1,
            sha256,
            sha512,
            base64
          }
        }
      });
    }
  },
  {
    name: "Regex Tester & Validator",
    desc: "Menguji pola Regular Expression (Regex) terhadap teks dengan flags dan penangkapan match",
    category: "Developer Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      pattern: { type: "string", example: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" },
      text: { type: "string", example: "Kontak kami di admin@putzapi.biz.id atau info@gmail.com" },
      flags: { type: "string", example: "gi" }
    },
    path: "/dev/regex",
    async run(req, res) {
      const { apikey, pattern, text, flags } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!pattern || !text) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'pattern' dan 'text' wajib diisi" });
      }

      try {
        const regex = new RegExp(pattern, flags || "g");
        const matches = text.match(regex) || [];
        const isMatch = regex.test(text);

        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            pattern,
            flags: flags || "g",
            isMatch,
            matchCount: matches.length,
            matches
          }
        });
      } catch (err) {
        res.status(400).json({ status: false, creator: "PutzOfficial", message: `Pola regex tidak valid: ${err.message}` });
      }
    }
  }
];
