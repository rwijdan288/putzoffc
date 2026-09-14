const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const FormData = require('form-data');
const axios = require("axios");

async function removeBg(buffer, filename = "image.jpg") {
  const data = new FormData();
  data.append('image', buffer, { filename });
  data.append('format', 'png');
  data.append('model', 'v1');

  const options = {
    method: 'POST',
    headers: {
      ...data.getHeaders(),
      'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.174 Mobile Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'x-client-version': 'web:pixelcut.ai:b8e5154f',
      'x-locale': 'id',
      'origin': 'https://www.pixelcut.ai',
      'referer': 'https://www.pixelcut.ai/'
    },
    body: data,
  };

  return fetch('https://api2.pixelcut.app/image/matte/v1', options)
    .then(res => res.arrayBuffer())
    .then(buf => Buffer.from(buf))
    .catch(err => ({ error: err.message }));
}

module.exports = {
  name: "Remove Bg",
  desc: "Remove background foto",
  category: "Imagecreator",
  parameters: {
    apikey: { type: "string", example: "skyy" },
    url: { type: "string", example: "https://example.com/photo.jpg" }
  },   
  path: "/imagecreator/removebg",

  async run(req, res) {
    const { url, apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!url) {
      return res.json({ status: false, error: "Masukkan url image" });
    }

    try {
      const buffer = await global.getBuffer(url);
      const image = await removeBg(buffer, "image.jpg");

      if (!image || image.error) {
        return res.json({ status: false, error: image?.error || "Gagal remove background" });
      }

      res.type("image/png").send(image);
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  }
};
