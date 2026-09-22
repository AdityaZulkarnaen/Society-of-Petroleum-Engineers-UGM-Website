"use client";

import { useState, useTransition, type FormEvent } from "react";

import {
  control,
  controlBase,
  Field,
} from "@/modules/admin/components/form";
import { ModalHeader } from "@/modules/admin/components/modal";
import { primaryButton, secondaryButton } from "@/modules/admin/components/ui";
import { toJakartaInput } from "@/modules/admin/presensi/format";
import {
  MEETING_SCOPES,
  SCOPE,
  type MeetingScope,
} from "@/modules/admin/presensi/status";

import {
  LATE_MAX,
  LOCATION_MAX,
  NOTES_MAX,
  TITLE_MAX,
  validateMeeting,
  type ActionResult,
  type FormErrors,
  type ManagedMeeting,
  type MeetingInput,
} from "./fields";

/* The next 'Rapat ke-' for each scope, so switching the jenis rapat renumbers
   the field the way it would be numbered on save. */
type Sequences = Record<MeetingScope, number>;

/** Default start: today at 16.00 Jakarta, the usual rapat slot. */
function defaultStart() {
  const now = toJakartaInput(new Date().toISOString());
  return `${now.slice(0, 10)}T16:00`;
}

/**
 * Tambah / Edit Rapat. A super admin always organises for their own division;
 * the jenis rapat only decides who is called — their division, or everyone.
 */
export function MeetingForm({
  meeting,
  division,
  sequences,
  onSubmit,
  onClose,
  onPendingChange,
}: {
  /** Omitted when creating. */
  meeting?: ManagedMeeting;
  division: string | null;
  sequences: Sequences;
  onSubmit: (input: MeetingInput) => Promise<ActionResult>;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const editing = Boolean(meeting);
  const [scope, setScope] = useState<MeetingScope>(meeting?.scope ?? "divisi");
  const [sequence, setSequence] = useState(
    String(meeting?.sequence ?? sequences.divisi),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const prefix = editing ? "edit-meeting" : "new-meeting";

  /* Editing keeps the saved number; a new rapat follows its scope. */
  function pickScope(next: MeetingScope) {
    setScope(next);
    if (!editing) setSequence(String(sequences[next]));
  }

  /* onSubmit rather than a form action, which would reset the fields */
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const input: MeetingInput = {
      title: String(data.get("title") ?? ""),
      scope,
      sequence,
      scheduledAt: String(data.get("scheduledAt") ?? ""),
      location: String(data.get("location") ?? ""),
      notes: String(data.get("notes") ?? ""),
      lateAfterMinutes: String(data.get("lateAfterMinutes") ?? ""),
    };

    const check = validateMeeting(input);
    setErrors(check.errors);
    if (!check.ok) {
      setFormError(null);
      return;
    }

    onPendingChange(true);
    startTransition(async () => {
      const result = await onSubmit(input);
      onPendingChange(false);
      setErrors(result.errors ?? {});
      setFormError(result.error ?? null);
    });
  }

  const fieldProps = (name: keyof MeetingInput) => ({
    id: `${prefix}-f-${name}`,
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${prefix}-f-${name}-error` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate className="px-6 pt-7 pb-7 sm:px-8">
      <ModalHeader
        id={`${prefix}-title`}
        title={editing ? "Edit Rapat" : "Buat Rapat Baru"}
        onClose={onClose}
        disabled={pending}
      />

      <fieldset className="mt-7">
        <legend className="mb-2 text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
          Jenis Rapat
        </legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {MEETING_SCOPES.map((option) => {
            const on = scope === option;
            return (
              <label
                key={option}
                className={`cursor-pointer rounded-xl border px-4 py-3.5 transition-colors ${
                  on
                    ? "border-[#4f8dff]/40 bg-[#1b2a5c]/60"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="scope"
                    value={option}
                    checked={on}
                    onChange={() => pickScope(option)}
                    className="size-4 accent-[#4f8dff]"
                  />
                  <span className="text-sm font-semibold text-white">
                    {SCOPE[option].label}
                  </span>
                </span>
                <span className="mt-1.5 block pl-[26px] text-xs leading-relaxed text-[#8a8ea3]">
                  {SCOPE[option].hint}
                </span>
              </label>
            );
          })}
        </div>
        {errors.scope && (
          <p className="mt-1.5 text-xs text-[#fca5a5]">{errors.scope}</p>
        )}
      </fieldset>

      <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-[1fr_140px]">
        <Field
          id={`${prefix}-f-title`}
          label="Nama Rapat"
          error={errors.title}
        >
          <input
            {...fieldProps("title")}
            defaultValue={meeting?.title}
            placeholder="mis. Rapat Koordinasi Bulanan"
            autoComplete="off"
            autoFocus
            maxLength={TITLE_MAX}
            className={control}
          />
        </Field>
        <Field
          id={`${prefix}-f-sequence`}
          label="Rapat ke-"
          error={errors.sequence}
        >
          <input
            {...fieldProps("sequence")}
            type="number"
            inputMode="numeric"
            min={1}
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            className={control}
          />
        </Field>
      </div>

      <p className="mt-2 text-xs text-[#6f7286]">
        {editing
          ? "Nomor rapat dipakai di daftar dan rekap presensi."
          : scope === "gabungan"
            ? `Nomor urut rapat gabungan seluruh organisasi. Berikutnya: ${sequences.gabungan}.`
            : `Nomor urut rapat divisi ${division ?? "kamu"}. Berikutnya: ${sequences.divisi}.`}
      </p>

      <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <Field
          id={`${prefix}-f-scheduledAt`}
          label="Tanggal & Jam (WIB)"
          error={errors.scheduledAt}
        >
          <input
            {...fieldProps("scheduledAt")}
            type="datetime-local"
            defaultValue={
              meeting ? toJakartaInput(meeting.scheduledAt) : defaultStart()
            }
            className={control}
          />
        </Field>
        <Field
          id={`${prefix}-f-lateAfterMinutes`}
          label="Batas Terlambat (menit)"
          error={errors.lateAfterMinutes}
        >
          <input
            {...fieldProps("lateAfterMinutes")}
            type="number"
            inputMode="numeric"
            min={0}
            max={LATE_MAX}
            defaultValue={meeting?.lateAfterMinutes ?? 15}
            className={control}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field
            id={`${prefix}-f-location`}
            label="Lokasi"
            error={errors.location}
          >
            <input
              {...fieldProps("location")}
              defaultValue={meeting?.location ?? ""}
              placeholder="mis. Ruang Sidang Lantai 2, atau tautan Zoom"
              autoComplete="off"
              maxLength={LOCATION_MAX}
              className={control}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field
            id={`${prefix}-f-notes`}
            label="Agenda / Catatan"
            error={errors.notes}
          >
            <textarea
              {...fieldProps("notes")}
              defaultValue={meeting?.notes ?? ""}
              placeholder="Agenda singkat rapat ini…"
              rows={3}
              maxLength={NOTES_MAX}
              className={`${controlBase} min-h-[88px] resize-y py-3 leading-relaxed`}
            />
          </Field>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[#6f7286]">
        Pengurus yang scan setelah{" "}
        <span className="text-[#c7c9d4]">batas terlambat</span> tercatat
        Terlambat.{" "}
        {editing
          ? "Presensi dibuka dan ditutup dari halaman rapat."
          : "Setelah dibuat, kamu dibawa ke halaman rapat. Buka presensinya di sana saat rapat dimulai."}
      </p>

      {formError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-[#f87171]/25 bg-[#f87171]/10 px-4 py-3 text-[13px] text-[#fca5a5]"
        >
          {formError}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className={secondaryButton}
        >
          Batal
        </button>
        <button
          type="submit"
          aria-disabled={pending}
          className={`${primaryButton} aria-disabled:cursor-wait aria-disabled:opacity-70`}
        >
          {pending
            ? editing
              ? "Menyimpan…"
              : "Membuat…"
            : editing
              ? "Simpan Perubahan"
              : "Buat Rapat"}
        </button>
      </div>
    </form>
  );
}
