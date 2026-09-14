const axios = require("axios");
const cheerio = require("cheerio");

function slugify(t){return t.trim().toLowerCase().replace(/\s+/g,'-')}
function encodeTitle(t){return encodeURIComponent(t).replace(/%20/g,'+')}

async function getRealIframe(videoUrl, title) {
  try {
    const res = await axios.get(videoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 4000
    });
    const $ = cheerio.load(res.data);
    const dataSrc = $('.secure-iframe-wrapper').attr('data-src');
    if (!dataSrc) return videoUrl;

    const playerUrl = `https://bokepsin.in.net/player/${dataSrc}/?title=${encodeTitle(title)}`;
    return playerUrl;
  } catch {
    return videoUrl;
  }
}

async function bokepsinSearch(query) {
  const slug = slugify(query);
  const url = `https://bokepsin.in.net/videos/${slug}`;
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    timeout: 8000
  });
  const $ = cheerio.load(res.data);
  const results = [];

  $('article.three-card').each((_, el) => {
    const title = $(el).find('header.three-card-title').text().trim();
    const link = $(el).find('a.three-card-link').attr('href');
    const duration = $(el).find('span.three-card-duration').text().trim();
    if (title && link) results.push({ title, link, duration, download: link });
  });

  // Fetch direct player for top 4 in parallel
  const topItems = results.slice(0, 4);
  await Promise.all(topItems.map(async item => {
    item.download = await getRealIframe(item.link, item.title);
  }));

  return { query, slug, total: results.length, results };
}

module.exports = {
  name: "Bokep",
  desc: "Search vidio bokep bokepsin.in.net",
  category: "Search",
  parameters: {
    apikey: { type: "string", example: "ptz" },
    q: { type: "string", example: "jepang" }
  },     
  path: "/search/bokep",
  async run(req, res) {
    const apikey = req.query?.apikey || req.body?.apikey;
    const q = req.query?.q || req.query?.query || req.body?.q || req.body?.query;

    const validKeyList = global.apikey || ["skyy", "rz", "ptz", "putz", "piantech", "key123"];
    if (!apikey || !validKeyList.includes(apikey)) {
      return res.status(401).json({ status: false, creator: "PutzOfficial", error: "Apikey invalid" });
    }

    if (!q) {
      return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'q' wajib diisi" });
    }

    try {
      const data = await bokepsinSearch(q);
      res.json({ status: true, creator: "PutzOfficial", result: data });
    } catch (e) {
      res.status(500).json({ status: false, creator: "PutzOfficial", error: e.message });
    }
  }
};
