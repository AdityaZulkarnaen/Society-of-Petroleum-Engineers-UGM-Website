"use client";

import { useState, useTransition, type ReactNode } from "react";

import { Modal, ModalHeader } from "@/modules/admin/components/modal";
import {
  Badge,
  primaryButton,
  secondaryButton,
} from "@/modules/admin/components/ui";

import { AccountForm } from "./account-form";
import {
  createAccount,
  deleteAccount,
  setAccountActive,
  updateAccount,
} from "./actions";
import type { Account, AccountInput, Credentials } from "./fields";

const PAGE_SIZE = 6;

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "active", label: "Aktif" },
  { key: "inactive", label: "Nonaktif" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

type Dialog =
  | { type: "create" }
  | { type: "edit"; account: Account }
  | { type: "delete"; account: Account }
  | { type: "credentials"; name: string; credentials: Credentials };

type Notice = { tone: "success" | "error"; text: string };

/* Icons ------------------------------------------------------------------ */

const icons = {
  search: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="7" cy="7" r="4.75" />
      <path d="m10.5 10.5 3 3" strokeLinecap="round" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  ),
  edit: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="m10.5 2.75 2.75 2.75L6 12.75l-3.5.75.75-3.5 7.25-7.25Z" strokeLinejoin="round" />
    </svg>
  ),
  toggle: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="1.75" y="4.75" width="12.5" height="6.5" rx="3.25" />
      <circle cx="10.75" cy="8" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  trash: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M2.75 4.25h10.5M6.25 4.25V2.75h3.5v1.5M4 4.25l.6 8.6a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.75 7v4M9.25 7v4" strokeLinecap="round" />
    </svg>
  ),
  copy: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="5.25" y="5.25" width="8.5" height="8.5" rx="1.5" />
      <path d="M10.75 5.25V3.75a1.5 1.5 0 0 0-1.5-1.5h-5.5a1.5 1.5 0 0 0-1.5 1.5v5.5a1.5 1.5 0 0 0 1.5 1.5h1.5" />
    </svg>
  ),
};

function IconButton({
  label,
  onClick,
  disabled,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid size-7 place-items-center rounded-md text-[#8a8ea3] transition-colors hover:bg-white/[0.06] disabled:opacity-40 ${
        danger ? "hover:text-[#f87171]" : "hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/* Dialog bodies ------------------------------------------------------------ */

function DeleteDialog({
  account,
  onClose,
  onDeleted,
  onPendingChange,
}: {
  account: Account;
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
      const result = await deleteAccount(account.id);
      onPendingChange(false);
      if (result.error) setError(result.error);
      else onDeleted();
    });
  }

  return (
    <div className="px-6 pt-7 pb-7 sm:px-8">
      <ModalHeader
        id="delete-account-title"
        title="Hapus Akun Pengurus"
        onClose={onClose}
        disabled={pending}
      />
      <p className="mt-6 text-sm leading-relaxed text-[#c7c9d4]">
        Akun <strong className="font-semibold text-white">{account.fullName}</strong>{" "}
        akan dihapus permanen. Tindakan ini tidak dapat diurungkan.
      </p>
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

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard blocked; the value is still selectable */
        }
      }}
      aria-label={`Salin ${label}`}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs text-[#c7c9d4] transition-colors hover:border-white/20 hover:text-white"
    >
      {icons.copy}
      <span aria-live="polite">{copied ? "Tersalin" : "Salin"}</span>
    </button>
  );
}

function CredentialsDialog({
  name,
  credentials,
  onClose,
}: {
  name: string;
  credentials: Credentials;
  onClose: () => void;
}) {
  const rows = [
    ["Username", credentials.username],
    ["Password sementara", credentials.password],
  ] as const;

  return (
    <div className="px-6 pt-7 pb-7 sm:px-8">
      <ModalHeader id="credentials-title" title="Akun Berhasil Dibuat" onClose={onClose} />
      <p className="mt-5 text-sm leading-relaxed text-[#c7c9d4]">
        Bagikan kredensial berikut langsung kepada{" "}
        <strong className="font-semibold text-white">{name}</strong>. Password
        hanya ditampilkan sekali ini.
      </p>
      <dl className="mt-5 space-y-2.5">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
          >
            <div className="min-w-0">
              <dt className="text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
                {label}
              </dt>
              <dd className="mt-1 truncate font-mono text-[15px] text-white select-all">
                {value}
              </dd>
            </div>
            <CopyButton value={value} label={label.toLowerCase()} />
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-[#6f7286]">
        Pengurus masuk di halaman login dashboard memakai username di atas.
      </p>
      <div className="mt-6 flex justify-end">
        <button type="button" autoFocus onClick={onClose} className={primaryButton}>
          Selesai
        </button>
      </div>
    </div>
  );
}

/* The page ------------------------------------------------------------------ */

export function AccountManager({
  accounts,
  division,
  defaultPeriod,
  openCreate = false,
}: {
  accounts: Account[];
  division: string | null;
  defaultPeriod: string;
  /** Open the Tambah dialog on arrival (from the dashboard's quick action). */
  openCreate?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<Dialog | null>(
    openCreate ? { type: "create" } : null,
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [, startToggle] = useTransition();

  const activeCount = accounts.filter((a) => a.isActive).length;

  const needle = query.trim().toLowerCase();
  const shown = accounts.filter(
    (a) =>
      (filter === "all" || a.isActive === (filter === "active")) &&
      (!needle ||
        [a.fullName, a.nim, a.email, a.username].some((field) =>
          field?.toLowerCase().includes(needle),
        )),
  );
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const rows = shown.slice(start, start + PAGE_SIZE);

  const close = () => setDialog(null);

  async function submitCreate(input: AccountInput) {
    const result = await createAccount(input);
    if (result.credentials) {
      setDialog({
        type: "credentials",
        name: input.fullName.trim(),
        credentials: result.credentials,
      });
      setNotice({ tone: "success", text: `Akun ${input.fullName.trim()} berhasil dibuat.` });
    }
    return result;
  }

  function submitEdit(account: Account) {
    return async (input: AccountInput) => {
      const result = await updateAccount(account.id, input);
      if (!result.error && !result.fieldErrors) {
        close();
        setNotice({ tone: "success", text: `Data ${input.fullName.trim()} diperbarui.` });
      }
      return result;
    };
  }

  function toggle(account: Account) {
    setTogglingId(account.id);
    startToggle(async () => {
      const result = await setAccountActive(account.id, !account.isActive);
      setTogglingId(null);
      setNotice(
        result.error
          ? { tone: "error", text: result.error }
          : {
              tone: "success",
              text: `Akun ${account.fullName} ${account.isActive ? "dinonaktifkan" : "diaktifkan kembali"}.`,
            },
      );
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
            Manajemen Akun
          </h1>
          <p className="mt-2 text-sm text-[#8a8ea3]">
            {activeCount} pengurus aktif · {accounts.length - activeCount} nonaktif
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ type: "create" })}
          className={`${primaryButton} gap-2`}
        >
          {icons.plus}
          Tambah Pengurus
        </button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Cari pengurus</span>
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#8a8ea3]">
            {icons.search}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama, NIM, atau email..."
            className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pr-4 pl-10 text-sm text-white placeholder:text-[#6f7286] focus-visible:border-[#4f8dff]/60 focus-visible:ring-4 focus-visible:ring-[#4f8dff]/15 focus-visible:outline-none"
          />
        </label>
        <div role="group" aria-label="Filter status akun" className="flex gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => {
                setFilter(key);
                setPage(1);
              }}
              className={`inline-flex h-10 items-center rounded-full border px-4 text-sm transition-colors ${
                filter === key
                  ? "border-[#4f8dff]/20 bg-[#1b2a5c] font-medium text-white"
                  : "border-white/10 bg-white/[0.03] text-[#a3a6b8] hover:border-white/20 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite">
        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : undefined}
            className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-2.5 text-[13px] ${
              notice.tone === "error"
                ? "border-[#f87171]/25 bg-[#f87171]/10 text-[#fca5a5]"
                : "border-[#34d399]/25 bg-[#34d399]/[0.08] text-[#6ee7b7]"
            }`}
          >
            {notice.text}
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Tutup pemberitahuan"
              className="opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.015]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
                <th scope="col" className="py-4 pr-3 pl-[18px] font-medium">Nama Lengkap</th>
                <th scope="col" className="px-3 py-4 font-medium">NIM</th>
                <th scope="col" className="px-3 py-4 font-medium">Email</th>
                <th scope="col" className="px-3 py-4 font-medium">Divisi</th>
                <th scope="col" className="px-3 py-4 font-medium">Jabatan</th>
                <th scope="col" className="px-3 py-4 font-medium">Periode</th>
                <th scope="col" className="px-3 py-4 text-center font-medium">Status</th>
                <th scope="col" className="py-4 pr-[18px] pl-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((account) => (
                <tr
                  key={account.id}
                  className="border-b border-white/[0.06] transition-colors last:border-b-0 hover:bg-white/[0.02]"
                >
                  <td className="py-[18px] pr-3 pl-[18px] text-sm font-semibold text-white">
                    {account.fullName}
                  </td>
                  <td className="px-3 text-xs whitespace-nowrap text-[#8a8ea3]">
                    {account.nim ?? "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-3 text-[#c7c9d4]" title={account.email ?? undefined}>
                    {account.email ?? "—"}
                  </td>
                  <td className="px-3 whitespace-nowrap text-[#a3a6b8]">
                    {account.division ?? "—"}
                  </td>
                  <td className="px-3 whitespace-nowrap text-[#a3a6b8]">
                    {account.position ?? "—"}
                  </td>
                  <td className="px-3 whitespace-nowrap text-[#6f7286]">
                    {account.period ?? "—"}
                  </td>
                  <td className="px-3 text-center">
                    <Badge
                      tone={account.isActive ? "green" : "neutral"}
                      className="px-2.5 py-1 text-xs font-semibold"
                    >
                      {account.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="py-2 pr-[18px] pl-3">
                    <div className="flex justify-end gap-0.5">
                      <IconButton
                        label={`Edit ${account.fullName}`}
                        onClick={() => setDialog({ type: "edit", account })}
                      >
                        {icons.edit}
                      </IconButton>
                      <IconButton
                        label={`${account.isActive ? "Nonaktifkan" : "Aktifkan"} ${account.fullName}`}
                        onClick={() => toggle(account)}
                        disabled={togglingId === account.id}
                      >
                        {icons.toggle}
                      </IconButton>
                      <IconButton
                        label={`Hapus ${account.fullName}`}
                        onClick={() => setDialog({ type: "delete", account })}
                        danger
                      >
                        {icons.trash}
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-[#c7c9d4]">
                      {accounts.length === 0
                        ? "Belum ada akun pengurus"
                        : "Tidak ada pengurus yang cocok"}
                    </p>
                    <p className="mt-1.5 text-[13px] text-[#6f7286]">
                      {accounts.length === 0
                        ? "Tambahkan pengurus pertama divisimu lewat tombol Tambah Pengurus."
                        : "Coba kata kunci atau filter lain."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] px-5 py-4">
          <p className="text-[13px] text-[#6f7286]">
            {shown.length > 0
              ? `Menampilkan ${start + 1}-${start + rows.length} dari ${shown.length} pengurus`
              : "Tidak ada data"}
          </p>
          {pageCount > 1 && (
            <nav aria-label="Halaman" className="flex gap-1.5">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === current ? "page" : undefined}
                  className={`grid size-8 place-items-center rounded-lg text-sm transition-colors ${
                    n === current
                      ? "bg-[#1b2a5c] font-medium text-white"
                      : "bg-white/[0.04] text-[#8a8ea3] hover:text-white"
                  }`}
                >
                  {n}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>

      <Modal
        open={dialog?.type === "create" || dialog?.type === "edit"}
        onClose={close}
        busy={busy}
        labelledBy={dialog?.type === "edit" ? "edit-account-title" : "new-account-title"}
        className="max-w-[760px]"
      >
        {dialog?.type === "create" && (
          <AccountForm
            division={division}
            defaultPeriod={defaultPeriod}
            onSubmit={submitCreate}
            onClose={close}
            onPendingChange={setBusy}
          />
        )}
        {dialog?.type === "edit" && (
          <AccountForm
            key={dialog.account.id}
            account={dialog.account}
            division={dialog.account.division ?? division}
            defaultPeriod={defaultPeriod}
            onSubmit={submitEdit(dialog.account)}
            onClose={close}
            onPendingChange={setBusy}
          />
        )}
      </Modal>

      <Modal
        open={dialog?.type === "delete"}
        onClose={close}
        busy={busy}
        labelledBy="delete-account-title"
      >
        {dialog?.type === "delete" && (
          <DeleteDialog
            account={dialog.account}
            onClose={close}
            onPendingChange={setBusy}
            onDeleted={() => {
              setNotice({ tone: "success", text: `Akun ${dialog.account.fullName} dihapus.` });
              close();
            }}
          />
        )}
      </Modal>

      <Modal
        open={dialog?.type === "credentials"}
        onClose={close}
        labelledBy="credentials-title"
      >
        {dialog?.type === "credentials" && (
          <CredentialsDialog
            name={dialog.name}
            credentials={dialog.credentials}
            onClose={close}
          />
        )}
      </Modal>
    </div>
  );
}
