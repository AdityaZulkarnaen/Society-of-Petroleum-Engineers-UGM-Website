"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { ApplicationEntry, inputStyle, MockNotice, primaryButton, RecruitmentFrame, secondaryButton } from "./components";
import { documentSlots, MAX_FILE_BYTES, MOCK_NOTICE, recruitmentCatalogs, recruitmentConfig, steps, type RecruitmentCatalog } from "./config";
import { assignmentView, resolvePreference, validateAssignment } from "./assignment";
import { Field, FileField } from "./form-fields";
import { PreferenceStep } from "./preference-step";
import { preferenceFields, type PreferenceRank, type RecruitmentPeriod } from "./recruitment-types";
import { emptyValues, validateFile, validateStep, validateSubmission, type ApplicationFiles, type ApplicationValues, type DocumentKey, type Errors } from "./validation";

const personalFields = [
  { key: "fullName", label: "Nama lengkap", type: "text", placeholder: "Nama sesuai identitas" },
  { key: "nim", label: "NIM", type: "text", placeholder: "Nomor induk mahasiswa" },
  { key: "birthPlace", label: "Tempat lahir", type: "text", placeholder: "Kota / kabupaten" },
  { key: "birthDate", label: "Tanggal lahir", type: "date", placeholder: "" },
  { key: "ugmEmail", label: "Email UGM", type: "email", placeholder: "Alamat email kampus" },
  { key: "phoneNumber", label: "Nomor telepon", type: "tel", placeholder: "Nomor yang dapat dihubungi" },
  { key: "major", label: "Program studi", type: "text", placeholder: "Program studi" },
] as const;

export function ApplicationWizard({ backend = false }: { backend?: boolean }) {
  const [livePeriod, setLivePeriod] = useState<RecruitmentPeriod>();
  const session = useRef("");
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const [receipt, setReceipt] = useState("");
  useEffect(() => {
    if (!backend) return;
    let active = true;
    fetch("/api/recruitment", { cache: "no-store", credentials: "same-origin" })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
      .then(data => { if (active) { session.current = data.token; setLivePeriod(data.period); } })
      .catch(error => { if (active) setServerError(error instanceof Error ? error.message : "Pendaftaran belum tersedia."); });
    return () => { active = false; };
  }, [backend]);
  const [catalog, setCatalog] = useState<RecruitmentCatalog>("draft");
  const period = livePeriod ?? recruitmentCatalogs[catalog];
  const [selectionNotice, setSelectionNotice] = useState("");
  const [values, setValues] = useState<ApplicationValues>({ ...emptyValues });
  const [files, setFiles] = useState<ApplicationFiles>({});
  const [errors, setErrors] = useState<Errors>({});
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"editing" | "review" | "success">("editing");
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    heading.current?.focus();
  }, [step, phase]);

  function change(key: keyof ApplicationValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  function clearAssignment(key: "assignment1" | "assignment2") {
    setFiles((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  function changePreference(rank: PreferenceRank, level: "division" | "subDivision", value: string) {
    const fields = preferenceFields[rank];
    const field = fields[level];
    if (values[field] === value) return;
    setValues((previous) => ({ ...previous, [field]: value, ...(level === "division" ? { [fields.subDivision]: "" } : {}) }));
    clearAssignment(fields.assignment);
    setErrors((previous) => ({ ...previous, subDivision1: undefined, subDivision2: undefined, [fields.division]: undefined, [fields.assignment]: undefined }));
    setSelectionNotice(`Pilihan ${fields.label} diperbarui. File assignment terkait dikosongkan${level === "division" ? " dan sub-divisi perlu dipilih kembali" : ""}.`);
  }

  function changeCatalog(next: RecruitmentCatalog) {
    if (next === catalog) return;
    setCatalog(next);
    setValues((previous) => ({ ...previous, division1: "", subDivision1: "", division2: "", subDivision2: "" }));
    clearAssignment("assignment1");
    clearAssignment("assignment2");
    setErrors({});
    setStep(0);
    setPhase("editing");
    setSelectionNotice("Sumber pilihan berubah. Kedua pilihan divisi, sub-divisi, dan file assignment dikosongkan. Data pribadi serta dokumen pendukung tetap tersedia.");
  }

  function changeFile(key: DocumentKey, file?: File) {
    setFiles((previous) => {
      const next = { ...previous };
      if (file) next[key] = file;
      else delete next[key];
      return next;
    });
    let error: string | undefined;
    if (key === "assignment1" || key === "assignment2") {
      const fields = preferenceFields[key === "assignment1" ? 1 : 2];
      const { subDivision } = resolvePreference(period, values[fields.division], values[fields.subDivision]);
      error = file ? validateAssignment(subDivision?.assignment, file, false) : undefined;
    } else error = file ? validateFile(key, file) : undefined;
    setErrors((previous) => ({ ...previous, [key]: error }));
  }

  function check(target: number, forSubmission = false): boolean {
    const nextErrors = validateStep(target, values, files, period, forSubmission);
    setErrors(nextErrors);
    const firstKey = Object.keys(nextErrors)[0];
    if (!firstKey) return true;
    setPhase("editing");
    setStep(target);
    requestAnimationFrame(() => document.getElementById(`recruit-${firstKey}`)?.focus());
    return false;
  }

  function next() {
    if (!check(step)) return;
    if (step < 3) setStep(step + 1);
    else {
      for (let index = 0; index < 4; index++) if (!check(index)) return;
      setPhase("review");
    }
  }

  function edit(target: number) { setStep(target); setPhase("editing"); setErrors({}); }

  function simulateSubmission() {
  if (recruitmentConfig.status !== "open") return;
    for (let index = 0; index < 4; index++) if (!check(index, true)) return;
    // Deliberately synchronous, memory-only UI transition. No submission adapter,
    // server action, fetch, analytics event, or persistent storage is involved.
    setValues({ ...emptyValues });
    setFiles({});
    setErrors({});
    setSelectionNotice("");
    setPhase("success");
  }

  async function submitApplication() {
    if (sending || !livePeriod) return;
    for (let index = 0; index < 4; index++) if (!check(index, true)) return;
    setSending(true); setServerError("");
    try {
      const body = new FormData();
      for (const [key, value] of Object.entries(values)) body.append(key, value);
      for (const [key, file] of Object.entries(files)) if (file) body.append(key, file);
      const response = await fetch("/api/recruitment", { method: "POST", credentials: "same-origin", headers: { "x-recruitment-session": session.current }, body });
      const data = await response.json();
      if (!response.ok) { setErrors(data.fields ?? {}); throw new Error(data.error); }
      setReceipt(data.applicationId); setValues({ ...emptyValues }); setFiles({}); setErrors({}); setPhase("success");
    } catch (error) { setServerError(error instanceof Error ? error.message : "Pengiriman belum terkonfirmasi. Coba kembali dengan data dan file yang sama."); }
    finally { setSending(false); }
  }

  function handleEnter(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement && ["text", "email", "tel"].includes(event.target.type)) {
      event.preventDefault();
      next();
    }
  }

  if (backend && !livePeriod) return <RecruitmentFrame><section className="mx-auto max-w-xl py-16"><h1 className="font-display text-3xl font-semibold">Pendaftaran SPE UGM SC</h1><p role="status" className="mt-6">{serverError || "Memuat periode pendaftaran..."}</p><Link href="/join" className={`${secondaryButton} mt-6`}>Kembali</Link></section></RecruitmentFrame>;
  if (backend && phase === "success") return <RecruitmentFrame><section className="mx-auto max-w-2xl py-16 text-center"><h1 className="font-display text-3xl font-semibold">Pendaftaran berhasil dikirim.</h1><p className="mt-6">Nomor konfirmasi: <strong>{receipt}</strong></p><p className="mt-4">Simpan nomor ini. Untuk koreksi setelah pengiriman, hubungi panitia. Jangan mengirim aplikasi baru.</p><Link href="/join" className={`${secondaryButton} mt-6`}>Kembali</Link></section></RecruitmentFrame>;

  if (recruitmentConfig.status !== "open") return <RecruitmentFrame>{!backend && <MockNotice />}<section className="mx-auto max-w-xl py-16"><h1 className="font-display text-3xl font-semibold">Form simulasi belum tersedia</h1><div className="mt-6"><ApplicationEntry /></div><Link href="/join" className={`${secondaryButton} mt-6`}>Kembali ke informasi rekrutmen</Link></section></RecruitmentFrame>;

  if (phase === "success") return <RecruitmentFrame>{!backend && <MockNotice />}<section className="mx-auto max-w-2xl py-16 text-center">
    <span aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-full bg-[#ebe6ff] text-3xl text-iris">✓</span>
    <p className="mt-6 text-xs font-semibold tracking-[0.15em] text-iris uppercase">Preview selesai</p>
    <h1 ref={heading} tabIndex={-1} className="mt-4 scroll-mt-32 font-display text-3xl font-semibold tracking-tight outline-none sm:text-4xl">Simulasi berhasil diselesaikan.</h1>
    <p className="mt-5 text-lg font-semibold text-ink-deep">Tidak ada pendaftaran resmi yang dikirim.</p>
    <p className="mt-3 text-base leading-7 text-ink-soft">{MOCK_NOTICE} Isian dan referensi file telah dilepas dari state formulir. Tidak ada nomor pendaftaran atau bukti penerimaan resmi.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/join" className={secondaryButton}>Kembali ke halaman Join</Link><button type="button" className={primaryButton} onClick={() => { setStep(0); setPhase("editing"); }}>Mulai ulang simulasi</button></div>
  </section></RecruitmentFrame>;

  const errorCount = Object.values(errors).filter(Boolean).length;
  const submissionErrors = validateSubmission(values, files, period);
  return <RecruitmentFrame>
    <Link href="/join" className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-ink-soft hover:text-iris focus-visible:outline-2 focus-visible:outline-iris"><span aria-hidden="true">←</span> Informasi rekrutmen</Link>
    {!backend && <MockNotice />}
    {!backend && <div className="mt-6 max-w-3xl">
      <label htmlFor="recruit-catalog" className="mb-2 block text-sm font-semibold text-ink-deep">Sumber pilihan simulasi</label>
      <select id="recruit-catalog" value={catalog} onChange={(event) => changeCatalog(event.target.value as RecruitmentCatalog)} aria-describedby="catalog-notice" className={inputStyle}>
        <option value="draft">Draft guidebook — aturan belum disahkan</option>
        <option value="demo">Data contoh UX — bukan ketentuan resmi</option>
      </select>
      <p id="catalog-notice" className="mt-2 text-sm leading-6 text-ink-soft">{period.notice}</p>
      <p role="status" aria-live="polite" className="mt-2 text-sm leading-6 text-ink-soft">{selectionNotice}</p>
    </div>
    }
    {backend && <p role="status" aria-live="polite" className="mt-2 text-sm text-ink-soft">{selectionNotice}</p>}
    {serverError && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">{serverError}</p>}
    <div className="grid gap-8 pt-10 lg:grid-cols-[250px_1fr] lg:gap-12">
      <aside aria-label="Progres aplikasi">
        <p className="text-xs font-semibold tracking-[0.15em] text-iris uppercase">SPE UGM SC · {period.label}</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">Application<br className="hidden lg:block" /> {backend ? "form." : "preview."}</h2>
        <ol className="mt-6 grid grid-cols-4 gap-2 lg:grid-cols-1 lg:gap-3">{steps.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} className={`flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-center text-xs lg:flex-row lg:gap-3 lg:px-3 lg:text-left lg:text-sm ${step === index ? "bg-[#eeebff] font-semibold text-iris" : "text-ink-soft"}`}><span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-full ${step >= index ? "bg-iris text-white" : "border border-[#dcddea] bg-white"}`}>{step > index ? "✓" : index + 1}</span><span>{label}</span></li>)}</ol>
        <p className="mt-5 text-xs leading-6 text-ink-soft">Pilih dua sub-divisi berbeda; keduanya boleh berada dalam divisi utama yang sama. Data pribadi, alasan, dan dokumen pendukung wajib diisi. Assignment mengikuti sub-divisi. Tombol Sebelumnya mempertahankan isian dan file; reload menghapus semuanya.</p>
      </aside>
      <section className="min-w-0 rounded-3xl border border-[#e4e5ef] bg-white p-5 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-iris uppercase">Langkah {step + 1} dari 4{phase === "review" ? " · Review" : ""}</p>
        <h1 ref={heading} tabIndex={-1} id="wizard-title" className="mt-3 scroll-mt-32 font-display text-2xl font-semibold tracking-tight outline-none sm:text-3xl">{phase === "review" ? (backend ? "Periksa sebelum mengirim" : "Periksa sebelum simulasi submit") : steps[step]}</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">{phase === "review" ? (backend ? "Periksa isian. Aplikasi terkirim tidak dapat diedit mandiri." : "Periksa kembali seluruh isian. Ini hanya simulasi; tidak ada aplikasi yang akan dikirim.") : step === 0 ? (backend ? "Lengkapi identitas Anda sesuai dokumen." : "Gunakan identitas contoh untuk mencoba alur pendaftaran.") : step === 3 ? (backend ? "Lengkapi dokumen sesuai ketentuan panitia." : "Lengkapi lima dokumen berikut, lalu periksa ringkasan sebelum submit simulasi.") : (backend ? "Assignment mengikuti sub-divisi yang dipilih." : "Pilihan divisi dan assignment di sini merupakan placeholder, bukan informasi resmi.")}</p>
        {errorCount > 0 && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Ada {errorCount} field yang perlu diperiksa. Lihat pesan pada masing-masing field.</div>}
        {phase === "review" ? <fieldset disabled={sending} className="mt-8 space-y-7">
          <SummaryGroup title="Data pribadi" onEdit={() => edit(0)}><dl className="grid gap-4 sm:grid-cols-2">{[...personalFields.map((field) => [field.label, values[field.key]]), ["Angkatan", values.batch]].map(([label, value]) => <SummaryValue key={label} label={label} value={value} />)}</dl></SummaryGroup>
          <p className="text-sm leading-6 text-ink-soft">Sumber data: {period.contentState === "approved" ? "konfigurasi resmi panitia" : period.contentState === "demo" ? "contoh UX sintetis" : "draft guidebook, belum disahkan"}.</p>
          {([1, 2] as const).map((rank) => {
            const fields = preferenceFields[rank];
            const { division, subDivision } = resolvePreference(period, values[fields.division], values[fields.subDivision]);
            const assignment = assignmentView(subDivision?.assignment, files[fields.assignment]);
            return <SummaryGroup key={rank} title={`Pilihan ${fields.label}`} onEdit={() => edit(rank)}><dl className="space-y-4"><SummaryValue label="Divisi utama" value={division?.label ?? "—"} /><SummaryValue label="Sub-divisi" value={subDivision?.label ?? "—"} /><SummaryValue label="Alasan" value={values[fields.motivation]} /><SummaryValue label="Assignment" value={assignment.summary} /></dl></SummaryGroup>;
          })}
          <SummaryGroup title="Dokumen pendukung" onEdit={() => edit(3)}><dl className="space-y-4">{documentSlots.map((slot) => <SummaryValue key={slot.key} label={`${slot.label} (${slot.format})`} value={`${files[slot.key]?.name ?? "—"} · ${((files[slot.key]?.size ?? 0) / 1024).toFixed(1)} KiB`} />)}</dl></SummaryGroup>
          <div className="rounded-2xl bg-[#f2efff] p-5 text-sm leading-6 text-[#4a398c]"><p className="font-semibold">{backend ? "Data dan dokumen dikirim privat kepada panitia." : MOCK_NOTICE}</p><p className="mt-1">{backend ? "Jika koneksi terputus, coba kembali dengan data dan file yang sama tanpa memuat ulang halaman. Untuk koreksi setelah pengiriman, hubungi panitia." : "Klik tombol di bawah hanya menyelesaikan preview pada browser ini. Data dan file tidak disimpan atau dikirim."}</p></div>
          {Object.keys(submissionErrors).length > 0 && <div id="submission-blockers" role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><p className="font-semibold">{backend ? "Pengiriman belum tersedia" : "Submit simulasi belum tersedia"}</p><ul className="mt-2 list-disc space-y-1 pl-5">{Object.entries(submissionErrors).map(([field, message]) => <li key={field}>{field === "subDivision1" ? "Pilihan pertama: " : field === "subDivision2" ? "Pilihan kedua: " : ""}{message}</li>)}</ul><p className="mt-2">{backend ? "Periksa isian atau hubungi panitia." : "Ubah pilihan terkait atau tunggu konfigurasi panitia. Mode data contoh UX dapat digunakan untuk mencoba aturan sintetis yang lengkap."}</p></div>}
          <div className="flex flex-col-reverse justify-between gap-3 border-t border-[#e7e8f0] pt-6 sm:flex-row"><button type="button" className={secondaryButton} onClick={() => edit(3)}>Sebelumnya</button><button type="button" className={primaryButton} onClick={backend ? submitApplication : simulateSubmission} disabled={sending || Object.keys(submissionErrors).length > 0} aria-describedby={Object.keys(submissionErrors).length > 0 ? "submission-blockers" : undefined}>{backend ? sending ? "Mengirim..." : "Kirim pendaftaran" : "Submit simulasi"} <span aria-hidden="true">✓</span></button></div>
        </fieldset> : <div role="form" aria-labelledby="wizard-title" onKeyDown={handleEnter} className="mt-8">
          {/* No HTML form or named controls: there is no native network-submit path,
              including before hydration or when JavaScript is unavailable. */}
          <noscript><p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Aktifkan JavaScript untuk mencoba simulasi. Form ini tidak dapat mengirim pendaftaran.</p></noscript>
          <fieldset><legend className="sr-only">{steps[step]}</legend>
            {step === 0 && <div className="grid gap-6 sm:grid-cols-2">{personalFields.map((field) => {
              const id = `recruit-${field.key}`;
              const hint = field.key === "ugmEmail" ? backend ? "Masukkan alamat email aktif. Untuk koreksi setelah pengiriman, hubungi panitia." : "Simulasi hanya memeriksa format email. Domain UGM resmi belum dikonfigurasi." : field.key === "nim" ? "NIM diperlakukan sebagai teks. Aturan format resmi belum ditetapkan." : undefined;
              return <Field key={field.key} id={id} label={field.label} error={errors[field.key]} hint={hint}><input id={id} type={field.type} value={values[field.key]} onChange={(event) => change(field.key, event.target.value)} placeholder={field.placeholder} autoComplete="off" maxLength={field.key === "ugmEmail" ? 254 : field.key === "phoneNumber" ? 25 : 150} required aria-invalid={Boolean(errors[field.key])} aria-describedby={[hint ? `${id}-hint` : "", errors[field.key] ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined} className={inputStyle} /></Field>;
            })}<Field id="recruit-batch" label="Angkatan" error={errors.batch}><select id="recruit-batch" value={values.batch} onChange={(event) => change("batch", event.target.value)} required aria-invalid={Boolean(errors.batch)} aria-describedby={errors.batch ? "recruit-batch-error" : undefined} className={inputStyle}><option value="">Pilih angkatan</option>{period.batches.map((batch) => <option key={batch} value={batch}>{batch}</option>)}</select></Field></div>}
            {(step === 1 || step === 2) && <PreferenceStep rank={step} period={period} values={values} files={files} errors={errors} onDivision={(value) => changePreference(step, "division", value)} onSubDivision={(value) => changePreference(step, "subDivision", value)} onMotivation={(value) => change(preferenceFields[step].motivation, value)} onFile={(file) => changeFile(preferenceFields[step].assignment, file)} />}
            {step === 3 && <div className="space-y-6">{documentSlots.map((slot) => <FileField key={slot.key} slot={slot} required={period.documents?.[slot.key]?.required ?? true} upload={period.documents?.[slot.key] ?? { formats: [slot.format === "PDF" ? "pdf" : "png"], maxBytes: MAX_FILE_BYTES, filename: slot.filename }} file={files[slot.key]} error={errors[slot.key]} onChange={(file) => changeFile(slot.key, file)} />)}</div>}
          </fieldset>
          <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-[#e7e8f0] pt-6 sm:flex-row">{step > 0 ? <button type="button" className={secondaryButton} onClick={() => edit(step - 1)}>Sebelumnya</button> : <Link href="/join" className={secondaryButton}>Kembali</Link>}<button type="button" className={primaryButton} onClick={next}>{step === 3 ? "Review isian" : "Selanjutnya"}<span aria-hidden="true">→</span></button></div>
          <p className="mt-4 text-center text-xs text-ink-soft">{backend ? "Dokumen disimpan privat untuk panitia." : MOCK_NOTICE}</p>
        </div>}
      </section>
    </div>
  </RecruitmentFrame>;
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs font-medium text-ink-soft">{label}</dt><dd className="mt-1 text-sm leading-6 whitespace-pre-wrap break-words text-ink-deep">{value}</dd></div>;
}

function SummaryGroup({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return <section className="rounded-2xl border border-[#e4e5ef] p-5"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-base font-semibold">{title}</h2><button type="button" onClick={onEdit} aria-label={`Ubah ${title}`} className="min-h-10 rounded-lg px-2 text-sm font-semibold text-iris hover:bg-[#f2efff] focus-visible:outline-2 focus-visible:outline-iris">Ubah</button></div>{children}</section>;
}
