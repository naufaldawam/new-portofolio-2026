# Naufal Dawam Dzikrilah - Portfolio Website 2k26

Website portofolio interaktif berbasis web modern yang dirancang untuk menampilkan profil, perjalanan karier, *tech stack*, serta daftar proyek/karya (*featured works*) dengan efek animasi yang halus dan desain bergaya *cyber/neon glassmorphism*.

## Teknologi & Library yang Digunakan

Proyek ini dibangun menggunakan teknologi web standar dan diperkaya dengan beberapa *library* pihak ketiga eksternal untuk memaksimalkan pengalaman interaktif pengguna:

1. **HTML5 & CSS3 (Modern Flexbox & Grid)**
   * Digunakan sebagai struktur utama dan penata letak halaman dengan pendekatan desain responsif.
   * Menerapkan konsep *Glassmorphism* (`backdrop-filter`) untuk memberikan efek transparan modern pada kartu dan komponen antarmuka.

2. **JavaScript (ES6+)**
   * Mengatur interaktivitas website, navigasi *mobile menu*, kustom kursor interaktif, serta logika pengiriman form kontak.

3. **EmailJS**
   * Digunakan untuk mengintegrasikan form kontak agar pesan dari pengunjung web dapat terkirim langsung ke email pribadi tanpa memerlukan *backend server* tambahan.

4. **Library Eksternal Pihak Ketiga:**
   * **[AOS (Animate On Scroll)](https://michalsnik.github.io/aos/)**: Digunakan untuk memberikan animasi kemunculan elemen yang halus ketika halaman digulir (*scrolling*) [cite: 35].
   * **[particles.js](https://vincentgarreau.com/particles.js/)**: Digunakan sebagai templat latar belakang interaktif berupa partikel titik-titik dan garis bercahaya yang bergerak dinamis [cite: 36].
   * **[Typed.js](https://mattboldt.com/demos/typed-js/)**: Digunakan untuk membuat efek teks berjalan ala mesin ketik otomatis pada bagian teks peran profesional (*typing animation*) [cite: 37].
   * **[Vanilla-Tilt.js](https://micku7zu.github.io/vanilla-tilt.js/)**: Digunakan khusus untuk memberikan efek animasi 3D interaktif pada kartu (*cards*) ketika kursor diarahkan di atasnya (bergerak miring mengikuti arah kursor) [cite: 38].

## Struktur Proyek
- `index.html` : Berisi struktur kerangka halaman utama portofolio.
- `style.css`  : Berisi seluruh styling, variabel warna, efek kaca, dan responsivitas perangkat.
- `script.js`  : Berisi logika interaksi, konfigurasi *Particles.js*, *Typed.js*, dan integrasi *EmailJS*.
- `images/`    : Direktori penyimpanan aset gambar atau *screenshot* proyek.

---
## Cara Deploy ke GitHub Pages

Jika kamu ingin mempublikasikan portofolio ini secara gratis menggunakan GitHub Pages, ikuti langkah-langkah berikut:

1. **Buat Repository Baru di GitHub:**
   * Masuk ke akun GitHub kamu, lalu buat *repository* baru (misal: `portfolio` atau `naufaldawam`).
2. **Push File Proyek ke Repository:**
   * Buka terminal di folder proyekmu, lalu jalankan perintah Git berikut:
     ```bash
     git init
     git add .
     git commit -m "Initial commit - Portfolio Naufal"
     git branch -M main
     git remote add origin [https://github.com/USERNAME_KAMU/NAMA_REPOSITORY.git](https://github.com/USERNAME_KAMU/NAMA_REPOSITORY.git)
     git push -u origin main
     ```
     *(Ganti `USERNAME_KAMU` dan `NAMA_REPOSITORY` dengan data GitHub kamu).*
3. **Aktifkan GitHub Pages:**
   * Masuk ke halaman *repository* kamu di GitHub melalui *browser*.
   * Klik tab **Settings** di bagian atas.
   * Pada menu sebelah kiri, pilih **Pages**.
   * Di bagian **Build and deployment** -> **Branch**, pilih `main` (atau `root`), lalu klik **Save**.
   * Tunggu beberapa menit, dan website portofoliomu akan otomatis online melalui tautan yang diberikan oleh GitHub!