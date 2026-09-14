const axios = require("axios");
const FormData = require("form-data");

const UPLOAD_API_URL = "https://app.putzoffc.biz.id/api.php";

/**
 * Upload a file Buffer to PutzUpload API
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Filename with extension (e.g. image.png)
 * @param {string} mimeType - MIME type (e.g. image/png)
 * @returns {Promise<{success: boolean, id: string, name: string, url: string, size: number, mime: string}>}
 */
async function uploadToPutz(buffer, filename = "image.png", mimeType = "image/png") {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid buffer provided for upload");
  }

  const form = new FormData();
  form.append("file", buffer, {
    filename,
    contentType: mimeType
  });

  const response = await axios.post(UPLOAD_API_URL, form, {
    headers: {
      ...form.getHeaders(),
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    },
    timeout: 30000,
    maxContentLength: 50 * 1024 * 1024
  });

  const data = response.data;
  if (!data || !data.success) {
    throw new Error(data?.message || "Gagal mengunggah file ke PutzUpload");
  }

  const fileInfo = data.file || {};
  return {
    success: true,
    id: fileInfo.id || "",
    name: fileInfo.name || "",
    original_name: fileInfo.original_name || filename,
    size: fileInfo.size || buffer.length,
    mime: fileInfo.mime || mimeType,
    url: fileInfo.url || `https://app.putzoffc.biz.id/${fileInfo.name || fileInfo.id}`
  };
}

/**
 * Upload an image from a URL to PutzUpload API
 * @param {string} url - Source URL
 * @param {string} defaultName - Fallback filename
 */
async function uploadUrlToPutz(url, defaultName = "image.jpg") {
  const downloadRes = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });

  const mimeType = downloadRes.headers["content-type"] || "image/jpeg";
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const filename = defaultName.includes(".") ? defaultName : `${defaultName}.${ext}`;

  return await uploadToPutz(Buffer.from(downloadRes.data), filename, mimeType);
}

module.exports = {
  uploadToPutz,
  uploadUrlToPutz,
  UPLOAD_API_URL
};
