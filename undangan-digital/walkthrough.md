# Walkthrough — Kesiapan Deploy ke Cloudflare Pages

## 🚀 Status Kesiapan Deploy:
**SUDAH 100% SIAP DIDEPLOY KE CLOUDFLARE PAGES!**

Seluruh arsitektur kode telah disesuaikan agar dapat berjalan sempurna di infrastruktur Cloudflare Pages (baik sebagai situs statis berbasis CDN murni maupun dengan Cloudflare Pages Functions).

---

## 📋 Checklist Kesiapan Cloudflare Pages:

| Item | Status | Keterangan |
|---|---|---|
| **Struktur File Bersih** | ✅ Siap | Tidak ada dependensi build rumit (`index.html`, `styles.css`, `script.js` siap disajikan langsung). |
| **Integrasi Google Drive** | ✅ Siap | Foto mempelai, cover, dan galeri langsung menggunakan CDN Google Drive tanpa membebani kuota penyimpanan Cloudflare. |
| **Fallback Data Multi-Layer** | ✅ Siap | Jika API server tidak ada, sistem otomatis membaca static JSON `/data/clients/*.json` dan `/data/wedding-data.json` yang di-host langsung di Cloudflare Pages. |
| **Cloudflare Pages Functions** | ✅ Siap | Folder `functions/api/` sudah disiapkan (`data.js`, `proxy-audio.js`, `settings.js`, `rsvps.js`) untuk fungsi serverless edge otomatis. |
| **Header Keamanan & CORS** | ✅ Siap | File `_headers` sudah dibuat dengan aturan CORS dan proteksi iframe. |
| **Bebas Error Sintaks** | ✅ Siap | Validasi `node -c script.js` status exit 0. |

---

## 🛠️ Panduan Langkah-demi-Langkah Deploy ke Cloudflare Pages:

Anda memiliki **2 Pilihan Cara Deploy** yang sangat mudah:

### 🔹 Pilihan 1: Direct Upload (Paling Cepat — Tanpa Git / 1 Menit Selesai)
1. Buka dashboard Cloudflare di [dash.cloudflare.com](https://dash.cloudflare.com).
2. Di menu sebelah kiri, pilih **Workers & Pages** > klik **Create application**.
3. Pilih tab **Pages** > klik **Upload assets**.
4. Beri nama proyek Anda (misal: `undangan-digital` atau `satuacara-undangan`).
5. **Drag & Drop** folder `undangan-digital` ini ke kotak upload Cloudflare.
6. Klik **Deploy site**.
7. Selesai! Web undangan Anda langsung aktif di domain gratis `https://nama-proyek.pages.dev`.

---

### 🔹 Pilihan 2: Git Repository (GitHub / GitLab — Otomatis Update saat Push)
1. Push folder `undangan-digital` ini ke repository GitHub Anda.
2. Di dashboard Cloudflare: **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Pilih repository Anda.
4. Pengaturan Build:
   - **Framework preset**: `None`
   - **Build command**: *(Biarkan KOSONG)*
   - **Build output directory**: `.` *(atau biarkan kosong/root)*
5. Klik **Save and Deploy**.
6. Cloudflare Pages akan otomatis mem-build dan mengaktifkan fungsi serverless edge dari folder `functions/`.

---

## 🔗 Custom Domain (Opsional):
Setelah aktif di `*.pages.dev`, Anda bisa menghubungkan domain pribadi Anda (misal: `undangan.domainanda.com`) langsung dari tab **Custom domains** di Cloudflare Pages dengan SSL gratis otomatis.
