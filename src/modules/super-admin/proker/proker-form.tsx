"use client";

import { useState, useTransition, type FormEvent } from "react";

import { PROKER_STATUSES, STATUS } from "@/modules/admin/acara/status";
import {
  control,
  controlBase,
  Field,
  Select,
} from "@/modules/admin/components/form";
import { ModalHeader } from "@/modules/admin/components/modal";
import { primaryButton, secondaryButton } from "@/modules/admin/components/ui";

import {
  DESCRIPTION_MAX,
  validateProker,
  type ActionResult,
  type ManagedProker,
  type PengurusOption,
  type ProkerErrors,
  type ProkerInput,
} from "./fields";

type Row = { key: number; profileId: string; role: string };

let nextKey = 0;

/* Pengurus grouped by division for the picker. */
function groupByDivision(pengurus: PengurusOption[]) {
  const groups = new Map<string, PengurusOption[]>();
  for (const p of pengurus) {
    const division = p.division ?? "Tanpa divisi";
    groups.set(division, [...(groups.get(division) ?? []), p]);
  }
  return [...groups];
}

/**
 * Tambah / Edit Proker. A super admin can only organise proker for their own
 * division, so Divisi Penyelenggara is fixed.
 */
export function ProkerForm({
  proker,
  division,
  pengurus,
  onSubmit,
  onClose,
  onPendingChange,
}: {
  /** Omitted when creating. */
  proker?: ManagedProker;
  division: string | null;
  pengurus: PengurusOption[];
  onSubmit: (input: ProkerInput) => Promise<ActionResult>;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    (proker?.members ?? []).map((m) => ({
      key: nextKey++,
      profileId: m.profileId,
      role: m.role,
    })),
  );
  const [errors, setErrors] = useState<ProkerErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(proker);
  const prefix = editing ? "edit-proker" : "new-proker";
  const groups = groupByDivision(pengurus);
  const chosen = new Set(rows.map((r) => r.profileId));

  /* onSubmit rather than a form action, which would reset the fields */
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const input: ProkerInput = {
      name: String(data.get("name") ?? ""),
      description: String(data.get("description") ?? ""),
      startsOn: String(data.get("startsOn") ?? ""),
      endsOn: String(data.get("endsOn") ?? ""),
      status: String(data.get("status") ?? ""),
      members: rows.map(({ profileId, role }) => ({ profileId, role })),
    };

    const check = validateProker(input);
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

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  const fieldProps = (name: keyof ProkerInput) => ({
    id: `${prefix}-${name}`,
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${prefix}-${name}-error` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate className="px-6 pt-7 pb-7 sm:px-8">
      <ModalHeader
        id={`${prefix}-title`}
        title={editing ? "Edit Proker" : "Tambah Proker Baru"}
        onClose={onClose}
        disabled={pending}
      />

      <div className="mt-7 grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id={`${prefix}-name`} label="Nama Proker / Acara" error={errors.name}>
            <input
              {...fieldProps("name")}
              defaultValue={proker?.name}
              placeholder="Nama program kerja atau acara"
              autoComplete="off"
              autoFocus
              className={control}
            />
          </Field>
        </div>
        <Field id={`${prefix}-division`} label="Divisi Penyelenggara">
          <Select id={`${prefix}-division`} disabled defaultValue={division ?? ""}>
            <option value={division ?? ""}>{division ? `Divisi ${division}` : "—"}</option>
          </Select>
        </Field>
        <Field id={`${prefix}-startsOn`} label="Tanggal Mulai" error={errors.startsOn}>
          <input
            {...fieldProps("startsOn")}
            type="date"
            defaultValue={proker?.startsOn ?? ""}
            className={control}
          />
        </Field>
        <Field id={`${prefix}-endsOn`} label="Tanggal Selesai" error={errors.endsOn}>
          <input
            {...fieldProps("endsOn")}
            type="date"
            defaultValue={proker?.endsOn ?? ""}
            className={control}
          />
        </Field>
        <Field id={`${prefix}-status`} label="Status" error={errors.status}>
          <Select {...fieldProps("status")} defaultValue={proker?.status ?? "direncanakan"}>
            {PROKER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS[status].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset className="mt-5 rounded-xl border border-white/[0.08] bg-[#0b0e1f]/50 px-5 py-4">
        <legend className="sr-only">Pengurus Terlibat</legend>
        <div className="flex items-baseline justify-between gap-4">
          <p
            aria-hidden="true"
            className="text-[11px] font-medium tracking-[0.08em] text-[#c7c9d4] uppercase"
          >
            Pengurus Terlibat
          </p>
          <span className="text-xs text-[#6f7286]">
            {rows.length} pengurus ditambahkan
          </span>
        </div>

        {rows.length > 0 && (
          <ul className="mt-3.5 space-y-2.5">
            {rows.map((row, i) => {
              const e = (f: string) => errors[`members.${i}.${f}`];
              return (
                <li key={row.key}>
                  <div className="grid grid-cols-[minmax(0,1fr)_32px] gap-2 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_32px]">
                    <div className="col-span-2 sm:col-span-1">
                      <Select
                        aria-label={`Pengurus ${i + 1}`}
                        value={row.profileId}
                        onChange={(ev) => updateRow(row.key, { profileId: ev.target.value })}
                        aria-invalid={Boolean(e("profileId"))}
                      >
                        <option value="" disabled>
                          Pilih pengurus
                        </option>
                        {groups.map(([group, people]) => (
                          <optgroup key={group} label={group}>
                            {people.map((p) => (
                              <option
                                key={p.id}
                                value={p.id}
                                disabled={p.id !== row.profileId && chosen.has(p.id)}
                              >
                                {p.fullName}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </Select>
                    </div>
                    <input
                      aria-label={`Peran pengurus ${i + 1}`}
                      value={row.role}
                      onChange={(ev) => updateRow(row.key, { role: ev.target.value })}
                      placeholder="Peran, mis. Koordinator"
                      maxLength={60}
                      aria-invalid={Boolean(e("role"))}
                      className={control}
                    />
                    <button
                      type="button"
                      onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                      aria-label={`Hapus pengurus ${i + 1}`}
                      className="grid h-[42px] w-8 place-items-center rounded-lg text-[#f87171]/80 transition-colors hover:bg-[#f87171]/10 hover:text-[#f87171]"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="m3 3 8 8M11 3l-8 8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  {(e("profileId") || e("role")) && (
                    <p className="mt-1.5 text-xs text-[#fca5a5]">{e("profileId") ?? e("role")}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={() =>
            setRows((r) => [...r, { key: nextKey++, profileId: "", role: "" }])
          }
          disabled={rows.length >= pengurus.length}
          className="mt-3.5 inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-white/15 px-4 text-sm text-[#a3a6b8] transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M7 2.5v9M2.5 7h9" strokeLinecap="round" />
          </svg>
          Tambah Pengurus
        </button>
      </fieldset>

      <div className="mt-5">
        <Field id={`${prefix}-description`} label="Deskripsi Singkat" error={errors.description}>
          <textarea
            {...fieldProps("description")}
            defaultValue={proker?.description ?? ""}
            placeholder="Deskripsikan tujuan dan gambaran umum proker ini..."
            rows={3}
            maxLength={DESCRIPTION_MAX}
            className={`${controlBase} min-h-[88px] resize-y py-3 leading-relaxed`}
          />
        </Field>
      </div>

      {formError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-[#f87171]/25 bg-[#f87171]/10 px-4 py-3 text-[13px] text-[#fca5a5]"
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
          {pending ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Buat Proker"}
        </button>
      </div>
    </form>
  );
}
