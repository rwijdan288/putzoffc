const cheerio = require('cheerio');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function searchAnime(query) {
  const searchUrl = `https://otakudesu.best/?s=${encodeURIComponent(query)}&post_type=anime`;
  const res = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://otakudesu.best/'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const results = [];
  $('ul.chivsrc li').each((_, el) => {
    const title = $(el).find('h2 a').text().trim();
    const url = $(el).find('h2 a').attr('href');
    const thumbnail = $(el).find('img').attr('src');
    let rating = null;
    $(el).find('.set').each((_, s) => {
      if ($(s).text().includes('Rating')) {
        rating = $(s)
          .text()
          .replace('Rating', '')
          .replace(':', '')
          .trim();
      }
    });

    if (title && url) {
      results.push({
        title,
        url,
        thumbnail,
        rating
      });
    }
  });

  return results;
}

async function getAnimeDetail(url) {
  const res = await fetch(url, {
    headers: {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 23124RA7EO Build/AQ3A.240829.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.174 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const descriptionArr = [];
  $('.sinopc p').each((_, el) => {
    descriptionArr.push($(el).text().trim());
  });
  const description = descriptionArr.join('\n\n');
  const episodes = [];
  $('.episodelist').each((_, el) => {
    const title = $(el).find('.monktit').text().toLowerCase();
    if (title.includes('episode')) {
      $(el).find('ul li').each((_, li) => {
        episodes.push({
          title: $(li).find('a').text().trim(),
          url: $(li).find('a').attr('href'),
          date: $(li).find('.zeebr').text().trim()
        });
      });
    }
  });

  return {
    description,
    episodes,
    total_episode: episodes.length
  };
}

async function searchAnimeFull(query) {
  const searchResults = await searchAnime(query);
  const output = [];

  for (const anime of searchResults) {
    try {
      const detail = await getAnimeDetail(anime.url);
      output.push({
        title: anime.title,
        url: anime.url,
        thumbnail: anime.thumbnail,
        rating: anime.rating,
        description: detail.description,
        episodes: detail.episodes,
        total_episode: detail.total_episode
      });
    } catch (e) {
      output.push(anime);
    }
  }

  return output;
}

module.exports = {
  name: "Otakudesu",
  desc: "Search vidio Anime Otakudesu",
  category: "Search",
  parameters: {
    apikey: { type: "string", example: "skyy" },
    q: { type: "string", example: "naruto" }
  },     
  path: "/search/otakudesu",
  async run(req, res) {
    const { apikey, q } = req.query;

    if (!apikey) return res.json({ status: false, error: "Apikey required" });
    if (!global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });
    if (!q) return res.json({ status: false, error: "Query is required" });

    try {
      const results = await searchAnimeFull(q);
      res.status(200).json({ status: true, result: results });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
};
