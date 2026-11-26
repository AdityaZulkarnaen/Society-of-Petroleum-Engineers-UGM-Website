## Ringkasan Perubahan
<!-- Jelaskan singkat apa yang dikerjakan di PR ini dan halaman/route mana yang terdampak. -->

- Halaman / Route terdampak: (contoh: `/about`, `/coming-soon/apecx`, dll.)
- Deskripsi singkat:

## Jenis Perubahan
<!-- Centang yang sesuai dengan mengganti [ ] menjadi [x] -->
- [ ] Halaman baru / pengembangan fitur publik
- [ ] Perbaikan tampilan / responsive / bug fix
- [ ] Update konten atau aset gambar (`public/`)
- [ ] Perubahan dashboard (`/admin` / `/super-admin`) atau backend / database

## Screenshot (Wajib untuk perubahan UI)
<!-- Tarik/tempel screenshot tampilan Desktop dan Mobile (HP) agar mudah dicek saat review. -->
| Desktop | Mobile |
| :---: | :---: |
| <!-- tempel gambar di sini --> | <!-- tempel gambar di sini --> |

## Checklist Sebelum Review Koordinator
- [ ] Branch dibuat dari kode `main` terbaru
- [ ] Tidak ada file `.env*`, password, secret key, atau file `.exe` yang ikut ter-commit
- [ ] Jika sempat mengaktifkan `DUMMY_DATA` di `src/modules/admin/dummy/index.ts`, sudah dikembalikan ke `ENABLED = false`
- [ ] Sudah dicek di browser lokal (tampilan desktop & HP tidak kepotong / overflow)
- [ ] Sudah menjalankan `pnpm lint`, `pnpm exec tsc --noEmit`, dan `pnpm build`
- [ ] Saya paham perubahan kode yang saya kirim (termasuk jika dibantu AI) dan siap menjelaskan singkat bila ditanya
