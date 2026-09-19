"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

import { control, controlBase, Field } from "@/modules/admin/components/form";
import { ModalHeader } from "@/modules/admin/components/modal";
import { primaryButton, secondaryButton } from "@/modules/admin/components/ui";
import type { Candidate } from "@/modules/admin/voting/data";

import { discardCandidatePhotos } from "./actions";
import {
  POINT_MAX,
  POINTS_MAX,
  validateCandidate,
  VISION_MAX,
  type ActionResult,
  type CandidateInput,
  type FormErrors,
} from "./fields";
import { PhotoUpload } from "./photo-upload";

type Point = { key: number; text: string };

let nextKey = 0;

const toPoints = (items: string[] | undefined): Point[] =>
  (items?.length ? items : [""]).map((text) => ({ key: nextKey++, text }));

const fieldLabel =
  "block text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase";

/** Program Unggulan / Pencapaian: a growing list of one-line points. */
function PointList({
  id,
  label,
  points,
  errors,
  errorKey,
  onChange,
}: {
  id: string;
  label: string;
  points: Point[];
  errors: FormErrors;
  errorKey: string;
  onChange: (points: Point[]) => void;
}) {
  return (
    <fieldset>
      <legend className={`${fieldLabel} mb-2`}>{label}</legend>
      <ul className="space-y-2">
        {points.map((point, i) => (
          <li key={point.key}>
            <div className="flex items-center gap-2">
              <input
                id={i === 0 ? id : undefined}
                aria-label={`${label} poin ${i + 1}`}
                value={point.text}
                onChange={(e) =>
                  onChange(
                    points.map((p) => (p.key === point.key ? { ...p, text: e.target.value } : p)),
                  )
                }
                placeholder={`Poin ${i + 1}`}
                maxLength={POINT_MAX}
                aria-invalid={Boolean(errors[`${errorKey}.${i}`])}
                className={control}
              />
              <button
                type="button"
                onClick={() =>
                  onChange(
                    points.length > 1
                      ? points.filter((p) => p.key !== point.key)
                      : [{ key: nextKey++, text: "" }],
                  )
                }
                aria-label={`Hapus ${label} poin ${i + 1}`}
                className="grid h-[42px] w-8 shrink-0 place-items-center rounded-lg text-[#f87171]/80 transition-colors hover:bg-[#f87171]/10 hover:text-[#f87171]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="m3 3 8 8M11 3l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {errors[`${errorKey}.${i}`] && (
              <p className="mt-1.5 text-xs text-[#fca5a5]">{errors[`${errorKey}.${i}`]}</p>
            )}
          </li>
        ))}
      </ul>
      {errors[errorKey] && <p className="mt-1.5 text-xs text-[#fca5a5]">{errors[errorKey]}</p>}
      <div className="mt-2.5 flex justify-center pr-10">
        <button
          type="button"
          onClick={() => onChange([...points, { key: nextKey++, text: "" }])}
          disabled={points.length >= POINTS_MAX}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashed border-white/15 px-3.5 text-sm text-[#a3a6b8] transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M7 2.5v9M2.5 7h9" strokeLinecap="round" />
          </svg>
          Tambah poin
        </button>
      </div>
    </fieldset>
  );
}

/** Tambah / Edit Kandidat. */
export function CandidateForm({
  candidate,
  onSubmit,
  onClose,
  onPendingChange,
}: {
  /** Omitted when adding. */
  candidate?: Candidate;
  onSubmit: (input: CandidateInput) => Promise<ActionResult>;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [programs, setPrograms] = useState(() => toPoints(candidate?.programs));
  const [achievements, setAchievements] = useState(() => toPoints(candidate?.achievements));
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [photoUrl, setPhotoUrl] = useState(candidate?.photoUrl ?? null);
  const editing = Boolean(candidate);
  const prefix = editing ? "edit-candidate" : "new-candidate";

  /* Photos uploaded while the dialog is open, and the one that got saved.
     Whatever else was uploaded is removed when the dialog goes away. */
  const uploads = useRef<string[]>([]);
  const savedPhoto = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const uploaded = uploads.current;
    return () => {
      const unused = uploaded.filter((url) => url !== savedPhoto.current);
      if (unused.length) void discardCandidatePhotos(unused);
    };
  }, []);

  /* onSubmit rather than a form action, which would reset the fields */
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "");
    const input: CandidateInput = {
      fullName: text("fullName"),
      nim: text("nim"),
      position: text("position"),
      photoUrl: photoUrl ?? "",
      vision: text("vision"),
      grandDesignUrl: text("grandDesignUrl"),
      programs: programs.map((p) => p.text),
      achievements: achievements.map((p) => p.text),
    };

    const check = validateCandidate(input);
    setErrors(check.errors);
    if (!check.ok) {
      setFormError(null);
      return;
    }

    onPendingChange(true);
    startTransition(async () => {
      const result = await onSubmit(input);
      if (!result.error && !result.errors) savedPhoto.current = photoUrl;
      onPendingChange(false);
      setErrors(result.errors ?? {});
      setFormError(result.error ?? null);
    });
  }

  const fieldProps = (name: keyof CandidateInput) => ({
    id: `${prefix}-${name}`,
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${prefix}-${name}-error` : undefined,
    autoComplete: "off",
  });

  return (
    <form onSubmit={submit} noValidate className="px-6 pt-7 pb-7 sm:px-8">
      <ModalHeader
        id={`${prefix}-title`}
        title={editing ? "Edit Kandidat" : "Tambah Kandidat"}
        onClose={onClose}
        disabled={pending}
      />

      <div className="mt-7 grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <Field id={`${prefix}-fullName`} label="Nama Lengkap" error={errors.fullName}>
          <input
            {...fieldProps("fullName")}
            defaultValue={candidate?.fullName}
            placeholder="Nama kandidat"
            autoFocus
            className={control}
          />
        </Field>
        <Field id={`${prefix}-nim`} label="NIM" error={errors.nim}>
          <input
            {...fieldProps("nim")}
            defaultValue={candidate?.nim ?? ""}
            placeholder="xx/xxxxxx/TK/xxxxx"
            className={control}
          />
        </Field>
        <Field id={`${prefix}-position`} label="Jabatan Saat Ini" error={errors.position}>
          <input
            {...fieldProps("position")}
            defaultValue={candidate?.position ?? ""}
            placeholder="Kepala Bidang Teknik"
            maxLength={80}
            className={control}
          />
        </Field>
        <Field id={`${prefix}-photoUrl`} label="Foto">
          <PhotoUpload
            id={`${prefix}-photoUrl`}
            value={photoUrl}
            name={candidate?.fullName ?? ""}
            error={errors.photoUrl}
            onChange={setPhotoUrl}
            onUploaded={(url) => uploads.current.push(url)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field id={`${prefix}-vision`} label="Visi" error={errors.vision}>
            <textarea
              {...fieldProps("vision")}
              defaultValue={candidate?.vision ?? ""}
              placeholder="Visi sebagai Ketua Umum..."
              rows={3}
              maxLength={VISION_MAX}
              className={`${controlBase} min-h-[84px] resize-y py-3 leading-relaxed`}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field
            id={`${prefix}-grandDesignUrl`}
            label="URL Access Grand Design"
            error={errors.grandDesignUrl}
          >
            <input
              {...fieldProps("grandDesignUrl")}
              type="url"
              defaultValue={candidate?.grandDesignUrl ?? ""}
              placeholder="https://..."
              className={control}
            />
          </Field>
        </div>
        <PointList
          id={`${prefix}-programs`}
          label="Program Unggulan"
          points={programs}
          errors={errors}
          errorKey="programs"
          onChange={setPrograms}
        />
        <PointList
          id={`${prefix}-achievements`}
          label="Pencapaian"
          points={achievements}
          errors={errors}
          errorKey="achievements"
          onChange={setAchievements}
        />
      </div>

      {formError && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-[#f87171]/25 bg-[#f87171]/10 px-4 py-3 text-[13px] text-[#fca5a5]"
        >
          {formError}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={pending} className={secondaryButton}>
          Batal
        </button>
        <button
          type="submit"
          aria-disabled={pending}
          className={`${primaryButton} aria-disabled:cursor-wait aria-disabled:opacity-70`}
        >
          {pending ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Tambah Kandidat"}
        </button>
      </div>
    </form>
  );
}
