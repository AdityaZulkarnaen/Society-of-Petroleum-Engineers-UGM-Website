"use client";

import { useState, useTransition, type ReactNode } from "react";

import { ModalHeader } from "@/modules/admin/components/modal";
import { secondaryButton } from "@/modules/admin/components/ui";

/** Body of a "Hapus …" dialog: message, Batal and a red confirm button. */
export function ConfirmDelete({
  titleId,
  title,
  children,
  onConfirm,
  onClose,
  onDeleted,
  onPendingChange,
}: {
  titleId: string;
  title: string;
  /** The message, e.g. "Akun X akan dihapus permanen." */
  children: ReactNode;
  onConfirm: () => Promise<{ error?: string }>;
  onClose: () => void;
  onDeleted: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    if (pending) return;
    onPendingChange(true);
    startTransition(async () => {
      const result = await onConfirm();
      onPendingChange(false);
      if (result.error) setError(result.error);
      else onDeleted();
    });
  }

  return (
    <div className="px-6 pt-7 pb-7 sm:px-8">
      <ModalHeader id={titleId} title={title} onClose={onClose} disabled={pending} />
      <p className="mt-6 text-sm leading-relaxed text-[#c7c9d4]">{children}</p>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-[#f87171]/25 bg-[#f87171]/10 px-4 py-3 text-[13px] text-[#fca5a5]"
        >
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          disabled={pending}
          className={secondaryButton}
        >
          Batal
        </button>
        <button
          type="button"
          onClick={confirm}
          aria-disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#d63a3a] px-5 text-sm font-semibold text-white shadow-[0_8px_22px_-10px_rgba(214,58,58,0.8)] transition-colors hover:bg-[#e04747] aria-disabled:cursor-wait aria-disabled:opacity-70"
        >
          {pending ? "Menghapus…" : "Ya, Hapus"}
        </button>
      </div>
    </div>
  );
}
