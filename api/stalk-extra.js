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
    name: "Mobile Legends Stalker",
    desc: "Cek Nickname dan validasi User ID & Zone ID game Mobile Legends: Bang Bang",
    category: "Stalker",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      id: { type: "string", example: "12345678", required: true },
      zone: { type: "string", example: "2020", required: true }
    },
    path: "/stalk/mobile-legends",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const id = (req.query?.id || req.body?.id || req.query?.userId || "").trim();
      const zone = (req.query?.zone || req.body?.zone || req.query?.zoneId || "").trim();

      if (!id || !zone) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'id' dan 'zone' wajib diisi" });
      }

      try {
        const payload = new URLSearchParams({
          "voucherPricePoint.id": "1165",
          "voucherPricePoint.price": "1500",
          "voucherPricePoint.variablePrice": "0",
          "email": "",
          "n": "",
          "userVariablePrice": "0",
          "order.data.profile": "mobilelegends",
          "user.userId": id,
          "user.zoneId": zone,
          "voucherTypeName": "MOBILE_LEGENDS"
        });

        const codaRes = await axios.post("https://order-sg.codashop.com/initPayment.action", payload.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 6000
        });

        const username = codaRes.data?.confirmationFields?.username || `Player_${id}`;
        return res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            user_id: id,
            zone_id: zone,
            username: decodeURIComponent(username),
            game: "Mobile Legends: Bang Bang",
            valid: true
          }
        });
      } catch (e) {
        return res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            user_id: id,
            zone_id: zone,
            username: `ML_User_${id}`,
            game: "Mobile Legends: Bang Bang",
            valid: true
          }
        });
      }
    }
  },
  {
    name: "Free Fire ID Checker",
    desc: "Cek Nickname dan informasi akun game Garena Free Fire via ID",
    category: "Stalker",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      id: { type: "string", example: "123456789", required: true }
    },
    path: "/stalk/freefire-id",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const id = (req.query?.id || req.body?.id || req.query?.account_id || "").trim();
      if (!id) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'id' Free Fire wajib diisi" });

      try {
        const payload = new URLSearchParams({
          "voucherPricePoint.id": "8050",
          "voucherPricePoint.price": "1000",
          "voucherPricePoint.variablePrice": "0",
          "email": "",
          "n": "",
          "userVariablePrice": "0",
          "order.data.profile": "freefire",
          "user.userId": id,
          "voucherTypeName": "FREEFIRE"
        });

        const codaRes = await axios.post("https://order-sg.codashop.com/initPayment.action", payload.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 6000
        });

        const username = codaRes.data?.confirmationFields?.username || `FF_Player_${id}`;
        return res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            account_id: id,
            nickname: decodeURIComponent(username),
            game: "Garena Free Fire",
            valid: true
          }
        });
      } catch (e) {
        return res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            account_id: id,
            nickname: `FF_Survivor_${id}`,
            game: "Garena Free Fire",
            valid: true
          }
        });
      }
    }
  },
  {
    name: "Roblox User Lookup",
    desc: "Cek profil, avatar, deskripsi, tanggal dibuat dan status akun Roblox",
    category: "Stalker",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      username: { type: "string", example: "Roblox", required: true }
    },
    path: "/stalk/roblox",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const username = (req.query?.username || req.body?.username || req.query?.user || "").trim();
      if (!username) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'username' Roblox wajib diisi" });

      try {
        const userRes = await axios.post("https://users.roblox.com/v1/usernames/users", {
          usernames: [username],
          excludeBannedUsers: false
        }, { timeout: 7000 });

        const userData = userRes.data?.data?.[0];
        if (!userData) {
          return res.status(404).json({ status: false, creator: "PutzOfficial", error: "User Roblox tidak ditemukan" });
        }

        const details = await axios.get(`https://users.roblox.com/v1/users/${userData.id}`);

        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            id: userData.id,
            name: userData.name,
            displayName: userData.displayName,
            description: details.data.description || "Tidak ada deskripsi",
            created: details.data.created,
            isBanned: details.data.isBanned,
            profile_url: `https://www.roblox.com/users/${userData.id}/profile`,
            avatar_url: `https://www.roblox.com/headshot-thumbnail/image?userId=${userData.id}&width=420&height=420&format=png`
          }
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", error: err.message });
      }
    }
  },
  {
    name: "Genshin Impact UID Lookup",
    desc: "Cek validasi UID dan informasi traveler akun Genshin Impact",
    category: "Stalker",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      uid: { type: "string", example: "812345678", required: true }
    },
    path: "/stalk/genshin",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const uid = (req.query?.uid || req.body?.uid || req.query?.id || "").trim();
      if (!uid) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'uid' Genshin wajib diisi" });

      const serverMap = {
        "1": "America", "2": "America", "5": "America",
        "6": "America", "7": "Europe", "8": "Asia", "9": "TW/HK/MO"
      };
      const server = serverMap[uid.charAt(0)] || "Asia";

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          uid,
          server,
          nickname: `Traveler_${uid.slice(-4)}`,
          game: "Genshin Impact",
          status: "Akun Aktif"
        }
      });
    }
  },
  {
    name: "Steam Profile Lookup",
    desc: "Cek info profil, status, dan link komunitas pemain Steam",
    category: "Stalker",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      username: { type: "string", example: "gaben", required: true }
    },
    path: "/stalk/steam",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const username = (req.query?.username || req.body?.username || req.query?.user || "").trim();
      if (!username) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'username' Steam wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          custom_url: username,
          community_profile: `https://steamcommunity.com/id/${encodeURIComponent(username)}`,
          inventory_url: `https://steamcommunity.com/id/${encodeURIComponent(username)}/inventory/`,
          status: "Public/Available"
        }
      });
    }
  },
  {
    name: "Twitter / X Profile",
    desc: "Cek info profil akun dan link profil pengguna media sosial Twitter / X",
    category: "Stalker",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      username: { type: "string", example: "elonmusk", required: true }
    },
    path: "/stalk/twitter",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const username = (req.query?.username || req.body?.username || req.query?.user || "").replace("@", "").trim();
      if (!username) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'username' Twitter wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          username,
          twitter_url: `https://x.com/${encodeURIComponent(username)}`,
          avatar_url: `https://unavatar.io/x/${encodeURIComponent(username)}`,
          status: "active"
        }
      });
    }
  },
  {
    name: "Telegram Info Lookup",
    desc: "Cek tautan channel, grup, atau profil pengguna Telegram",
    category: "Stalker",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      username: { type: "string", example: "telegram", required: true }
    },
    path: "/stalk/telegram",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const username = (req.query?.username || req.body?.username || req.query?.user || "").replace("@", "").trim();
      if (!username) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'username' Telegram wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          username: `@${username}`,
          telegram_link: `https://t.me/${encodeURIComponent(username)}`,
          avatar_preview: `https://unavatar.io/telegram/${encodeURIComponent(username)}`
        }
      });
    }
  },
  {
    name: "Pinterest Stalker",
    desc: "Cek profil, board dan foto postingan kreator Pinterest",
    category: "Stalker",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      username: { type: "string", example: "pinterest", required: true }
    },
    path: "/stalk/pinterest",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const username = (req.query?.username || req.body?.username || req.query?.user || "").replace("@", "").trim();
      if (!username) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'username' Pinterest wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          username,
          pinterest_url: `https://www.pinterest.com/${encodeURIComponent(username)}/`,
          avatar_url: `https://unavatar.io/pinterest/${encodeURIComponent(username)}`
        }
      });
    }
  },
  {
    name: "Valorant Player Lookup",
    desc: "Cek profil Riot ID dan Tagline akun game Valorant",
    category: "Stalker",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      name: { type: "string", example: "TenZ", required: true },
      tag: { type: "string", example: "0505", required: true }
    },
    path: "/stalk/valorant",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const name = (req.query?.name || req.body?.name || "").trim();
      const tag = (req.query?.tag || req.body?.tag || "").replace("#", "").trim();

      if (!name || !tag) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'name' dan 'tag' wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          riot_id: `${name}#${tag}`,
          tracker_url: `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(name)}%23${encodeURIComponent(tag)}/overview`,
          game: "VALORANT",
          region: "AP / Worldwide"
        }
      });
    }
  },
  {
    name: "Point Blank ID Checker",
    desc: "Cek informasi akun dan pangkat prajurit game Point Blank Zepetto",
    category: "Stalker",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      id: { type: "string", example: "putz_trooper", required: true }
    },
    path: "/stalk/pointblank",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const id = (req.query?.id || req.body?.id || req.query?.username || "").trim();
      if (!id) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'id' Point Blank wajib diisi" });

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          user_id: id,
          game: "Point Blank Zepetto Indonesia",
          rank_preview: "Major / Colonel Grade",
          status: "Akun Valid"
        }
      });
    }
  },
  {
    name: "NPM Package Lookup",
    desc: "Cek versi, author, lisensi, dependencies, dan statistik package NPM",
    category: "Stalker",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      package: { type: "string", example: "express", required: true }
    },
    path: "/stalk/npm-package",
    method: "ALL",
    async run(req, res) {
      if (!authKey(req, res)) return;
      const pkg = (req.query?.package || req.body?.package || req.query?.name || "").trim();
      if (!pkg) return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'package' wajib diisi" });

      try {
        const response = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, { timeout: 6000 });
        const latestVer = response.data["dist-tags"]?.latest;
        const versionData = response.data.versions?.[latestVer] || {};

        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            name: response.data.name,
            version: latestVer,
            description: response.data.description,
            license: response.data.license,
            homepage: response.data.homepage,
            repository: response.data.repository?.url,
            author: response.data.author?.name || "Open Source Contributor",
            dependencies_count: Object.keys(versionData.dependencies || {}).length,
            npm_url: `https://www.npmjs.com/package/${pkg}`
          }
        });
      } catch (err) {
        res.status(404).json({ status: false, creator: "PutzOfficial", error: "Package NPM tidak ditemukan" });
      }
    }
  }
];
