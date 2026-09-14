const axios = require("axios");
const yts = require("yt-search");

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// 1. Music Search (Full Original Audio, No 30s Preview Limit)
async function searchMusic(query, limit = 15) {
  try {
    const searchResults = await yts(query);
    const videos = (searchResults?.videos || []).slice(0, limit);

    if (videos.length > 0) {
      return videos.map(v => ({
        id: v.videoId,
        title: v.title,
        artist: v.author?.name || "Unknown Artist",
        duration: v.timestamp || formatDuration(v.seconds),
        duration_seconds: v.seconds,
        views: v.views,
        published: v.ago,
        thumbnail: v.thumbnail || v.image,
        url: v.url,
        audio_url: `https://spotdown.org/api/direct-download?url=${encodeURIComponent(v.url)}`,
        download_url: `https://p.savenow.to/ajax/download.php?format=mp3&url=${encodeURIComponent(v.url)}`,
        full_audio: true,
        type: "original_full_song"
      }));
    }
  } catch (e) {}

  // Fallback to Deezer with full song resolver
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await axios.get(url, { timeout: 9000 });
  const items = res.data?.data || [];
  if (!items.length) {
    throw new Error(`Musik '${query}' tidak ditemukan`);
  }

  return items.map(item => ({
    id: item.id,
    title: item.title,
    title_short: item.title_short,
    artist: {
      id: item.artist?.id,
      name: item.artist?.name,
      link: item.artist?.link,
      picture: item.artist?.picture_medium || item.artist?.picture
    },
    album: {
      id: item.album?.id,
      title: item.album?.title,
      cover: item.album?.cover_medium || item.album?.cover,
      cover_xl: item.album?.cover_xl || item.album?.cover_big
    },
    duration: item.duration,
    duration_formatted: formatDuration(item.duration),
    rank: item.rank,
    explicit_lyrics: item.explicit_lyrics,
    audio_url: `https://spotdown.org/api/direct-download?url=${encodeURIComponent(`https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + ' ' + (item.artist?.name || ''))}`)}`,
    download_url: `https://p.savenow.to/ajax/download.php?format=mp3&url=${encodeURIComponent(item.link)}`,
    full_audio: true,
    link: item.link
  }));
}

// 2. DJ Search
async function searchDj(query, limit = 15) {
  const searchQuery = query.toLowerCase().includes("dj")
    ? query
    : `DJ ${query} Remix Full Bass`;
  
  const searchResults = await yts(searchQuery);
  const videos = (searchResults?.videos || []).slice(0, limit);

  if (!videos.length) {
    throw new Error(`DJ Music '${query}' tidak ditemukan`);
  }

  return videos.map(v => ({
    id: v.videoId,
    title: v.title,
    dj_name: v.author?.name || "DJ Artist",
    duration: v.timestamp || formatDuration(v.seconds),
    duration_seconds: v.seconds,
    views: v.views,
    ago: v.ago,
    url: v.url,
    thumbnail: v.thumbnail || v.image,
    description: v.description
  }));
}

// 3. Artist Search
async function searchArtist(query, limit = 10) {
  const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await axios.get(url, { timeout: 9000 });
  const items = res.data?.data || [];
  if (!items.length) {
    throw new Error(`Artis '${query}' tidak ditemukan`);
  }

  const results = await Promise.all(
    items.slice(0, 5).map(async artist => {
      let topTracks = [];
      try {
        const topRes = await axios.get(`https://api.deezer.com/artist/${artist.id}/top?limit=5`, { timeout: 5000 });
        topTracks = (topRes.data?.data || []).map(t => ({
          id: t.id,
          title: t.title,
          duration: formatDuration(t.duration),
          preview: t.preview,
          album: t.album?.title
        }));
      } catch (e) {}

      return {
        id: artist.id,
        name: artist.name,
        picture: artist.picture_medium || artist.picture,
        picture_xl: artist.picture_xl || artist.picture_big,
        nb_album: artist.nb_album,
        nb_fan: artist.nb_fan,
        radio: artist.radio,
        link: artist.link,
        top_tracks: topTracks
      };
    })
  );

  const remaining = items.slice(5).map(artist => ({
    id: artist.id,
    name: artist.name,
    picture: artist.picture_medium || artist.picture,
    picture_xl: artist.picture_xl || artist.picture_big,
    nb_album: artist.nb_album,
    nb_fan: artist.nb_fan,
    radio: artist.radio,
    link: artist.link,
    top_tracks: []
  }));

  return [...results, ...remaining];
}

// 4. Album Search
async function searchAlbum(query, limit = 10) {
  const url = `https://api.deezer.com/search/album?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await axios.get(url, { timeout: 9000 });
  const items = res.data?.data || [];
  if (!items.length) {
    throw new Error(`Album '${query}' tidak ditemukan`);
  }

  return items.map(album => ({
    id: album.id,
    title: album.title,
    cover: album.cover_medium || album.cover,
    cover_xl: album.cover_xl || album.cover_big,
    genre_id: album.genre_id,
    nb_tracks: album.nb_tracks,
    record_type: album.record_type,
    explicit_lyrics: album.explicit_lyrics,
    artist: {
      id: album.artist?.id,
      name: album.artist?.name,
      picture: album.artist?.picture_medium || album.artist?.picture
    },
    link: album.link
  }));
}

// 5. Track Search
async function searchTrack(query, limit = 15) {
  const url = `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await axios.get(url, { timeout: 9000 });
  const items = res.data?.data || [];
  if (!items.length) {
    throw new Error(`Track lagu '${query}' tidak ditemukan`);
  }

  return items.map(track => ({
    id: track.id,
    title: track.title,
    title_short: track.title_short,
    title_version: track.title_version || null,
    duration: track.duration,
    duration_formatted: formatDuration(track.duration),
    rank: track.rank,
    release_date: track.release_date || null,
    explicit_lyrics: track.explicit_lyrics,
    preview: track.preview,
    artist: {
      id: track.artist?.id,
      name: track.artist?.name,
      picture: track.artist?.picture_medium || track.artist?.picture,
      link: track.artist?.link
    },
    album: {
      id: track.album?.id,
      title: track.album?.title,
      cover: track.album?.cover_medium || track.album?.cover,
      cover_xl: track.album?.cover_xl || track.album?.cover_big
    },
    link: track.link
  }));
}

// 6. Lyrics Search
async function searchLyrics(query) {
  try {
    const res = await axios.get(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, { timeout: 9000 });
    const items = res.data || [];
    if (Array.isArray(items) && items.length > 0) {
      const match = items[0];
      return {
        id: match.id,
        track_name: match.trackName,
        artist_name: match.artistName,
        album_name: match.albumName,
        duration: match.duration,
        duration_formatted: formatDuration(match.duration),
        instrumental: match.instrumental || false,
        plain_lyrics: match.plainLyrics || "Lirik tidak tersedia.",
        synced_lyrics: match.syncedLyrics || null,
        has_synced_lyrics: !!match.syncedLyrics
      };
    }
  } catch (e) {}

  throw new Error(`Lirik lagu untuk '${query}' tidak ditemukan`);
}

// 7. Playlist Search
async function searchPlaylist(query, limit = 10) {
  const url = `https://api.deezer.com/search/playlist?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await axios.get(url, { timeout: 9000 });
  const items = res.data?.data || [];
  if (!items.length) {
    throw new Error(`Playlist '${query}' tidak ditemukan`);
  }

  return items.map(pl => ({
    id: pl.id,
    title: pl.title,
    public: pl.public,
    nb_tracks: pl.nb_tracks,
    picture: pl.picture_medium || pl.picture,
    picture_xl: pl.picture_xl || pl.picture_big,
    link: pl.link,
    creator: {
      id: pl.creator?.id,
      name: pl.creator?.name,
      tracklist: pl.creator?.tracklist
    }
  }));
}

// 8. Music Detail
async function getMusicDetail(query) {
  let trackData = null;

  if (/^\d+$/.test(query.trim())) {
    try {
      const directRes = await axios.get(`https://api.deezer.com/track/${query.trim()}`, { timeout: 9000 });
      if (directRes.data && !directRes.data.error) {
        trackData = directRes.data;
      }
    } catch (e) {}
  }

  if (!trackData) {
    const searchRes = await axios.get(`https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=1`, { timeout: 9000 });
    const first = searchRes.data?.data?.[0];
    if (!first) {
      throw new Error(`Detail musik untuk '${query}' tidak ditemukan`);
    }
    try {
      const fullRes = await axios.get(`https://api.deezer.com/track/${first.id}`, { timeout: 9000 });
      trackData = fullRes.data || first;
    } catch (e) {
      trackData = first;
    }
  }

  let lyricsData = { available: false, plain_lyrics: null, synced_lyrics: null };
  try {
    const lrcRes = await axios.get(
      `https://lrclib.net/api/get?track_name=${encodeURIComponent(trackData.title)}&artist_name=${encodeURIComponent(trackData.artist?.name || "")}`,
      { timeout: 5000 }
    );
    if (lrcRes.data) {
      lyricsData = {
        available: !!(lrcRes.data.plainLyrics || lrcRes.data.syncedLyrics),
        instrumental: lrcRes.data.instrumental || false,
        plain_lyrics: lrcRes.data.plainLyrics || null,
        synced_lyrics: lrcRes.data.syncedLyrics || null
      };
    }
  } catch (e) {
    try {
      const lrcSearch = await axios.get(`https://lrclib.net/api/search?q=${encodeURIComponent(trackData.title + " " + (trackData.artist?.name || ""))}`, { timeout: 5000 });
      if (lrcSearch.data?.[0]) {
        lyricsData = {
          available: !!(lrcSearch.data[0].plainLyrics || lrcSearch.data[0].syncedLyrics),
          instrumental: lrcSearch.data[0].instrumental || false,
          plain_lyrics: lrcSearch.data[0].plainLyrics || null,
          synced_lyrics: lrcSearch.data[0].syncedLyrics || null
        };
      }
    } catch (err) {}
  }

  return {
    id: trackData.id,
    title: trackData.title,
    title_short: trackData.title_short || trackData.title,
    isrc: trackData.isrc || null,
    duration: trackData.duration,
    duration_formatted: formatDuration(trackData.duration),
    bpm: trackData.bpm || null,
    gain: trackData.gain || null,
    release_date: trackData.release_date || null,
    explicit_lyrics: trackData.explicit_lyrics || false,
    preview_url: trackData.preview,
    link: trackData.link,
    artist: {
      id: trackData.artist?.id,
      name: trackData.artist?.name,
      link: trackData.artist?.link,
      picture: trackData.artist?.picture_medium || trackData.artist?.picture,
      picture_xl: trackData.artist?.picture_xl || trackData.artist?.picture_big
    },
    album: {
      id: trackData.album?.id,
      title: trackData.album?.title,
      cover: trackData.album?.cover_medium || trackData.album?.cover,
      cover_xl: trackData.album?.cover_xl || trackData.album?.cover_big,
      release_date: trackData.album?.release_date || null,
      label: trackData.album?.label || null,
      genres: trackData.album?.genres?.data || []
    },
    contributors: (trackData.contributors || []).map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      picture: c.picture_medium || c.picture
    })),
    lyrics: lyricsData
  };
}

// 9. Music Video Search
async function searchMusicVideo(query, limit = 10) {
  const searchQuery = query.toLowerCase().includes("video") || query.toLowerCase().includes("mv")
    ? query
    : `${query} official music video`;

  const searchResults = await yts(searchQuery);
  const videos = (searchResults?.videos || []).slice(0, limit);

  if (!videos.length) {
    throw new Error(`Video musik '${query}' tidak ditemukan`);
  }

  return videos.map(v => ({
    id: v.videoId,
    title: v.title,
    artist_or_channel: v.author?.name || "Music Channel",
    duration: v.timestamp || formatDuration(v.seconds),
    duration_seconds: v.seconds,
    views: v.views,
    ago: v.ago,
    url: v.url,
    thumbnail: v.thumbnail || v.image,
    description: v.description
  }));
}

// 10. Trending Music
async function getTrendingMusic() {
  const res = await axios.get("https://api.deezer.com/chart", { timeout: 9000 });
  const data = res.data || {};

  const tracks = (data.tracks?.data || []).map(t => ({
    id: t.id,
    title: t.title,
    title_short: t.title_short,
    position: t.position,
    duration: t.duration,
    duration_formatted: formatDuration(t.duration),
    preview: t.preview,
    artist: {
      id: t.artist?.id,
      name: t.artist?.name,
      picture: t.artist?.picture_medium || t.artist?.picture
    },
    album: {
      id: t.album?.id,
      title: t.album?.title,
      cover: t.album?.cover_medium || t.album?.cover
    },
    link: t.link
  }));

  const artists = (data.artists?.data || []).map(a => ({
    id: a.id,
    name: a.name,
    position: a.position,
    picture: a.picture_medium || a.picture,
    picture_xl: a.picture_xl || a.picture_big,
    radio: a.radio,
    link: a.link
  }));

  const albums = (data.albums?.data || []).map(al => ({
    id: al.id,
    title: al.title,
    position: al.position,
    cover: al.cover_medium || al.cover,
    cover_xl: al.cover_xl || al.cover_big,
    artist: {
      id: al.artist?.id,
      name: al.artist?.name,
      picture: al.artist?.picture_medium || al.artist?.picture
    },
    link: al.link
  }));

  const playlists = (data.playlists?.data || []).map(p => ({
    id: p.id,
    title: p.title,
    public: p.public,
    nb_tracks: p.nb_tracks,
    picture: p.picture_medium || p.picture,
    picture_xl: p.picture_xl || p.picture_big,
    creator: {
      id: p.creator?.id,
      name: p.creator?.name
    },
    link: p.link
  }));

  return {
    tracks,
    artists,
    albums,
    playlists
  };
}

module.exports = [
  {
    name: "Music Search",
    desc: "Mencari musik dan lagu lengkap dengan audio full original (durasi asli, bukan preview 30 detik)",
    category: "Music",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Alan Walker Faded", required: true }
    },
    path: "/music/search",
    method: "ALL",
    async run(req, res) {
      const query = req.query || {};
      const body = req.body || {};

      const apikey = query.apikey || body.apikey || req.headers?.["x-api-key"] || req.headers?.["authorization"]?.replace("Bearer ", "");
      const validKeyList = global.apikey || ["skyy", "rz", "ptz", "putz", "piantech", "key123"];
      if (!apikey || !validKeyList.includes(apikey.trim())) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", error: "Apikey invalid (contoh: ?apikey=ptz)" });
      }

      const searchQuery = (query.query || body.query || query.q || body.q || query.text || body.text || query.title || body.title || query.song || body.song || query.search || body.search || "").trim();
      if (!searchQuery) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'query' (atau 'q' / 'title') wajib diisi" });
      }

      try {
        const result = await searchMusic(searchQuery);
        return res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        return res.status(500).json({ status: false, creator: "PutzOfficial", error: err.message || "Gagal memuat pencarian musik" });
      }
    }
  },
  {
    name: "DJ Search",
    desc: "Mencari musik DJ remix, jedag jedug, breakbeat, dan full bass",
    category: "Music",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Alan Walker", required: true }
    },
    path: "/music/dj-search",
    method: "GET",
    async run(req, res) {
      const { apikey, query, q } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }
      const searchQuery = query || q;
      if (!searchQuery) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });
      }

      try {
        const result = await searchDj(searchQuery);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Artist Search",
    desc: "Mencari profil penyanyi/musisi, foto profil, jumlah fans/followers, dan top 5 lagu terpopuler",
    category: "Music",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Alan Walker", required: true }
    },
    path: "/music/artist",
    method: "GET",
    async run(req, res) {
      const { apikey, query, q } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }
      const searchQuery = query || q;
      if (!searchQuery) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });
      }

      try {
        const result = await searchArtist(searchQuery);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Album Search",
    desc: "Mencari album musik, cover art HD, nama artis, dan jumlah track",
    category: "Music",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Different World", required: true }
    },
    path: "/music/album",
    method: "GET",
    async run(req, res) {
      const { apikey, query, q } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }
      const searchQuery = query || q;
      if (!searchQuery) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });
      }

      try {
        const result = await searchAlbum(searchQuery);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Track Search",
    desc: "Mencari track lagu spesifik dengan audio preview MP3 30 detik, durasi, dan informasi album",
    category: "Music",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Faded", required: true }
    },
    path: "/music/track",
    method: "GET",
    async run(req, res) {
      const { apikey, query, q } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }
      const searchQuery = query || q;
      if (!searchQuery) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });
      }

      try {
        const result = await searchTrack(searchQuery);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Lyrics Search",
    desc: "Mencari lirik lagu lengkap (plain text dan synced lyrics format LRC)",
    category: "Music",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Alan Walker Faded", required: true }
    },
    path: "/music/lyrics",
    method: "GET",
    async run(req, res) {
      const { apikey, query, q } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }
      const searchQuery = query || q;
      if (!searchQuery) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });
      }

      try {
        const result = await searchLyrics(searchQuery);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Playlist Search",
    desc: "Mencari playlist musik publik beserta jumlah lagu dan pembuatnya",
    category: "Music",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Top Hits 2024", required: true }
    },
    path: "/music/playlist",
    method: "GET",
    async run(req, res) {
      const { apikey, query, q } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }
      const searchQuery = query || q;
      if (!searchQuery) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });
      }

      try {
        const result = await searchPlaylist(searchQuery);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Music Detail",
    desc: "Mendapatkan informasi detail lagu lengkap (Audio preview, artis, album, genre, BPM, dan lirik lagu)",
    category: "Music",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Alan Walker Faded", required: true }
    },
    path: "/music/detail",
    method: "GET",
    async run(req, res) {
      const { apikey, query, q } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }
      const searchQuery = query || q;
      if (!searchQuery) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });
      }

      try {
        const result = await getMusicDetail(searchQuery);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Music Video Search",
    desc: "Mencari video klip musik resmi (official music video) dan live performances",
    category: "Music",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      query: { type: "string", example: "Alan Walker Faded", required: true }
    },
    path: "/music/video",
    method: "GET",
    async run(req, res) {
      const { apikey, query, q } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }
      const searchQuery = query || q;
      if (!searchQuery) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'query' wajib diisi" });
      }

      try {
        const result = await searchMusicVideo(searchQuery);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Trending Music",
    desc: "Mendapatkan chart musik trending teratas (Top tracks, artis, album, dan playlist)",
    category: "Music",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/music/trending",
    method: "GET",
    async run(req, res) {
      const { apikey } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      try {
        const result = await getTrendingMusic();
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  }
];
