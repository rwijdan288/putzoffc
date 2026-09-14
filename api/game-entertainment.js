const axios = require("axios");

// Bank Data Game & Entertainment Terlengkap
const TEBAK_GAMBAR_BANK = [
  {
    img: "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar/1.jpg",
    jawaban: "TANTANGAN SERU",
    deskripsi: "Gambar orang menantang dan tanda seru"
  },
  {
    img: "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar/2.jpg",
    jawaban: "POTONGAN HARGA",
    deskripsi: "Gambar gunting memotong label harga"
  },
  {
    img: "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar/3.jpg",
    jawaban: "KURA KURA NINJA",
    deskripsi: "Gambar kura-kura memakai topeng ninja"
  },
  {
    img: "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar/4.jpg",
    jawaban: "MINUM OBAT",
    deskripsi: "Gambar orang minum pil kapsul"
  },
  {
    img: "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar/5.jpg",
    jawaban: "JAM TANGAN",
    deskripsi: "Gambar jam dan tangan"
  },
  {
    img: "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar/6.jpg",
    jawaban: "BUKU CERITA",
    deskripsi: "Gambar buku terbuka dengan tokoh dongeng"
  },
  {
    img: "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar/7.jpg",
    jawaban: "KAPAL TERBANG",
    deskripsi: "Gambar kapal pesiar punya sayap terbang"
  },
  {
    img: "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar/8.jpg",
    jawaban: "RUMAH TANGGA",
    deskripsi: "Gambar miniatur rumah di atas anak tangga"
  }
];

const TEBAK_KATA_BANK = [
  { soal: "Hewan mamalia berkantung asal Australia", acak: "K-U-A-G-N-U-R", jawaban: "KANGURU" },
  { soal: "Alat untuk mengukur suhu tubuh atau ruangan", acak: "T-E-M-O-R-E-T-R-M", jawaban: "TERMOMETER" },
  { soal: "Ibu kota negara Jepang", acak: "O-T-K-Y-O", jawaban: "TOKYO" },
  { soal: "Planet terbesar di tata surya kita", acak: "J-U-I-P-E-T-R", jawaban: "JUPITER" },
  { soal: "Proses pembuatan makanan pada tumbuhan hijau", acak: "F-O-T-O-S-I-N-T-E-S-I-S", jawaban: "FOTOSINTESIS" },
  { soal: "Kendaraan roda dua bertenaga kayuhan kaki", acak: "S-E-P-E-D-A", jawaban: "SEPEDA" }
];

const TEBAK_LIRIK_BANK = [
  { lirik: "Dan bila esok datang kembali, seperti sedia kala di mana kau bisa...", lagu: "Akad - Payung Teduh", jawaban: "BERLARI" },
  { lirik: "Ku menangis... membayangkan betapa kejamnya dirimu atas...", lagu: "Hati-Hati di Jalan - Tulus", jawaban: "DIRIKU" },
  { lirik: "Kemesraan ini janganlah cepat berlalu, kemesraan ini ingin ku...", lagu: "Kemesraan - Iwan Fals", jawaban: "KENANG SELALU" },
  { lirik: "Mungkin suatu saat nanti kau temukan bahagia meski tak...", lagu: "Komang - Raim Laode", jawaban: "BERSAMAKU" },
  { lirik: "Pelangi pelangi alangkah indahmu, merah kuning hijau di...", lagu: "Pelangi", jawaban: "LANGIT YANG BIRU" }
];

const TEBAK_KIMIA_BANK = [
  { lambang: "Au", nama: "Emas", nomor_atom: 79, golongan: "Logam Transisi" },
  { lambang: "Ag", nama: "Perak", nomor_atom: 47, golongan: "Logam Transisi" },
  { lambang: "Fe", nama: "Besi", nomor_atom: 26, golongan: "Logam Transisi" },
  { lambang: "O", nama: "Oksigen", nomor_atom: 8, golongan: "Non Logam" },
  { lambang: "H", nama: "Hidrogen", nomor_atom: 1, golongan: "Non Logam" },
  { lambang: "Na", nama: "Natrium", nomor_atom: 11, golongan: "Logam Alkali" },
  { lambang: "He", nama: "Helium", nomor_atom: 2, golongan: "Gas Mulia" }
];

const SUSUN_KATA_BANK = [
  { soal: "A P N D A I", clue: "Memiliki banyak ilmu pengetahuan / cerdas", jawaban: "PANDAI" },
  { soal: "B L A A J R", clue: "Kegiatan menuntut ilmu", jawaban: "BELAJAR" },
  { soal: "I N D O N E S I A", clue: "Negara kepulauan terbesar di Asia Tenggara", jawaban: "INDONESIA" },
  { soal: "K O M P U T E R", clue: "Perangkat elektronik untuk mengolah data", jawaban: "KOMPUTER" },
  { soal: "M A T A H A R I", clue: "Pusat tata surya yang memancarkan cahaya", jawaban: "MATAHARI" }
];

const ASAH_OTAK_BANK = [
  { soal: "Bila diinjak selalu menatap ke atas, bila dilepas selalu menatap ke bawah. Apakah itu?", jawaban: "Sandal / Sepatu" },
  { soal: "Semakin banyak diambil, semakin besar jadinya. Apakah itu?", jawaban: "Lubang" },
  { soal: "Punya banyak gigi tapi tidak bisa makan. Apakah itu?", jawaban: "Sisir" },
  { soal: "Punya leher tapi tidak punya kepala. Apakah itu?", jawaban: "Baju / Botol" },
  { soal: "Benda apa yang kalau dipotong malah bertambah panjang?", jawaban: "Kacang panjang" }
];

const SIAPAKAH_AKU_BANK = [
  { soal: "Aku selalu terbang tanpa sayap, menangis tanpa mata. Di manapun aku pergi, kegelapan selalu mengikutiku. Siapakah aku?", jawaban: "Awan Mendung" },
  { soal: "Aku mempunyai cabang, tetapi tidak mempunyai daun, batang, atau buah. Siapakah aku?", jawaban: "Bank" },
  { soal: "Aku bisa berjalan tanpa kaki dan berbicara tanpa lidah. Bila kau panggil namaku, aku akan menyahut. Siapakah aku?", jawaban: "Gema / Echo" },
  { soal: "Aku ada di awal malam dan di akhir zaman. Siapakah aku?", jawaban: "Huruf M" },
  { soal: "Aku selalu bertambah setiap tahun tapi tidak pernah berkurang. Siapakah aku?", jawaban: "Umur" }
];

const CAK_LONTONG_BANK = [
  { soal: "Banteng menyeruduk karena...", jawaban: "Punya tanduk", deskripsi: "Kalau punya sayap namanya burung merpati" },
  { soal: "Kambing berkaki...", jawaban: "Empat", deskripsi: "Kalau dua namanya ayam" },
  { soal: "Supaya bersih kita harus...", jawaban: "Mandi", deskripsi: "Masa nyapu badan sendiri" },
  { soal: "Matahari tenggelam di sebelah...", jawaban: "Gawat", deskripsi: "Kalau tenggelam di sebelah rumah kan gawat" },
  { soal: "Orang yang memimpin sebuah kapal laut disebut...", jawaban: "Kapten", deskripsi: "Kalau dipimpin dokter namanya pasien" }
];

const TRUTH_OR_DARE_BANK = {
  truth: [
    "Siapa orang yang diam-diam kamu sukai saat ini?",
    "Apa rahasia terbesar yang belum pernah kamu ceritakan ke siapapun?",
    "Hal memalukan apa yang pernah kamu lakukan di depan umum?",
    "Kapan terakhir kali kamu menangis dan karena apa?",
    "Pernahkah kamu stalking mantan pakai akun fake?",
    "Apa kebohongan terbesar yang pernah kamu ucapkan ke orang tua?"
  ],
  dare: [
    "Kirim voice note bernyanyi lagu anak-anak ke grup WhatsApp.",
    "Pasang foto profil paling konyol selama 1 jam.",
    "Chat seseorang di kontakmu dan bilang 'Aku baru sadar kamu mirip kartun Spongebob'.",
    "Kirim emoji acak ke kontak urutan ke-5 di WhatsApp.",
    "Buat status teks di WhatsApp bertuliskan 'Lagi pengen makan odading'."
  ]
};

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
    name: "Tebak Gambar",
    desc: "Kuis Tebak Gambar lengkap dengan URL gambar petunjuk dan kunci jawaban",
    category: "Game",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/game/tebakgambar",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = TEBAK_GAMBAR_BANK[Math.floor(Math.random() * TEBAK_GAMBAR_BANK.length)];
      res.json({ status: true, creator: "PutzOfficial", result: pick });
    }
  },
  {
    name: "Tebak Kata",
    desc: "Kuis tebak kata berdasarkan soal petunjuk dan huruf acak",
    category: "Game",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/game/tebakkata",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = TEBAK_KATA_BANK[Math.floor(Math.random() * TEBAK_KATA_BANK.length)];
      res.json({ status: true, creator: "PutzOfficial", result: pick });
    }
  },
  {
    name: "Tebak Lirik",
    desc: "Kuis melengkapi lirik lagu Indonesia populer",
    category: "Game",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/game/tebaklirik",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = TEBAK_LIRIK_BANK[Math.floor(Math.random() * TEBAK_LIRIK_BANK.length)];
      res.json({ status: true, creator: "PutzOfficial", result: pick });
    }
  },
  {
    name: "Tebak Unsur Kimia",
    desc: "Kuis edukasi sains mengenai tabel periodik dan simbol unsur kimia",
    category: "Game",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/game/tebakkimia",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = TEBAK_KIMIA_BANK[Math.floor(Math.random() * TEBAK_KIMIA_BANK.length)];
      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          soal: `Sebutkan nama dan nomor atom unsur dengan lambang '${pick.lambang}'!`,
          lambang: pick.lambang,
          jawaban: pick.nama,
          nomor_atom: pick.nomor_atom,
          golongan: pick.golongan
        }
      });
    }
  },
  {
    name: "Susun Kata",
    desc: "Game menyusun huruf-huruf acak menjadi sebuah kata yang bermakna",
    category: "Game",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/game/susunkata",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = SUSUN_KATA_BANK[Math.floor(Math.random() * SUSUN_KATA_BANK.length)];
      res.json({ status: true, creator: "PutzOfficial", result: pick });
    }
  },
  {
    name: "Asah Otak",
    desc: "Kuis teka-teki logika pengasah otak dan wawasan",
    category: "Game",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/game/asahotak",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = ASAH_OTAK_BANK[Math.floor(Math.random() * ASAH_OTAK_BANK.length)];
      res.json({ status: true, creator: "PutzOfficial", result: pick });
    }
  },
  {
    name: "Siapakah Aku",
    desc: "Kuis tebak objek/benda/konsep misterius dari sudut pandang orang pertama",
    category: "Game",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/game/siapakahaku",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = SIAPAKAH_AKU_BANK[Math.floor(Math.random() * SIAPAKAH_AKU_BANK.length)];
      res.json({ status: true, creator: "PutzOfficial", result: pick });
    }
  },
  {
    name: "Tebak Cak Lontong",
    desc: "Kuis tebak-tebakan humor ala Cak Lontong dengan alasan kocak",
    category: "Game",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true }
    },
    path: "/game/caklontong",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const pick = CAK_LONTONG_BANK[Math.floor(Math.random() * CAK_LONTONG_BANK.length)];
      res.json({ status: true, creator: "PutzOfficial", result: pick });
    }
  },
  {
    name: "Truth or Dare",
    desc: "Random generator tantangan atau kejujuran (Truth or Dare)",
    category: "Game",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      type: { type: "string", example: "truth", required: false }
    },
    path: "/game/truth-or-dare",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const queryType = (req.query?.type || req.body?.type || "all").toLowerCase();
      let mode = queryType;
      if (!["truth", "dare"].includes(queryType)) {
        mode = Math.random() > 0.5 ? "truth" : "dare";
      }
      const list = TRUTH_OR_DARE_BANK[mode];
      const text = list[Math.floor(Math.random() * list.length)];
      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          type: mode.toUpperCase(),
          text
        }
      });
    }
  },
  {
    name: "Game Suit",
    desc: "Bermain suit (Batu, Gunting, Kertas) melawan bot AI dengan hasil instan",
    category: "Game",
    parameters: {
      apikey: { type: "string", example: "ptz", required: true },
      pilihan: { type: "string", example: "batu", required: true }
    },
    path: "/game/suit",
    method: "ALL",
    run(req, res) {
      if (!authKey(req, res)) return;
      const userChoice = (req.query?.pilihan || req.body?.pilihan || "").toLowerCase().trim();
      const validChoices = ["batu", "gunting", "kertas"];
      if (!validChoices.includes(userChoice)) {
        return res.status(400).json({ status: false, creator: "PutzOfficial", error: "Pilihan harus salah satu dari: batu, gunting, atau kertas" });
      }

      const botChoice = validChoices[Math.floor(Math.random() * validChoices.length)];
      let hasil = "";
      if (userChoice === botChoice) {
        hasil = "Seri! Pilihan kita sama.";
      } else if (
        (userChoice === "batu" && botChoice === "gunting") ||
        (userChoice === "gunting" && botChoice === "kertas") ||
        (userChoice === "kertas" && botChoice === "batu")
      ) {
        hasil = "Selamat! Anda Menang 🎉";
      } else {
        hasil = "Yah, Bot Menang 🤖";
      }

      res.json({
        status: true,
        creator: "PutzOfficial",
        result: {
          player: userChoice,
          bot: botChoice,
          status: hasil
        }
      });
    }
  }
];
