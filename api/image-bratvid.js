module.exports = {
  name: "Bratvid", 
  desc: "Brat video generator", 
  category: "Imagecreator", 
  parameters: {
    apikey: { type: "string", example: "skyy" },
    text: { type: "string", example: "putz" }
  },   
  path: "/imagecreator/bratvid",

  async run(req, res) {
    try {
      const { apikey, text } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' });
      }

      if (!text) {
        return res.json({ status: false, error: 'Text parameter is required' });
      }

      const buffer = await global.getBuffer(`https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=true&delay=500`);
      res.type('image/gif').send(buffer);
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};
