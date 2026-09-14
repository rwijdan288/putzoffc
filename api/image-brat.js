function generateBratSvg(text) {
  const safeText = (text || "brat").toLowerCase()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Wrap text every 18 characters
  const words = safeText.split(' ');
  const lines = [];
  let currentLine = '';
  for (const w of words) {
    if ((currentLine + ' ' + w).trim().length > 16) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = w;
    } else {
      currentLine = (currentLine + ' ' + w).trim();
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  const tspans = lines.map((l, i) => `<tspan x="40" dy="${i === 0 ? 0 : 54}">${l}</tspan>`).join('');

  return Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#8ACE00"/>
      <text x="40" y="90" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="bold" fill="#000000" letter-spacing="-1.5px">
        ${tspans}
      </text>
    </svg>
  `);
}

module.exports = {
  name: "Brat",
  desc: "Brat text generator",
  category: "Imagecreator",
  parameters: {
    apikey: { type: "string", example: "ptz" },
    text: { type: "string", example: "halo dunia" }
  },   
  path: "/imagecreator/brat",
  async run(req, res) {
    const { apikey, text } = req.query;
    if (!apikey || !global.apikey?.includes(apikey)) return res.json({ status: false, error: 'Apikey invalid' });
    if (!text) return res.json({ status: false, error: 'Parameter text wajib diisi' });

    try {
      const buffer = await global.getBuffer(`https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=false&delay=500`, { timeout: 4000 });
      if (Buffer.isBuffer(buffer) && buffer.length > 50) {
        res.setHeader('Content-Type', 'image/png');
        return res.end(buffer);
      }
    } catch (_) {}

    // Fallback SVG Brat generator
    const svgBuffer = generateBratSvg(text);
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.end(svgBuffer);
  }
};
