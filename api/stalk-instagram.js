const axios = require("axios");
const cheerio = require("cheerio");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function getIgAppId(username) {
  const url = `https://www.instagram.com/${username}/`;

  const { data: html } = await axios.get(url, {
    headers: { "user-agent": UA },
    timeout: 15000
  });

  const $ = cheerio.load(html);
  const scripts = $("script");

  for (let i = 0; i < scripts.length; i++) {
    const content = $(scripts[i]).html();
    if (!content) continue;

    const match = content.match(/"X-IG-App-ID":"(\d+)"/);
    if (match) {
      return match[1];
    }
  }

  return "936619743392459";
}

async function instagramStalk(username) {
  const appId = await getIgAppId(username);

  const res = await axios.get(
    "https://www.instagram.com/api/v1/users/web_profile_info/",
    {
      params: { username },
      headers: {
        "user-agent": UA,
        "x-ig-app-id": appId,
        "accept": "*/*",
        "referer": `https://www.instagram.com/${username}/`
      },
      timeout: 15000
    }
  );

  const user = res.data?.data?.user;
  if (!user) throw new Error("User tidak ditemukan");

  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    bio: user.biography,
    avatar: user.profile_pic_url_hd || user.profile_pic_url,
    followers: user.edge_followed_by?.count || 0,
    following: user.edge_follow?.count || 0,
    posts: user.edge_owner_to_timeline_media?.count || 0,
    verified: user.is_verified,
    private: user.is_private
  };
}

module.exports = {
  name: "Instagram",
  desc: "Stalking akun Instagram",
  category: "Stalker",
  parameters: {
    apikey: { type: "string", example: "skyy" },
    username: { type: "string", example: "instagram" }
  },     
  path: "/stalk/instagram",
  async run(req, res) {
    const { apikey, username } = req.query;

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });

    if (!username)
      return res.json({ status: false, error: "Username is required" });

    try {
      const result = await instagramStalk(username);
      res.status(200).json({
        status: true,
        result
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  }
};
