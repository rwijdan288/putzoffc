const axios = require("axios");

async function downloadTikTok(tiktokUrl) {
  // 1. Primary Engine: TikWM API (Fast, Reliable, Video + Slides + MP3)
  try {
    const res = await axios.post("https://www.tikwm.com/api/", new URLSearchParams({
      url: tiktokUrl,
      count: 12,
      cursor: 0,
      web: 1,
      hd: 1
    }).toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      timeout: 10000
    });

    const data = res.data?.data;
    if (data) {
      const isImages = Array.isArray(data.images) && data.images.length > 0;
      return {
        id: data.id,
        title: data.title || "",
        caption: data.title || "",
        author: {
          id: data.author?.id,
          unique_id: data.author?.unique_id,
          nickname: data.author?.nickname,
          avatar: data.author?.avatar
        },
        type: isImages ? "photo" : "video",
        video: data.play || data.hdplay || data.wmplay || null,
        video_hd: data.hdplay || data.play || null,
        video_watermark: data.wmplay || null,
        music: data.music || data.music_info?.play || null,
        music_info: data.music_info || null,
        slides: isImages ? data.images : [],
        stats: {
          views: data.play_count || 0,
          likes: data.digg_count || 0,
          comments: data.comment_count || 0,
          shares: data.share_count || 0
        }
      };
    }
  } catch (err) {
    console.error("[TikTok TikWM Error]:", err.message);
  }

  // 2. Fallback Engine: Lofter API
  try {
    const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(tiktokUrl)}`, {
      timeout: 8000
    });
    const d = res.data;
    if (d && (d.video || d.images || d.url)) {
      return {
        id: d.id || "tiktok_media",
        title: d.title || "",
        caption: d.title || "",
        author: d.author || {},
        type: d.images?.length ? "photo" : "video",
        video: d.video?.noWatermark || d.video?.watermark || d.url || null,
        music: d.music?.play_url || null,
        slides: d.images?.map(i => i.url) || []
      };
    }
  } catch (_) {}

  throw new Error("Gagal mengambil media TikTok. Pastikan URL video publik dan valid.");
}

module.exports = [
  {
    name: "Tiktok",
    desc: "Tiktok Downloader support slide, video HD & sound audio",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      url: { type: "string", example: "https://vt.tiktok.com/ZSjC8xWpL/" }
    },     
    path: "/download/tiktok",
    async run(req, res) {
      const { url, apikey } = req.query;

      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!url) {
        return res.json({
          status: false,
          error: "Parameter 'url' TikTok wajib diisi"
        });
      }

      try {
        const result = await downloadTikTok(url);
        return res.json({
          status: true,
          creator: "PutzOfficial",
          result
        });
      } catch (err) {
        return res.json({
          status: false,
          creator: "PutzOfficial",
          error: err.message || "Failed to download TikTok media"
        });
      }
    }
  }
];
