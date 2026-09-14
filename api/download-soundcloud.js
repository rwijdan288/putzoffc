const axios = require("axios");

async function soundcloudDl(scUrl) {
  try {
    const config = {
      method: "GET",
      url: `https://p.savenow.to/ajax/download.php?format=mp3&url=${encodeURIComponent(scUrl)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.174 Mobile Safari/537.36",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        origin: "https://soundcloudrips.com",
        referer: "https://soundcloudrips.com/"
      },
    };

    const a = await axios.request(config);
    if (!a.data?.progress_url) throw new Error("progress_url tidak ditemukan");

    const b = await axios.get(a.data.progress_url);
    if (!b.data?.download_url) throw new Error("download_url tidak ditemukan");

    return { download_url: b.data.download_url };
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = [
  {
    name: "SoundCloud",
    desc: "Download audio SoundCloud",
    category: "Downloader",
    parameters: {
     apikey: { type: "string", example: "skyy" },
     url: { type: "string", example: "https://soundcloud.com/artist/track" }
    },      
    path: "/download/soundcloud",
    async run(req, res) {
      const { url, apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Url is required" });
      }

      try {
        const result = await soundcloudDl(url);
        res.status(200).json({
          status: true,
          result
        });
      } catch (error) {
        res.status(500).json({
          status: false,
          error: error.message
        });
      }
    },
  },
];
