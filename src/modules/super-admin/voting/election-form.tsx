"use client";

import { useState, useTransition, type FormEvent } from "react";

import { control, Field } from "@/modules/admin/components/form";
import { ModalHeader } from "@/modules/admin/components/modal";
import { primaryButton, secondaryButton } from "@/modules/admin/components/ui";
import type { Election } from "@/modules/admin/voting/data";

import {
  validateElection,
  type ActionResult,
  type ElectionInput,
  type FormErrors,
} from "./fields";

/** Buat / Edit Pemilihan: title, term and voting dates. */
export function ElectionForm({
  election,
  defaultTerm,
  onSubmit,
  onClose,
  onPendingChange,
}: {
  /** Omitted when creating. */
  election?: Election;
  defaultTerm: string;
  onSubmit: (input: ElectionInput) => Promise<ActionResult>;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "");
    const input: ElectionInput = {
      title: text("title"),
      termLabel: text("termLabel"),
      opensOn: text("opensOn"),
      closesOn: text("closesOn"),
    };

    const check = validateElection(input);
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

  const fieldProps = (name: keyof ElectionInput) => ({
    id: `election-${name}`,
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `election-${name}-error` : undefined,
    autoComplete: "off",
  });

  return (
    <form onSubmit={submit} noValidate className="px-6 pt-7 pb-7 sm:px-8">
      <ModalHeader
        id="election-dialog-title"
        title={election ? "Election Settings" : "Create Election"}
        onClose={onClose}
        disabled={pending}
      />

      <div className="mt-7 grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="election-title" label="Election Title" error={errors.title}>
            <input
              {...fieldProps("title")}
              defaultValue={election?.title}
              placeholder="SPE UGM SC 2027 Presidential Election"
              autoFocus
              className={control}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="election-termLabel" label="Elected Term" error={errors.termLabel}>
            <input
              {...fieldProps("termLabel")}
              defaultValue={election?.termLabel ?? defaultTerm}
              placeholder="2026/2027"
              className={control}
            />
          </Field>
        </div>
        <Field id="election-opensOn" label="Voting Opens" error={errors.opensOn}>
          <input
            {...fieldProps("opensOn")}
            type="date"
            defaultValue={election?.opensOn ?? ""}
            className={control}
          />
        </Field>
        <Field id="election-closesOn" label="Voting Closes" error={errors.closesOn}>
          <input
            {...fieldProps("closesOn")}
            type="date"
            defaultValue={election?.closesOn ?? ""}
            className={control}
          />
        </Field>
      </div>

      <p className="mt-5 rounded-xl border border-[#3b82f6]/30 bg-[#0f1f45]/50 px-4 py-3 text-[13px] leading-relaxed text-[#8fb4ff]">
        Voting runs from 00:00 WIB on the opening date until 23:59 WIB on the closing
        date. Candidates can only be added or deleted before voting opens.
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
        <button type="button" onClick={onClose} disabled={pending} className={secondaryButton}>
          Cancel
        </button>
        <button
          type="submit"
          aria-disabled={pending}
          className={`${primaryButton} aria-disabled:cursor-wait aria-disabled:opacity-70`}
        >
          {pending ? "Saving…" : election ? "Save Changes" : "Create Election"}
        </button>
      </div>
    </form>
  );
}
