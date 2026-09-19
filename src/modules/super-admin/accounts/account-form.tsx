"use client";

import { useState, useTransition, type FormEvent } from "react";

import { control, Field, Select } from "@/modules/admin/components/form";
import { ModalHeader } from "@/modules/admin/components/modal";
import { primaryButton, secondaryButton } from "@/modules/admin/components/ui";

import {
  POSITIONS,
  type Account,
  type AccountInput,
  type ActionResult,
  type FieldErrors,
} from "./fields";

/**
 * Tambah / Edit Pengurus. Pengurus always belong to the super admin's own
 * division, so the Divisi field is fixed.
 */
export function AccountForm({
  account,
  division,
  defaultPeriod,
  onSubmit,
  onClose,
  onPendingChange,
}: {
  /** Omitted when creating. */
  account?: Account;
  division: string | null;
  defaultPeriod: string;
  onSubmit: (input: AccountInput) => Promise<ActionResult>;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editing = Boolean(account);
  const prefix = editing ? "edit" : "new";

  /* onSubmit rather than a form action, which would reset the fields */
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    const input = Object.fromEntries(
      ["fullName", "nim", "email", "whatsapp", "department", "position", "period"].map(
        (key) => [key, String(formData.get(key) ?? "")],
      ),
    ) as AccountInput;

    onPendingChange(true);
    startTransition(async () => {
      const result = await onSubmit(input);
      onPendingChange(false);
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error ?? null);
    });
  }

  const fieldProps = (name: keyof AccountInput) => ({
    id: `${prefix}-${name}`,
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${prefix}-${name}-error` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate className="px-6 pt-7 pb-7 sm:px-8">
      <ModalHeader
        id={`${prefix}-account-title`}
        title={editing ? "Edit Data Pengurus" : "Tambah Pengurus Baru"}
        onClose={onClose}
        disabled={pending}
      />

      <div className="mt-7 grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <Field id={`${prefix}-fullName`} label="Nama Lengkap" error={errors.fullName}>
          <input
            {...fieldProps("fullName")}
            defaultValue={account?.fullName}
            placeholder="Nama lengkap"
            autoComplete="off"
            autoFocus
            className={control}
          />
        </Field>
        <Field id={`${prefix}-nim`} label="NIM" error={errors.nim}>
          <input
            {...fieldProps("nim")}
            defaultValue={account?.nim ?? ""}
            placeholder="20/468xxx/TK/5xxxx"
            autoComplete="off"
            className={control}
          />
        </Field>
        <Field id={`${prefix}-email`} label="Email" error={errors.email}>
          <input
            {...fieldProps("email")}
            type="email"
            defaultValue={account?.email ?? ""}
            placeholder="nama@mail.ugm.ac.id"
            autoComplete="off"
            className={control}
          />
        </Field>
        <Field id={`${prefix}-whatsapp`} label="No. WhatsApp" error={errors.whatsapp}>
          <input
            {...fieldProps("whatsapp")}
            type="tel"
            defaultValue={account?.whatsapp ?? ""}
            placeholder="+62 8xx-xxxx-xxxx"
            autoComplete="off"
            className={control}
          />
        </Field>
        <Field id={`${prefix}-department`} label="Departemen / Jurusan" error={errors.department}>
          <input
            {...fieldProps("department")}
            defaultValue={account?.department ?? ""}
            placeholder="Teknik Geologi"
            autoComplete="off"
            className={control}
          />
        </Field>
        <Field id={`${prefix}-division`} label="Divisi">
          <Select id={`${prefix}-division`} disabled defaultValue={division ?? ""}>
            <option value={division ?? ""}>
              {division ? `Divisi ${division}` : "—"}
            </option>
          </Select>
        </Field>
        <Field id={`${prefix}-position`} label="Jabatan" error={errors.position}>
          <Select {...fieldProps("position")} defaultValue={account?.position ?? "Staff"}>
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={`${prefix}-period`} label="Periode Kepengurusan" error={errors.period}>
          <input
            {...fieldProps("period")}
            defaultValue={account?.period ?? defaultPeriod}
            placeholder="2025/2026"
            autoComplete="off"
            className={control}
          />
        </Field>
      </div>

      {!editing && (
        <p className="mt-5 rounded-xl border border-[#3b82f6]/30 bg-[#0f1f45]/50 px-4 py-3 text-[13px] leading-relaxed text-[#8fb4ff]">
          Password sementara akan digenerate otomatis setelah akun dibuat.
          Bagikan kredensial langsung kepada pengurus.
        </p>
      )}

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
          {pending
            ? "Menyimpan…"
            : editing
              ? "Simpan Perubahan"
              : "Buat Akun"}
        </button>
      </div>
    </form>
  );
}
