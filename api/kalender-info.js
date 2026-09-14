const axios = require("axios");

// Perhitungan Kalender Jawa & Pasaran
function getKalenderLengkap(dateInput) {
  const targetDate = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(targetDate.getTime())) {
    throw new Error("Format tanggal tidak valid (gunakan format YYYY-MM-DD, contoh: 2026-08-27)");
  }

  const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulanList = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const pasaranList = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"];
  const neptuHari = { Minggu: 5, Senin: 4, Selasa: 3, Rabu: 7, Kamis: 8, Jumat: 6, Sabtu: 9 };
  const neptuPasaran = { Legi: 5, Pahing: 9, Pon: 7, Wage: 4, Kliwon: 8 };

  // Base epoch untuk pasaran jawa: 1 Januari 1970 adalah Kamis Wage
  const baseDate = new Date(1970, 0, 1);
  const diffDays = Math.floor((targetDate.setHours(0, 0, 0, 0) - baseDate.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
  
  // 1 Jan 1970 adalah Wage (index 3 di pasaran: Legi=0, Pahing=1, Pon=2, Wage=3, Kliwon=4)
  let pasaranIndex = (3 + (diffDays % 5) + 5) % 5;
  const pasaran = pasaranList[pasaranIndex];
  const namaHari = hariList[targetDate.getDay()];
  const namaBulan = bulanList[targetDate.getMonth()];
  const weton = `${namaHari} ${pasaran}`;
  const totalNeptu = (neptuHari[namaHari] || 0) + (neptuPasaran[pasaran] || 0);

  // Estimasi Kalender Hijriah
  const hijriMonths = ["Muharram", "Safar", "Rabiul Awwal", "Rabiul Akhir", "Jumadil Awwal", "Jumadil Akhir", "Rajab", "Syaban", "Ramadhan", "Syawwal", "Dzulqa'dah", "Dzulhijjah"];
  // Menggunakan Intl format Hijriah bawaan Node.js
  let hijriString = "1448 H";
  try {
    const hijriFormatter = new Intl.DateTimeFormat("id-ID-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    hijriString = hijriFormatter.format(targetDate);
  } catch (e) {
    hijriString = `${targetDate.getDate()} Shafar 1448 H`;
  }

  return {
    masehi: {
      hari: namaHari,
      tanggal: targetDate.getDate(),
      bulan: namaBulan,
      tahun: targetDate.getFullYear(),
      formatLengkap: `${namaHari}, ${targetDate.getDate()} ${namaBulan} ${targetDate.getFullYear()}`
    },
    hijriah: {
      format: hijriString
    },
    jawa: {
      weton: weton,
      pasaran: pasaran,
      neptu: totalNeptu,
      penjelasan: `Neptu ${weton} adalah ${totalNeptu} (Hari ${neptuHari[namaHari]} + Pasaran ${neptuPasaran[pasaran]}).`
    }
  };
}

const dataZodiak = {
  aries: { nama: "Aries", rentang: "21 Maret - 19 April", elemen: "Api", sifat: "Penuh semangat, berani, mandiri, dan berjiwa pemimpin.", asmara: "Komunikasi terbuka akan memperkuat hubunganmu hari ini.", karir: "Peluang baru mulai terbuka, tetap fokus pada target utama." },
  taurus: { nama: "Taurus", rentang: "20 April - 20 Mei", elemen: "Tanah", sifat: "Sabar, setia, pekerja keras, dan menyukai kenyamanan.", asmara: "Beri perhatian lebih pada pasangan agar suasana makin harmonis.", karir: "Finansial stabil, hindari pengeluaran impulsif." },
  gemini: { nama: "Gemini", rentang: "21 Mei - 20 Juni", elemen: "Udara", sifat: "Cerdas, adaptif, komunikatif, dan penuh rasa ingin tahu.", asmara: "Hari yang menyenangkan untuk bertukar cerita dan ide baru.", karir: "Kreativitasmu sedang tinggi, manfaatkan untuk solusi pekerjaan." },
  cancer: { nama: "Cancer", rentang: "21 Juni - 22 Juli", elemen: "Air", sifat: "Penyayang, intuitif, protektif, dan memiliki empati tinggi.", asmara: "Kehangatan keluarga dan pasangan memberi ketenangan hati.", karir: "Percayai intuisimu dalam mengambil keputusan penting." },
  leo: { nama: "Leo", rentang: "23 Juli - 22 Agustus", elemen: "Api", sifat: "Percaya diri, karismatik, murah hati, dan berjiwa besar.", asmara: "Pesonamu sedang memancar, waktu yang tepat untuk mengutarakan rasa.", karir: "Kepemimpinanmu diakui oleh rekan dan atasan." },
  virgo: { nama: "Virgo", rentang: "23 Agustus - 22 September", elemen: "Tanah", sifat: "Teliti, analitis, praktis, dan menyukai keteraturan.", asmara: "Kurangi sikap overthinking, nikmati momen saat ini.", karir: "Detail kecil yang kamu perhatikan membawa hasil memuaskan." },
  libra: { nama: "Libra", rentang: "23 September - 22 Oktober", elemen: "Udara", sifat: "Adil, diplomatis, artistik, dan menyukai keseimbangan.", asmara: "Waktu yang tepat untuk menyelesaikan perbedaan pendapat.", karir: "Kerja sama tim berjalan lancar dan produktif." },
  scorpio: { nama: "Scorpio", rentang: "23 Oktober - 21 November", elemen: "Air", sifat: "Fokus, gigih, misterius, dan memiliki tekad kuat.", asmara: "Kejujuran adalah kunci keharmonisan hubunganmu.", karir: "Konsistensimu akan membuahkan hasil dalam waktu dekat." },
  sagittarius: { nama: "Sagittarius", rentang: "22 November - 21 Desember", elemen: "Api", sifat: "Optimis, jujur, suka kebebasan dan petualangan.", asmara: "Suasana santai dan tawa bersama membuat ikatan semakin erat.", karir: "Rencana perjalanan atau proyek luar kota terbuka lebar." },
  capricorn: { nama: "Capricorn", rentang: "22 Desember - 19 Januari", elemen: "Tanah", sifat: "Disiplin, bertanggung jawab, ambisius, dan realistis.", asmara: "Kesetiaan dan dukungan moril sangat dihargai pasangan.", karir: "Kerja kerasmu mulai memperlihatkan kemajuan signifikan." },
  aquarius: { nama: "Aquarius", rentang: "20 Januari - 18 Februari", elemen: "Udara", sifat: "Inovatif, mandiri, berjiwa kemanusiaan, dan orisinil.", asmara: "Berikan ruang bagi pasangan untuk berekspresi secara bebas.", karir: "Ide-ide baru yang out-of-the-box mendapatkan apresiasi." },
  pisces: { nama: "Pisces", rentang: "19 Februari - 20 Maret", elemen: "Air", sifat: "Imajinatif, penyayang, peka, dan artistik.", asmara: "Momen romantis menanti, tunjukkan kasih sayang dengan tulus.", karir: "Gunakan kepekaan rasa untuk menyelesaikan tantangan kerja." }
};

module.exports = [
  {
    name: "Kalender Masehi, Hijriah & Jawa (Weton)",
    desc: "Mengecek penanggalan lengkap 3 kalender: Masehi, Hijriah Islam, dan Pasaran Weton Jawa dengan perhitungan neptu akurat",
    category: "Information",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      tanggal: { type: "string", example: "2026-08-27" }
    },
    path: "/info/kalender",
    async run(req, res) {
      const { apikey, tanggal } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      try {
        const result = getKalenderLengkap(tanggal);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(400).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Zodiak & Horoskop Harian",
    desc: "Mendapatkan ramalan zodiak lengkap, peruntungan, asmara, karir, dan elemen",
    category: "Information",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      sign: { type: "string", example: "gemini" }
    },
    path: "/info/zodiak",
    async run(req, res) {
      const { apikey, sign } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const zodiakKey = (sign || "").toLowerCase().trim();
      if (!zodiakKey || !dataZodiak[zodiakKey]) {
        return res.status(400).json({
          status: false,
          creator: "PutzOfficial",
          message: "Zodiak tidak valid. Pilihan: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces."
        });
      }

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: dataZodiak[zodiakKey]
      });
    }
  },
  {
    name: "Info Cuaca Kota",
    desc: "Mengecek prakiraan cuaca, suhu (°C), kelembapan, dan kecepatan angin kota di Indonesia",
    category: "Information",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      kota: { type: "string", example: "surabaya" }
    },
    path: "/info/cuaca",
    async run(req, res) {
      const { apikey, kota } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      const queryKota = kota || "jakarta";

      try {
        const response = await axios.get(`https://wttr.in/${encodeURIComponent(queryKota)}?format=j1`, {
          timeout: 8000,
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        const current = response.data?.current_condition?.[0] || {};
        const nearest = response.data?.nearest_area?.[0] || {};

        res.json({
          status: true,
          creator: "PutzOfficial",
          result: {
            lokasi: nearest.areaName?.[0]?.value || queryKota,
            negara: nearest.country?.[0]?.value || "Indonesia",
            suhu: `${current.temp_C} °C`,
            terasaSeperti: `${current.FeelsLikeC} °C`,
            kondisi: current.weatherDesc?.[0]?.value || "Cerah",
            kelembapan: `${current.humidity}%`,
            kecepatanAngin: `${current.windspeedKmph} km/jam`,
            uvIndex: current.uvIndex
          }
        });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: "Gagal mengambil data cuaca." });
      }
    }
  }
];
