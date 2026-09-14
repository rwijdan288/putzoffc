module.exports = [
  {
    name: "Barcode Generator",
    desc: "Membuat gambar Barcode instan (Code 128 / EAN) untuk label produk atau inventaris toko",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      text: { type: "string", example: "PUTZ-100293" },
      type: { type: "string", example: "code128" }
    },
    path: "/tools/barcode",
    async run(req, res) {
      const { apikey, text, type } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!text) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'text' wajib diisi" });
      }

      const barcodeType = (type || "code128").toLowerCase();
      const barcodeUrl = `https://barcodeapi.org/api/${barcodeType}/${encodeURIComponent(text)}`;

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          text,
          type: barcodeType,
          barcodeUrl,
          directImage: barcodeUrl
        }
      });
    }
  },
  {
    name: "Text Stats & SEO Analyzer",
    desc: "Menganalisis teks: jumlah kata, karakter (dengan/tanpa spasi), perkiraan waktu baca, dan jumlah kalimat",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      text: { type: "string", example: "Halo selamat datang di Putz API, REST API tercepat untuk bot dan web." }
    },
    path: "/tools/text-stats",
    async run(req, res) {
      const { apikey, text } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!text) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'text' wajib diisi" });
      }

      const charCount = text.length;
      const charNoSpace = text.replace(/\s+/g, "").length;
      const words = text.trim().split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const sentenceCount = sentences.length;
      
      // Kecepatan membaca rata-rata 200 kata/menit
      const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          charCountWithSpace: charCount,
          charCountWithoutSpace: charNoSpace,
          wordCount,
          sentenceCount,
          estimatedReadingTime: `${readingTimeMinutes} menit`,
          averageWordLength: wordCount > 0 ? (charNoSpace / wordCount).toFixed(1) : 0
        }
      });
    }
  },
  {
    name: "Slugify & Case Converter",
    desc: "Mengonversi format teks ke URL Slug, camelCase, snake_case, PascalCase, dan CONSTANT_CASE",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      text: { type: "string", example: "Panduan Lengkap Belajar Node JS 2026" }
    },
    path: "/tools/slugify",
    async run(req, res) {
      const { apikey, text } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!text) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'text' wajib diisi" });
      }

      const cleanText = text.trim();
      const words = cleanText.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);

      const slug = words.map(w => w.toLowerCase()).join("-");
      const snakeCase = words.map(w => w.toLowerCase()).join("_");
      const constantCase = words.map(w => w.toUpperCase()).join("_");
      const camelCase = words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
      const pascalCase = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          original: cleanText,
          slug,
          camelCase,
          pascalCase,
          snake_case: snakeCase,
          CONSTANT_CASE: constantCase
        }
      });
    }
  },
  {
    name: "Profanity Filter (Sensor Kata Kasar)",
    desc: "Mendeteksi dan menyensor kata-kata kasar / toxic / umpatan dalam bahasa Indonesia dan Inggris",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      text: { type: "string", example: "halo anjing jangan bego ya bangsat" }
    },
    path: "/tools/filter-badwords",
    async run(req, res) {
      const { apikey, text } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!text) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'text' wajib diisi" });
      }

      const toxicWords = [
        "anjing", "babi", "bangsat", "kontol", "memek", "jembut", "pantek", "itil", "puki",
        "asu", "bajingan", "bego", "tolol", "idiot", "goblok", "kampret", "fuck", "shit", "bitch",
        "dick", "pussy", "asshole", "bastard", "cunt", "ngentot", "ngewe", "pepek", "sange"
      ];

      let sanitizedText = text;
      const detectedWords = [];

      toxicWords.forEach(badword => {
        const regex = new RegExp(`\\b${badword}\\b`, "gi");
        if (regex.test(sanitizedText)) {
          detectedWords.push(badword);
          sanitizedText = sanitizedText.replace(regex, "*".repeat(badword.length));
        }
      });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          isClean: detectedWords.length === 0,
          detectedCount: detectedWords.length,
          detectedWords: [...new Set(detectedWords)],
          originalText: text,
          sanitizedText
        }
      });
    }
  },
  {
    name: "Clean URL (Anti-Tracker)",
    desc: "Membersihkan parameter pelacak sampah (utm_, affiliate id, fbclid, ref, gclid) dari link marketplace & sosmed",
    category: "Tools",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      url: { type: "string", example: "https://shopee.co.id/product/123/456?utm_source=tiktok&utm_medium=affiliate&fbclid=IwAR3x" }
    },
    path: "/tools/clean-url",
    async run(req, res) {
      const { apikey, url } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'url' wajib diisi" });
      }

      try {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        const trackingParams = [
          "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
          "fbclid", "gclid", "dclid", "msclkid", "ref", "ref_src", "_ga", "_gl",
          "aff_source", "aff_medium", "share_id", "si", "feature"
        ];

        const removedParams = [];
        trackingParams.forEach(param => {
          if (parsed.searchParams.has(param)) {
            removedParams.push(param);
            parsed.searchParams.delete(param);
          }
        });

        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            originalUrl: url,
            cleanUrl: parsed.toString(),
            removedTrackers: removedParams
          }
        });
      } catch (err) {
        res.status(400).json({ status: false, creator: "PutzOfficial", message: "URL tidak valid." });
      }
    }
  }
];
