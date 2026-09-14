const axios = require("axios");
const cheerio = require("cheerio");

async function searchXHSocial(quer) {
  try {
    let query = quer.includes(" ") ? quer.split(" ").join("+") : quer;
    const searchUrl = `https://id.xhsocial.com/search/${query}`;
    const { data: html } = await axios.get(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    const $ = cheerio.load(html);
    const videos = [];

    $("div[data-video-id]").each((i, el) => {
      const container = $(el).find("a.thumb-image-container").first();
      const videoUrl = container.attr("href");
      const previewVideo = container.attr("data-previewvideo");
      const thumbnail = container.find("img").attr("src") || container.find("img").attr("data-src");
      
      const duration = container
  .find('.thumb-image-container__duration [data-role="video-duration"] div')
  .text()
  .trim();

      let title = "";
      const titleEl = $(el).find('a[data-role="thumb-link"]').first();
      if (titleEl.length) {
        title = titleEl.attr("title")?.trim();
        if (!title) {  
          title = titleEl.find("img").attr("alt")?.trim();  
        }  
        if (!title) {  
          title = titleEl.text().trim();  
        }
      }

      const views = $(el).find(".video-thumb-views").first().text().trim();

      if (videoUrl) {
        videos.push({
          title,
          url: videoUrl,
          thumbnail,
          previewVideo,
          views,
          duration
        });
      }
    });

    return videos;

  } catch (err) {
    console.error("Error fetching videos:", err.message);
    return [];
  }
}

module.exports = {
  name: "Xhamster",
  desc: "Search vidio 18+ Xhamster",
  category: "Search",
  parameters: {
    apikey: { type: "string", example: "skyy" },
    q: { type: "string", example: "japanese" }
  },     
  path: "/search/xhamster",
  async run(req, res) {
    const { apikey, q } = req.query;

    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!q) {
      return res.json({ status: false, error: "Query is required" });
    }

    try {
      const data = await searchXHSocial(q);
      res.json({
        status: true,
        result: data
      });
    } catch (e) {
      res.status(500).json({
        status: false,
        error: e.message
      });
    }
  }
};
