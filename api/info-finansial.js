const axios = require("axios");

async function getBMKGCuaca(wilayah) {
  // Ambil data gempa & cuaca BMKG terkini
  const res = await axios.get("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json", { timeout: 8000 });
  const gempa = res.data?.Infogempa?.gempa || {};
  return {
    info: "BMKG Indonesia Live Data",
    gempaTerkini: {
      tanggal: gempa.Tanggal,
      jam: gempa.Jam,
      magnitude: gempa.Magnitude,
      kedalaman: gempa.Kedalaman,
      wilayah: gempa.Wilayah,
      potensi: gempa.Potensi,
      shakemap: `https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`
    }
  };
}

async function getExchangeRate(from = "USD", to = "IDR", amount = 1) {
  const fromCurr = from.toUpperCase();
  const toCurr = to.toUpperCase();
  const res = await axios.get(`https://open.er-api.com/v6/latest/${fromCurr}`, { timeout: 8000 });
  
  if (!res.data || res.data.result !== "success") {
    throw new Error(`Gagal mengambil kurs untuk mata uang ${fromCurr}`);
  }

  const rate = res.data.rates[toCurr];
  if (!rate) {
    throw new Error(`Mata uang tujuan ${toCurr} tidak valid.`);
  }

  const total = (Number(amount) || 1) * rate;

  return {
    from: fromCurr,
    to: toCurr,
    amount: Number(amount) || 1,
    rate: rate,
    converted: total,
    formatted: new Intl.NumberFormat("id-ID", { style: "currency", currency: toCurr }).format(total),
    lastUpdate: res.data.time_last_update_utc
  };
}

async function getCryptoPrice(coin = "bitcoin") {
  const coinId = coin.toLowerCase().trim();
  const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=idr,usd&include_24hr_change=true`, { timeout: 8000 });
  
  if (!res.data || !res.data[coinId]) {
    throw new Error(`Koin '${coinId}' tidak ditemukan di CoinGecko (contoh: bitcoin, ethereum, solana, dogecoin).`);
  }

  const data = res.data[coinId];
  return {
    coin: coinId,
    price_idr: data.idr,
    formatted_idr: `Rp ${data.idr.toLocaleString("id-ID")}`,
    price_usd: `$${data.usd.toLocaleString("en-US")}`,
    change_24h: `${data.usd_24h_change?.toFixed(2)}%`
  };
}

module.exports = [
  {
    name: "Gempa Terkini (BMKG)",
    desc: "Mendapatkan informasi gempa bumi terkini dan peringatan tsunami dari BMKG Indonesia secara real-time",
    category: "Information",
    parameters: {
      apikey: { type: "string", example: "ptz" }
    },
    path: "/info/gempa",
    async run(req, res) {
      const { apikey } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      try {
        const result = await getBMKGCuaca();
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Kurs Mata Uang",
    desc: "Konversi nilai tukar kurs mata uang dunia secara live (USD, IDR, EUR, JPY, MYR, dll)",
    category: "Information",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      from: { type: "string", example: "USD" },
      to: { type: "string", example: "IDR" },
      amount: { type: "string", example: "10" }
    },
    path: "/info/kurs",
    async run(req, res) {
      const { apikey, from, to, amount } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      try {
        const result = await getExchangeRate(from, to, amount);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Crypto Price Live",
    desc: "Mengecek harga pasar Cryptocurrency terbaru (Bitcoin, Ethereum, Solana, USDT)",
    category: "Information",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      coin: { type: "string", example: "bitcoin" }
    },
    path: "/info/crypto",
    async run(req, res) {
      const { apikey, coin } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      try {
        const result = await getCryptoPrice(coin);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  }
];
