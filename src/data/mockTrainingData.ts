import { TrainingChapter, OnboardingTask } from '../types/hr';

export interface TrainingTrack {
  id: 'retail' | 'cs' | 'admin' | 'corporate';
  title: string;
  shortDesc: string;
  iconName: string;
  colorClass: string;
  accentBg: string;
  targetRole: string;
}

export const TRAINING_TRACKS: TrainingTrack[] = [
  {
    id: 'retail',
    title: 'Retail & Operasi Kedai',
    shortDesc: 'Panduan juruwang, susunan rak buku, pengurusan stok, dan penutupan harian (closing).',
    iconName: 'ShoppingBag',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    targetRole: 'Pembantu Kedai, Juruwang, Eksekutif Retail'
  },
  {
    id: 'cs',
    title: 'Customer Service (CS)',
    shortDesc: 'SOP komunikasi sopan WhatsApp/emel, pengendalian pertanyaan stok, dan aduan pelanggan.',
    iconName: 'Headphones',
    colorClass: 'text-sky-600 dark:text-sky-400',
    accentBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
    targetRole: 'Pegawai CS, Helpdesk, Perhubungan Pelanggan'
  },
  {
    id: 'admin',
    title: 'Admin Pejabat & Pengurusan',
    shortDesc: 'Pengurusan surat menyurat, fail dokumen, log kurier pos, bilik mesyuarat, dan petty cash.',
    iconName: 'Building2',
    colorClass: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    targetRole: 'Pegawai Pentadbiran, Pembantu Operasi Pejabat'
  },
  {
    id: 'corporate',
    title: 'Budaya & Akta Kerja 1955',
    shortDesc: 'Visi Pustaka Union & Solusi Serumpun, polisi jam kerja/shift, cuti, KWSP, SOCSO, dan EIS.',
    iconName: 'ShieldCheck',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    accentBg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
    targetRole: 'Semua Calon & Karyawan Baru (Wajib)'
  }
];

export const INITIAL_TRAINING_MODULES: TrainingChapter[] = [
  // ==========================================
  // TRACK 1: RETAIL & OPERASI KEDAI BUKU
  // ==========================================
  {
    id: 'mod-retail-01',
    chapterNumber: 1,
    title: 'Pengenalan Operasi Kedai & Klasifikasi Rak Buku',
    estimatedMinutes: 20,
    category: 'Retail & Kasir',
    track: 'retail',
    summary: 'Memahami susunan ruang pameran kedai buku Pustaka Union, kategori buku mengikut ISBN, dan panduan visual merchandising.',
    sections: [
      {
        heading: '1. Pengkategorian Zon & Rak Buku',
        content: [
          'Kedai buku Pustaka Union dibahagikan kepada 4 zon utama: Zon Sekolah & Rujukan Peperiksaan (SPM/STPM), Zon Sastera & Penerbitan Melayu Klasik, Zon Kanak-kanak & Keibubapaan, dan Zon Buku Baharu / Best Seller.',
          'Setiap buku mesti disusun mengikut turutan abjad pengarang atau subjek agar mudah dicari oleh pembantu jualan dalam tempoh kurang 60 saat.'
        ],
        keyPoints: [
          'Buku "Best Seller" diletakkan pada paras mata (eye-level: 120cm - 160cm dari lantai).',
          'Setiap rak wajib dipasang tanda harga dan kod kategori yang jelas.',
          'Periksa fizikal buku: elakkan meletakkan naskhah berhabuk atau berlipat kulit di barisan hadapan.'
        ],
        sopPoints: [
          'Lakukan "Face-Out" untuk 3 tajuk paling popular di setiap rak utama.',
          'Pastikan lorong pejalan kaki sentiasa bersih daripada kotak stok sekurang-kurangnya 1.2 meter kelebaran.'
        ]
      },
      {
        heading: '2. Cara Membaca Kod ISBN & Barcode',
        content: [
          'ISBN (International Standard Book Number) terdiri daripada 13 digit unik bermula dengan 978 atau 979.',
          'Barcode diimbas menggunakan pengimbas laser sistem POS untuk menarik tajuk, edisi cetakan, dan harga runcit rasmi.'
        ],
        keyPoints: [
          'Jika kod barcode rosak, masukkan 13 angka ISBN secara manual pada papan kekunci POS.',
          'Jangan menampal pelekat harga di atas nombor ISBN atau barcode asal buku.'
        ]
      }
    ],
    quizQuestions: [
      {
        id: 'q-ret-01',
        question: 'Pada paras ketinggian berapakah buku "Best Seller" paling efektif diletakkan di rak kedai?',
        options: [
          'Paras lantai (bawah 50 cm)',
          'Paras mata pelanggan (120 cm - 160 cm)',
          'Paras siling (atas 220 cm)',
          'Di dalam stor tertutup'
        ],
        correctIndex: 1,
        explanation: 'Paras mata (eye-level) 120cm - 160cm adalah ruang pameran premium yang paling mudah dilihat dan dicapai oleh pelanggan.'
      },
      {
        id: 'q-ret-02',
        question: 'Apakah tindakan segera jika barcode pada kulit belakang buku tidak dapat diimbas oleh laser POS?',
        options: [
          'Menolak jualan kepada pelanggan',
          'Menebak harga sesuka hati',
          'Menaip nombor 13 digit ISBN secara manual pada sistem POS',
          'Menyuruh pelanggan mencari kedai lain'
        ],
        correctIndex: 2,
        explanation: 'Nombor 13 digit ISBN adalah nombor induk buku yang tersimpan di dalam pangkalan data sistem POS.'
      }
    ]
  },
  {
    id: 'mod-retail-02',
    chapterNumber: 2,
    title: 'SOP Sistem Kaunter Kasir & Pembayaran POS',
    estimatedMinutes: 25,
    category: 'Retail & Kasir',
    track: 'retail',
    summary: 'Standard operasi transaksi bayaran tunai, kad debit/kredit, QR DuitNow, diskaun keahlian, dan pengeluaran resit rasmi.',
    sections: [
      {
        heading: '1. Standard Layanan di Kaunter Kasir',
        content: [
          'Juruwang mewakili imej profesional syarikat. Setiap pelanggan yang tiba di kaunter mesti disambut dengan senyuman mesra dan ucapan selamat datang.',
          'Tanya pelanggan sama ada mereka mempunyai Kad Keahlian Rakan Union (Union Member Card) untuk diskaun 10%.'
        ],
        keyPoints: [
          'Senyum, beri salam: "Selamat datang ke Pustaka Union! Boleh saya imbas kad ahli tuan/puan?"',
          'Sebut jumlah harga dengan jelas sebelum menerima bayaran: "Jumlahnya RM 48.50, puan."'
        ],
        sopPoints: [
          'Untuk pembayaran Tunai: Sebut jumlah wang yang diterima ("Saya terima wang tunai RM 50.00")',
          'Kira wang baki di hadapan pelanggan sebelum menyerahkannya bersama resit pembelian.',
          'Tawarkan beg kertas mesra alam atau beg kain kitar semula Union.'
        ]
      },
      {
        heading: '2. Pengendalian Kaedah Pembayaran Digital',
        content: [
          'Pustaka Union menyokong Terminal Kad EDC (MyDebit, Visa, Mastercard) serta Paparan Kod QR DuitNow / Touch n Go eWallet.',
          'Pastikan resit transaksi kad slip bank dicetak dan disematkan bersama resit POS kedai sebelum pelanggan meninggalkan kaunter.'
        ],
        keyPoints: [
          'Untuk pembayaran QR: Sentiasa tunggu pengesahan "Berjaya / Paid" pada skrin terminal atau peranti juruwang.',
          'Jangan sesekali melepaskan barangan hanya berdasarkan tangkapan skrin telefon pelanggan yang belum disahkan sistem.'
        ]
      }
    ],
    quizQuestions: [
      {
        id: 'q-ret-03',
        question: 'Mengapakah juruwang perlu mengulang sebut nilai wang tunai yang diterima daripada pelanggan?',
        options: [
          'Untuk menghiburkan juruwang',
          'Mengelakkan salah faham dan pertikaian baki wang dengan pelanggan',
          'Kerana ia arahan bank negara',
          'Supaya kedengaran kuat di kedai'
        ],
        correctIndex: 1,
        explanation: 'Menyebut nilai tunai yang diterima (cth. "Saya terima RM 100") mengelakkan kekeliruan jika pelanggan tersilap menyangka mereka membayar jumlah lain.'
      }
    ]
  },
  {
    id: 'mod-retail-03',
    chapterNumber: 3,
    title: 'Penutupan Harian Kedai & Imbangan Tunai (Z-Report)',
    estimatedMinutes: 25,
    category: 'Retail & Kasir',
    track: 'retail',
    summary: 'Prosedur penutupan kaunter jualan (Closing Shift), pengiraan wang tunai laci (float), penjanaan laporan Z-Report, dan keselamatan peti besi.',
    sections: [
      {
        heading: '1. Prosedur Penutupan Akhir Hari (End of Day)',
        content: [
          'Penutupan kedai dilakukan tepat 15 minit selepas pintu kedai ditutup kepada orang awam.',
          'Juruwang bertugas bersama Penyelia Kedai (Supervisor) mesti mengira jumlah fizikal wang tunai, slip kad kredit, dan baucar diskaun secara bersama.'
        ],
        keyPoints: [
          'Asingkan wang apungan permulaan (Floating cash: RM 300.00) ke dalam beg keselamatan khusus.',
          'Baki wang jualan hari tersebut mesti sepadan tepat (0.00 selisih) dengan jumlah Z-Report POS.'
        ],
        sopPoints: [
          'Cetak 2 salinan Z-Report: 1 salinan diserahkan kepada Jabatan Akaun bersama wang jualan, 1 salinan difailkan dalam buku rekod kedai.',
          'Semua wang tunai lebihan mesti dimasukkan ke dalam peti besi berkunci (Safe Box) dengan kod keselamatan berkembar.'
        ]
      }
    ],
    quizQuestions: [
      {
        id: 'q-ret-04',
        question: 'Apakah yang perlu dilakukan dengan wang apungan (floating cash RM 300) semasa penutupan jualan harian?',
        options: [
          'Dicampur sekali ke dalam keuntungan akaun syarikat',
          'Diasingkan untuk kegunaan apungan baki juruwang hari esok',
          'Dibahagikan sesama pekerja',
          'Dibiarkan di atas meja kaunter'
        ],
        correctIndex: 1,
        explanation: 'Wang apungan permulaan (floating cash) wajib diasingkan supaya laci kasir esok pagi mempunyai wang pecah untuk urusan pelanggan.'
      }
    ]
  },

  // ==========================================
  // TRACK 2: CUSTOMER SERVICE (CS) & HELPDESK
  // ==========================================
  {
    id: 'mod-cs-01',
    chapterNumber: 1,
    title: 'Etika Komunikasi & Standard Greeting Rasmi',
    estimatedMinutes: 20,
    category: 'Customer Service',
    track: 'cs',
    summary: 'Standard komunikasi profesional khidmat pelanggan Pustaka Union melalui WhatsApp Rasmi, panggilan telefon, dan tiket emel.',
    sections: [
      {
        heading: '1. Standard Salam Pembuka Melalui WhatsApp & Emel',
        content: [
          'Setiap perbualan WhatsApp perniagaan mesti dimulakan dengan format salam rasmi Pustaka Union dalam masa kurang daripada 5 minit dari mesej diterima.',
          'Gunakan panggilan hormat yang sopan (Tuan/Puan/Cik) dan elakkan bahasa slanga atau singkatan SMS.'
        ],
        keyPoints: [
          'Format WhatsApp: "Salam sejahtera Tuan/Puan, terima kasih kerana menghubungi Pustaka Union & Solusi Serumpun. Nama saya [Nama Anda]. Bagaimana boleh saya bantu hari ini?"',
          'Jangan gunakan perkataan: "k", "tq", "xde", "jap", atau emotikon berlebihan.'
        ],
        sopPoints: [
          'Kenal pasti keperluan pelanggan terlebih dahulu dengan mendengar secara aktif tanpa memotong perbualan.',
          'Ulang kembali intipati permintaan pelanggan untuk memastikan kefahaman yang tepat sebelum memberi jawapan.'
        ]
      },
      {
        heading: '2. Cara Pengendalian Panggilan Telefon Masuk',
        content: [
          'Jawab panggilan sebelum deringan ketiga berbunyi dengan nada suara ceria, tenang, dan jelas.',
          'Jika perlu meletakkan pemanggil pada mod "Hold", minta izin terlebih dahulu dan jangan biarkan mereka menunggu lebih daripada 60 saat tanpa maklum balas.'
        ],
        keyPoints: [
          'Contoh Hold: "Bolehkah saya semak stok tajuk ini sebentar Tuan? Saya mohon letakkan talian sebentar ya."',
          'Sentiasa ucapkan terima kasih sebelum mematikan talian dan biarkan pelanggan meletakkan gagang terlebih dahulu.'
        ]
      }
    ],
    quizQuestions: [
      {
        id: 'q-cs-01',
        question: 'Berapakah had masa maksimum tindak balas (SLA) untuk mesej pertanyaan pelanggan di WhatsApp?',
        options: [
          'Kurang daripada 5 minit pada waktu operasi',
          '24 jam kemudian',
          'Hanya pada hujung minggu',
          'Bila-bila masa pekerja berkelapangan'
        ],
        correctIndex: 0,
        explanation: 'Standard SLA khidmat pelanggan Union adalah tindak balas pantas dalam 5 minit untuk memastikan kepuasan pelanggan.'
      }
    ]
  },
  {
    id: 'mod-cs-02',
    chapterNumber: 2,
    title: 'Penanganan Aduan & Polisi Ganti Rugi Buku Rosak',
    estimatedMinutes: 25,
    category: 'Customer Service',
    track: 'cs',
    summary: 'Langkah demi langkah menguruskan aduan buku koyak/salah cetak, kelewatan kurier, dan polisi penggantian tanpa pertikaian (No-Hassle Exchange).',
    sections: [
      {
        heading: '1. Prinsip HEAT dalam Pengendalian Aduan',
        content: [
          'H - Hear (Dengar aduan pelanggan dengan penuh empati tanpa menyangkal)',
          'E - Empathize (Nyatakan permohonan maaf atas kesulitan yang dialami)',
          'A - Apologize & Act (Ambil tindakan pembetulan segera mengikut polisi syarikat)',
          'T - Thank & Follow Up (Ucap terima kasih atas maklum balas dan pantau penyelesaian sehingga selesai)'
        ],
        keyPoints: [
          'Polisi Syarikat: Buku dengan halaman kosong / terbalik cetakan layak ditukar ganti 1-ke-1 dalam masa 14 hari berserta resit atau bukti pesanan.',
          'Kos pos pemulangan bagi kecacatan kilang ditanggung sepenuhnya oleh syarikat.'
        ],
        sopPoints: [
          'Minta foto jelas bahagian buku yang cacat bersama gambar resit pembelian.',
          'Daftarkan tiket aduan ke dalam sistem CS Portal dalam kategori "Aduan Kerosakan / Salah Cetak".'
        ]
      }
    ],
    quizQuestions: [
      {
        id: 'q-cs-02',
        question: 'Apakah tindakan pertama yang wajib diambil apabila menerima pelanggan yang marah kerana buku koyak?',
        options: [
          'Menyalahkan syarikat kurier penghantaran serta merta',
          'Mendengar dengan tenang, memohon maaf atas kesulitan, dan meminta bukti foto kerosakan',
          'Menyekat (block) nombor pelanggan tersebut',
          'Menyuruh pelanggan mencetak sendiri halaman yang hilang'
        ],
        correctIndex: 1,
        explanation: 'Menggunakan kaedah HEAT: Mendengar dan memohon maaf secara profesional mententeramkan pelanggan sebelum proses penggantian dilaksanakan.'
      }
    ]
  },

  // ==========================================
  // TRACK 3: PENTADBIRAN & GENERAL ADMIN
  // ==========================================
  {
    id: 'mod-adm-01',
    chapterNumber: 1,
    title: 'Pengurusan Dokumen, Surat Rasmi & Pengfailan Syarikat',
    estimatedMinutes: 20,
    category: 'Admin Pejabat',
    track: 'admin',
    summary: 'Format nombor rujukan fail rasmi Pustaka Union & Solusi Serumpun, pengarkiban kontrak, dan kerahsiaan dokumen syarikat.',
    sections: [
      {
        heading: '1. Struktur Nombor Rujukan Memo & Surat',
        content: [
          'Setiap surat rasmi keluar mesti menggunakan format rujukan standard:',
          '[KOD_SYARIKAT] / [JABATAN] / [BULAN-TAHUN] / [NOMBOR_SIRI]',
          'Contoh: PU/HR/05-25/088 (Pustaka Union, Jabatan HR, Mei 2025, Siri ke-88).'
        ],
        keyPoints: [
          'PU = Pustaka Union | SSS = Solusi Serumpun Senusantara SDN. BHD.',
          'Surat tanpa nombor rujukan tidak sah untuk penguatkuasaan rasmi kontrak pembekal atau pekerja.'
        ],
        sopPoints: [
          'Simpan 1 salinan fizikal berkulit keras di bilik fail berkunci (Archive Room).',
          'Muat naik salinan PDF ke sistem HR Portal di bahagian Dokumen Pekerja / Kontrak.'
        ]
      }
    ],
    quizQuestions: [
      {
        id: 'q-adm-01',
        question: 'Apakah kod rujukan surat keluar rasmi bagi Pustaka Union bahagian Sumber Manusia?',
        options: [
          'PU/HR/...',
          'TEST/123/...',
          'SURAT-BEBAS/...',
          'ABC/XYZ/...'
        ],
        correctIndex: 0,
        explanation: 'Format standard syarikat bermula dengan akronim rasmi "PU/HR/..." mengikut jabatan dan syarikat berkenaan.'
      }
    ]
  },
  {
    id: 'mod-adm-02',
    chapterNumber: 2,
    title: 'SOP Log Kurier Pos, Tempahan Fasiliti & Petty Cash',
    estimatedMinutes: 25,
    category: 'Admin Pejabat',
    track: 'admin',
    summary: 'Pengendalian log parcel masuk/keluar PosLaju/J&T, jadual bilik mesyuarat, dan borang perbelanjaan tunai runcit.',
    sections: [
      {
        heading: '1. Log Masuk & Keluar Bungkusan Kurier',
        content: [
          'Semua bungkusan dan surat berdaftar yang sampai ke kaunter penyambut tetamu mesti direkodkan dalam Buku Log Kurier Harian.',
          'Catatkan: Tarikh/Masa, Nama Penghantar, Syarikat Kurier, Nombor Tracking, dan Nama Penerima Staf.'
        ],
        keyPoints: [
          'Hantar notifikasi mesej pantas kepada penerima sebaik sahaja barang didaftarkan.',
          'Penerima wajib menurunkan tandatangan penerimaan sebelum mengambil barang.'
        ],
        sopPoints: [
          'Bagi bungkusan "PENTING / SULIT": serahkan terus ke tangan pengurus berkenaan tanpa membuka pembungkus luaran.'
        ]
      },
      {
        heading: '2. Peraturan Petty Cash (Tunai Runcit)',
        content: [
          'Tunai runcit hanya dibenarkan untuk perbelanjaan mendesak pejabat di bawah RM 100.00 (cth: beli pos ekspres, bateri jam pejabat, makanan mesyuarat ad-hoc).',
          'Setiap pengeluaran mesti disertakan resit cukai asal (Tax Invoice) dan ditandatangani oleh pemohon dan diluluskan HR/Kewangan.'
        ],
        keyPoints: [
          'Tiada resit = Tiada bayaran balik (No claims without official receipt).',
          'Baki fizikal tunai runcit diimbangi setiap hari Jumaat jam 4:30 petang.'
        ]
      }
    ],
    quizQuestions: [
      {
        id: 'q-adm-02',
        question: 'Apakah syarat utama untuk membuat tuntutan perbelanjaan tunai runcit (petty cash)?',
        options: [
          'Cukup sekadar memberitahu secara lisan',
          'Menyertakan resit cukai rasmi asal (Tax Invoice) bersama borang kelulusan',
          'Menulis atas sekeping kertas kosong',
          'Menuntut tanpa had masa'
        ],
        correctIndex: 1,
        explanation: 'Setiap tuntutan kewangan memerlukan resit rasmi yang sah bagi tujuan audit dalaman dan pematuhan LHDN.'
      }
    ]
  },

  // ==========================================
  // TRACK 4: BUDAYA SYARIKAT & AKTA KERJA 1955
  // ==========================================
  {
    id: 'mod-corp-01',
    chapterNumber: 1,
    title: 'Pengenalan Kumpulan Syarikat, Visi & Nilai Teras',
    estimatedMinutes: 20,
    category: 'Pengenalan & Budaya',
    track: 'corporate',
    summary: 'Mengenali sejarah Pustaka Union (ditubuhkan 1994) dan Solusi Serumpun Senusantara SDN. BHD, komitmen ilmu, dan integriti kerja.',
    sections: [
      {
        heading: '1. Dua Entiti, Satu Matlamat Unggul',
        content: [
          'Pustaka Union merupakan perintis penerbitan dan pengedaran buku berkualiti di Malaysia sejak lebih tiga dekad, menghubungkan pembaca dengan khazanah ilmu sastera, pendidikan, dan buku teks rasmi.',
          'Solusi Serumpun Senusantara SDN. BHD merupakan sayap teknologi dan pengurusan digital yang memacu transformasi operasi moden merentas sempadan serantau Malaysia dan Indonesia.'
        ],
        keyPoints: [
          'Nilai Teras: Integriti, Ketepatan Masa, Layanan Mesra Pelanggan, dan Kualiti Buku Berkekalan.',
          'Komitmen kita adalah memastikan setiap pesanan pembaca sampai dengan pantas dan selamat.'
        ]
      }
    ],
    quizQuestions: [
      {
        id: 'q-corp-01',
        question: 'Apakah dua entiti syarikat utama di bawah portal pengurusan HRPro ini?',
        options: [
          'Pustaka Union & Solusi Serumpun Senusantara SDN. BHD',
          'Kolej Komuniti & Universiti Awam',
          'Kedai Runcit ABC & Kedai Buku DEF',
          'Syarikat Percetakan Asing'
        ],
        correctIndex: 0,
        explanation: 'Kedua-dua entiti bekerjasama erat sebagai pengedar buku fizikal dan penyedia operasi digital serumpun.'
      }
    ]
  },
  {
    id: 'mod-corp-02',
    chapterNumber: 2,
    title: 'Polisi Waktu Bekerja, Shift & Pematuhan Akta Kerja 1955',
    estimatedMinutes: 25,
    category: 'Akta Kerja & Polisi',
    track: 'corporate',
    summary: 'Kefahaman mendalam had waktu bekerja maksimum 45 jam seminggu, had toleransi masuk, caruman KWSP 11%, SOCSO, dan faedah statutori.',
    sections: [
      {
        heading: '1. Waktu Kerja & Toleransi Shift Masuk',
        content: [
          'Di bawah pindaan Akta Kerja 1955 (Pindaan 2022), waktu bekerja biasa tidak melebihi 45 jam seminggu.',
          'Pustaka Union menetapkan sistem shift diselaraskan mengikut jabatan: Shift Penuh (09:00 - 18:00, 8 jam kerja + 1 jam rehat), Shift Pagi (09:00 - 12:00, 3 jam), dan Shift Siang (12:00 - 16:00, 4 jam).'
        ],
        keyPoints: [
          'Had Toleransi: Karyawan diberi toleransi 10–15 minit untuk check-in. Check-in melebihi had akan dikira LEWAT dan dicatat dalam minit keterlambatan (late_minutes).',
          'Jam Lebih Masa (Overtime): Dibayar pada kadar 1.5x upah sejam pada hari bekerja biasa.'
        ],
        sopPoints: [
          'Karyawan mesti mengklik butang "Check In" dan "Check Out" secara sedar di Dashboard pada setiap hari bertugas.',
          'Jika tidak dapat hadir bertugas akibat sakit, maklumkan penyelia sebelum jam 9:00 pagi dan serahkan Sijil Cuti Sakit (MC) rasmi dalam tempoh 48 jam.'
        ]
      },
      {
        heading: '2. Caruman Statutori Wajib Malaysia',
        content: [
          'Kumpulan Wang Simpanan Pekerja (KWSP): Potongan 11% daripada gaji pekerja, ditambah 12% atau 13% caruman oleh majikan.',
          'PERKESO / SOCSO (Skim Bencana Pekerjaan): Perlindungan keselamatan semasa bekerja dan perjalanan ulang-alik ke tempat kerja.',
          'Sistem Insurans Pekerjaan (EIS): Perlindungan sokongan kewangan dan pencarian kerja.'
        ],
        keyPoints: [
          'Pekerja kontrak luar negara yang berkhidmat secara remote diberi pengecualian statutori mengikut undang-undang percukaian tempatan mereka.'
        ]
      }
    ],
    quizQuestions: [
      {
        id: 'q-corp-02',
        question: 'Berapakah had maksimum jam bekerja biasa seminggu mengikut Akta Kerja 1955 (Pindaan 2022)?',
        options: [
          '60 jam seminggu',
          '45 jam seminggu',
          '30 jam seminggu',
          'Tiada had masa'
        ],
        correctIndex: 1,
        explanation: 'Pindaan Akta Kerja 1955 mengurangkan had jam bekerja maksimum daripada 48 jam kepada 45 jam seminggu bagi menjaga kebajikan pekerja.'
      },
      {
        id: 'q-corp-03',
        question: 'Bilakah sijil cuti sakit (MC) rasmi perlu diserahkan kepada pihak pengurusan?',
        options: [
          'Dalam tempoh 48 jam dari tarikh cuti sakit bermula',
          'Selepas 1 tahun bekerja',
          'Tidak perlu serahkan langsung',
          'Hanya semasa hendak berhenti kerja'
        ],
        correctIndex: 0,
        explanation: 'Mengikut undang-undang buruh Malaysia, majikan perlu dimaklumkan dan MC perlu dikemukakan dalam 48 jam untuk pengesahan cuti bergaji.'
      }
    ]
  }
];

export const INITIAL_ONBOARDING_TASKS: OnboardingTask[] = [
  {
    id: 'task-01',
    dayPhase: 'Hari 1 (Day 1)',
    title: 'Selesai Baca Modul Budaya Syarikat & Akta Kerja 1955',
    description: 'Fahami visi syarikat, jadual shift, dan prosedur Check In / Check Out di portal.',
    requiredFor: 'Semua Karyawan'
  },
  {
    id: 'task-02',
    dayPhase: 'Hari 1 (Day 1)',
    title: 'Serahan Dokumen Salinan IC, Penyata Bank & No. KWSP/Cukai',
    description: 'Muat naik atau serahkan dokumen peribadi kepada pegawai HR untuk pengesahan penggajian.',
    requiredFor: 'Semua Karyawan'
  },
  {
    id: 'task-03',
    dayPhase: 'Minggu 1 (Week 1)',
    title: 'Latihan Amali Sistem POS Kasir & Imbasan Kod Barcode Buku',
    description: 'Kuasai pengendalian transaksi pembayaran dan susunan rak mengikut kategori ISBN.',
    requiredFor: 'Operasi & Retail'
  },
  {
    id: 'task-04',
    dayPhase: 'Minggu 1 (Week 1)',
    title: 'Latihan Khidmat Pelanggan (CS) & Pengendalian Tiket Aduan',
    description: 'Latihan menjawab mesej pelanggan WhatsApp mengikut standard nada profesional Union.',
    requiredFor: 'Pemasaran & Jualan'
  },
  {
    id: 'task-05',
    dayPhase: 'Bulan 1 (Month 1)',
    title: 'Semakan Kitaran Pertama Absensi & Slip Gaji Rasmi (26-25hb)',
    description: 'Pastikan rekod kehadiran lengkap tanpa isu untuk pemprosesan gaji statutori penuh.',
    requiredFor: 'Semua Karyawan'
  }
];
