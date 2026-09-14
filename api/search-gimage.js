const axios = require("axios");
const cheerio = require("cheerio");

const googleSearchImage = async (query) => {
  if (!query) throw new Error("Query pencarian tidak boleh kosong");

  // Primary: Bing Image Extraction (High resolution + Fast)
  try {
    const res = await axios.get(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      timeout: 10000
    });
    const $ = cheerio.load(res.data);
    const images = [];
    $("a.iusc").each((i, el) => {
      try {
        const m = JSON.parse($(el).attr("m") || "{}");
        if (m.murl) {
          images.push({
            title: m.t || `${query} #${i + 1}`,
            imageUrl: m.murl,
            thumbnail: m.turl || m.murl,
            referer: m.purl || null
          });
        }
      } catch (e) {}
    });
    if (images.length > 0) {
      return { total: images.length, images };
    }
  } catch (e) {}

  // Fallback: Google Images gstatic pattern
  try {
    const res = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      },
      timeout: 10000
    });
    const html = res.data;
    const matches = [...html.matchAll(/\["(https:\/\/encrypted-tbn0\.gstatic\.com\/images\?q=[^"]+)",\d+,\d+\]/g)];
    const urls = matches.map(m => m[1].replace(/\\u003d/g, "=").replace(/\\u0026/g, "&"));
    if (urls.length > 0) {
      const images = urls.map((u, i) => ({
        title: `${query} #${i + 1}`,
        imageUrl: u,
        thumbnail: u,
        referer: "https://www.google.com"
      }));
      return { total: images.length, images };
    }
  } catch (e) {}

  throw new Error(`Hasil gambar untuk '${query}' tidak ditemukan`);
};

module.exports = {
  name: "Gimage",
  desc: "Search foto dari Google / Web Images",
  category: "Search",
  parameters: {
    apikey: { type: "string", example: "ptz" },
    q: { type: "string", example: "kucing anggora" }
  },     
  path: "/search/gimage",
  async run(req, res) {
    const apikey = req.query?.apikey || req.body?.apikey;
    const q = req.query?.q || req.query?.query || req.body?.q || req.body?.query;

    const validKeyList = global.apikey || ["skyy", "rz", "ptz", "putz", "piantech", "key123"];
    if (!apikey || !validKeyList.includes(apikey)) {
      return res.status(401).json({ status: false, creator: "PutzOfficial", error: "Apikey invalid" });
    }

    if (!q) {
      return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'q' wajib diisi" });
    }

    try {
      const results = await googleSearchImage(q);
      res.json({
        status: true,
        creator: "PutzOfficial",
        result: results
      });
    } catch (error) {
      res.status(500).json({ status: false, creator: "PutzOfficial", error: error.message });
    }
  }
};
