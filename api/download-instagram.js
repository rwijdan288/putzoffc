const axios = require("axios");

async function downloadInstagram(url) {
  try {
    const res = await axios.post("https://savegram.me/api/ajaxSearch", new URLSearchParams({ q: url, t: "media", lang: "en" }).toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      timeout: 8000
    });
    if (res.data) return res.data;
  } catch (e) {}

  // Fallback direct Instagram structure
  return {
    url,
    note: "Untuk download Instagram Reels / Post, pastikan tautan berasal dari akun publik.",
    direct: `https://snapinsta.app/?url=${encodeURIComponent(url)}`
  };
}

module.exports = {
  name: "Instagram",
  desc: "Instagram Video, Reel & Foto Downloader",
  category: "Downloader",
  parameters: {
    apikey: { type: "string", example: "ptz" }, 
    url: { type: "string", example: "https://www.instagram.com/reel/C_example/" }
  }, 
  path: "/download/instagram",
  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, creator: "PutzOfficial", error: "Apikey invalid" });
    }

    if (!url) {
      return res.json({ status: false, creator: "PutzOfficial", error: "Parameter 'url' Instagram wajib diisi" });
    }

    try {
      const result = await downloadInstagram(url);
      res.status(200).json({
        status: true,
        creator: "PutzOfficial",
        result
      });
    } catch (error) {
      res.status(500).json({ status: false, creator: "PutzOfficial", error: error.message });
    }
  }
};
