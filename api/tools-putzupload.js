const { uploadToPutz, uploadUrlToPutz } = require("../lib/putz-uploader");

function getAuthorInfo() {
  return {
    author: process.env.AUTHOR || "PutzOfficial",
    link: process.env.AUTHOR_LINK || "https://t.me/putzpay"
  };
}

module.exports = {
  name: "PutzUpload Uploader",
  desc: "Unggah file atau gambar ke PutzUpload (app.putzoffc.biz.id) dan dapatkan direct link file.",
  category: "Developer Tools",
  path: "/tools/upload",
  method: "POST",
  parameters: {
    apikey: {
      type: "string",
      required: false,
      example: "ptz",
      description: "API Key (default otomatis)"
    },
    url: {
      type: "string",
      required: false,
      example: "https://example.com/image.png",
      description: "URL file atau gambar yang ingin diunggah"
    }
  },

  async run(req, res) {
    const { author, link } = getAuthorInfo();
    const apikey = req.query?.apikey || req.body?.apikey;

    if (apikey && global.apikey && !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, creator: author, error: "Apikey invalid" });
    }

    const fileUrl = req.body?.url || req.query?.url;
    const base64Data = req.body?.base64 || req.body?.data;

    try {
      if (fileUrl) {
        const uploadRes = await uploadUrlToPutz(fileUrl, "uploaded_file");
        return res.json({
          status: true,
          creator: author,
          message: "File berhasil diunggah ke PutzUpload",
          result: uploadRes
        });
      }

      if (base64Data) {
        const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, "base64");
        const filename = `upload_${Date.now()}.png`;
        const uploadRes = await uploadToPutz(buffer, filename, "image/png");
        return res.json({
          status: true,
          creator: author,
          message: "File berhasil diunggah ke PutzUpload",
          result: uploadRes
        });
      }

      return res.status(400).json({
        status: false,
        creator: author,
        error: "Sertakan parameter 'url' atau data 'base64' file untuk diunggah"
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        creator: author,
        error: err.message || "Gagal mengunggah ke PutzUpload"
      });
    }
  }
};
