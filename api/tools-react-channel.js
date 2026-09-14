const axios = require("axios");

const tokens = [
    "e4e2f8b34124eea2c0d2ff724d1704a8f6e85d87ca4a7caeba240fba1e83327d",
    "1e51b47b5526318a1b091ce809351831c283ac3508c1cc058d19c7dc153a6b1f",
    "56a630611abe6d81e2d92a361be12527b566095eb80e9b645b699b2da4e744a0",
    "92c508311f91f557d67acd09ac3feaf9884c790cc69df2edbbe0432f9eb3a965",
    "1268a2225806ec952aefe8eb950687c9b3d336de719e4b3245c2be3150003d09"
];

let currentTokenIndex = 0;

async function reactToChannel(postUrl, emojis) {
    let attempts = 0;
    const maxAttempts = tokens.length;

    while (attempts < maxAttempts) {
        const apiKey = tokens[currentTokenIndex];

        try {
            const response = await axios({
                method: "POST",
                url: `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post?apiKey=${apiKey}`,
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'content-type': 'application/json',
                    'origin': 'https://asitha.top',
                    'referer': 'https://asitha.top/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
                },
                data: {
                    post_link: postUrl,
                    reacts: Array.isArray(emojis) ? emojis : [emojis]
                }
            });

            return {
                success: true,
                data: response.data
            };

        } catch (err) {
            const e = err.response?.data || err.message;

            if (err.response?.status === 402 ||
                e?.message?.includes("limit") ||
                e?.message?.includes("Limit")) {
                currentTokenIndex = (currentTokenIndex + 1) % tokens.length;
                attempts++;
                continue;
            }

            return {
                success: false,
                error: e,
                status: err.response?.status || 500
            };
        }
    }

    return {
        success: false,
        error: "All tokens are limited",
        status: 402
    };
}

module.exports = {
  name: "React Ch",
  desc: "React postingan Channel WA",
  category: "Tools",
  parameters: {
    apikey: { type: "string", example: "skyy" },
    postUrl: { type: "string", example: "https://whatsapp.com/channel/xxx/123" }, 
    emoji: { type: "string", example: "😭, 🗿, ♥️" }
  },     
  path: "/tools/react-channel",

  async run(req, res) {
    const { apikey, postUrl, emoji } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Invalid API key" });
    }

    if (!postUrl) {
      return res.json({ status: false, error: "postUrl is required" });
    }

    if (!emoji) {
      return res.json({ status: false, error: "emoji is required" });
    }

    try {
      const result = await reactToChannel(postUrl, emoji);

      if (!result.success) {
        return res.status(result.status || 500).json({
          status: false,
          error: result.error
        });
      }

      res.json({
        status: true,
        data: result.data
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  }
};
