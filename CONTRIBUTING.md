# Panduan Kontribusi Website SPE UGM SC

Selamat datang di tim Web Development **SPE UGM Student Chapter**! Dokumen ini dibuat supaya semua anggota tim—termasuk yang masih sama-sama belajar—bisa berkontribusi dengan nyaman, rapi, dan aman tanpa takut merusak website live.

---

## 1. Ringkasan Tech Stack

Sebelum mulai mengedit kode, pahami dulu teknologi yang dipakai di proyek ini (penting karena beberapa versinya sangat baru dan berbeda dari tutorial lama):

| Bagian | Teknologi | Catatan Penting |
| :--- | :--- | :--- |
| **Framework** | Next.js `16.3.5` (App Router) | Memakai `proxy.ts` di root (bukan `middleware.ts`). Cek `node_modules/next/dist/docs/` jika butuh referensi API versi ini. |
| **UI Library** | React `19.2.8` & TypeScript `^5` | `strict: true` aktif di `tsconfig.json`. |
| **Styling** | Tailwind CSS `^4` | Konfigurasi token ada di `src/styles/globals.css` (`@theme inline`), **tidak memakai** `tailwind.config.js`. |
| **Animasi** | `gsap` + `@gsap/react` & CSS | Dipakai di section landing page & about. |
| **Backend & Auth** | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) | Dipakai untuk dashboard `/admin` dan `/super-admin`, serta migrasi SQL di `supabase/migrations/`. |
| **Package Manager** | `pnpm` (`pnpm@11.24.0`) | **Wajib pakai `pnpm`**, jangan memakai `npm install` atau `yarn` agar `pnpm-lock.yaml` tidak rusak. |

---

## 2. Persiapan Awal (Setup Lokal)

### A. Install Prasyarat
1. Install **Node.js** versi LTS (v22 atau v24) dan **Git**.
2. Aktifkan `pnpm`:
   ```bash
   corepack enable
   ```
   *(Jika `corepack` belum tersedia, jalankan `npm install -g pnpm`.)*

### B. Clone & Sinkronisasi Repo
Jika tim memakai sistem **Fork (`origin`) + Repo Utama (`upstream`)**:
```bash
git clone <url-repo-fork-atau-utama>
cd Society-of-Petroleum-Engineers-UGM-Website
```
Jika kamu bekerja lewat fork pribadi, pastikan remote `upstream` mengarah ke repo utama, lalu selalu tarik update terbaru sebelum mulai mengerjakan task:
```bash
git fetch upstream
git checkout main
git merge upstream/main
```
*(Jika kamu langsung jadi kolaborator di repo utama tanpa fork, cukup `git checkout main && git pull origin main`.)*

### C. Install Dependencies & Jalankan Server Lokal
```bash
pnpm install
pnpm dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser.

### D. Cara Menjalankan Tanpa Kredensial Production (Aman!)
> **PENTING:** Jangan pernah meminta, menyalin, atau membagikan file `.env.local` production ke sembarang tempat.

- **Untuk mengerjakan halaman publik** (`/`, `/about`, `/coming-soon/...`, `/join`):
  Kamu **tidak butuh** file `.env.local` Supabase. Jalankan langsung `pnpm dev` dan halaman publik akan tampil normal.
- **Untuk mengerjakan tampilan dashboard** (`/admin` atau `/super-admin`) tanpa database asli:
  1. Buka `src/modules/admin/dummy/index.ts`.
  2. Ubah sementara `const ENABLED = false;` menjadi `const ENABLED = true;` (hanya berlaku di `pnpm dev`).
  3. **Wajib kembalikan ke `false` sebelum `git commit`!**
- **Untuk fitur yang wajib koneksi backend/database:**
  Minta kunci Supabase **Staging/Dev** (bukan production) kepada Koordinator, lalu salin `.env.example` menjadi `.env.local`.

---

## 3. Peta Folder & Zona Keamanan

Supaya jelas area mana yang bebas dieksplorasi dan mana yang harus hati-hati:

### Zona Aman (Cocok untuk Belajar & Kontribusi Rutin)
- `app/(site)/` — Route halaman publik (Home, About, Join, Coming Soon).
- `src/modules/home/`, `src/modules/about/`, `src/modules/coming-soon/`, `src/modules/footer/` — Isi dan komponen tiap halaman publik.
- `src/components/` — Komponen bersama seperti `site-header.tsx` dan `ui/button-styles.ts`.
- `public/` — Aset gambar/logo/SVG. Usahakan gambar foto berformat `.webp` dengan ukuran file wajar.

### Zona Kritis (Wajib Diskusi / Pair Programming dengan Koordinator)
- `app/admin/`, `app/super-admin/`, `src/modules/admin/`, `src/modules/super-admin/` — Logika dashboard pengurus, presensi QR, voting, rekap kompetensi, proker, dan manajemen akun.
- `src/lib/supabase/` — Koneksi Supabase (`admin.ts` memakai `SUPABASE_SECRET_KEY` yang mem-bypass Row Level Security).
- `proxy.ts` — Penjaga sesi login untuk rute `/admin/*` dan `/super-admin/*`.
- `supabase/migrations/` & `scripts/` — Skema database dan script seeding (`seed:divisions`, `seed:super-admins`). **Jangan jalankan script seed ke database production saat latihan.**

---

## 4. Alur Kerja Git & Pull Request (PR)

Dilarang push langsung ke `main`. Semua perubahan harus lewat branch dan Pull Request:

1. **Pastikan `main` terbaru:**
   ```bash
   git checkout main
   git pull origin main   # atau sinkronkan dengan upstream/main
   ```
2. **Buat branch baru sesuai tugas:**
   - Fitur baru / halaman baru: `feat/nama-halaman-singkat`
   - Perbaikan bug / tampilan: `fix/nama-perbaikan`
   ```bash
   git checkout -b feat/halaman-apecx
   ```
3. **Kerjakan perubahan & uji di browser** (cek ukuran layar **desktop** dan **mobile/HP** lewat DevTools `F12`).
4. **Jalankan pengecekan wajib sebelum commit:**
   ```bash
   pnpm lint
   pnpm exec tsc --noEmit
   pnpm build
   ```
5. **Cek daftar file yang berubah (`git status`):**
   Pastikan **tidak ada** file `.env*`, file binary (`*.exe`), atau perubahan testing di `src/modules/admin/dummy/index.ts`.
6. **Commit dengan pesan jelas, lalu push:**
   ```bash
   git add <file-yang-relevan>
   git commit -m "feat(apecx): add initial event overview section"
   git push -u origin feat/halaman-apecx
   ```
7. **Buka Pull Request ke branch `main`** di GitHub, isi template PR, lampirkan screenshot desktop & mobile, lalu tag Koordinator untuk review.

---

## 5. Aturan Menggunakan AI Assistant / Agent saat Belajar

Kamu boleh memakai AI (ChatGPT, Claude, Cursor, Antigravity, dll.) sebagai teman belajar dan asisten coding, dengan 3 aturan:

1. **Berikan konteks stack yang benar ke AI:**
   Sertakan catatan ini saat bertanya ke AI:
   > *"Proyek ini memakai Next.js 16 App Router (`proxy.ts`, bukan `middleware.ts`), React 19, TypeScript strict, Tailwind CSS v4 (`@theme inline` di `src/styles/globals.css`, tanpa `tailwind.config.js`), dan `pnpm`."*
2. **Jangan copy-paste buta:**
   Pahami dulu alur file mana yang diubah, kenapa kodenya ditulis seperti itu, dan pastikan kamu bisa menjelaskannya singkat saat review PR.
3. **Verifikasi hasil AI:**
   AI bisa saja memberi sintaks versi lama atau mengubah file yang tidak perlu. Selalu cek `git diff`, tes langsung di browser, dan pastikan cek lint/typecheck/build lolos.
