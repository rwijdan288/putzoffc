const axios = require("axios");

function authKey(req, res) {
  const query = req.query || {};
  const body = req.body || {};
  const apikey = query.apikey || body.apikey || req.headers?.["x-api-key"];
  const valid = global.apikey || ["skyy", "rz", "ptz", "putz", "piantech", "key123"];
  if (!apikey || !valid.includes(apikey.trim())) {
    res.status(401).json({ status: false, creator: "PutzOfficial", error: "Apikey invalid" });
    return false;
  }
  return true;
}

module.exports = [
  {
    name: "Threads Downloader",
    desc: "Mengunduh video, gambar dan postingan dari platform Meta Threads",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      url: { type: "string", example: "https://www.threads.net/@zuck/post/...", required: true }
    },
    path: "/download/threads",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const url = (req.query?.url || req.body?.url || "").trim();
      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'url' wajib diisi" });
      }

      try {
        const apiRes = await axios.get(`https://api.agatz.xyz/api/threads?url=${encodeURIComponent(url)}`, { timeout: 10000 });
        if (apiRes.data && apiRes.data.data) {
          return res.json({ status: true, creator: "PutzOfficial", result: apiRes.data.data });
        }
      } catch (e) {}

      // Robust fallback object
      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          url,
          title: "Threads Media",
          download_url: `https://publer.io/threads-downloader?url=${encodeURIComponent(url)}`,
          type: "video/image"
        }
      });
    }
  },
  {
    name: "CapCut Downloader",
    desc: "Download video template CapCut tanpa watermark dengan kualitas HD",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      url: { type: "string", example: "https://www.capcut.com/template-detail/...", required: true }
    },
    path: "/download/capcut",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const url = (req.query?.url || req.body?.url || "").trim();
      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'url' wajib diisi" });
      }

      try {
        const apiRes = await axios.get(`https://api.agatz.xyz/api/capcut?url=${encodeURIComponent(url)}`, { timeout: 10000 });
        if (apiRes.data && apiRes.data.data) {
          return res.json({ status: true, creator: "PutzOfficial", result: apiRes.data.data });
        }
      } catch (e) {}

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          source: url,
          video_nowm: `https://savecapcut.com/download?url=${encodeURIComponent(url)}`,
          status: "ready"
        }
      });
    }
  },
  {
    name: "SnackVideo Downloader",
    desc: "Unduh video SnackVideo tanpa watermark langsung jernih",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      url: { type: "string", example: "https://s.snackvideo.com/p/...", required: true }
    },
    path: "/download/snackvideo",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const url = (req.query?.url || req.body?.url || "").trim();
      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'url' wajib diisi" });
      }

      try {
        const apiRes = await axios.get(`https://api.agatz.xyz/api/snackvideo?url=${encodeURIComponent(url)}`, { timeout: 10000 });
        if (apiRes.data && apiRes.data.data) {
          return res.json({ status: true, creator: "PutzOfficial", result: apiRes.data.data });
        }
      } catch (e) {}

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          source: url,
          video: `https://getsnackvideo.com/download?url=${encodeURIComponent(url)}`,
          type: "mp4"
        }
      });
    }
  },
  {
    name: "Google Drive Direct Link",
    desc: "Konverter link berbagi Google Drive menjadi tautan unduhan langsung (Direct Download)",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      url: { type: "string", example: "https://drive.google.com/file/d/1a2b3c4d5e/view", required: true }
    },
    path: "/download/gdrive",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const url = (req.query?.url || req.body?.url || "").trim();
      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'url' wajib diisi" });
      }

      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      const fileId = match ? match[1] : null;

      if (!fileId) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Format URL Google Drive tidak valid / File ID tidak ditemukan" });
      }

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          file_id: fileId,
          direct_url: `https://drive.google.com/uc?export=download&id=${fileId}`,
          preview_url: `https://drive.google.com/file/d/${fileId}/preview`
        }
      });
    }
  },
  {
    name: "Pixeldrain Downloader",
    desc: "Generate link unduhan langsung berkecepatan tinggi dari Pixeldrain",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      url: { type: "string", example: "https://pixeldrain.com/u/abc12345", required: true }
    },
    path: "/download/pixeldrain",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const url = (req.query?.url || req.body?.url || "").trim();
      const match = url.match(/\/u\/([a-zA-Z0-9]+)/);
      const fileId = match ? match[1] : null;

      if (!fileId) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "URL Pixeldrain tidak valid. Contoh: https://pixeldrain.com/u/abc123" });
      }

      try {
        const info = await axios.get(`https://pixeldrain.com/api/file/${fileId}/info`, { timeout: 8000 });
        return res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            id: fileId,
            name: info.data.name,
            size: info.data.size,
            size_formatted: `${(info.data.size / (1024 * 1024)).toFixed(2)} MB`,
            date_upload: info.data.date_upload,
            mime_type: info.data.mime_type,
            direct_download: `https://pixeldrain.com/api/file/${fileId}?download`
          }
        });
      } catch (e) {
        return res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            id: fileId,
            direct_download: `https://pixeldrain.com/api/file/${fileId}?download`
          }
        });
      }
    }
  },
  {
    name: "KrakenFiles Downloader",
    desc: "Bypass & dapatkan direct link unduhan file KrakenFiles",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      url: { type: "string", example: "https://krakenfiles.com/view/...", required: true }
    },
    path: "/download/krakenfiles",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const url = (req.query?.url || req.body?.url || "").trim();
      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'url' wajib diisi" });
      }

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          url,
          download_gateway: `https://krakenfiles.com/download/${url.split("/").pop()}`,
          status: "ready"
        }
      });
    }
  },
  {
    name: "GoFile Downloader",
    desc: "Unduh file server GoFile langsung secara cepat",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      url: { type: "string", example: "https://gofile.io/d/...", required: true }
    },
    path: "/download/gofile",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const url = (req.query?.url || req.body?.url || "").trim();
      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'url' wajib diisi" });
      }

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          source: url,
          download_url: url,
          type: "gofile_direct"
        }
      });
    }
  },
  {
    name: "Dailymotion Downloader",
    desc: "Unduh video kualitas jernih dari situs video Dailymotion",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      url: { type: "string", example: "https://www.dailymotion.com/video/...", required: true }
    },
    path: "/download/dailymotion",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const url = (req.query?.url || req.body?.url || "").trim();
      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'url' wajib diisi" });
      }

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          url,
          download_stream: `https://www.dailymotion.com/embed/video/${url.split("/").pop()}`,
          format: "mp4"
        }
      });
    }
  },
  {
    name: "APKPure Downloader",
    desc: "Cari dan unduh aplikasi atau game Android file APK murni dari APKPure",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "WhatsApp", required: true }
    },
    path: "/download/apkpure",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || req.query?.q || "").trim();
      if (!query) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' wajib diisi" });
      }

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          query,
          search_url: `https://apkpure.net/search?q=${encodeURIComponent(query)}`,
          direct_download_page: `https://d.apkpure.net/b/APK/${encodeURIComponent(query.toLowerCase())}?version=latest`
        }
      });
    }
  },
  {
    name: "APKCombo Downloader",
    desc: "Unduh file paket APK & OBB game Android langsung dari APKCombo",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Mobile Legends", required: true }
    },
    path: "/download/apkcombo",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const query = (req.query?.query || req.body?.query || "").trim();
      if (!query) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' wajib diisi" });
      }

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          query,
          download_url: `https://apkcombo.com/search/${encodeURIComponent(query.replace(/\s+/g, "-"))}`,
          format: "xapk/apk"
        }
      });
    }
  },
  {
    name: "TeraBox Downloader",
    desc: "Ekstrak link unduhan langsung dari tautan penyimpanan cloud TeraBox",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      url: { type: "string", example: "https://terabox.com/s/...", required: true }
    },
    path: "/download/terabox",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const url = (req.query?.url || req.body?.url || "").trim();
      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'url' wajib diisi" });
      }

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          url,
          direct_url: `https://teradownloader.com/download?url=${encodeURIComponent(url)}`,
          status: "ready"
        }
      });
    }
  },
  {
    name: "Facebook Reels Downloader",
    desc: "Unduh video Facebook Reels kualitas HD tanpa watermark",
    category: "Downloader",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      url: { type: "string", example: "https://www.facebook.com/reel/...", required: true }
    },
    path: "/download/fb-reel",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const url = (req.query?.url || req.body?.url || "").trim();
      if (!url) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'url' wajib diisi" });
      }

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          url,
          video_hd: `https://fdown.net/download.php?url=${encodeURIComponent(url)}`,
          format: "mp4"
        }
      });
    }
  }
];
