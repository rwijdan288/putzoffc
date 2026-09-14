const axios = require("axios");

module.exports = {
  name: "Emoji Mix",
  desc: "Mixed emoji generator (Google Emoji Kitchen)",
  category: "Imagecreator",
  parameters: {
    apikey: { type: "string", example: "ptz" },
    emoji1: { type: "string", example: "😭" },
    emoji2: { type: "string", example: "🗿" }
  },   
  path: "/imagecreator/emojimix",
  async run(req, res) {
    const { apikey, emoji1, emoji2 } = req.query;
    
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    if (!emoji1 || !emoji2) {
      return res.json({ status: false, error: 'Emoji1 dan Emoji2 wajib diisi' });
    }

    try {
      const targetUrl = `https://emojik.vercel.app/s/${encodeURIComponent(emoji1.trim())}_${encodeURIComponent(emoji2.trim())}?size=256`;
      const response = await axios.get(targetUrl, {
        responseType: "arraybuffer",
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });

      if (!response.data || response.status !== 200) {
        throw new Error("Kombinasi emoji tidak didukung di Emoji Kitchen");
      }

      res.type("image/png").send(Buffer.from(response.data));
    } catch (error) {
      res.status(400).json({ status: false, error: "Kombinasi emoji tidak valid atau tidak tersedia di Emoji Kitchen" });
    }
  }
};
