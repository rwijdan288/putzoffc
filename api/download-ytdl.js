const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function youtubeV2(url, format) {
    const yt = { title: null, image: null, format, download: null };

    const options = {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.174 Mobile Safari/537.36',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'origin': 'https://ytmp3.so',
            'referer': 'https://ytmp3.so/',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
        }
    };

    let init = await fetch(
        `https://p.savenow.to/ajax/download.php?copyright=0&format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab23222`,
        options
    ).then(r => r.json());

    const id = init.id;
    yt.title = init.info?.title || "";
    yt.image = init.info?.image || "";

    let prog = await fetch(`https://p.savenow.to/api/progress?id=${id}`, options).then(r => r.json());

    let retry = 0;
    while (prog.success === 0 && retry < 20) {
        await new Promise(r => setTimeout(r, 1000));
        prog = await fetch(`https://p.savenow.to/api/progress?id=${id}`, options).then(r => r.json());
        if (prog.success === 1) break;
        retry++;
    }

    yt.download = prog.download_url || null;

    return yt;
}

module.exports = [
{
  name: "Ytdl Mp3",
  desc: "Youtube mp3 Downloader",
  category: "Downloader",
  parameters: {
    apikey: { type: "string", example: "skyy" },
    url: { type: "string", example: "https://www.youtube.com/watch?v=xxx" }
  },     
  path: "/download/ytdl-mp3",
  async run(req, res) {
    const { apikey, url } = req.query;

    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!url) {
      return res.json({ status: false, error: "Url is required" });
    }

    try {
      const result = await youtubeV2(url, "mp3");
      res.status(200).json({ status: true, result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
},

{
  name: "Ytdl Mp4",
  desc: "Youtube vidio Downloader",
  category: "Downloader",
  parameters: {
    apikey: { type: "string", example: "skyy" },
    url: { type: "string", example: "https://www.youtube.com/watch?v=xxx" }
  },     
  path: "/download/ytdl-mp4",
  async run(req, res) {
    const { apikey, url } = req.query;

    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!url) {
      return res.json({ status: false, error: "Url is required" });
    }

    try {
      const result = await youtubeV2(url, "720");
      res.status(200).json({ status: true, result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
}
];
