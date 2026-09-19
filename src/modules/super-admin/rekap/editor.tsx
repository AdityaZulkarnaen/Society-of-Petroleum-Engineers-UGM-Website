"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ComponentProps } from "react";

import {
  Card,
  primaryButton,
  ProgressBar,
  SectionHeading,
} from "@/modules/admin/components/ui";
import { RATING } from "@/modules/admin/rekap-diri/competency-list";
import {
  COMPETENCIES,
  RATINGS,
  type Rating,
  type SelfReport,
} from "@/modules/admin/rekap-diri/data";
import type { Account } from "@/modules/super-admin/accounts/fields";

import { saveRekap } from "./actions";
import {
  NOTE_MAX,
  NOTES,
  STATS,
  validateRekap,
  type RekapErrors,
  type RekapInput,
} from "./fields";

/* Layout only; colours and height are added per field so they never compete. */
const controlBase =
  "w-full rounded-lg border px-3.5 text-sm " +
  "placeholder:text-[#6f7286] transition-[border-color,box-shadow] " +
  "focus-visible:border-[#4f8dff]/60 focus-visible:ring-4 focus-visible:ring-[#4f8dff]/15 focus-visible:outline-none " +
  "aria-invalid:border-[#f87171]/60";

/* Inside the glass cards everything is solid, so only the outer containers
   read as glass. */
const neutral = "border-white/[0.09] bg-[#1a1d2f] text-white";
const control = `${controlBase} h-[42px] ${neutral}`;

const label =
  "block text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase";

/* The level select takes the colour of the chosen rating. */
const RATING_SELECT: Record<Rating, string> = {
  sangat_baik: "border-[#34d399]/35 bg-[#0d2724] text-[#4ade80]",
  baik: "border-[#3b82f6]/40 bg-[#111e44] text-[#6aa5ff]",
  cukup: "border-white/15 bg-[#1a1d2f] text-[#c7c9d4]",
  perlu_ditingkatkan: "border-[#f59e0b]/40 bg-[#282010] text-[#fbbf24]",
};

function Chevron() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 opacity-80"
    >
      <path d="m3 4.5 3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Select({
  colors = neutral,
  height = "h-[42px]",
  className = "",
  ...props
}: ComponentProps<"select"> & { colors?: string; height?: string }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${controlBase} ${height} ${colors} appearance-none pr-9 [&>option]:bg-[#151a38] [&>option]:text-white ${className}`}
      />
      <Chevron />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-[#fca5a5]">
      {message}
    </p>
  );
}

type Row = { key: number; competency: string; score: string; rating: string };

let nextKey = 0;

/** The editor's starting values: the saved rekap, or blanks. */
function initialState(report: SelfReport | null) {
  const pair = (t: { done: number; total: number } | null | undefined) => ({
    done: t ? String(t.done) : "",
    target: t ? String(t.total) : "",
  });
  return {
    stats: {
      proker: pair(report?.proker),
      attendance: pair(report?.attendance),
      points: pair(report?.points),
    },
    rows: (report?.competencies ?? [])
      .filter((c) => c.current != null)
      .map((c) => ({
        key: nextKey++,
        competency: c.name,
        score: String(c.current),
        rating: c.rating ?? "",
      })),
    notes: {
      achievements: report?.notes.achievements ?? "",
      strengths: report?.notes.strengths ?? "",
      improvements: report?.notes.improvements ?? "",
    },
  };
}

const optionLabel = (a: Account) =>
  [
    a.fullName,
    a.position,
    a.division && `Divisi ${a.division}`,
    !a.isActive && "nonaktif",
  ]
    .filter(Boolean)
    .join(" · ");

export function RekapEditor({
  accounts,
  selected,
  report,
  hasRekap,
  period,
}: {
  accounts: Account[];
  selected: Account;
  report: SelfReport | null;
  /** Ids of pengurus with a rekap saved this period. */
  hasRekap: string[];
  period: string;
}) {
  const router = useRouter();
  const [initial] = useState(() => initialState(report));
  const [stats, setStats] = useState(initial.stats);
  const [rows, setRows] = useState<Row[]>(initial.rows);
  const [notes, setNotes] = useState(initial.notes);
  const [errors, setErrors] = useState<RekapErrors>({});
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [switching, startSwitch] = useTransition();

  const saved = hasRekap.includes(selected.id);
  const used = new Set(rows.map((r) => r.competency));

  function touch() {
    setDirty(true);
    setStatus(null);
  }

  function input(): RekapInput {
    return {
      stats,
      competencies: rows.map(({ competency, score, rating }) => ({
        competency,
        score,
        rating,
      })),
      notes,
    };
  }

  function choose(id: string) {
    if (
      dirty &&
      !window.confirm("Perubahan rekap belum disimpan. Pindah pengurus dan buang perubahan?")
    ) {
      return;
    }
    startSwitch(() => router.push(`/super-admin/rekap?pengurus=${id}`, { scroll: false }));
  }

  function save() {
    if (pending) return;
    const check = validateRekap(input());
    setErrors(check.errors);
    if (!check.ok) {
      setStatus({ tone: "error", text: "Periksa kembali isian yang ditandai." });
      return;
    }
    startTransition(async () => {
      const result = await saveRekap(selected.id, input());
      setErrors(result.errors ?? {});
      if (result.error) {
        setStatus({ tone: "error", text: result.error });
      } else {
        setDirty(false);
        setStatus({ tone: "success", text: `Rekap ${selected.fullName} tersimpan.` });
      }
    });
  }

  function addRow() {
    const free = COMPETENCIES.find((c) => !used.has(c));
    if (!free) return;
    setRows((r) => [...r, { key: nextKey++, competency: free, score: "", rating: "" }]);
    touch();
  }

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    touch();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
          Rekap Pengurus
        </h1>
        <p className="mt-2 text-sm text-[#8a8ea3]">
          Pilih pengurus untuk melihat dan mengedit data rekap periode aktif ({period}).
        </p>
      </header>

      <div>
        <label htmlFor="rekap-pengurus" className={`${label} mb-2.5`}>
          Pilih Pengurus
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Select
              id="rekap-pengurus"
              value={selected.id}
              onChange={(e) => choose(e.target.value)}
              disabled={switching}
              height="h-12"
              colors="border-white/[0.12] bg-[#0d1024] text-white"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {optionLabel(a)}
                </option>
              ))}
            </Select>
          </div>
          <span
            className={`inline-flex h-8 shrink-0 items-center self-start rounded-lg border px-3 text-xs font-semibold sm:self-auto ${
              saved
                ? "border-[#34d399]/30 bg-[#34d399]/10 text-[#4ade80]"
                : "border-white/15 bg-[#14172a] text-[#a3a6b8]"
            }`}
          >
            {saved ? "Data tersedia" : "Belum ada data"}
          </span>
        </div>
      </div>

      <div className={`space-y-6 transition-opacity ${switching ? "opacity-50" : ""}`}>
        <Card className="p-6">
          <SectionHeading eyebrow="Input Data" title="Statistik Kontribusi" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {STATS.map(({ key, label: title }) => {
              const { done, target } = stats[key];
              const d = Number(done);
              const t = Number(target);
              const valid = done !== "" && target !== "" && t > 0 && d >= 0;
              const percent = valid ? Math.round(Math.min(1, d / t) * 100) : null;
              const set = (field: "done" | "target", value: string) => {
                setStats((s) => ({ ...s, [key]: { ...s[key], [field]: value } }));
                touch();
              };
              return (
                <fieldset
                  key={key}
                  className="rounded-xl border border-white/[0.07] bg-[#0b0e1f]/50 p-4"
                >
                  <legend className="sr-only">{title}</legend>
                  <p aria-hidden="true" className={label}>
                    {title}
                  </p>
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-x-2.5">
                    {(["done", "target"] as const).map((field, i) => (
                      <div key={field} className={i === 1 ? "col-start-3" : undefined}>
                        <label htmlFor={`${key}-${field}`} className={`${label} mb-2`}>
                          {field === "done" ? "Capaian" : "Target"}
                        </label>
                        <input
                          id={`${key}-${field}`}
                          inputMode="numeric"
                          value={stats[key][field]}
                          onChange={(e) => set(field, e.target.value)}
                          aria-invalid={Boolean(errors[`${key}.${field}`])}
                          aria-describedby={`${key}-${field}-error`}
                          className={control}
                        />
                      </div>
                    ))}
                    <span
                      aria-hidden="true"
                      className="col-start-2 row-start-1 pb-2.5 text-lg text-[#5d6075]"
                    >
                      /
                    </span>
                  </div>
                  <FieldError id={`${key}-done-error`} message={errors[`${key}.done`]} />
                  <FieldError id={`${key}-target-error`} message={errors[`${key}.target`]} />
                  <ProgressBar percent={percent} label={title} className="mt-4" />
                  <p className="mt-2 text-right text-xs font-bold text-[#4f8dff]">
                    {percent == null ? (
                      <span className="font-normal text-[#6f7286]">—</span>
                    ) : (
                      `${percent}%`
                    )}
                  </p>
                </fieldset>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Penilaian HR" title="Evaluasi Kompetensi" />

          <div className="mt-6 hidden grid-cols-[minmax(0,1fr)_120px_160px_32px] gap-2.5 border-b border-white/[0.06] pb-2.5 sm:grid">
            <span className={label}>Kompetensi</span>
            <span className={label}>Skor (1–5)</span>
            <span className={`${label} col-span-2`}>Level Kualitatif</span>
          </div>

          {rows.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-white/10 px-5 py-6 text-center text-[13px] text-[#6f7286]">
              Belum ada kompetensi yang dinilai. Tambahkan lewat tombol di bawah.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {rows.map((row, i) => {
                const e = (f: string) => errors[`competency.${i}.${f}`];
                const message = e("competency") ?? e("score") ?? e("rating");
                return (
                  <li key={row.key}>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] gap-2.5 sm:grid-cols-[minmax(0,1fr)_120px_160px_32px]">
                      <div className="col-span-3 sm:col-span-1">
                        <Select
                          aria-label={`Kompetensi baris ${i + 1}`}
                          value={row.competency}
                          onChange={(ev) => updateRow(row.key, { competency: ev.target.value })}
                          aria-invalid={Boolean(e("competency"))}
                        >
                          {COMPETENCIES.map((c) => (
                            <option
                              key={c}
                              value={c}
                              disabled={c !== row.competency && used.has(c)}
                            >
                              {c}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <input
                        aria-label={`Skor ${row.competency}`}
                        inputMode="decimal"
                        placeholder="1–5"
                        value={row.score}
                        onChange={(ev) => updateRow(row.key, { score: ev.target.value })}
                        aria-invalid={Boolean(e("score"))}
                        className={control}
                      />
                      <Select
                        aria-label={`Level ${row.competency}`}
                        value={row.rating}
                        onChange={(ev) => updateRow(row.key, { rating: ev.target.value })}
                        aria-invalid={Boolean(e("rating"))}
                        colors={
                          row.rating
                            ? RATING_SELECT[row.rating as Rating]
                            : "border-white/[0.09] bg-[#1a1d2f] text-[#6f7286]"
                        }
                        className="font-medium"
                      >
                        <option value="" disabled>
                          Pilih level
                        </option>
                        {RATINGS.map((r) => (
                          <option key={r} value={r}>
                            {RATING[r].label}
                          </option>
                        ))}
                      </Select>
                      <button
                        type="button"
                        onClick={() => {
                          setRows((r) => r.filter((x) => x.key !== row.key));
                          touch();
                        }}
                        aria-label={`Hapus ${row.competency}`}
                        className="grid h-[42px] w-8 place-items-center rounded-lg text-[#f87171]/80 transition-colors hover:bg-[#f87171]/10 hover:text-[#f87171]"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                          <path d="m3 3 8 8M11 3l-8 8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    {message && <p className="mt-1.5 text-xs text-[#fca5a5]">{message}</p>}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={addRow}
              disabled={used.size >= COMPETENCIES.length}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-white/15 bg-[#14172a] px-4 text-sm text-[#a3a6b8] transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M7 2.5v9M2.5 7h9" strokeLinecap="round" />
              </svg>
              Tambah Kompetensi
            </button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Narasi Evaluator" title="Catatan & Ringkasan dari HR" />
          <div className="mt-6 space-y-6">
            {NOTES.map(({ key, label: title }) => (
              <div key={key}>
                <label htmlFor={`note-${key}`} className={`${label} mb-2.5`}>
                  {title}
                </label>
                <textarea
                  id={`note-${key}`}
                  rows={4}
                  maxLength={NOTE_MAX}
                  value={notes[key]}
                  onChange={(e) => {
                    setNotes((n) => ({ ...n, [key]: e.target.value }));
                    touch();
                  }}
                  aria-invalid={Boolean(errors[`notes.${key}`])}
                  className={`${controlBase} border-white/[0.08] bg-[#0b0e1f]/70 text-white min-h-[108px] resize-y py-3 leading-relaxed`}
                />
                <FieldError id={`note-${key}-error`} message={errors[`notes.${key}`]} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <p
          aria-live="polite"
          className={`text-[13px] ${
            status?.tone === "error"
              ? "text-[#fca5a5]"
              : status
                ? "text-[#6ee7b7]"
                : "text-[#8a8ea3]"
          }`}
        >
          {status?.text ?? (dirty ? "Ada perubahan yang belum disimpan." : "")}
        </p>
        <button
          type="button"
          onClick={save}
          aria-disabled={pending}
          className={`${primaryButton} h-12 px-7 aria-disabled:cursor-wait aria-disabled:opacity-70`}
        >
          {pending ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
}
