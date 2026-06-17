# Memory Projek - Kalkulator Ar Rahnu V2 (Desktop Edition)

Fail ini berfungsi sebagai ingatan konteks (*project memory*) untuk dibaca oleh pembantu AI pada permulaan setiap sesi pembangunan. Ia merumuskan status semasa, keputusan seni bina utama, kekangan projek, dan sejarah perubahan penting.

---

## 📌 1. Konteks Projek & Peraturan Mutlak

### ⚠️ Kekangan Teknikal (Wajib Dipatuhi)
1. **100% Offline (Bebas CDN Luar)**:
   - Aplikasi mesti boleh berfungsi tanpa sambungan internet sepenuhnya.
   - **DILARANG** memuatkan sebarang perpustakaan (JS/CSS) atau font daripada CDN luar (seperti Google Fonts, cdnjs, dsb.).
   - Semua aset wajib diletakkan secara tempatan (seperti font Outfit di `/src/renderer/fonts/` dan Chart.js di `/src/renderer/lib/`).
2. **Antara Muka (UI/UX)**:
   - Tema Gelap & Emas Premium (`#0c0e12` gelap, `#d4af37` emas).
   - Susun atur dual-column real-time (tiada butang submit untuk pengiraan simulasi).
3. **Pangkalan Data (Database)**:
   - Menggunakan SQLite tempatan menerusi library `better-sqlite3`.
   - Laluan fail database disimpan secara dinamik mengikut profil pengguna: `%APPDATA%/ar-rahnu-v2-exe/ar_rahnu_v2.db`.

---

## 🔒 2. Polisi Keselamatan Aplikasi (Security Posture)

Perisian ini telah diperketatkan daripada segi keselamatan dengan konfigurasi berikut:
- **`webSecurity: true`**: Mengaktifkan Same-Origin Policy (SOP) untuk menyekat pemuatan fail luaran yang mencurigakan.
- **`contextIsolation: true` & `nodeIntegration: false`**: Mengasingkan konteks JS Renderer daripada Main Process.
- **Content Security Policy (CSP)**: Tag meta CSP dipasang di `index.html` dan `print.html` untuk menyekat XSS dan menghalang sambungan keluar (`connect-src 'none'`).
- **Penapisan Protokol URL**: IPC `open-external` ditapis secara ketat pada Main Process (hanya membenarkan protokol `http://` dan `https://` sahaja) untuk menghalang serangan sistem operasi.
- **Prepared Statements**: Menggunakan kueri berparameter (`?`) dalam SQLite untuk mengelakkan serangan SQL Injection.

---

## 🛠️ 3. Rekod Perubahan Penting (Changelog)

### [2026-06-15] - Pautan Maklum Balas & Pengetatan Keselamatan
- **Pautan Google Form**: Mengemas kini fungsi `openFeedbackForm()` di `src/renderer/js/prices.js` ke pautan Google Form sebenar (`https://forms.gle/14wn2y7Uou7PGWgd9`). Pautan ini dijamin dibuka pada pelayar web lalai pengguna (luar dari tingkap Electron) menerusi `window.api.openExternal()`.
- **Pengukuhan Keselamatan**:
  - Mengaktifkan `webSecurity: true` pada BrowserWindow di `main.js`.
  - Menambah tag meta CSP tegar pada `index.html` dan `print.html`.
  - Menambah penapisan protokol URL (`http/https`) dalam pengendali IPC `open-external` di `main.js`.
  - Mendokumentasikan spesifikasi keselamatan dalam `PRD.md` (Seksyen 7) dan `README.md`.
- **Sistem Semakan Kemas Kini (Hybrid Check)**:
  - Melaksanakan fungsi `checkAppUpdates()` di `src/renderer/js/app.js` yang menyemak fail `version.json` di GitHub secara latar belakang.
  - Jika kemas kini tersedia, penunjuk titik merah (`#update-dot`) akan dipaparkan di sebelah menu sidebar "Tentang".
  - Kad maklumat kemas kini (`#update-alert-card`) akan muncul di dalam halaman "Tentang" dengan pilihan butang muat turun daripada GitHub dan Google Drive.
  - Membenarkan domain `https://raw.githubusercontent.com` di bawah tetapan `connect-src` tag CSP di `index.html`.

---

## 📋 4. Senarai Tugasan Seterusnya (Next Steps / Roadmap)

- [ ] Lakukan pengujian penuh (*smoke testing*) aplikasi untuk memastikan graf Chart.js dan SQLite berfungsi dengan lancar di bawah sekatan `webSecurity: true`.
- [ ] Menyediakan skrip pengemasan dependencies (seperti kemas kini berkala Electron dan `better-sqlite3` bagi menampal tampalan keselamatan yang baharu).
- [ ] Melakukan sanitasi input tambahan semasa proses import CSV harga emas untuk mencegah manipulasi jenis data.
