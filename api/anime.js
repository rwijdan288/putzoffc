const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://otakudesu.blog';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
};

async function fetchOtakudesu(endpoint, params = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const response = await axios.get(url, {
    headers: HEADERS,
    params,
    timeout: 12000
  });
  return cheerio.load(response.data);
}

// AniList GraphQL client
async function fetchAniList(query, variables) {
  const response = await axios.post('https://graphql.anilist.co', {
    query,
    variables
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 10000
  });
  return response.data?.data?.Media;
}

// 1. Search Anime
async function searchAnime(query) {
  const $ = await fetchOtakudesu(`/?s=${encodeURIComponent(query)}&post_type=anime`);
  const results = [];

  $('ul.chivsrc li').each((_, el) => {
    const title = $(el).find('h2 a').text().trim();
    const url = $(el).find('h2 a').attr('href');
    const thumbnail = $(el).find('img').attr('src');
    const genres = $(el).find('.set:contains("Genres")').text().replace(/Genres\s*:/i, '').trim();
    const status = $(el).find('.set:contains("Status")').text().replace(/Status\s*:/i, '').trim();
    const score = $(el).find('.set:contains("Rating")').text().replace(/Rating\s*:/i, '').trim();

    if (title && url) {
      const slug = url.split('/anime/')[1]?.replace(/\/$/, '') || url;
      results.push({
        title,
        slug,
        thumbnail,
        genres,
        status,
        score,
        url
      });
    }
  });

  return results;
}

// 2. Detail Anime
async function getAnimeDetail(targetUrlOrSlug) {
  let targetUrl = targetUrlOrSlug;
  if (!targetUrl.startsWith('http')) {
    targetUrl = `${BASE_URL}/anime/${targetUrlOrSlug}/`;
  }

  const $ = await fetchOtakudesu(targetUrl);
  const title = $('.jdlreset').text().trim() || $('h1').text().trim();
  const thumbnail = $('.fotoanime img').attr('src') || $('.cukder img').attr('src');
  const synopsis = $('.sinopc p').map((_, el) => $(el).text().trim()).get().join('\n\n') || $('.sinopc').text().trim();

  const details = {};
  $('.infozingle p').each((_, el) => {
    const text = $(el).text();
    const split = text.split(':');
    if (split.length >= 2) {
      const key = split[0].trim().toLowerCase().replace(/\s+/g, '_');
      const val = split.slice(1).join(':').trim();
      details[key] = val;
    }
  });

  const episodeList = [];
  $('.episodelist').each((_, sec) => {
    const secTitle = $(sec).find('.monktit, h4, h3').text().trim();
    if (!secTitle.toLowerCase().includes('batch') && !secTitle.toLowerCase().includes('lengkap')) {
      $(sec).find('ul li').each((_, li) => {
        const epTitle = $(li).find('a').text().trim();
        const epUrl = $(li).find('a').attr('href');
        const epDate = $(li).find('.zeebr').text().trim();
        if (epTitle && epUrl) {
          const epSlug = epUrl.split('/episode/')[1]?.replace(/\/$/, '') || epUrl;
          episodeList.push({
            title: epTitle,
            slug: epSlug,
            url: epUrl,
            date: epDate
          });
        }
      });
    }
  });

  const batchList = [];
  $('.episodelist').each((_, sec) => {
    const secTitle = $(sec).find('.monktit, h4, h3').text().trim();
    if (secTitle.toLowerCase().includes('batch')) {
      $(sec).find('ul li').each((_, li) => {
        batchList.push({
          title: $(li).find('a').text().trim(),
          url: $(li).find('a').attr('href')
        });
      });
    }
  });

  return {
    title: details.judul || title,
    japanese: details.japanese || null,
    score: details.skor || details.score || null,
    producer: details.produser || null,
    type: details.tipe || 'TV',
    status: details.status || null,
    total_episodes: details.total_episode || details.total_episodes || null,
    duration: details.durasi || null,
    release_date: details.tanggal_rilis || null,
    studio: details.studio || null,
    genres: details.genre || details.genres || null,
    thumbnail,
    synopsis,
    total_parsed_episodes: episodeList.length,
    episodes: episodeList,
    batches: batchList,
    source_url: targetUrl
  };
}

// 3. Episode Detail & Stream & Download Parser
async function getEpisodeDetail(targetUrlOrSlug) {
  let targetUrl = targetUrlOrSlug;
  if (!targetUrl.startsWith('http')) {
    targetUrl = `${BASE_URL}/episode/${targetUrlOrSlug}/`;
  }

  const $ = await fetchOtakudesu(targetUrl);
  const title = $('.posttl').text().trim() || $('h1').text().trim();
  const streamIframe = $('.responsive-embed-stream iframe, .stream-anime iframe').attr('src') || null;

  // Navigation
  const prevEp = $('.flir a:contains("Previous"), .flir a:contains("Sebelumnya")').attr('href') || null;
  const nextEp = $('.flir a:contains("Next"), .flir a:contains("Selanjutnya")').attr('href') || null;
  const allEp = $('.flir a:contains("See All"), .flir a:contains("Semua")').attr('href') || null;

  // Mirror stream servers
  const mirrorStreams = [];
  $('.mirrorstream ul li').each((_, li) => {
    const serverName = $(li).text().trim();
    const dataContent = $(li).find('a').attr('data-content') || $(li).find('a').attr('href') || '';
    if (serverName) {
      mirrorStreams.push({
        server: serverName,
        data_content: dataContent
      });
    }
  });

  // Downloads grouped by quality
  const downloads = [];
  $('.download ul li').each((_, li) => {
    const quality = $(li).find('strong').text().trim();
    const size = $(li).find('i').text().trim();
    const links = [];
    $(li).find('a').each((_, a) => {
      const host = $(a).text().trim();
      const linkUrl = $(a).attr('href');
      if (host && linkUrl) {
        links.push({ host, url: linkUrl });
      }
    });
    if (quality && links.length > 0) {
      downloads.push({
        quality,
        size,
        links
      });
    }
  });

  return {
    title,
    stream: {
      iframe_url: streamIframe,
      mirrors: mirrorStreams
    },
    navigation: {
      prev_episode_url: prevEp,
      next_episode_url: nextEp,
      all_episodes_url: allEp
    },
    downloads,
    source_url: targetUrl
  };
}

// 4. Latest / Ongoing
async function getLatestAnime(page = 1) {
  const pagePath = page > 1 ? `/ongoing-anime/page/${page}/` : '/ongoing-anime/';
  const $ = await fetchOtakudesu(pagePath);
  const results = [];

  $('.venz ul li').each((_, el) => {
    const title = $(el).find('.jdlflm').text().trim();
    const episode = $(el).find('.epz').text().trim();
    const release_day = $(el).find('.epztipe').text().trim();
    const release_date = $(el).find('.newsc').text().trim();
    const thumbnail = $(el).find('img').attr('src');
    const url = $(el).find('a').attr('href');
    const slug = url?.split('/anime/')[1]?.replace(/\/$/, '');

    if (title && url) {
      results.push({
        title,
        slug,
        episode,
        release_day,
        release_date,
        thumbnail,
        url
      });
    }
  });

  return { page: parseInt(page), count: results.length, data: results };
}

// 5. Popular / Complete
async function getPopularAnime(page = 1) {
  const pagePath = page > 1 ? `/complete-anime/page/${page}/` : '/complete-anime/';
  const $ = await fetchOtakudesu(pagePath);
  const results = [];

  $('.venz ul li').each((_, el) => {
    const title = $(el).find('.jdlflm').text().trim();
    const episodes = $(el).find('.epz').text().trim();
    const score = $(el).find('.epztipe').text().trim();
    const release_date = $(el).find('.newsc').text().trim();
    const thumbnail = $(el).find('img').attr('src');
    const url = $(el).find('a').attr('href');
    const slug = url?.split('/anime/')[1]?.replace(/\/$/, '');

    if (title && url) {
      results.push({
        title,
        slug,
        episodes,
        score,
        release_date,
        thumbnail,
        url
      });
    }
  });

  return { page: parseInt(page), count: results.length, data: results };
}

// 6. Schedule
async function getSchedule() {
  const $ = await fetchOtakudesu('/jadwal-rilis/');
  const schedule = {};

  $('.kglist321').each((_, el) => {
    const day = $(el).find('h2').text().trim();
    const list = [];
    $(el).find('ul li a').each((_, a) => {
      const title = $(a).text().trim();
      const url = $(a).attr('href');
      const slug = url?.split('/anime/')[1]?.replace(/\/$/, '');
      if (title && url) {
        list.push({ title, slug, url });
      }
    });
    if (day) schedule[day] = list;
  });

  return schedule;
}

// 7. Genre Anime
async function getAnimeByGenre(genreSlug, page = 1) {
  const cleanSlug = genreSlug.replace(/^\/genres\//, '').replace(/\/$/, '');
  const pagePath = page > 1 ? `/genres/${cleanSlug}/page/${page}/` : `/genres/${cleanSlug}/`;
  const $ = await fetchOtakudesu(pagePath);
  const results = [];

  $('.col-anime').each((_, el) => {
    const title = $(el).find('.col-anime-title a').text().trim();
    const url = $(el).find('.col-anime-title a').attr('href');
    const slug = url?.split('/anime/')[1]?.replace(/\/$/, '');
    const studio = $(el).find('.col-anime-studio').text().trim();
    const eps = $(el).find('.col-anime-eps').text().trim();
    const rating = $(el).find('.col-anime-rating').text().trim();
    const thumbnail = $(el).find('.col-anime-cover img').attr('src');
    const synopsis = $(el).find('.col-synopsis p').text().trim();

    if (title && url) {
      results.push({
        title,
        slug,
        studio,
        episodes: eps,
        rating,
        thumbnail,
        synopsis,
        url
      });
    }
  });

  return { genre: cleanSlug, page: parseInt(page), count: results.length, data: results };
}

// 8. Genres List
async function getGenresList() {
  const $ = await fetchOtakudesu('/genre-list/');
  const genres = [];

  $('.genres li a, ul.genres li a').each((_, el) => {
    const name = $(el).text().trim();
    const url = $(el).attr('href');
    const slug = url?.split('/genres/')[1]?.replace(/\//g, '') || url;
    if (name && slug) {
      genres.push({ name, slug, url });
    }
  });

  return genres;
}

// Helper validation for API Key
function validateKey(req, res) {
  const { apikey } = req.query;
  if (!apikey || !global.apikey.includes(apikey)) {
    res.status(401).json({ status: false, creator: 'PutzOfficial', message: 'Apikey invalid' });
    return false;
  }
  return true;
}

// Export 15 Anime Streaming endpoints
module.exports = [
  // 1. Search
  {
    name: "Anime Search",
    desc: "Mencari anime berdasarkan judul/keyword subtitle Indonesia dengan data lengkap",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      query: { type: "string", example: "boruto" }
    },
    path: "/anime/search",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const q = req.query.query || req.query.q;
      if (!q) return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });

      try {
        const result = await searchAnime(q);
        res.json({ status: true, creator: "PutzOfficial", total: result.length, result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 2. Detail
  {
    name: "Anime Detail",
    desc: "Mendapatkan informasi detail lengkap anime, sinopsis, produser, studio, score, dan daftar episode",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      url: { type: "string", example: "borot-sub-indo" }
    },
    path: "/anime/detail",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const target = req.query.url || req.query.slug || req.query.id || req.query.q;
      if (!target) return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'url' atau 'slug' wajib diisi" });

      try {
        const result = await getAnimeDetail(target);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 3. Episodes
  {
    name: "Anime Episodes",
    desc: "Mendapatkan seluruh daftar episode dari anime beserta link slug dan tanggal rilis",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      url: { type: "string", example: "borot-sub-indo" }
    },
    path: "/anime/episodes",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const target = req.query.url || req.query.slug || req.query.id;
      if (!target) return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'url' atau 'slug' wajib diisi" });

      try {
        const detail = await getAnimeDetail(target);
        res.json({
          status: true,
          creator: "PutzOfficial",
          anime: detail.title,
          total_episodes: detail.episodes.length,
          result: detail.episodes
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 4. Episode Detail
  {
    name: "Episode Detail",
    desc: "Mendapatkan detail episode spesifik beserta player streaming, navigasi prev/next, dan link unduhan",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      url: { type: "string", example: "btr-ng-episode-293-sub-indo" }
    },
    path: "/anime/episode",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const target = req.query.url || req.query.slug || req.query.id;
      if (!target) return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'url' atau 'slug' wajib diisi" });

      try {
        const result = await getEpisodeDetail(target);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 5. Anime Streaming
  {
    name: "Anime Streaming",
    desc: "Mendapatkan sumber video streaming yang valid, iframe player, dan mirror server episode anime",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      url: { type: "string", example: "btr-ng-episode-293-sub-indo" }
    },
    path: "/anime/stream",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const target = req.query.url || req.query.slug || req.query.id;
      if (!target) return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'url' atau 'slug' episode wajib diisi" });

      try {
        const epData = await getEpisodeDetail(target);
        res.json({
          status: true,
          creator: "PutzOfficial",
          title: epData.title,
          stream_url: epData.stream?.iframe_url,
          mirrors: epData.stream?.mirrors,
          navigation: epData.navigation
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 6. Anime Download
  {
    name: "Anime Download",
    desc: "Mendapatkan tautan unduhan video episode anime berkualitas 360p, 480p, dan 720p dari server resmi provider",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      url: { type: "string", example: "btr-ng-episode-293-sub-indo" }
    },
    path: "/anime/download",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const target = req.query.url || req.query.slug || req.query.id;
      if (!target) return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'url' atau 'slug' episode wajib diisi" });

      try {
        const epData = await getEpisodeDetail(target);
        res.json({
          status: true,
          creator: "PutzOfficial",
          title: epData.title,
          downloads: epData.downloads
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 7. Anime Latest
  {
    name: "Anime Latest",
    desc: "Mendapatkan daftar rilisan anime terbaru yang sedang tayang (ongoing) secara real-time",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      page: { type: "number", example: "1" }
    },
    path: "/anime/latest",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const page = req.query.page || 1;

      try {
        const result = await getLatestAnime(page);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 8. Anime Popular
  {
    name: "Anime Popular",
    desc: "Mendapatkan daftar anime populer berstatus tamat (complete) dengan rating tinggi",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      page: { type: "number", example: "1" }
    },
    path: "/anime/popular",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const page = req.query.page || 1;

      try {
        const result = await getPopularAnime(page);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 9. Anime Trending
  {
    name: "Anime Trending",
    desc: "Mendapatkan daftar anime yang sedang trending dan paling banyak ditonton minggu ini",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      page: { type: "number", example: "1" }
    },
    path: "/anime/trending",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const page = req.query.page || 1;

      try {
        const [ongoing, complete] = await Promise.all([
          getLatestAnime(page).catch(() => ({ data: [] })),
          getPopularAnime(page).catch(() => ({ data: [] }))
        ]);

        const combined = [...ongoing.data.slice(0, 10), ...complete.data.slice(0, 10)];
        res.json({
          status: true,
          creator: "PutzOfficial",
          page: parseInt(page),
          total: combined.length,
          result: combined
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 10. Anime Schedule
  {
    name: "Anime Schedule",
    desc: "Mendapatkan jadwal rilis anime mingguan berdasarkan hari tayang (Senin s/d Minggu)",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" }
    },
    path: "/anime/schedule",
    async run(req, res) {
      if (!validateKey(req, res)) return;

      try {
        const schedule = await getSchedule();
        res.json({ status: true, creator: "PutzOfficial", result: schedule });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 11. Anime Genre
  {
    name: "Anime Genre",
    desc: "Mendapatkan daftar anime berdasarkan kategori genre tertentu (action, romance, isekai, dll)",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      genre: { type: "string", example: "action" },
      page: { type: "number", example: "1" }
    },
    path: "/anime/genre",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const genre = req.query.genre || req.query.slug || req.query.q;
      const page = req.query.page || 1;
      if (!genre) return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'genre' wajib diisi (contoh: action, comedy, fantasy)" });

      try {
        const result = await getAnimeByGenre(genre, page);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 12. Anime Genres
  {
    name: "Anime Genres",
    desc: "Mendapatkan seluruh daftar genre anime yang tersedia beserta slug URL kategorinya",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" }
    },
    path: "/anime/genres",
    async run(req, res) {
      if (!validateKey(req, res)) return;

      try {
        const result = await getGenresList();
        res.json({ status: true, creator: "PutzOfficial", total: result.length, result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 13. Anime Characters
  {
    name: "Anime Characters",
    desc: "Mendapatkan data karakter anime beserta seiyuu (voice actor) resmi dan foto karakter",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      query: { type: "string", example: "Naruto" }
    },
    path: "/anime/characters",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const q = req.query.query || req.query.q || req.query.anime;
      if (!q) return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });

      const queryGQL = `
        query ($search: String) {
          Media (search: $search, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            characters(page: 1, perPage: 15) {
              edges {
                role
                node {
                  id
                  name {
                    full
                    native
                  }
                  image {
                    large
                    medium
                  }
                }
                voiceActors(language: JAPANESE) {
                  id
                  name {
                    full
                    native
                  }
                  image {
                    medium
                  }
                }
              }
            }
          }
        }
      `;

      try {
        const media = await fetchAniList(queryGQL, { search: q });
        if (!media) {
          return res.status(404).json({ status: false, creator: "PutzOfficial", message: `Anime '${q}' tidak ditemukan` });
        }

        const characters = (media.characters?.edges || []).map(edge => ({
          role: edge.role,
          name: edge.node?.name?.full,
          native_name: edge.node?.name?.native,
          image: edge.node?.image?.large || edge.node?.image?.medium,
          voice_actor: edge.voiceActors?.[0] ? {
            name: edge.voiceActors[0].name?.full,
            native_name: edge.voiceActors[0].name?.native,
            image: edge.voiceActors[0].image?.medium
          } : null
        }));

        res.json({
          status: true,
          creator: "PutzOfficial",
          anime: media.title?.romaji || media.title?.english || q,
          total_characters: characters.length,
          result: characters
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 14. Anime Recommendations
  {
    name: "Anime Recommendations",
    desc: "Mendapatkan rekomendasi judul anime serupa berdasarkan kesamaan genre, cerita, dan tema",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      query: { type: "string", example: "Jujutsu Kaisen" }
    },
    path: "/anime/recommendations",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const q = req.query.query || req.query.q || req.query.anime;
      if (!q) return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });

      const queryGQL = `
        query ($search: String) {
          Media (search: $search, type: ANIME) {
            id
            title {
              romaji
              english
            }
            recommendations(page: 1, perPage: 12) {
              nodes {
                mediaRecommendation {
                  id
                  title {
                    romaji
                    english
                  }
                  coverImage {
                    large
                    medium
                  }
                  averageScore
                  episodes
                  format
                  status
                  genres
                }
              }
            }
          }
        }
      `;

      try {
        const media = await fetchAniList(queryGQL, { search: q });
        if (!media) {
          return res.status(404).json({ status: false, creator: "PutzOfficial", message: `Anime '${q}' tidak ditemukan` });
        }

        const recommendations = (media.recommendations?.nodes || [])
          .filter(n => n.mediaRecommendation)
          .map(n => ({
            id: n.mediaRecommendation.id,
            title: n.mediaRecommendation.title?.romaji || n.mediaRecommendation.title?.english,
            cover: n.mediaRecommendation.coverImage?.large || n.mediaRecommendation.coverImage?.medium,
            score: n.mediaRecommendation.averageScore ? (n.mediaRecommendation.averageScore / 10).toFixed(1) : null,
            episodes: n.mediaRecommendation.episodes,
            format: n.mediaRecommendation.format,
            status: n.mediaRecommendation.status,
            genres: n.mediaRecommendation.genres
          }));

        res.json({
          status: true,
          creator: "PutzOfficial",
          anime: media.title?.romaji || media.title?.english || q,
          total: recommendations.length,
          result: recommendations
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // 15. Anime Related
  {
    name: "Anime Related",
    desc: "Mendapatkan anime terkait seperti prequel, sequel, spin-off, alternative version, atau adaptasi",
    category: "Anime Streaming",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      query: { type: "string", example: "Kimetsu no Yaiba" }
    },
    path: "/anime/related",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const q = req.query.query || req.query.q || req.query.anime;
      if (!q) return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });

      const queryGQL = `
        query ($search: String) {
          Media (search: $search, type: ANIME) {
            id
            title {
              romaji
              english
            }
            relations {
              edges {
                relationType
                node {
                  id
                  title {
                    romaji
                    english
                  }
                  format
                  type
                  status
                  coverImage {
                    medium
                    large
                  }
                }
              }
            }
          }
        }
      `;

      try {
        const media = await fetchAniList(queryGQL, { search: q });
        if (!media) {
          return res.status(404).json({ status: false, creator: "PutzOfficial", message: `Anime '${q}' tidak ditemukan` });
        }

        const related = (media.relations?.edges || []).map(edge => ({
          relation_type: edge.relationType,
          id: edge.node?.id,
          title: edge.node?.title?.romaji || edge.node?.title?.english,
          format: edge.node?.format,
          type: edge.node?.type,
          status: edge.node?.status,
          cover: edge.node?.coverImage?.large || edge.node?.coverImage?.medium
        }));

        res.json({
          status: true,
          creator: "PutzOfficial",
          anime: media.title?.romaji || media.title?.english || q,
          total: related.length,
          result: related
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },

  // Preserved old non-conflicting anime endpoints
  {
    name: "Top Anime Ranking",
    desc: "Mendapatkan daftar anime dengan rating tertinggi di dunia secara real-time",
    category: "Anime",
    parameters: {
      apikey: { type: "string", example: "ptz" }
    },
    path: "/anime/top",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      try {
        const top = await getPopularAnime(1);
        res.json({ status: true, creator: "PutzOfficial", result: top.data });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Quotes Anime",
    desc: "Mendapatkan kata-kata bijak / motivasi anime secara acak beserta karakternya",
    category: "Anime",
    parameters: {
      apikey: { type: "string", example: "ptz" }
    },
    path: "/anime/quotes",
    async run(req, res) {
      if (!validateKey(req, res)) return;
      const quotes = [
        { quote: "Jika kau tidak menyerah pada dirimu sendiri, kau tidak akan pernah kalah.", character: "Rock Lee", anime: "Naruto" },
        { quote: "Bukan karena aku kuat aku menang, tapi karena aku tidak ingin kalah.", character: "Kuroko Tetsuya", anime: "Kuroko no Basket" },
        { quote: "Rasa sakit membuat kita menjadi lebih dewasa.", character: "Pain (Nagato)", anime: "Naruto Shippuden" },
        { quote: "Jika kau tidak menyukai takdirmu, jangan terima. Beranilah untuk mengubahnya sesuai caramu sendiri.", character: "Naruto Uzumaki", anime: "Naruto" }
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      res.json({ status: true, creator: "PutzOfficial", result: randomQuote });
    }
  }
];
