const axios = require("axios");

function extractYouTubeId(input) {
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = input.match(regex);
  return match ? match[1] : null;
}

async function downloadYouTube(input, type = "mp3") {
  const videoId = extractYouTubeId(input);
  if (!videoId) throw new Error("Format URL / Video ID YouTube tidak valid");

  const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 1. Cobalt / Loader Engine
  try {
    const res = await axios.post("https://api.cobalt.tools/api/json", {
      url: cleanUrl,
      downloadMode: type === "mp3" ? "audio" : "auto",
      audioFormat: "mp3"
    }, {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      timeout: 8000
    });

    if (res.data?.url) {
      return {
        id: videoId,
        url: cleanUrl,
        type: type,
        title: res.data.filename || `YouTube_${videoId}`,
        download: res.data.url
      };
    }
  } catch (_) {}

  // 2. Yt1s / Fast Engine Fallback
  try {
    const res = await axios.get(`https://api.vkrdownloader.workers.dev/server?v=${videoId}`, {
      timeout: 8000
    });
    const d = res.data?.data;
    if (d) {
      return {
        id: videoId,
        url: cleanUrl,
        type: type,
        title: d.title || `YouTube_${videoId}`,
        thumbnail: d.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: d.duration || "",
        download: type === "mp3" ? (d.audio_url || d.download_url) : (d.video_url || d.download_url)
      };
    }
  } catch (_) {}

  // 3. Fallback direct metadata
  return {
    id: videoId,
    url: cleanUrl,
    type: type,
    title: `YouTube Video (${videoId})`,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    download: `https://yt1s.com.co/download/?id=${videoId}&type=${type}`,
    note: "Gunakan direct link untuk memulai streaming atau pengunduhan."
  };
}

module.exports = [
  {
    name: "Youtube",
    desc: "Download audio (MP3) atau video (MP4) YouTube HD",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      url: { type: "string", example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      type: { type: "select", selection: ["mp3", "mp4"], value: "mp3" }
    },   
    path: "/download/youtube",
    async run(req, res) {
      const { apikey, url, type = "mp3" } = req.query;

      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Parameter 'url' YouTube wajib diisi" });
      }

      try {
        const result = await downloadYouTube(url, type);
        res.json({
          status: true,
          creator: "PutzOfficial",
          result
        });
      } catch (err) {
        res.json({
          status: false,
          creator: "PutzOfficial",
          error: err.message || "Gagal memproses media YouTube"
        });
      }
    }
  }
];
