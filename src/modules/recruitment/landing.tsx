import { ApplicationEntry, MockNotice, RecruitmentFrame, StatusBadge } from "./components";
import { documentSlots, recruitmentConfig } from "./config";

export function RecruitmentLanding() {
  return <RecruitmentFrame>
    <MockNotice />
    <section className="grid gap-10 pt-10 pb-14 lg:grid-cols-[1.35fr_0.85fr] lg:items-center lg:gap-16">
      <div>
        <StatusBadge />
        <p className="mt-7 text-xs font-semibold tracking-[0.2em] text-iris uppercase">SPE UGM Student Chapter</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,6vw,4.6rem)] leading-[1.1] font-semibold tracking-[-0.05em] text-ink-deep">Your next chapter<br /><span className="text-iris">starts here.</span></h1>
        <p className="mt-6 text-lg font-semibold">Staff Recruitment {recruitmentConfig.period}</p>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">Kenali alur Open Recruitment Staff SPE UGM SC, siapkan dokumen, lalu coba formulir empat langkah. Informasi pada halaman ini masih berupa preview.</p>
        <div className="mt-7 flex flex-wrap items-center gap-4"><ApplicationEntry /><a href="#application-guide" className="rounded-lg px-2 py-3 text-sm font-semibold text-ink-deep underline decoration-iris/40 underline-offset-4 focus-visible:outline-2 focus-visible:outline-iris">Lihat panduan</a></div>
      </div>
      <div className="relative overflow-hidden rounded-[2rem] bg-[#eeebff] p-8 sm:p-10">
        <div aria-hidden="true" className="absolute -top-12 -right-12 size-52 rounded-full border-[32px] border-white/50" />
        <p className="relative text-xs font-semibold tracking-[0.2em] text-iris uppercase">Open Recruitment · Preview</p>
        <p aria-hidden="true" className="mt-8 font-display text-[clamp(5rem,12vw,8rem)] leading-none font-semibold tracking-[-0.08em] text-iris">26<span className="text-iris/35">/</span>27</p>
        <p className="mt-8 max-w-64 font-display text-xl font-medium text-ink-deep">Empat langkah.<br />Satu awal perjalanan.</p>
        <div className="mt-7 flex items-center gap-3 border-t border-iris/15 pt-5 text-sm text-[#5c5084]"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-white font-semibold text-iris">04</span>Data pribadi, pilihan divisi, dan dokumen.</div>
      </div>
    </section>

    <section id="application-guide" aria-labelledby="guide-title" className="scroll-mt-28 border-t border-[#e7e8f0] py-12">
      <p className="text-xs font-semibold tracking-[0.15em] text-iris uppercase">Sebelum memulai</p>
      <h2 id="guide-title" className="mt-3 font-display text-3xl font-semibold tracking-tight">Siapkan langkahmu.</h2>
      <ol className="mt-7 grid gap-4 md:grid-cols-3">{[
        ["01", "Baca informasi", "Daftar divisi, jadwal, dan petunjuk assignment resmi masih menunggu konfirmasi organisasi."],
        ["02", "Siapkan dokumen", "Gunakan tiga PDF dan dua PNG contoh sebagai dokumen pendukung. Assignment mengikuti sub-divisi. Batas simulasi bukan ketentuan resmi."],
        ["03", "Isi & periksa kembali", "Lengkapi empat langkah, periksa ringkasan, lalu coba submit simulasi. Tidak ada aplikasi yang dikirim."],
      ].map(([number, title, text]) => <li key={number} className="rounded-2xl border border-[#e4e5ef] bg-white p-6"><span className="text-sm font-semibold text-iris">{number}</span><h3 className="mt-4 font-display text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-ink-soft">{text}</p></li>)}</ol>
    </section>

    <div className="grid gap-8 pb-12 lg:grid-cols-2">
      <section aria-labelledby="timeline-title" className="rounded-3xl border border-[#e4e5ef] bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.15em] text-iris uppercase">Timeline</p>
        <h2 id="timeline-title" className="mt-3 font-display text-2xl font-semibold">Jadwal rekrutmen</h2>
        <p className="mt-3 text-sm leading-6 text-ink-soft">Placeholder — belum ada tanggal resmi pada preview ini.</p>
        <dl className="mt-6 divide-y divide-[#ececf3]">{["Pembukaan pendaftaran", "Penutupan pendaftaran", "Tahapan seleksi"].map((label) => <div key={label} className="flex flex-wrap justify-between gap-2 py-4 text-sm"><dt className="font-medium">{label}</dt><dd className="text-ink-soft">Menunggu konfirmasi</dd></div>)}</dl>
      </section>
      <section aria-labelledby="divisions-title" className="rounded-3xl border border-[#e4e5ef] bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.15em] text-iris uppercase">Explore your interests</p>
        <h2 id="divisions-title" className="mt-3 font-display text-2xl font-semibold">Pilihan divisi</h2>
        <p className="mt-3 text-sm leading-6 text-ink-soft">Nama divisi berikut berasal dari draft guidebook, belum menjadi daftar yang disahkan. Ketentuan assignment seluruh sub-divisi masih menunggu konfirmasi panitia.</p>
        <ul className="mt-6 space-y-3">{recruitmentConfig.divisions.map((division) => <li key={division.id} className="flex items-center justify-between gap-3 rounded-xl bg-ground px-4 py-3 text-sm"><span className="font-medium">{division.label}</span><span className="rounded-full bg-white px-3 py-1 text-xs text-iris">Draft</span></li>)}</ul>
      </section>
    </div>

    <section aria-labelledby="documents-title" className="rounded-3xl bg-[#f0eefb] p-6 sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div><p className="text-xs font-semibold tracking-[0.15em] text-iris uppercase">Document checklist</p><h2 id="documents-title" className="mt-3 font-display text-3xl font-semibold tracking-tight">Semua siap<br />sebelum mulai.</h2><p className="mt-4 text-sm leading-6 text-ink-soft">Nama file adalah panduan saja. File tetap berada di memori browser dan tidak diunggah.</p></div>
        <ul className="grid gap-3 sm:grid-cols-2">{documentSlots.map((slot) => <li key={slot.key} className="rounded-2xl bg-white p-4"><div className="flex items-start justify-between gap-2"><span className="text-sm font-semibold">{slot.label}</span><span className="text-xs font-semibold text-iris">{slot.format}</span></div><p className="mt-2 text-xs leading-5 break-all text-ink-soft">{slot.filename}</p></li>)}</ul>
      </div>
    </section>
    <section aria-label="Mulai simulasi" className="flex flex-wrap items-center justify-between gap-6 pt-12"><div><h2 className="font-display text-2xl font-semibold">Coba alur pendaftarannya.</h2><p className="mt-2 text-sm text-ink-soft">Belum ada pendaftaran resmi yang akan dikirim.</p></div><ApplicationEntry /></section>
  </RecruitmentFrame>;
}
