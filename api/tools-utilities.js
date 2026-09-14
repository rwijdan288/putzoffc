const axios = require("axios");

module.exports = [
  {
    name: "Web Screenshot",
    desc: "Mengambil tangkapan layar (screenshot) penuh dari halaman website manapun",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      url: { type: "string", example: "https://google.com" }
    },
    path: "/tools/ssweb",
    async run(req, res) {
      const { apikey, url } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'url' wajib diisi (contoh: https://google.com)" });
      }

      const targetUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
      const screenshotUrl = `https://image.thum.io/get/width/1280/crop/800/noanimate/${targetUrl}`;

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          targetUrl,
          screenshotUrl,
          directImage: screenshotUrl
        }
      });
    }
  },
  {
    name: "QR Code Generator",
    desc: "Menghasilkan gambar QR Code instan dari teks atau URL dengan resolusi tinggi",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      text: { type: "string", example: "https://t.me/putzpay" },
      size: { type: "string", example: "300x300" }
    },
    path: "/tools/qrcode",
    async run(req, res) {
      const { apikey, text, size } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!text) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'text' wajib diisi" });
      }

      const qrSize = size || "350x350";
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}&data=${encodeURIComponent(text)}`;

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          text,
          size: qrSize,
          qrUrl
        }
      });
    }
  },
  {
    name: "URL Shortener (TinyURL)",
    desc: "Memendekkan link panjang menjadi link pendek yang rapi",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      url: { type: "string", example: "https://github.com/PutzOfficial" }
    },
    path: "/tools/shorturl",
    async run(req, res) {
      const { apikey, url } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'url' wajib diisi" });
      }

      try {
        const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 8000 });
        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            originalUrl: url,
            shortUrl: response.data
          }
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: "Gagal memendekkan URL." });
      }
    }
  }
];
