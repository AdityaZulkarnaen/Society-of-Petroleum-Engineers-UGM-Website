"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";

import {
  Badge,
  compactCardSurface,
  secondaryButton,
  type Tone,
} from "@/modules/admin/components/ui";
import { icons } from "../components/table";

import {
  STATUS_LABELS,
  type ApplicantSummary,
  type RecruitmentPeriodInfo,
  type ScreeningStatus,
} from "./types";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
] as const;

type StatusFilterKey = (typeof STATUS_FILTERS)[number]["key"];

const STATUS_TONES: Record<ScreeningStatus, Tone> = {
  submitted: "blue",
  under_review: "amber",
  accepted: "green",
  rejected: "red",
};

function formatTimestamp(isoString: string | null): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(d);
  } catch {
    return isoString;
  }
}

export function ApplicantTable({
  applicants,
  periods,
  currentPeriodId,
}: {
  applicants: ApplicantSummary[];
  periods: RecruitmentPeriodInfo[];
  currentPeriodId: string;
}) {
  const router = useRouter();
  const initialPeriod =
    currentPeriodId ||
    periods.find((p) => p.isOpen)?.id ||
    periods[0]?.id ||
    applicants[0]?.periodId ||
    "";
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  // Count stats
  const stats = useMemo(() => {
    let submitted = 0;
    let underReview = 0;
    let accepted = 0;
    let rejected = 0;

    applicants.forEach((a) => {
      if (a.status === "submitted") submitted++;
      else if (a.status === "under_review") underReview++;
      else if (a.status === "accepted") accepted++;
      else if (a.status === "rejected") rejected++;
    });

    return { total: applicants.length, submitted, underReview, accepted, rejected };
  }, [applicants]);

  // Filtered applicants
  const filtered = useMemo(() => {
    return applicants.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) {
        return false;
      }
      if (deferredSearch) {
        const matchName = a.fullName.toLowerCase().includes(deferredSearch);
        const matchNim = a.nim.toLowerCase().includes(deferredSearch);
        const matchEmail = a.email.toLowerCase().includes(deferredSearch);
        const matchMajor = a.major.toLowerCase().includes(deferredSearch);
        if (!matchName && !matchNim && !matchEmail && !matchMajor) {
          return false;
        }
      }
      return true;
    });
  }, [applicants, statusFilter, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const currentRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  function handlePeriodChange(newPeriodId: string) {
    setSelectedPeriod(newPeriodId);
    setPage(1);
    router.push(`/super-admin/recruitment?period=${encodeURIComponent(newPeriodId)}`);
  }

  function handleExport() {
    const targetPeriod =
      selectedPeriod ||
      currentPeriodId ||
      periods.find((p) => p.isOpen)?.id ||
      periods[0]?.id ||
      applicants[0]?.periodId;

    if (!targetPeriod) {
      console.error("Export canceled: no recruitment period identified.");
      return;
    }

    setExporting(true);
    try {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Browser assignment initiates file download stream for CSV attachment.
      window.location.assign(
        `/api/super-admin/recruitment/export?periodId=${encodeURIComponent(targetPeriod)}`,
      );
    } finally {
      setTimeout(() => setExporting(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
            Recruitment Screening
          </h1>
          <p className="mt-1.5 text-sm text-[#8a8ea3]">
            {stats.total} total applicants · {stats.underReview} under review ·{" "}
            {stats.accepted} accepted · {stats.rejected} rejected
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {periods.length > 1 && (
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-[#0f142e] px-3.5 text-sm font-medium text-white transition-colors focus-visible:border-[#4f8dff]/60 focus-visible:outline-none"
              aria-label="Select recruitment period"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0b0e22] text-white">
                  {p.label} {p.isOpen ? "(Active)" : "(Closed)"}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || applicants.length === 0}
            className={`${secondaryButton} gap-2`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                d="M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2M8 2.5v7M5.5 7l2.5 2.5L10.5 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </header>

      {/* Search & Status Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search applicants</span>
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#8a8ea3]">
            {icons.search}
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, NIM, email, or major..."
            className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pr-4 pl-10 text-sm text-white placeholder:text-[#6f7286] focus-visible:border-[#4f8dff]/60 focus-visible:ring-4 focus-visible:ring-[#4f8dff]/15 focus-visible:outline-none"
          />
        </label>

        <div
          role="group"
          aria-label="Filter applicant status"
          className="flex flex-wrap gap-2"
        >
          {STATUS_FILTERS.map(({ key, label }) => {
            const count =
              key === "all"
                ? stats.total
                : key === "submitted"
                  ? stats.submitted
                  : key === "under_review"
                    ? stats.underReview
                    : key === "accepted"
                      ? stats.accepted
                      : stats.rejected;

            const isSelected = statusFilter === key;

            return (
              <button
                key={key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setStatusFilter(key);
                  setPage(1);
                }}
                className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${
                  isSelected
                    ? "border-[#4f8dff]/20 bg-[#1b2a5c] font-medium text-white"
                    : "border-white/10 bg-white/[0.03] text-[#a3a6b8] hover:border-white/20 hover:text-white"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-xs ${
                    isSelected ? "text-[#8cb4ff]" : "text-[#6f7286]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table / Card Container */}
      <div className={`overflow-hidden ${compactCardSurface}`}>
        {/* Desktop Table View */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1020px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase">
                <th scope="col" className="py-4 pr-3 pl-[18px]">
                  Applicant
                </th>
                <th scope="col" className="px-3 py-4">
                  Student ID (NIM)
                </th>
                <th scope="col" className="px-3 py-4">
                  Major & Batch
                </th>
                <th scope="col" className="px-3 py-4">
                  1st Preference
                </th>
                <th scope="col" className="px-3 py-4">
                  2nd Preference
                </th>
                <th scope="col" className="px-3 py-4 text-center">
                  Status
                </th>
                <th scope="col" className="px-3 py-4">
                  Submitted At
                </th>
                <th scope="col" className="py-4 pr-[18px] pl-3 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-white/[0.06] transition-colors last:border-b-0 hover:bg-white/[0.02]"
                >
                  <td className="py-4 pr-3 pl-[18px]">
                    <Link
                      href={`/super-admin/recruitment/${app.id}`}
                      className="font-semibold text-white transition-colors hover:text-[#4f8dff]"
                    >
                      {app.fullName}
                    </Link>
                    <p className="mt-0.5 text-xs text-[#8a8ea3]">{app.email}</p>
                  </td>
                  <td className="px-3 py-4 font-mono text-xs text-[#c7c9d4]">
                    {app.nim}
                  </td>
                  <td className="px-3 py-4 text-[#a3a6b8]">
                    <span>{app.major}</span>
                    <span className="ml-1 text-xs text-[#6f7286]">({app.batch})</span>
                  </td>
                  <td className="px-3 py-4 text-[#c7c9d4]">
                    {app.firstPreference ? (
                      <div>
                        <p className="font-medium text-white">
                          {app.firstPreference.subLabel}
                        </p>
                        <p className="text-xs text-[#8a8ea3]">
                          {app.firstPreference.mainLabel}
                        </p>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-4 text-[#c7c9d4]">
                    {app.secondPreference ? (
                      <div>
                        <p className="font-medium text-white">
                          {app.secondPreference.subLabel}
                        </p>
                        <p className="text-xs text-[#8a8ea3]">
                          {app.secondPreference.mainLabel}
                        </p>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <Badge
                      tone={STATUS_TONES[app.status]}
                      className="px-2.5 py-1 text-xs font-semibold"
                    >
                      {STATUS_LABELS[app.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-4 text-xs whitespace-nowrap text-[#8a8ea3]">
                    {formatTimestamp(app.submittedAt)}
                  </td>
                  <td className="py-4 pr-[18px] pl-3 text-right">
                    <Link
                      href={`/super-admin/recruitment/${app.id}`}
                      className="inline-flex h-8 items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-[#c7c9d4] transition-colors hover:border-[#4f8dff]/40 hover:text-white"
                    >
                      Screening →
                    </Link>
                  </td>
                </tr>
              ))}

              {currentRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-[#c7c9d4]">
                      {applicants.length === 0
                        ? "No applicants found for this period"
                        : "No matching applicants"}
                    </p>
                    <p className="mt-1.5 text-[13px] text-[#6f7286]">
                      {applicants.length === 0
                        ? "Applications will appear here once candidates submit their forms."
                        : "Try different search terms or status filters."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="divide-y divide-white/[0.06] md:hidden">
          {currentRows.map((app) => (
            <div key={app.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/super-admin/recruitment/${app.id}`}
                    className="font-semibold text-white hover:text-[#4f8dff]"
                  >
                    {app.fullName}
                  </Link>
                  <p className="text-xs font-mono text-[#8a8ea3]">{app.nim}</p>
                </div>
                <Badge
                  tone={STATUS_TONES[app.status]}
                  className="px-2 py-0.5 text-xs font-semibold"
                >
                  {STATUS_LABELS[app.status]}
                </Badge>
              </div>

              <div className="text-xs text-[#a3a6b8] space-y-1">
                <p>
                  <span className="text-[#6f7286]">Major: </span>
                  {app.major} ({app.batch})
                </p>
                {app.firstPreference && (
                  <p>
                    <span className="text-[#6f7286]">1st Choice: </span>
                    {app.firstPreference.subLabel}
                  </p>
                )}
                <p>
                  <span className="text-[#6f7286]">Submitted: </span>
                  {formatTimestamp(app.submittedAt)}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href={`/super-admin/recruitment/${app.id}`}
                  className="flex h-9 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-medium text-white transition-colors hover:bg-white/[0.08]"
                >
                  Review Application
                </Link>
              </div>
            </div>
          ))}

          {currentRows.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-[#c7c9d4]">
                {applicants.length === 0
                  ? "No applicants found for this period"
                  : "No matching applicants"}
              </p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-4">
          <p className="text-[13px] text-[#6f7286]">
            {filtered.length > 0
              ? `Showing ${startIdx + 1}-${startIdx + currentRows.length} of ${filtered.length} applicants`
              : "No data"}
          </p>

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="grid size-8 place-items-center rounded-lg text-sm text-[#8a8ea3] transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
                aria-label="Previous page"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === currentPage ? "page" : undefined}
                  className={`grid size-8 place-items-center rounded-lg text-sm transition-colors ${
                    n === currentPage
                      ? "bg-[#1b2a5c] font-medium text-white shadow-[inset_0_0_0_1px_rgba(79,141,255,0.2)]"
                      : "text-[#8a8ea3] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="grid size-8 place-items-center rounded-lg text-sm text-[#8a8ea3] transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
                aria-label="Next page"
              >
                ›
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
