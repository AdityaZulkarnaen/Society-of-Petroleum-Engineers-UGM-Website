"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ComponentProps } from "react";

import {
  Card,
  compactCardSurface,
  primaryButton,
  ProgressBar,
  SectionHeading,
  Badge,
} from "@/modules/admin/components/ui";
import {
  COMPETENCIES,
  MAX_SCORE,
  getKategori,
  type Kategori,
  type SelfReport,
} from "@/modules/admin/rekap-diri/data";
import type { Tone } from "@/modules/admin/components/ui";
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

const KATEGORI_TONE: Record<Kategori, Tone> = {
  "Sangat Baik": "green",
  "Baik": "blue",
  "Cukup": "neutral",
  "Kurang": "amber",
  "Sangat Kurang": "amber",
};

/* Layout only; colours and height are added per field so they never compete. */
const controlBase =
  "w-full rounded-lg border px-3.5 text-sm " +
  "placeholder:text-[#6f7286] transition-[border-color,box-shadow] " +
  "focus-visible:border-[#4f8dff]/60 focus-visible:ring-4 focus-visible:ring-[#4f8dff]/15 focus-visible:outline-none " +
  "aria-invalid:border-[#f87171]/60";

const neutral = "border-white/[0.09] bg-[#1a1d2f] text-white";
const control = `${controlBase} h-[42px] ${neutral}`;

const label =
  "block text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase";

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

/** The editor's starting values: the saved rekap, or blanks. */
function initialState(report: SelfReport | null) {
  const pair = (t: { done: number; total: number } | null | undefined) => ({
    done: t ? String(t.done) : "",
    target: t ? String(t.total) : "",
  });

  // Build scores array indexed by COMPETENCIES order
  const scoresByName = new Map(
    (report?.competencies ?? []).map((c) => [c.name, c.current]),
  );
  const scores = COMPETENCIES.map((name) => {
    const val = scoresByName.get(name);
    return val != null ? String(val) : "";
  });

  return {
    stats: {
      proker: pair(report?.proker),
      attendance: pair(report?.attendance),
      points: pair(report?.points),
    },
    scores,
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
  const [scores, setScores] = useState<string[]>(initial.scores);
  const [notes, setNotes] = useState(initial.notes);
  const [errors, setErrors] = useState<RekapErrors>({});
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [switching, startSwitch] = useTransition();

  const saved = hasRekap.includes(selected.id);

  // Compute total and rata-rata from current scores
  const parsedScores = scores.map((s) => {
    const v = Number(s.replace(",", "."));
    return s.trim() && !isNaN(v) && v >= 1 && v <= 5 ? v : null;
  });
  const scoredValues = parsedScores.filter((v): v is number => v != null);
  const totalScore = scoredValues.reduce((sum, v) => sum + v, 0);
  const rataRata = scoredValues.length > 0 ? totalScore / scoredValues.length : null;
  const kategori = rataRata != null ? getKategori(rataRata) : null;

  function touch() {
    setDirty(true);
    setStatus(null);
  }

  function input(): RekapInput {
    return {
      stats,
      competencyScores: scores,
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

  function updateScore(index: number, value: string) {
    setScores((s) => {
      const next = [...s];
      next[index] = value;
      return next;
    });
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
        <Card surface={compactCardSurface} className="p-6">
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

        <Card surface={compactCardSurface} className="p-6">
          <SectionHeading eyebrow="Penilaian HR" title="Evaluasi Kompetensi" />
          <p className="mt-2 text-xs text-[#6f7286]">
            Masukkan skor 1–5 (desimal diperbolehkan) untuk setiap aspek kompetensi.
          </p>

          {/* Header */}
          <div className="mt-5 hidden grid-cols-[2rem_1fr_100px] gap-2.5 border-b border-white/[0.06] pb-2.5 sm:grid">
            <span className={label}>No</span>
            <span className={label}>Aspek Kompetensi</span>
            <span className={label}>Skor</span>
          </div>

          {/* Rows */}
          <ul className="mt-3 space-y-2">
            {COMPETENCIES.map((name, i) => (
              <li
                key={name}
                className="grid grid-cols-[2rem_1fr_100px] items-center gap-2.5 rounded-lg border border-white/[0.06] bg-[#0b0e1f]/30 px-3 py-2.5"
              >
                <span className="text-xs font-medium text-[#6f7286]">{i + 1}</span>
                <p className="text-sm text-[#e3e5ee]">{name}</p>
                <div>
                  <input
                    aria-label={`Skor ${name}`}
                    inputMode="decimal"
                    placeholder="1–5"
                    value={scores[i]}
                    onChange={(e) => updateScore(i, e.target.value)}
                    aria-invalid={Boolean(errors[`competency.${i}`])}
                    className={`${control} text-center`}
                  />
                  {errors[`competency.${i}`] && (
                    <p className="mt-1 text-[11px] text-[#fca5a5]">{errors[`competency.${i}`]}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Summary: Total & Rata-rata */}
          <div className="mt-5 space-y-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#a3a6b8]">Total</span>
              <span className="text-lg font-bold tabular-nums text-white">
                {scoredValues.length > 0
                  ? `${totalScore.toFixed(1)} / ${COMPETENCIES.length * MAX_SCORE}`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#a3a6b8]">Rata-rata</span>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold tabular-nums text-white">
                  {rataRata != null ? `${rataRata.toFixed(2)} / ${MAX_SCORE}` : "—"}
                </span>
                {kategori && (
                  <Badge tone={KATEGORI_TONE[kategori]}>{kategori}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Interpretasi Nilai legend */}
          <details className="mt-4 text-xs text-[#6f7286]">
            <summary className="cursor-pointer font-medium text-[#8a8ea3] hover:text-white">
              Interpretasi Nilai
            </summary>
            <div className="mt-2 space-y-1 pl-1">
              <p><span className="font-semibold text-[#4ade80]">4.21 – 5.00</span> — Sangat Baik</p>
              <p><span className="font-semibold text-[#6aa5ff]">3.41 – 4.20</span> — Baik</p>
              <p><span className="font-semibold text-[#c7c9d4]">2.61 – 3.40</span> — Cukup</p>
              <p><span className="font-semibold text-[#fbbf24]">1.81 – 2.60</span> — Kurang</p>
              <p><span className="font-semibold text-[#f87171]">1.00 – 1.80</span> — Sangat Kurang</p>
            </div>
          </details>
        </Card>

        <Card surface={compactCardSurface} className="p-6">
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
