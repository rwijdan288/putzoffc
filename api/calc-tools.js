module.exports = [
  {
    name: "Marketplace Admin Fee Calculator",
    desc: "Menghitung estimasi potongan biaya admin & komisi marketplace (Shopee, Tokopedia, TikTok Shop, Lazada)",
    category: "Calculator",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      harga: { type: "string", example: "150000" },
      platform: { type: "string", example: "shopee" },
      gratisOngkirExtra: { type: "string", example: "true" }
    },
    path: "/calc/marketplace-fee",
    async run(req, res) {
      const { apikey, harga, platform, gratisOngkirExtra } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const nominalHarga = Number(harga);
      if (!harga || isNaN(nominalHarga) || nominalHarga <= 0) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'harga' harus berupa angka positif." });
      }

      const plat = (platform || "shopee").toLowerCase().trim();
      const isExtra = gratisOngkirExtra === "true" || gratisOngkirExtra === "1";

      let rateAdmin = 0.04; // default 4%
      let rateFreeShip = isExtra ? 0.04 : 0;
      let platformName = "Shopee";

      if (plat.includes("tokopedia") || plat.includes("toped")) {
        platformName = "Tokopedia";
        rateAdmin = 0.045;
        rateFreeShip = isExtra ? 0.035 : 0;
      } else if (plat.includes("tiktok")) {
        platformName = "TikTok Shop";
        rateAdmin = 0.04;
        rateFreeShip = isExtra ? 0.03 : 0;
      } else if (plat.includes("lazada")) {
        platformName = "Lazada";
        rateAdmin = 0.035;
        rateFreeShip = isExtra ? 0.03 : 0;
      }

      const feeAdmin = Math.round(nominalHarga * rateAdmin);
      const feeOngkir = Math.round(nominalHarga * rateFreeShip);
      const totalPotongan = feeAdmin + feeOngkir;
      const pendapatanBersih = nominalHarga - totalPotongan;

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          platform: platformName,
          hargaProduk: nominalHarga,
          biayaAdmin: {
            persen: `${(rateAdmin * 100).toFixed(1)}%`,
            nominal: feeAdmin
          },
          biayaProgramExtra: {
            persen: `${(rateFreeShip * 100).toFixed(1)}%`,
            nominal: feeOngkir
          },
          totalPotongan,
          pendapatanBersih,
          formatted: {
            hargaJual: `Rp ${nominalHarga.toLocaleString("id-ID")}`,
            potongan: `Rp ${totalPotongan.toLocaleString("id-ID")}`,
            diterimaSeller: `Rp ${pendapatanBersih.toLocaleString("id-ID")}`
          }
        }
      });
    }
  },
  {
    name: "Kalkulator BMI & Berat Ideal",
    desc: "Menghitung Body Mass Index (BMI), kategori berat badan, dan rentang berat badan ideal menurut WHO",
    category: "Calculator",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      beratBadan: { type: "string", example: "65" },
      tinggiBadan: { type: "string", example: "170" }
    },
    path: "/calc/bmi",
    async run(req, res) {
      const { apikey, beratBadan, tinggiBadan, bb, tb } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const weight = Number(beratBadan || bb);
      const height = Number(tinggiBadan || tb);

      if (!weight || !height || isNaN(weight) || isNaN(height)) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'beratBadan' (kg) dan 'tinggiBadan' (cm) wajib berupa angka." });
      }

      const heightM = height / 100;
      const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));

      let kategori = "Normal (Ideal)";
      let saran = "Pertahankan pola makan sehat dan olahraga teratur.";

      if (bmi < 18.5) {
        kategori = "Kurus (Underweight)";
        saran = "Tingkatkan asupan kalori bernutrisi dan protein harian.";
      } else if (bmi >= 25 && bmi < 29.9) {
        kategori = "Kelebihan Berat Badan (Overweight)";
        saran = "Kurangi makanan tinggi gula/lemak dan perbanyak aktivitas kardio.";
      } else if (bmi >= 30) {
        kategori = "Obesitas (Obese)";
        saran = "Konsultasikan dengan dokter gizi untuk program penurunan berat badan yang aman.";
      }

      const beratIdealMin = Math.round(18.5 * (heightM * heightM));
      const beratIdealMax = Math.round(24.9 * (heightM * heightM));

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          beratBadanKg: weight,
          tinggiBadanCm: height,
          bmi,
          kategori,
          beratBadanIdeal: `${beratIdealMin} kg - ${beratIdealMax} kg`,
          saranKesehatan: saran
        }
      });
    }
  },
  {
    name: "Kalkulator Diskon & PPN",
    desc: "Menghitung harga akhir setelah diskon bertingkat dan penambahan PPN (Pajak Pertambahan Nilai)",
    category: "Calculator",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      harga: { type: "string", example: "250000" },
      diskon: { type: "string", example: "20" },
      ppn: { type: "string", example: "11" }
    },
    path: "/calc/diskon",
    async run(req, res) {
      const { apikey, harga, diskon, ppn } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const h = Number(harga);
      const d = Number(diskon || 0);
      const p = Number(ppn || 0);

      if (!harga || isNaN(h) || h <= 0) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'harga' harus berupa angka positif." });
      }

      const hematDiskon = Math.round(h * (d / 100));
      const setelahDiskon = h - hematDiskon;
      const nominalPpn = Math.round(setelahDiskon * (p / 100));
      const totalBayar = setelahDiskon + nominalPpn;

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          hargaAwal: h,
          diskonPersen: `${d}%`,
          hematDiskon,
          hargaSetelahDiskon: setelahDiskon,
          ppnPersen: `${p}%`,
          nominalPpn,
          totalBayar,
          formatted: {
            hargaAwal: `Rp ${h.toLocaleString("id-ID")}`,
            hemat: `Rp ${hematDiskon.toLocaleString("id-ID")}`,
            pajak: `Rp ${nominalPpn.toLocaleString("id-ID")}`,
            totalAkhir: `Rp ${totalBayar.toLocaleString("id-ID")}`
          }
        }
      });
    }
  },
  {
    name: "Boredom Activity Idea",
    desc: "Memberikan ide aktivitas kreatif, edukatif, dan produktif secara acak saat kamu merasa bosan",
    category: "Random",
    parameters: {
      apikey: { type: "string", example: "ptz" }
    },
    path: "/random/bored",
    async run(req, res) {
      const { apikey } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const activities = [
        { aktivitas: "Belajar 10 kosakata bahasa asing baru (Jepang/Inggris/Arab)", kategori: "Edukasi", durasi: "15 Menit" },
        { aktivitas: "Rapikan meja kerja atau kamar tidur untuk menyegarkan pikiran", kategori: "Produktivitas", durasi: "20 Menit" },
        { aktivitas: "Coba resep minuman kopi/teh baru di dapur", kategori: "Kuliner", durasi: "10 Menit" },
        { aktivitas: "Dengarkan satu album musik instrumental atau lofi santai", kategori: "Relaksasi", durasi: "30 Menit" },
        { aktivitas: "Tulis 3 hal yang kamu syukuri hari ini di catatan", kategori: "Mindfulness", durasi: "5 Menit" },
        { aktivitas: "Lakukan stretching / peregangan badan selama 10 menit", kategori: "Kesehatan", durasi: "10 Menit" },
        { aktivitas: "Tonton 1 video dokumenter sains atau sejarah di YouTube", kategori: "Edukasi", durasi: "25 Menit" },
        { aktivitas: "Hubungi teman lama yang sudah jarang kamu sapa", kategori: "Sosial", durasi: "15 Menit" },
        { aktivitas: "Hapus foto-foto buram atau file duplikat di galeri HP", kategori: "Digital Declutter", durasi: "15 Menit" }
      ];

      const randomItem = activities[Math.floor(Math.random() * activities.length)];

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: randomItem
      });
    }
  }
];
