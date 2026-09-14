const axios = require("axios");
const cheerio = require("cheerio");

class Primbon {
    constructor({base_url} = {}) {
        this.base_url = base_url || "https://primbon.com/";
    }

    async nomer_hoki(nomor) {
        return new Promise((resolve, reject) => {
            axios({
                url: this.base_url+'no_hoki_bagua_shuzi.php',
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                data: new URLSearchParams(Object.entries({ "nomer": nomor, "submit": " Submit! " }))
            }).then(({ data }) => {
                let $ = cheerio.load(data);
                let fetchText = $('#body').text().trim();
                let hasil;
                try {
                    hasil = {
                        status: true,
                        message: {
                            nomer_hp: fetchText.split('No. HP : ')[1].split('\n')[0],
                            angka_shuzi: fetchText.split('Angka Bagua Shuzi : ')[1].split('\n')[0],
                            energi_positif: {
                                kekayaan: fetchText.split('Kekayaan = ')[1].split('\n')[0],
                                kesehatan: fetchText.split('Kesehatan = ')[1].split('\n')[0],
                                cinta: fetchText.split('Cinta/Relasi = ')[1].split('\n')[0],
                                kestabilan: fetchText.split('Kestabilan = ')[1].split('\n')[0],
                                persentase: fetchText.split('%ENERGI NEGATIF')[0].split('% = ')[1]+'%'
                            },
                            energi_negatif: {
                                perselisihan: fetchText.split('Perselisihan = ')[1].split('\n')[0],
                                kehilangan: fetchText.split('Kehilangan = ')[1].split('\n')[0],
                                malapetaka: fetchText.split('Malapetaka = ')[1].split('\n')[0],
                                kehancuran: fetchText.split('Kehancuran = ')[1].split('\n')[0],
                                persentase: fetchText.split('Kehancuran = ')[1].split('= ')[1].split('\n')[0]
                            },
                            catatan: fetchText.split('* ')[1].split('Masukkan Nomor HP Anda')[0]
                        }
                    };
                } catch {
                    hasil = {
                        status: false,
                        message: 'ERROR! No. Handphone Tidak Valid!'
                    };
                }
                resolve(hasil);
            }).catch(reject);
        });
    }

    async tafsir_mimpi(value) {
        return new Promise((resolve, reject) => {
            axios.get('https://primbon.com/tafsir_mimpi.php?mimpi='+value+'&submit=+Submit+')
            .then(({ data }) => {
                let $ = cheerio.load(data);
                let fetchText = $('#body').text();
                let hasil;
                try {
                    hasil = {
                        status: true,
                        message: {
                            mimpi: value,
                            arti: fetchText.split(`Hasil pencarian untuk kata kunci: ${value}`)[1].split('\n')[0],
                            solusi: fetchText.split('Solusi -')[1].trim()
                        }
                    };
                } catch {
                    hasil = {
                        status: false,
                        message: `Tidak ditemukan tafsir mimpi "${value}" Cari dengan kata kunci yang lain.`
                    };
                }
                resolve(hasil);
            }).catch(reject);
        });
    }

    async ramalan_jodoh(nama1, tgl1, bln1, thn1, nama2, tgl2, bln2, thn2) {
        return new Promise((resolve, reject) => {
            axios({
                url: this.base_url+'ramalan_jodoh.php',
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                data: new URLSearchParams(Object.entries({ "nama1": nama1, "tgl1": tgl1, "bln1": bln1, "thn1": thn1, "nama2": nama2, "tgl2": tgl2, "bln2": bln2, "thn2": thn2, "submit": "  RAMALAN JODOH »  " }))
            }).then(({ data }) => {
                let $ = cheerio.load(data);
                let fetchText = $('#body').text();
                let hasil;
                try {
                    hasil = {
                        status: true,
                        message: {
                            nama_anda: {
                                nama: nama1,
                                tgl_lahir: fetchText.split('Tgl. Lahir: ')[1].split(nama2)[0]
                            },
                            nama_pasangan: {
                                nama: nama2,
                                tgl_lahir: fetchText.split(nama2)[1].split('Tgl. Lahir: ')[1].split('Dibawah')[0]
                            },
                            result: fetchText.split('begitu pula sebaliknya.')[1].split('Konsultasi Hari Baik Akad Nikah >>>')[0].trim(),
                            catatan: 'Untuk melihat kecocokan jodoh dengan pasangan.'
                        }
                    };
                } catch {
                    hasil = {
                        status: false,
                        message: 'Error, Mungkin Input Yang Anda Masukkan Salah'
                    };
                }
                resolve(hasil);
            }).catch(reject);
        });
    }

    async arti_nama(value) {
        return new Promise((resolve, reject) => {
            axios.get('https://primbon.com/arti_nama.php?nama1='+value+'&proses=+Submit%21+')
            .then(({ data }) => {
                let $ = cheerio.load(data);
                let fetchText = $('#body').text();
                let hasil;
                try {
                    hasil = {
                        status: true,
                        message: {
                            nama: value,
                            arti: fetchText.split('memiliki arti: ')[1].split('Nama:')[0].trim()
                        }
                    };
                } catch {
                    hasil = {
                        status: false,
                        message: `Tidak ditemukan arti nama "${value}"`
                    };
                }
                resolve(hasil);
            }).catch(reject);
        });
    }

    async zodiak(zodiak) {
        return new Promise((resolve, reject) => {
            axios.get(`https://primbon.com/zodiak/${zodiak}.htm`)
            .then(({ data }) => {
                let $ = cheerio.load(data);
                let fetchText = $('#body').text();
                let hasil;
                try {
                    hasil = {
                        status: true,
                        message: {
                            zodiak: fetchText.split('Nomor Keberuntungan:')[0].trim(),
                            nomor_keberuntungan: fetchText.split('Nomor Keberuntungan: ')[1].split('\n')[0]
                        }
                    };
                } catch {
                    hasil = {
                        status: false,
                        message: 'Error mengambil ramalan zodiak'
                    };
                }
                resolve(hasil);
            }).catch(reject);
        });
    }

    async shio(shio) {
        return new Promise((resolve, reject) => {
            axios.get(`https://primbon.com/shio/${shio}.htm`)
            .then(({ data }) => {
                let $ = cheerio.load(data);
                let fetchText = $('#body').text();
                let hasil;
                try {
                    hasil = {
                        status: true,
                        message: fetchText.split('<<< Kembali')[0].trim()
                    };
                } catch {
                    hasil = {
                        status: false,
                        message: 'Error mengambil ramalan shio'
                    };
                }
                resolve(hasil);
            }).catch(reject);
        });
    }
}

const primbon = new Primbon();

function cekApikey(apikey, res) {
    if (!apikey || !global.apikey.includes(apikey)) {
        res.json({ status: false, error: "Invalid API key" });
        return false;
    }
    return true;
}

module.exports = [
    {
        name: "Arti Nama",
        desc: "Mengetahui arti dan makna nama berdasarkan Primbon",
        category: "Primbon",
        parameters: {
          apikey: { type: "string", example: "skyy" },
          nama: { type: "string", example: "Budi" }
        },
        path: "/primbon/artinama",
        async run(req, res) {
            const { apikey, nama } = req.query;
            if (!cekApikey(apikey, res)) return;
            if (!nama) return res.json({ status: false, error: "Nama wajib diisi" });

            try {
                const result = await primbon.arti_nama(nama);
                res.json(result);
            } catch (error) {
                res.json({ status: false, error: error.message });
            }
        },
    },
    {
        name: "Tafsir Mimpi",
        desc: "Menafsirkan arti mimpi berdasarkan kata kunci",
        category: "Primbon",
        parameters: {
          apikey: { type: "string", example: "skyy" },
          mimpi: { type: "string", example: "ular" }
        },
        path: "/primbon/tafsirmimpi",
        async run(req, res) {
            const { apikey, mimpi } = req.query;
            if (!cekApikey(apikey, res)) return;
            if (!mimpi) return res.json({ status: false, error: "Kata kunci mimpi wajib diisi" });

            try {
                const result = await primbon.tafsir_mimpi(mimpi);
                res.json(result);
            } catch (error) {
                res.json({ status: false, error: error.message });
            }
        },
    },
    {
        name: "Nomor Hoki",
        desc: "Mengetahui keberuntungan berdasarkan nomor HP",
        category: "Primbon",
        parameters: {
          apikey: { type: "string", example: "skyy" },
          nomor: { type: "string", example: "08123456789" }
        },
        path: "/primbon/nomerhoki",
        async run(req, res) {
            const { apikey, nomor } = req.query;
            if (!cekApikey(apikey, res)) return;
            if (!nomor) return res.json({ status: false, error: "Nomor HP wajib diisi" });

            try {
                const result = await primbon.nomer_hoki(nomor);
                res.json(result);
            } catch (error) {
                res.json({ status: false, error: error.message });
            }
        },
    },
    {
        name: "Zodiak",
        desc: "Ramalan karakteristik zodiak",
        category: "Primbon",
        parameters: {
          apikey: { type: "string", example: "skyy" },
          zodiak: { type: "string", example: "aries" }
        },
        path: "/primbon/zodiak",
        async run(req, res) {
            const { apikey, zodiak } = req.query;
            if (!cekApikey(apikey, res)) return;
            if (!zodiak) return res.json({ status: false, error: "Nama zodiak wajib diisi" });

            try {
                const result = await primbon.zodiak(zodiak);
                res.json(result);
            } catch (error) {
                res.json({ status: false, error: error.message });
            }
        },
    },
    {
        name: "Shio",
        desc: "Ramalan karakteristik shio",
        category: "Primbon",
        parameters: {
          apikey: { type: "string", example: "skyy" },
          shio: { type: "string", example: "naga" }
        },
        path: "/primbon/shio",
        async run(req, res) {
            const { apikey, shio } = req.query;
            if (!cekApikey(apikey, res)) return;
            if (!shio) return res.json({ status: false, error: "Nama shio wajib diisi" });

            try {
                const result = await primbon.shio(shio);
                res.json(result);
            } catch (error) {
                res.json({ status: false, error: error.message });
            }
        },
    }
];
