const { generateAndUploadImage } = require("../lib/ai-image-generator");

function getAuthorInfo() {
  return {
    author: process.env.AUTHOR || "PutzOfficial",
    link: process.env.AUTHOR_LINK || "https://t.me/putzpay"
  };
}

function sendResponse(res, status, data) {
  if (res.headersSent) return;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).send(JSON.stringify(data, null, 2));
}

module.exports = {
  name: "AI Image Generator",
  desc: "Endpoint AI untuk menghasilkan gambar (Text-to-Image) dari prompt deskripsi dan otomatis mengunggahnya ke PutzUpload untuk mendapatkan direct link gambar.",
  category: "Tools Ai",
  path: "/ai/image",
  method: "POST",
  timeout: 60000,
  parameters: {
    apikey: {
      type: "string",
      required: false,
      example: "ptz",
      description: "API Key (default otomatis terpasang)"
    },
    prompt: {
      type: "string",
      required: true,
      example: "seekor kucing oranye berpenampilan astronot di bulan",
      description: "Deskripsi gambar yang ingin dibuat oleh AI"
    },
    style: {
      type: "string",
      required: false,
      example: "cinematic",
      description: "Gaya visual (anime, realistic, cyberpunk, cinematic, 3d, fantasy, pixel)"
    },
    aspect_ratio: {
      type: "string",
      required: false,
      example: "1:1",
      description: "Rasio aspek gambar (1:1, 16:9, 9:16, 4:3, 3:4)"
    }
  },

  async run(req, res) {
    const { author, link } = getAuthorInfo();

    const rawApiKey = req.body?.apikey || req.query?.apikey || req.headers?.["x-api-key"] || req.headers?.["authorization"]?.replace(/^Bearer\s+/i, "");
    const rawPrompt = req.body?.prompt || req.query?.prompt || req.body?.text || req.query?.text || req.body?.q || req.query?.q;
    const rawStyle = req.body?.style || req.query?.style;
    const rawAspectRatio = req.body?.aspect_ratio || req.query?.aspect_ratio || req.body?.ratio || req.query?.ratio;

    const prompt = typeof rawPrompt === "string" ? rawPrompt.trim() : "";
    const style = typeof rawStyle === "string" ? rawStyle.trim() : "";
    const aspectRatio = typeof rawAspectRatio === "string" ? rawAspectRatio.trim() : "1:1";

    if (!prompt) {
      return sendResponse(res, 400, {
        author,
        link,
        success: false,
        error: "Parameter 'prompt' wajib diisi"
      });
    }

    try {
      const result = await generateAndUploadImage({
        prompt,
        style,
        aspectRatio,
        geminiApiKey: typeof rawApiKey === "string" && rawApiKey.startsWith("AQ.") ? rawApiKey : undefined
      });

      return sendResponse(res, 200, {
        author,
        link,
        success: true,
        prompt: result.prompt,
        enhanced_prompt: result.enhanced_prompt,
        result: {
          id: result.id,
          file_name: result.file_name,
          url: result.url,
          direct_url: result.direct_url,
          size: result.size,
          mime: result.mime
        }
      });
    } catch (err) {
      return sendResponse(res, 500, {
        author,
        link,
        success: false,
        error: err.message || "Gagal menghasilkan gambar AI dan mengunggah ke PutzUpload"
      });
    }
  }
};
