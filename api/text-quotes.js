// Generator Teks, Quotes, Pantun, Aksara Jawa & Sandi Morse

const PANTUN_BANK = [
  "Bunga mawar bunga melati,\nTumbuh indah di taman sari.\nSenyum manismu memikat hati,\nBikin rindu setiap hari.",
  "Ke pasar beli buah nangka,\nJangan lupa membeli terasi.\nJika hidup selalu bersangka,\nJiwa tak tenang hati tersiksa.",
  "Makan siang lauk kepiting,\nMinumnya es kelapa muda.\nJangan suka mengadu domba,\nLebih baik berbaik sangka.",
  "Jalan-jalan ke kota Blitar,\nJangan lupa beli sukun.\nJika kamu ingin pintar,\nBelajarlah dengan tekun.",
  "Pagi-pagi minum jamu,\nMinumnya di bawah pohon randu.\nSetiap malam terbayang wajahmu,\nApakah ini yang dinamakan rindu?"
];

const KATA_BIJAK_BANK = [
  { quotes: "Masa depan adalah milik mereka yang percaya pada keindahan mimpi-mimpi mereka.", author: "Eleanor Roosevelt" },
  { quotes: "Kegagalan adalah satu-satunya kesempatan untuk memulai lagi secara lebih cerdas.", author: "Henry Ford" },
  { quotes: "Bukan kesulitan yang membuat kita takut melangkah, melainkan ketakutanlah yang membuat segalanya tampak sulit.", author: "Seneca" },
  { quotes: "Jangan biarkan hari kemarin merampas terlalu banyak dari hari ini.", author: "Will Rogers" },
  { quotes: "Hiduplah seolah-olah kamu akan mati besok. Belajarlah seolah-olah kamu akan hidup selamanya.", author: "Mahatma Gandhi" },
  { quotes: "Kesuksesan berawal dari keputusan untuk mencoba.", author: "Anonim" }
];

const BUCIN_BANK = [
  "Kalau disuruh milih antara hidupku atau kamu, aku bakal milih hidupku. Soalnya hidupku itu ya kamu.",
  "Cinta aku ke kamu itu kayak lingkaran, nggak ada ujungnya dan nggak pernah putus.",
  "Aku nggak butuh maps lagi, soalnya tujuanku selalu pulang ke pelukanmu.",
  "Bintang di langit boleh banyak, tapi yang menerangi hariku cuma kamu.",
  "Sejak kenal kamu, hari-hariku yang biasa berubah jadi istimewa."
];

const JOKES_BANK = [
  { tanya: "Ikan apa yang paling suka berhenti?", jawab: "Ikan pause!" },
  { tanya: "Penyanyi luar negeri yang hobi naik sepeda?", jawab: "Bruno Mars, soalnya 'Bruno goes on bicycle'!" },
  { tanya: "Kenapa pohon mangga di depan rumah harus ditebang?", jawab: "Soalnya kalau dicabut keberatan." },
  { tanya: "Kenapa matahari tenggelam?", jawab: "Karena matahari nggak bisa berenang!" },
  { tanya: "Ban apa yang paling berat di dunia?", jawab: "Bantuin dorong truk mogok!" }
];

// Peta Aksara Jawa Dasar
const AKSARA_JAWA_MAP = {
  ha: "ꦲ", na: "ꦤ", ca: "ꦕ", ra: "ꦫ", ka: "ꦏ",
  da: "ꦢ", ta: "ꦠ", sa: "ꦱ", wa: "ꦮ", la: "ꦭ",
  pa: "ꦥ", dha: "ꦝ", ja: "ꦗ", ya: "ꦪ", nya: "ꦚ",
  ma: "ꦩ", ga: "ꦒ", ba: "ꦧ", tha: "ꦛ", nga: "ꦔ"
};

// Peta Sandi Morse
const MORSE_MAP = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.",
  g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..",
  m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.",
  s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-",
  y: "-.--", z: "--..",
  "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....",
  "6": "-....", "7": "--...", "8": "---..", "9": "----.", "0": "-----",
  " ": "/"
};

const REVERSE_MORSE_MAP = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
);

// Fancy text transformation styles
function transformFancy(text) {
  const styles = {
    bold: "",
    italic: "",
    monospace: "",
    bubble: "",
    fraktur: "",
    small_caps: ""
  };

  const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const boldChars = "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵";
  const monoChars = "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉0123456789";
  const bubbleChars = "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ⓪①②③④⑤⑥⑦⑧⑨";

  return {
    original: text,
    bold: text.split("").map(c => { const i = normal.indexOf(c); return i !== -1 ? boldChars.slice(i * 2, i * 2 + 2) : c; }).join(""),
    monospace: text.split("").map(c => { const i = normal.indexOf(c); return i !== -1 ? monoChars.slice(i * 2, i * 2 + 2) : c; }).join(""),
    bubble: text.split("").map(c => { const i = normal.indexOf(c); return i !== -1 ? bubbleChars.slice(i * 3, i * 3 + 3).trim() : c; }).join(""),
    strikethrough: text.split("").join("̶") + "̶",
    reverse: text.split("").reverse().join("")
  };
}

function latinToJawa(text) {
  let res = text.toLowerCase();
  for (const [latin, jawa] of Object.entries(AKSARA_JAWA_MAP)) {
    res = res.replace(new RegExp(latin, "g"), jawa);
  }
  return res;
}

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
    name: "Random Pantun",
    desc: "Kumpulan pantun jenaka, cinta, nasehat dan teka-teki nusantara",
    category: "Text & Quotes",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/text/pantun",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = PANTUN_BANK[Math.floor(Math.random() * PANTUN_BANK.length)];
      res.json({ status: true, creator: "PutzOfficial", result: { pantun: pick } });
    }
  },
  {
    name: "Kata Bijak & Quotes",
    desc: "Quotes motivasi hidup, inspirasi dan kata-kata mutiara tokoh ternama",
    category: "Text & Quotes",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/text/kata-bijak",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = KATA_BIJAK_BANK[Math.floor(Math.random() * KATA_BIJAK_BANK.length)];
      res.json({ status: true, creator: "PutzOfficial", result: pick });
    }
  },
  {
    name: "Kata Bucin",
    desc: "Koleksi kata-kata romantis, rayuan gombal dan quotes bucin",
    category: "Text & Quotes",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/text/bucin",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = BUCIN_BANK[Math.floor(Math.random() * BUCIN_BANK.length)];
      res.json({ status: true, creator: "PutzOfficial", result: { bucin: pick } });
    }
  },
  {
    name: "Jokes Receh",
    desc: "Tebak-tebakan lucu, banyolan garing dan jokes receh pengusir bosan",
    category: "Text & Quotes",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/text/jokes",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = JOKES_BANK[Math.floor(Math.random() * JOKES_BANK.length)];
      res.json({ status: true, creator: "PutzOfficial", result: pick });
    }
  },
  {
    name: "Fancy Text Style",
    desc: "Mengubah teks biasa menjadi berbagai font gaya keren, unik dan estetik",
    category: "Text & Quotes",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      text: { type: "string", example: "Putz Official API", required: true }
    },
    path: "/text/fancy-text",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const text = (req.query?.text || req.body?.text || "").trim();
      if (!text) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'text' wajib diisi" });
      }
      res.json({ status: true, creator: "PutzOfficial", result: transformFancy(text) });
    }
  },
  {
    name: "Sandi Morse Converter",
    desc: "Konverter teks latin ke sandi Morse dan sandi Morse ke teks latin",
    category: "Text & Quotes",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      text: { type: "string", example: "SOS PUTZ", required: true },
      mode: { type: "string", example: "encode", required: false }
    },
    path: "/text/morse",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const text = (req.query?.text || req.body?.text || "").trim();
      const mode = (req.query?.mode || req.body?.mode || "encode").toLowerCase();
      if (!text) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'text' wajib diisi" });
      }

      if (mode === "decode") {
        const words = text.split("/");
        const decoded = words.map(w => w.trim().split(/\s+/).map(code => REVERSE_MORSE_MAP[code] || "?").join("")).join(" ");
        return res.json({ status: true, creator: "PutzOfficial", result: { morse: text, text: decoded } });
      }

      const morse = text.toLowerCase().split("").map(c => MORSE_MAP[c] || c).join(" ");
      res.json({ status: true, creator: "PutzOfficial", result: { text, morse } });
    }
  },
  {
    name: "Aksara Jawa",
    desc: "Transliterasi teks tulisan latin ke tulisan aksara Jawa nusantara",
    category: "Text & Quotes",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      text: { type: "string", example: "hanacaraka datasawala magabathanga", required: true }
    },
    path: "/text/aksara-jawa",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const text = (req.query?.text || req.body?.text || "").trim();
      if (!text) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Parameter 'text' wajib diisi" });
      }
      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          latin: text,
          aksara: latinToJawa(text)
        }
      });
    }
  }
];
