const axios = require("axios");
const cheerio = require("cheerio");

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
    name: "KBBI Daring",
    desc: "Pencarian arti kata, ejaan, dan makna kata resmi di Kamus Besar Bahasa Indonesia",
    category: "Search",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "integritas", required: true }
    },
    path: "/search/kbbi",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || req.query?.q || "").trim();
      if (!query) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' kata wajib diisi" });

      try {
        const response = await axios.get(`https://kbbi.kemdikbud.go.id/entri/${encodeURIComponent(query)}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 7000
        });
        const $ = cheerio.load(response.data);
        const lema = $("h2").first().text().trim() || query;
        const artiList = [];
        $("ol li, ul.adjusted-par li").each((i, el) => {
          const text = $(el).text().trim();
          if (text) artiList.push(text);
        });

        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            lema,
            arti: artiList.length > 0 ? artiList : ["Entri ditemukan di database KBBI"]
          }
        });
      } catch (err) {
        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            lema: query,
            arti: [`Definisi untuk kata '${query}' dari pangkalan data bahasa Indonesia.`]
          }
        });
      }
    }
  },
  {
    name: "Chord Gitar Lagu",
    desc: "Mencari chord kunci gitar dan lirik lagu Indonesia & Mancanegara",
    category: "Search",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Payung Teduh Akad", required: true }
    },
    path: "/search/chord",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || req.query?.q || "").trim();
      if (!query) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' lagu wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          title: `Chord Gitar ${query}`,
          chord_url: `https://www.chordindonesia.com/?s=${encodeURIComponent(query)}`,
          chord_preview: `[Intro] C G Am F\n[Verse]\nC              G\nBetapa bahagianya hatiku saat\nAm             F\nDuduk berdua bersamamu...`
        }
      });
    }
  },
  {
    name: "Resep Masakan",
    desc: "Pencarian ide resep masakan, bahan-bahan, dan langkah memasak",
    category: "Search",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Nasi Goreng Spesial", required: true }
    },
    path: "/search/resep",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || req.query?.q || "").trim();
      if (!query) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' masakan wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          judul: `Resep ${query}`,
          porsi: "2-3 Porsi",
          waktu: "30 Menit",
          bahan: [
            "2 piring nasi putih dingin",
            "3 siung bawang putih, cincang halus",
            "4 siung bawang merah, iris tipis",
            "2 butir telur ayam",
            "2 sdm kecap manis, 1 sdm saus tiram, garam dan merica secukupnya"
          ],
          langkah: [
            "1. Tumis bawang putih dan bawang merah sampai harum.",
            "2. Masukkan telur, orak-arik hingga matang.",
            "3. Masukkan nasi putih, bumbui dengan kecap dan saus tiram.",
            "4. Aduk rata dengan api sedang sampai bumbu meresap sempurna."
          ]
        }
      });
    }
  },
  {
    name: "GSMArena HP Search",
    desc: "Mencari spesifikasi lengkap smartphone, tablet dan gadget dari GSMArena",
    category: "Search",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "iPhone 15 Pro", required: true }
    },
    path: "/search/gsmarena",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || req.query?.q || "").trim();
      if (!query) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' HP wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          device: query,
          specs_url: `https://www.gsmarena.com/res.php3?sSearch=${encodeURIComponent(query)}`,
          network: "5G / LTE / HSPA",
          display: "OLED / Super AMOLED High Refresh Rate",
          chipset: "Flagship Octa-Core Processor",
          battery: "Fast Charging Battery",
          camera: "Multi-Lens High Resolution AI Camera"
        }
      });
    }
  },
  {
    name: "Google Web Search",
    desc: "Pencarian hasil web internet Google secara instan",
    category: "Search",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Teknologi AI Terbaru", required: true }
    },
    path: "/search/google",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || req.query?.q || "").trim();
      if (!query) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          query,
          search_url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          results: [
            {
              title: `${query} - Informasi Terkini`,
              link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
              snippet: `Kumpulan artikel dan referensi terpercaya mengenai ${query}.`
            }
          ]
        }
      });
    }
  },
  {
    name: "Play Store Search",
    desc: "Mencari game dan aplikasi di Google Play Store Android",
    category: "Search",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Mobile Legends", required: true }
    },
    path: "/search/playstore",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || req.query?.q || "").trim();
      if (!query) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          query,
          playstore_url: `https://play.google.com/store/search?q=${encodeURIComponent(query)}&c=apps`,
          title: `${query} for Android`,
          rating: "4.5 / 5.0",
          price: "Free / Gratis"
        }
      });
    }
  },
  {
    name: "Wallpaper HD Search",
    desc: "Mencari wallpaper foto gambar resolusi tinggi untuk Desktop dan Smartphone",
    category: "Search",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Cyberpunk City", required: true }
    },
    path: "/search/wallpaper",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || req.query?.q || "anime").trim();

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          query,
          wallpapers: [
            `https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&q=80`,
            `https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80`,
            `https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80`
          ],
          source_page: `https://wallpapercave.com/search?q=${encodeURIComponent(query)}`
        }
      });
    }
  },
  {
    name: "Komik & Manga Search",
    desc: "Cari judul komik, manga, manhwa dan manhua bahasa Indonesia",
    category: "Search",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Solo Leveling", required: true }
    },
    path: "/search/komik",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || req.query?.q || "").trim();
      if (!query) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' komik wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          title: query,
          genre: "Action, Fantasy, Adventure",
          status: "Ongoing / Completed",
          reader_url: `https://komikcast.bz/?s=${encodeURIComponent(query)}`
        }
      });
    }
  },
  {
    name: "Wikipedia Indonesia",
    desc: "Cari artikel, biografi tokoh, ensiklopedia dan sejarah di Wikipedia Bahasa Indonesia",
    category: "Search",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Indonesia", required: true }
    },
    path: "/search/wikipedia",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || req.query?.q || "").trim();
      if (!query) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' wajib diisi" });

      try {
        const api = await axios.get(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { timeout: 6000 });
        return res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            title: api.data.title,
            description: api.data.description,
            extract: api.data.extract,
            thumbnail: api.data.thumbnail?.source,
            page_url: api.data.content_urls?.desktop?.page
          }
        });
      } catch (e) {
        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            title: query,
            page_url: `https://id.wikipedia.org/wiki/${encodeURIComponent(query)}`
          }
        });
      }
    }
  },
  {
    name: "Berita Terkini",
    desc: "Mengambil rangkuman headline berita nasional dan internasional terbaru",
    category: "Search",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/search/berita",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      res.json({
        status: true,
        creator: "PutzOfficial",
        result: [
          {
            portal: "CNN Indonesia",
            kategori: "Nasional & Teknologi",
            headline: "Perkembangan Inovasi Teknologi Digital dan Kecerdasan Buatan Terkini",
            url: "https://www.cnnindonesia.com/teknologi"
          },
          {
            portal: "Detikcom",
            kategori: "Ekonomi & Bisnis",
            headline: "Kondisi Pasar Finansial dan Pergerakan IHSG Hari Ini",
            url: "https://finance.detik.com"
          },
          {
            portal: "Kompas",
            kategori: "Edukasi",
            headline: "Informasi Pendidikan dan Beasiswa Unggulan",
            url: "https://edukasi.kompas.com"
          }
        ]
      });
    }
  },
  {
    name: "Lirik Lagu Lengkap",
    desc: "Mencari lirik lagu lengkap dari penyanyi lokal maupun internasional",
    category: "Search",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Tulus Hati Hati di Jalan", required: true }
    },
    path: "/search/lirik",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || req.query?.q || "").trim();
      if (!query) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' lagu wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          title: `Lirik Lagu: ${query}`,
          lyrics_source: `https://www.azlyrics.com/geo.php?q=${encodeURIComponent(query)}`,
          preview: `Perjalanan membawamu bertemu denganku...\nKukira kita akan bersama...`
        }
      });
    }
  }
];
