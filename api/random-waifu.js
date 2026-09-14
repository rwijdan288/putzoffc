const axios = require("axios");

module.exports = {
  name: "Waifu",
  desc: "Random foto Anime Waifu HD",
  category: "Random",
  parameters: {
    apikey: { type: "string", example: "ptz" }
  },   
  path: "/random/waifu",
  async run(req, res) {
    const apikey = req.query?.apikey || req.body?.apikey;
    const validKeyList = global.apikey || ["skyy", "rz", "ptz", "putz", "piantech", "key123"];
    if (!apikey || !validKeyList.includes(apikey)) {
      return res.status(401).json({ status: false, creator: "PutzOfficial", error: "Apikey invalid" });
    }

    try {
      const response = await axios.get("https://pic.re/image", {
        responseType: "arraybuffer",
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });

      const contentType = response.headers["content-type"] || "image/jpeg";
      res.type(contentType).send(Buffer.from(response.data));
    } catch (error) {
      res.status(500).json({ status: false, creator: "PutzOfficial", error: "Gagal mengambil foto Waifu: " + error.message });
    }
  }
};
