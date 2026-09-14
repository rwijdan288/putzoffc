const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");
const { generateAndUploadImage, isImageGenerationPrompt } = require("../lib/ai-image-generator");

const DEFAULT_GEMINI_API_KEY = (process.env.API_KEY_GEMINI || process.env.GEMINI_API_KEY || "AQ.Ab8RN6JaArEMtnnVlN9-Gj-aAM5NnFIKVHOgtfy-GY6SpCPknw").trim();
const DEFAULT_MODEL = "gemini-3.6-flash";

function getAuthorInfo() {
  return {
    author: process.env.AUTHOR || "PutzOfficial",
    link: process.env.AUTHOR_LINK || "https://t.me/putzpay"
  };
}

function parseGeminiError(err) {
  let msg = err?.message || String(err);
  try {
    const parsed = JSON.parse(msg);
    if (parsed.error?.message) {
      msg = parsed.error.message;
    }
  } catch (e) {}

  if (/api[ _]?key[ _]?(invalid|not valid)/i.test(msg) || msg.includes("API_KEY_INVALID")) {
    return "Invalid API key";
  }
  return msg;
}

function sendResponse(res, status, data) {
  if (res.headersSent) return;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).send(JSON.stringify(data, null, 2));
}

module.exports = {
  name: "Google Gemini AI",
  desc: "Endpoint AI berbasis Google Gemini yang mendukung chat, coding, analisis teks, dan analisis media melalui URL.",
  category: "Tools Ai",
  path: "/ai/gemini",
  method: "POST",
  timeout: 60000,
  parameters: {
    apikey: {
      type: "string",
      required: false,
      example: "ptz",
      description: "API Key Gemini atau API Key platform (default otomatis terpasang)"
    },
    model: {
      type: "string",
      required: false,
      example: "gemini-3.6-flash",
      description: "Model Gemini (default: gemini-3.6-flash, juga mendukung gemini-3.8-flash)"
    },
    prompt: {
      type: "string",
      required: true,
      example: "Jelaskan isi gambar ini",
      description: "Pertanyaan atau instruksi yang dikirim ke AI"
    },
    url: {
      type: "string",
      required: false,
      example: "https://example.com/image.jpg",
      description: "URL gambar atau media yang ingin dianalisis"
    }
  },

  async run(req, res) {
    const { author, link } = getAuthorInfo();

    // Ekstraksi parameter dari body (POST) atau query (GET)
    const rawApiKey = req.body?.apikey || req.query?.apikey || req.headers?.["x-api-key"] || req.headers?.["authorization"]?.replace("Bearer ", "");
    const rawModel = req.body?.model || req.query?.model;
    const rawPrompt = req.body?.prompt || req.query?.prompt || req.body?.text || req.query?.text || req.body?.q || req.query?.q;
    const rawUrl = req.body?.url || req.query?.url || req.body?.imageUrl || req.query?.imageUrl;

    let apikey = (typeof rawApiKey === "string" ? rawApiKey : "").trim();
    let model = (typeof rawModel === "string" ? rawModel : "").trim();
    const prompt = (typeof rawPrompt === "string" ? rawPrompt : "").trim();
    const url = (typeof rawUrl === "string" ? rawUrl : "").trim();

    // Jika apikey tidak diberikan, atau berupa platform key default (ptz, skyy, rz, dll.), gunakan Gemini API key server
    if (!apikey || (global.apikey && global.apikey.includes(apikey) && apikey !== DEFAULT_GEMINI_API_KEY)) {
      apikey = DEFAULT_GEMINI_API_KEY;
    }

    // Default model
    if (!model) {
      model = DEFAULT_MODEL;
    } else if (model === "gemini-2.5-flash" || model === "gemini-2.5-pro") {
      // Auto-upgrade deprecated flash/pro model to modern available model
      model = DEFAULT_MODEL;
    }

    // Validasi parameter prompt
    if (!prompt) {
      return sendResponse(res, 400, {
        author,
        link,
        success: false,
        error: "Parameter 'prompt' wajib diisi"
      });
    }

    // Jika pengguna meminta pembuatan gambar (Text-to-Image) atau menyertakan flag image
    const isImageReq = !url && (
      req.body?.image === true ||
      req.query?.image === "true" ||
      req.body?.generate_image === true ||
      req.query?.generate_image === "true" ||
      isImageGenerationPrompt(prompt)
    );

    if (isImageReq) {
      try {
        const imgResult = await generateAndUploadImage({
          prompt,
          style: req.body?.style || req.query?.style || "",
          aspectRatio: req.body?.aspect_ratio || req.query?.aspect_ratio || req.body?.ratio || "1:1",
          geminiApiKey: apikey
        });

        return sendResponse(res, 200, {
          author,
          link,
          success: true,
          type: "image",
          model,
          prompt,
          enhanced_prompt: imgResult.enhanced_prompt,
          response: `Berikut gambar yang dihasilkan oleh AI dan telah diunggah: ${imgResult.url}`,
          image: {
            id: imgResult.id,
            file_name: imgResult.file_name,
            url: imgResult.url,
            direct_url: imgResult.direct_url,
            size: imgResult.size,
            mime: imgResult.mime
          }
        });
      } catch (imgErr) {
        // Jika pembuatan gambar gagal, lanjutkan fallback ke jawaban teks Gemini biasa
      }
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apikey });
      let contents;

      // Jika URL media diberikan, unduh dan format sebagai inlineData multimodal
      if (url) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          return sendResponse(res, 400, {
            author,
            link,
            success: false,
            error: "Format parameter 'url' tidak valid. Harus diawali dengan http:// atau https://"
          });
        }

        let mediaRes;
        try {
          mediaRes = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 20000,
            maxContentLength: 25 * 1024 * 1024,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          });
        } catch (mediaErr) {
          return sendResponse(res, 400, {
            author,
            link,
            success: false,
            error: `Gagal mengunduh media dari url: ${mediaErr.message}`
          });
        }

        let mimeType = mediaRes.headers["content-type"];
        if (mimeType && mimeType.includes(";")) {
          mimeType = mimeType.split(";")[0].trim();
        }

        if (!mimeType || mimeType === "application/octet-stream") {
          const cleanExt = url.split(".").pop().toLowerCase().split("?")[0].split("#")[0];
          const mimeMap = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
            gif: "image/gif",
            mp4: "video/mp4",
            webm: "video/webm",
            mov: "video/quicktime",
            mp3: "audio/mp3",
            wav: "audio/wav",
            ogg: "audio/ogg",
            m4a: "audio/m4a",
            pdf: "application/pdf",
            txt: "text/plain"
          };
          mimeType = mimeMap[cleanExt] || "image/jpeg";
        }

        const base64Data = Buffer.from(mediaRes.data).toString("base64");
        contents = {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            },
            {
              text: prompt
            }
          ]
        };
      } else {
        contents = prompt;
      }

      // Generate respon dari model Gemini dengan auto-fallback jika model tidak ditemukan
      let result;
      try {
        result = await ai.models.generateContent({
          model,
          contents
        });
      } catch (genErr) {
        if (genErr?.message?.includes("404") || genErr?.message?.includes("NOT_FOUND") || genErr?.status === 404) {
          model = DEFAULT_MODEL;
          result = await ai.models.generateContent({
            model,
            contents
          });
        } else {
          throw genErr;
        }
      }

      const responseText = result.text || "";
      const usageMetadata = result.usageMetadata || {};
      const inputTokens = usageMetadata.promptTokenCount !== undefined ? usageMetadata.promptTokenCount : 0;
      const outputTokens = usageMetadata.candidatesTokenCount !== undefined ? usageMetadata.candidatesTokenCount : 0;
      const totalTokens = usageMetadata.totalTokenCount !== undefined ? usageMetadata.totalTokenCount : (inputTokens + outputTokens);

      return sendResponse(res, 200, {
        author,
        link,
        success: true,
        model,
        prompt,
        response: responseText,
        usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: totalTokens
        }
      });
    } catch (err) {
      const parsedError = parseGeminiError(err);
      const isAuthError = parsedError === "Invalid API key";
      return sendResponse(res, isAuthError ? 401 : 400, {
        author,
        link,
        success: false,
        error: parsedError
      });
    }
  }
};
