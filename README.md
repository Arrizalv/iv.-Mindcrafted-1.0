<div align="center">

# ✨ Mindcrafted 1.0 ✨

**Sebuah platform komunitas untuk belajar, berbagi, dan bertumbuh bersama.**

</div>

---

Mindcrafted adalah sebuah web aplikasi yang dibangun untuk para pembelajar, kreator, dan mentor untuk terhubung. Baik Anda ingin mempelajari keterampilan baru, menjual kursus, atau membimbing orang lain, Mindcrafted menyediakan alat yang Anda butuhkan untuk sukses di bidang keahlian Anda.

## 🚀 Fitur Utama

- **🧠 Kursus:** Ikuti atau buat kursus mendalam.
- **🛒 Marketplace:** Jual dan beli sumber daya digital.
- **🤝 Mentoring:** Cari mentor atau tawarkan bimbingan.
- **💬 Komunitas & Diskusi:** Terhubung dengan rekan-rekan dan berkolaborasi.
- **👤 Manajemen Pengguna & Peran:** Sistem otentikasi dan otorisasi yang aman dengan peran yang berbeda (Admin, Instructor, Mentor).

---

## 🛠️ Teknologi yang Digunakan

- **Frontend:** [Vue.js 3](https://vuejs.org/) (Composition API)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Bahasa:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database:** [Supabase](https://supabase.io/)
- **Routing:** [Vue Router](https://router.vuejs.org/)

---

## ⚙️ Langkah Awal Penggunaan

Untuk menjalankan proyek ini secara lokal, ikuti langkah-langkah berikut.

### 1. Prasyarat

- [Node.js](https://nodejs.org/) (Versi 18.x atau lebih tinggi direkomendasikan)
- `npm` (biasanya terinstal bersama Node.js)

### 2. Instalasi & Setup

1.  **Clone repository ini:**
    ```sh
    git clone https://github.com/nama-repo-anda/mindcrafted.git
    cd mindcrafted
    ```

2.  **Instal dependensi proyek:**
    ```sh
    npm install
    ```

3.  **Setup Environment Variables:**
    - Buat salinan file `.env.example` dan beri nama `.env`.
      ```sh
      # Untuk Windows (Command Prompt)
      copy .env.example .env

      # Untuk Windows (PowerShell)
      cp .env.example .env

      # Untuk macOS / Linux
      cp .env.example .env
      ```
    - Buka file `.env` yang baru dibuat.
    - Dapatkan **Project URL** dan **anon Key** dari dashboard Supabase Anda (Settings > API).
    - Ganti placeholder di dalam file `.env` dengan kredensial Supabase Anda.
      ```env
      # Supabase Credentials
      # Dapatkan dari dashboard proyek Supabase Anda
      VITE_SUPABASE_URL="https://your-supabase-url.supabase.co"
      VITE_SUPABASE_KEY="your-supabase-anon-key"
      ```

### 3. Menjalankan Aplikasi

- Setelah instalasi dan setup environment selesai, jalankan development server:
  ```sh
  npm run dev
  ```
- Aplikasi akan berjalan dan dapat diakses di `http://localhost:5173` (atau port lain yang ditampilkan di terminal).

---

## 📂 Struktur Proyek

Berikut adalah gambaran umum tentang bagaimana kode diatur:

```
src/
├── assets/         # Aset statis seperti gambar dan SVG
├── components/     # Komponen Vue yang dapat digunakan kembali
├── composables/    # Fungsi Composition API untuk state management (cth: useUser)
├── lib/            # Inisialisasi klien eksternal (cth: supabase.ts)
├── router/         # Konfigurasi routing aplikasi (index.ts)
├── types/          # Definisi tipe TypeScript
├── views/          # Komponen halaman (satu untuk setiap rute)
├── App.vue         # Komponen root aplikasi
├── main.ts         # Titik masuk utama aplikasi
└── style.css       # File style global
```

---

## 📚 Materi Pembelajaran

Bagi Anda yang baru mengenal teknologi yang kami gunakan, berikut adalah beberapa sumber daya untuk memulai:

- **Vue.js:** [Dokumentasi Resmi Vue 3](https://vuejs.org/guide/introduction.html) - Tempat terbaik untuk mempelajari dasar-dasar Vue.
- **Vite:** [Dokumentasi Resmi Vite](https://vitejs.dev/guide/) - Pelajari mengapa build tool ini sangat cepat.
- **Supabase:** [Dokumentasi Supabase](https://supabase.com/docs) - Pahami cara kerja "The Open Source Firebase Alternative".
- **Tailwind CSS:** [Dokumentasi Resmi Tailwind CSS](https://tailwindcss.com/docs/installation) - Pelajari cara menggunakan utility-first CSS framework.
- **TypeScript:** [TypeScript for New Programmers](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html) - Pengenalan dasar TypeScript.

---

<div align="center">
Selamat belajar dan berkarya! 🚀
</div>