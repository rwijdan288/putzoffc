const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");
const { uploadToPutz } = require("./putz-uploader");

const DEFAULT_GEMINI_KEY = (process.env.API_KEY_GEMINI || process.env.GEMINI_API_KEY || "API_KEY").trim();

// Map aspect ratios to dimensions
const ASPECT_RATIO_MAP = {
  "1:1": { width: 768, height: 768 },
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576, height: 1024 },
  "4:3": { width: 800, height: 600 },
  "3:4": { width: 600, height: 800 }
};

// Map styles to prompt enhancers
const STYLE_MAP = {
  "realistic": "photorealistic, highly detailed, 8k resolution, shot on 35mm lens, natural lighting, sharp focus",
  "anime": "vivid anime style, Makoto Shinkai aesthetics, clean lineart, beautiful digital illustration",
  "cyberpunk": "cyberpunk aesthetics, neon lights, rainy reflection, dark atmosphere, futuristic sci-fi city",
  "cinematic": "cinematic still, dramatic atmospheric lighting, shallow depth of field, 8k movie scene, masterpiece",
  "3d": "3D render, Pixar style, cute, smooth lighting, octane render, vibrant colors",
  "fantasy": "epic high fantasy, magical atmosphere, glowing particles, concept art, ultra detailed",
  "pixel": "pixel art style, 16-bit retro game aesthetic, sharp pixels, vibrant colors"
};

/**
 * Enhance prompt into descriptive English prompt using Gemini
 */
async function enhancePromptWithGemini(userPrompt, style, customApiKey) {
  const key = customApiKey || DEFAULT_GEMINI_KEY;
  if (!key) return userPrompt;

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const instruction = `Translate and enhance the following user request into a concise visual English prompt for AI image generation (under 25 words).
${style && STYLE_MAP[style.toLowerCase()] ? `Style: "${STYLE_MAP[style.toLowerCase()]}".` : ""}
Output ONLY the short prompt in English without quotes:
${userPrompt}`;

    const promptPromise = ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: instruction
    });

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), 6000));
    const res = await Promise.race([promptPromise, timeoutPromise]);

    const enhanced = res.text?.trim().replace(/[\r\n]+/g, " ");
    return enhanced && enhanced.length > 5 ? enhanced : userPrompt;
  } catch (err) {
    return userPrompt;
  }
}

/**
 * Check if a text prompt looks like an image generation request
 */
function isImageGenerationPrompt(text) {
  if (!text || typeof text !== "string") return false;
  const t = text.toLowerCase();
  return (
    t.startsWith("gambar") ||
    t.startsWith("buatkan gambar") ||
    t.startsWith("buat gambar") ||
    t.startsWith("bikinin gambar") ||
    t.startsWith("bikin gambar") ||
    t.startsWith("generate image") ||
    t.startsWith("create image") ||
    t.startsWith("draw") ||
    t.startsWith("lukis") ||
    t.includes("buatkan gambar") ||
    t.includes("generate an image of") ||
    t.includes("draw an image of") ||
    t.includes("create an image of") ||
    t.includes("buat foto") ||
    t.includes("generate image of")
  );
}

/**
 * Generate AI image and automatically upload to PutzUpload API
 */
async function generateAndUploadImage(options = {}) {
  const {
    prompt,
    style = "",
    aspectRatio = "1:1",
    seed = Math.floor(Math.random() * 1000000),
    geminiApiKey = ""
  } = options;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Parameter 'prompt' wajib diisi");
  }

  const cleanPrompt = prompt.trim();
  let enhancedPrompt = await enhancePromptWithGemini(cleanPrompt, style, geminiApiKey);

  // Batasi panjang prompt agar tidak memicu rate-limit atau error URL
  if (enhancedPrompt.length > 180) {
    enhancedPrompt = enhancedPrompt.slice(0, 180).trim();
  }

  const primaryUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?nologo=true&seed=${seed}`;
  const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt.slice(0, 100))}?nologo=true`;

  let imageBuffer = null;
  let lastErr = null;

  try {
    const res = await axios.get(primaryUrl, {
      responseType: "arraybuffer",
      timeout: 25000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    const contentType = res.headers["content-type"] || "";
    if (contentType.includes("image") && res.data && res.data.length > 500) {
      imageBuffer = Buffer.from(res.data);
    }
  } catch (err) {
    lastErr = err;
  }

  // Jika percobaan pertama gagal (misal 429), beri jeda 3 detik lalu gunakan fallback prompt
  if (!imageBuffer) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res = await axios.get(fallbackUrl, {
        responseType: "arraybuffer",
        timeout: 25000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      const contentType = res.headers["content-type"] || "";
      if (contentType.includes("image") && res.data && res.data.length > 500) {
        imageBuffer = Buffer.from(res.data);
      }
    } catch (err) {
      lastErr = err;
    }
  }

  if (!imageBuffer) {
    throw new Error(lastErr?.response?.data?.toString() || lastErr?.message || "Gagal mengunduh gambar dari generator AI");
  }

  // Upload directly to PutzUpload API
  const filename = `ai_image_${Date.now()}.jpg`;
  const uploadResult = await uploadToPutz(imageBuffer, filename, "image/jpeg");

  return {
    success: true,
    prompt: cleanPrompt,
    enhanced_prompt: enhancedPrompt,
    id: uploadResult.id,
    file_name: uploadResult.name,
    url: uploadResult.url,
    direct_url: uploadResult.url,
    size: uploadResult.size,
    mime: uploadResult.mime
  };
}

module.exports = {
  generateAndUploadImage,
  isImageGenerationPrompt,
  enhancePromptWithGemini,
  STYLE_MAP,
  ASPECT_RATIO_MAP
};
