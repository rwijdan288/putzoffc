const axios = require("axios");

const API = "https://mobile-legends.fandom.com/api.php";

async function getHeroesFast() {
  const { data } = await axios.get(API, {
    params: {
      action: "query",
      list: "categorymembers",
      cmtitle: "Category:Heroes",
      cmlimit: 500,
      format: "json"
    }
  });

  return data.query.categorymembers
    .map(h => h.title)
    .filter(h => !h.includes("/") && !h.includes(":"));
}

async function getFirstAudioFast(hero, maxRetry = 5) {
  let attempt = 0;

  while (attempt < maxRetry) {
    attempt++;

    const { data } = await axios.get(API, {
      params: {
        action: "parse",
        page: `${hero}/Audio/id`,
        prop: "images",
        format: "json"
      }
    });

    const images = data?.parse?.images;

    if (Array.isArray(images) && images.length > 0) {
      const audio = images.find(x => x.endsWith(".ogg"));
      if (!audio) return null;

      const file = await axios.get(API, {
        params: {
          action: "query",
          titles: `File:${audio}`,
          prop: "imageinfo",
          iiprop: "url",
          format: "json"
        }
      });

      const page = Object.values(file.data.query.pages)[0];
      return page?.imageinfo?.[0]?.url || null;
    }
  }

  return null;
}

module.exports = {
  name: "Hero ML",
  desc: "Random suara hero Mobile Legends",
  category: "Random",
  parameters: {
    apikey: { type: "string", example: "skyy" }
  },     
  path: "/random/heroml",
  async run(req, res) {
    const { apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    try {
      const heroes = await getHeroesFast();
      let hero, audio;

      for (let i = 0; i < 5; i++) {
        hero = heroes[Math.floor(Math.random() * heroes.length)];
        if (hero.includes(" ")) hero = hero.split(" ").join("-");
        audio = await getFirstAudioFast(hero);
        if (audio) break;
      }

      res.json({
        status: true,
        hero: hero || "Layla",
        audio: audio || "https://static.wikia.nocookie.net/mobile-legends/images/c/c5/Layla_Select.ogg"
      });

    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }
};
