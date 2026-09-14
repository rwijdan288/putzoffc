const axios = require("axios");
const FormData = require("form-data");

async function uploadImageToCloudinary(imageData) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    const signRes = await axios.post(
      "https://cloudinary-tools.netlify.app/.netlify/functions/sign-upload-params",
      {
        paramsToSign: {
          timestamp,
          upload_preset: "cloudinary-tools",
          source: "ml"
        }
      },
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/json"
        }
      }
    );

    const { signature } = signRes.data;

    const form = new FormData();
    form.append("upload_preset", "cloudinary-tools");
    form.append("source", "ml");
    form.append("signature", signature);
    form.append("timestamp", timestamp);
    form.append("api_key", "985946268373735");

    if (Buffer.isBuffer(imageData)) {
      form.append("file", imageData, {
        filename: "image.jpg",
        contentType: "image/jpeg"
      });
    } else {
      form.append("file", imageData);
    }

    const uploadRes = await axios.post(
      "https://api.cloudinary.com/v1_1/dtz0urit6/auto/upload",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "User-Agent": "Mozilla/5.0",
          "X-Requested-With": "XMLHttpRequest"
        }
      }
    );

    return `https://res.cloudinary.com/dtz0urit6/image/upload/f_jpg,w_512,e_upscale,q_auto/${uploadRes.data.public_id}.jpg`;
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  name: "Upscaler",
  desc: "Upscale/HD gambar",
  category: "Imagecreator",
  method: "POST",
  path: "/imagecreator/upscale",
  parameters: {
    apikey: { type: "string", example: "skyy" },
    image: { type: "image" }
  },
  async run(req, res) {
    try {
      const { apikey, url, image } = req.body || {};

      const key = apikey || req.query.apikey;
      if (!key || !global.apikey.includes(key)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      let imageData;

      if (req.files && req.files.length > 0) {
        imageData = req.files[0].buffer;
      }
      else if (image) {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        imageData = Buffer.from(base64Data, 'base64');
      }
      else if (url || req.query.url) {
        imageData = url || req.query.url;
      }
      else {
        return res.json({
          status: false,
          error: "Masukkan image URL, upload file, atau base64 string"
        });
      }

      const result = await uploadImageToCloudinary(imageData);

      return res.json({
        status: true,
        result
      });
    } catch (e) {
      console.error("Upscaler Error:", e);
      res.status(500).json({
        status: false,
        error: e.message
      });
    }
  }
};
