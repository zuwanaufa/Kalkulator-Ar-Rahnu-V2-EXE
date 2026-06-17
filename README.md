# Kalkulator Ar Rahnu V2 (Desktop Edition)

Kalkulator Ar Rahnu V2 Desktop Edition ialah perisian desktop Windows yang dibina menggunakan rangka kerja **Electron**, dikuasakan oleh pangkalan data **SQLite** terbina, dan mempunyai fungsi graf harga emas secara **offline**. Perisian ini mematuhi sekatan tembok api (*firewall*) pejabat sepenuhnya dengan meletakkan semua sumber (seperti font Outfit dan pustaka Chart.js) secara tempatan di dalam projek.

---

## 📁 Struktur Fail Projek

```
AR RAHNU V2 EXE/
├── package.json                   # Konfigurasi projek, dependensi & build scripts
├── PRD.md                         # Dokumen Keperluan Produk (kemas kini desktop)
├── README.md                      # Fail panduan ini
├── scripts/
│   └── setup.js                   # Skrip persediaan font Outfit & Chart.js offline
├── src/
│   ├── main/
│   │   ├── main.js                # Proses Utama (Main Process) - Lifecycle & IPC listeners
│   │   └── database.js            # Modul database SQLite (better-sqlite3)
│   ├── preload.js                 # Bridge IPC selamat antara Main & Renderer
│   └── renderer/
│       ├── index.html             # Antara muka utama (menu sidebar & panels)
│       ├── style.css              # Reka bentuk gaya premium Gelap & Emas
│       ├── print.html             # Templat slip cetakan A4
│       ├── js/                    # Modul ES6 JavaScript Renderer
│       │   ├── app.js             # Entry point inisialisasi aplikasi
│       │   ├── calculator.js      # Logik & pengiraan Ar Rahnu
│       │   ├── purchaseCalculator.js # Logik & pengiraan Belian Emas
│       │   ├── alsaleemCalculator.js # Logik & pengiraan Al Saleem
│       │   ├── prices.js          # Pengurusan harga emas & SQLite CRUD
│       │   ├── chart.js           # Paparan graf trend harga emas
│       │   ├── navigation.js      # Navigasi sidebar, tema cerah & lipat menu
│       │   └── config.js          # Utiliti & tetapan alert/konfigurasi
│       ├── fonts/                 # Fail-fail font Outfit (offline)
│       │   └── outfit.css         
│       └── lib/                   
│           └── chart.js           # Pustaka Chart.js (offline)
```

---

## 🚀 Persediaan & Cara Menjalankan Aplikasi

Sila pastikan anda mempunyai **Node.js** (versi 20 atau ke atas digalakkan) dipasang pada sistem anda.

### 1. Pemasangan Dependensi & Setup Offline
Buka terminal (Command Prompt / PowerShell) di dalam direktori projek ini dan jalankan arahan berikut:
```bash
npm install
```
*Nota: Arahan ini akan memasang semua pakej Node.js yang diperlukan (termasuk Electron dan `better-sqlite3`). Ia juga akan menjalankan skrip `postinstall` secara automatik untuk memuat turun font Outfit dan pustaka Chart.js ke dalam folder renderer supaya aplikasi boleh berfungsi 100% offline kelak.*

### 2. Menjalankan Aplikasi dalam Mod Pembangunan (Dev)
Untuk memulakan perisian bagi tujuan pembangunan dan ujian, jalankan:
```bash
npm start
```
Satu tetingkap aplikasi desktop Kalkulator Ar Rahnu V2 akan dipaparkan.

### 3. Membina Fail Executable (.exe) Mudah Alih
Untuk membungkus perisian ini menjadi fail aplikasi Windows tunggal (.exe) yang mudah alih (portable) yang boleh disebarkan kepada kakitangan tanpa perlu memasang Node.js, jalankan:
```bash
npm run build
```
Hasil pembungkusan (.exe) akan dijana di dalam folder `dist/` (cth: `dist/ArRahnuCalcV2 Portable.exe`). Fail ini boleh dipindahkan menggunakan USB drive dan dijalankan terus di mana-mana komputer Windows pejabat.

---

## 📖 Ciri-Ciri Utama & Panduan Penggunaan

1. **Urus & Kemaskini Harga Emas Semasa (SQLite)**:
   - Pilih menu **Urus Harga Emas** di sidebar kiri.
   - Masukkan harga dasar emas semasa bagi setiap mutu dan klik **Simpan Harga Hari Ini**.
   - Perisian akan merekodkan harga tersebut di dalam pangkalan data SQLite terbina dengan tarikh hari ini.
   - Apabila aplikasi dimula semula, ia akan secara automatik memuatkan harga emas terkini berdasarkan tarikh akhir kemaskini dalam SQLite.

2. **Kalkulator Dual-Lajur Real-time**:
   - Pilih menu **Kalkulator** di sidebar kiri.
   - Pilih produk Ar Rahnu (Prestij, Didik, Bisnes, Biznita, Emas, Care, atau eKASIH (Kadar Khas)). Rincian margin dan tempoh akan disesuaikan secara automatik.
   - Masukkan barang gadaian (mutu dan berat). Anda boleh menambah berbilang barang dengan butang **Tambah Barang**.
   - Input bagi caj tambahan (takaful, cuci, uji, dll.) dan tebusan surat lama boleh dimasukkan di bahagian bawah.
   - Pengiraan hasil (Nilai Marhun, Pembiayaan Dipohon, Upah Simpan Harian/Awal, Potongan, Jumlah Bersih) dan **Jadual Bayaran Balik berfasa** akan dikemas kini secara langsung (real-time) di panel kanan tanpa perlu menekan butang submit.
   - Sekiranya berlaku situasi **Defisit** (di mana potongan melebihi pembiayaan), masukkan jumlah wang tunai yang diterima daripada pelanggan untuk mengira baki wang ubah secara masa-nyata.

3. **Graf Trend Sejarah Harga**:
   - Pilih menu **Graf Sejarah** di sidebar kiri.
   - Boleh menapis data graf (7 hari, 1 bulan, 3 bulan, dsb.) dengan menggunakan dropdown *Filter*.
   - Graf garisan (Line Chart) interaktif akan dilukis menggunakan Chart.js tempatan untuk memaparkan trend harga emas mutu **999** dan **916**.
   - Jadual di bawah turut dilengkapi ciri **Paging (Halaman)** bagi memudahkan carian data yang panjang.

4. **Pengurusan Sejarah (Backup & Restore)**:
   - Pengguna boleh muat turun sandaran log sejarah dalam format CSV (**Eksport Data**) mengikut julat tahun.
   - Pengguna boleh memuat naik kembali fail CSV di PC baru (**Muat Naik CSV**).
   - Fungsi **Kosongkan Pangkalan Data** (Clear All) disediakan untuk memulakan perisian dengan keadaan baharu.
   - Semua fungsi ini terdapat di dalam menu **Urus Harga Emas > Log Harga Sejarah (CRUD)**, yang juga mempunyai ciri **Paging**.

4. **Cetak Simulasi A4 (Ar Rahnu & Belian Emas)**:
   - Klik butang **Cetak Simulasi** di panel rumusan kalkulator.
   - Satu pop-up amaran keselamatan akan dipaparkan bagi menegaskan bahawa dokumen ini adalah simulasi rujukan dan bukan slip rasmi.
   - Klik **Ya, Cetak Sekarang** untuk memicu tetingkap cetakan khusus A4 yang dilaraskan secara dinamik mengikut jenis simulasi (menyembunyikan bahagian kewangan/jadual pinjaman bagi simulasi belian emas, dan memaparkan pecahan upah simpan berfasa bagi Ar Rahnu). Tetingkap ini akan ditutup secara automatik selepas cetakan selesai atau dibatalkan.

5. **Kalkulator Belian Emas Balik (Multi-Tab)**:
   - Pilih menu **Kalkulator Belian** di sidebar kiri.
   - Masukkan barang belian (mutu dan berat). Anda boleh menambah berbilang barang dengan butang **Tambah Barang**.
   - Sistem akan mengira harga belian segram berasaskan harga semasa dan kadar potongan margin belian mengikut mutu emas (cth: 999 - 84%, 916 - 83%).
   - Menyokong pengiraan sehingga 10 tab berasingan secara selari. Nama tab akan berubah secara dinamik mengikut mutu emas barang pertama yang diisi (cth: `Belian 999 (Tab 1)`).
   - Pengiraan hasil (Jumlah Berat, Jumlah Nilai Marhun, Jumlah Payout Belian Bersih) dipaparkan secara real-time.

6. **Kalkulator Al Saleem (Safe Storage - Multi-Tab)**:
   - Pilih menu **Kalkulator Al Saleem** di sidebar kiri.
   - Masukkan barang simpanan (mutu dan berat). Anda boleh menambah berbilang barang dengan butang **Tambah Barang**.
   - Masukkan **Tarikh Mula Simpan** dan **Tarikh Tebus** menggunakan pemilih kalendar untuk simulasi tempoh simpanan.
   - Sistem akan mengira kadar upah simpan harian (berdasarkan kadar rata RM 0.60 per RM100 marhun sebulan) dan memaparkan jumlah upah simpan terkumpul mengikut bilangan hari inklusif secara langsung.
   - Menyokong pengiraan sehingga 10 tab berasingan secara selari. Nama tab dikemaskini secara dinamik mengikut mutu emas barang pertama (cth: `Simpan 916 (Tab 1)`).
   - Klik **Cetak Simulasi** untuk mencetak slip simulasi Al Saleem A4 khas yang memaparkan senarai barang dan perincian upah simpan secara bersebelahan.

---

## 🛠️ Maklumat Pembangunan Lanjut (Bagi AI / Developer)

- **Database Path**: Fail SQLite `ar_rahnu_v2.db` disimpan di dalam folder data profil pengguna Windows (`%APPDATA%/ar-rahnu-v2-exe/`). Ini menghalang ralat kebenaran menulis pada Windows.
- **Inter-Process Communication (IPC)**: Semua logik database dan windowing dijalankan di `src/main/main.js` & `src/main/database.js` (Main Process). Renderer process (`src/renderer/`) memanggil fungsi ini secara selamat melalui IPC yang didedahkan oleh `src/preload.js`.
- **Custom Font & Chart.js**: Jangan tukar pautan CSS font Outfit atau Chart.js kepada pautan HTTP/HTTPS luar. Ini bertujuan mengekalkan status perisian bebas CDN bagi mengelakkan sekatan firewall pejabat.
- **Kawalan Keselamatan (Security Posture)**: Aplikasi dikonfigurasikan dengan `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, dan `webSecurity: true`. Dasar Keselamatan Kandungan (CSP) yang ketat dilaksanakan pada fail HTML untuk menyekat XSS dan panggilan rangkaian (`connect-src 'none'`). Sebarang pembukaan pautan luar menerusi IPC ditapis hanya untuk protokol `http://` atau `https://` demi keselamatan sistem.
