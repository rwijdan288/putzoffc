const axios = require("axios");

async function getJadwalSholat(kota) {
  const queryKota = kota || "jakarta";
  const searchRes = await axios.get(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(queryKota)}`, { timeout: 8000 });
  if (!searchRes.data || !searchRes.data.status || !searchRes.data.data || searchRes.data.data.length === 0) {
    throw new Error(`Kota '${queryKota}' tidak ditemukan. Coba nama kota lain seperti 'jakarta', 'surabaya', 'bandung'.`);
  }

  const kotaId = searchRes.data.data[0].id;
  const namaLokasi = searchRes.data.data[0].lokasi;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const jadwalRes = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/${kotaId}/${year}/${month}/${day}`, { timeout: 8000 });
  if (!jadwalRes.data || !jadwalRes.data.status) {
    throw new Error("Gagal mengambil data jadwal sholat.");
  }

  return {
    lokasi: namaLokasi,
    daerah: searchRes.data.data[0].lokasi,
    tanggal: jadwalRes.data.data.jadwal.tanggal,
    jadwal: {
      imsak: jadwalRes.data.data.jadwal.imsak,
      subuh: jadwalRes.data.data.jadwal.subuh,
      terbit: jadwalRes.data.data.jadwal.terbit,
      dhuha: jadwalRes.data.data.jadwal.dhuha,
      dzuhur: jadwalRes.data.data.jadwal.dzuhur,
      ashar: jadwalRes.data.data.jadwal.ashar,
      maghrib: jadwalRes.data.data.jadwal.maghrib,
      isya: jadwalRes.data.data.jadwal.isya
    }
  };
}

async function getQuranSurah(surahNo, ayatNo) {
  const surah = parseInt(surahNo) || 1;
  const res = await axios.get(`https://equran.id/api/v2/surat/${surah}`, { timeout: 8000 });
  if (!res.data || res.data.code !== 200) {
    throw new Error("Surah tidak ditemukan (1 - 114).");
  }

  const data = res.data.data;
  if (ayatNo) {
    const targetAyat = parseInt(ayatNo);
    const foundAyat = data.ayat.find(a => a.nomorAyat === targetAyat);
    if (!foundAyat) {
      throw new Error(`Ayat ${targetAyat} tidak ditemukan pada Surah ${data.namaLatin}.`);
    }
    return {
      surah: data.namaLatin,
      namaArab: data.nama,
      arti: data.arti,
      jumlahAyat: data.jumlahAyat,
      tempatTurun: data.tempatTurun,
      ayat: {
        nomorAyat: foundAyat.nomorAyat,
        teksArab: foundAyat.teksArab,
        teksLatin: foundAyat.teksLatin,
        teksIndonesia: foundAyat.teksIndonesia,
        audio: foundAyat.audio["05"] || foundAyat.audio["01"]
      }
    };
  }

  return {
    nomor: data.nomor,
    nama: data.nama,
    namaLatin: data.namaLatin,
    jumlahAyat: data.jumlahAyat,
    tempatTurun: data.tempatTurun,
    arti: data.arti,
    deskripsi: data.deskripsi,
    audioFull: data.audioFull["05"] || data.audioFull["01"],
    ayatSample: data.ayat.slice(0, 5).map(a => ({
      nomor: a.nomorAyat,
      arab: a.teksArab,
      latin: a.teksLatin,
      terjemahan: a.teksIndonesia
    }))
  };
}

const fallbackDoa = [
  { judul: "Doa Sebelum Tidur", arab: "بِاسْمِكَ اللّهُمَّ أَحْيَا وَأَمُوتُ", latin: "Bismikallahumma ahya wa amuut", terjemahan: "Dengan nama-Mu ya Allah, aku hidup dan aku mati." },
  { judul: "Doa Bangun Tidur", arab: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", latin: "Alhamdulillahil ladzi ahyana ba'da ma amatana wa ilaihin nusyur", terjemahan: "Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan kepada-Nya lah tempat kembali." },
  { judul: "Doa Sebelum Makan", arab: "اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ", latin: "Allahumma barik lana fima razaqtana waqina 'adzaban nar", terjemahan: "Ya Allah, berkahilah kami dalam rezeki yang telah Engkau berikan kepada kami dan peliharalah kami dari siksa api neraka." },
  { judul: "Doa Sesudah Makan", arab: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ", latin: "Alhamdulillahilladzi ath'amanaa wa saqoonaa wa ja'alanaa minal muslimiin", terjemahan: "Segala puji bagi Allah yang telah memberi makan dan minum kepada kami serta menjadikan kami termasuk orang-orang muslim." },
  { judul: "Doa Masuk Masjid", arab: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", latin: "Allahummaftah lii abwaaba rohmatik", terjemahan: "Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu." },
  { judul: "Doa Keluar Masjid", arab: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", latin: "Allahumma inni as-aluka min fadlik", terjemahan: "Ya Allah, sesungguhnya aku memohon keutamaan dari-Mu." },
  { judul: "Doa Kedua Orang Tua", arab: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا", latin: "Rabbighfir lii wa liwaalidayya warhamhumaa kamaa robbayaanii shoghiiroo", terjemahan: "Wahai Tuhanku, ampunilah aku dan kedua orang tuaku, dan sayangilah mereka berdua sebagaimana mereka telah mendidikku di waktu kecil." }
];

async function getDoaHarian(query) {
  try {
    const res = await axios.get("https://islamic-api-zhirrr.vercel.app/api/doaharian", { timeout: 4000 });
    const doaList = res.data?.data || fallbackDoa;
    if (query) {
      const q = query.toLowerCase();
      const filtered = doaList.filter(d => (d.judul || d.nama || d.title || "").toLowerCase().includes(q));
      return { total: filtered.length, doa: filtered.length > 0 ? filtered : doaList.slice(0, 5) };
    }
    return { doa: doaList };
  } catch (e) {
    if (query) {
      const q = query.toLowerCase();
      const filtered = fallbackDoa.filter(d => d.judul.toLowerCase().includes(q));
      return { total: filtered.length, doa: filtered.length > 0 ? filtered : fallbackDoa };
    }
    return { doa: fallbackDoa };
  }
}

module.exports = [
  {
    name: "Jadwal Sholat",
    desc: "Mendapatkan jadwal sholat harian akurat berdasarkan nama kota di Indonesia",
    category: "Islamic",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      kota: { type: "string", example: "jakarta" }
    },
    path: "/islamic/jadwal-sholat",
    async run(req, res) {
      const { apikey, kota } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      try {
        const result = await getJadwalSholat(kota);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Al-Quran & Audio",
    desc: "Mendapatkan teks ayat Al-Quran, latin, terjemahan Indonesia beserta audio murottal",
    category: "Islamic",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      surah: { type: "string", example: "1" },
      ayat: { type: "string", example: "1" }
    },
    path: "/islamic/quran",
    async run(req, res) {
      const { apikey, surah, ayat } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      if (!surah) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", message: "Parameter 'surah' wajib diisi (1 - 114)" });
      }

      try {
        const result = await getQuranSurah(surah, ayat);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  },
  {
    name: "Doa Harian",
    desc: "Mendapatkan daftar dan pencarian doa-doa harian lengkap beserta latin dan artinya",
    category: "Islamic",
    parameters: {
      apikey: { type: "string", example: "ptz" },
      query: { type: "string", example: "tidur" }
    },
    path: "/islamic/doa",
    async run(req, res) {
      const { apikey, query } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, creator: "PutzOfficial", message: "Apikey invalid" });
      }

      try {
        const result = await getDoaHarian(query);
        res.json({ status: true, creator: "PutzOfficial", result });
      } catch (err) {
        res.status(500).json({ status: false, creator: "PutzOfficial", message: err.message });
      }
    }
  }
];
