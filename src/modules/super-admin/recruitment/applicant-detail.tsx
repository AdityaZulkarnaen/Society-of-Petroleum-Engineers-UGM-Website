"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  Badge,
  Card,
  compactCardSurface,
  primaryButton,
  type Tone,
} from "@/modules/admin/components/ui";

import { updateScreeningStatus } from "./actions";
import {
  STATUS_LABELS,
  type ApplicantDetail,
  type DocumentInfo,
  type PreferenceInfo,
  type ScreeningStatus,
} from "./types";

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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ApplicantDetailView({
  applicant,
}: {
  applicant: ApplicantDetail;
}) {
  const [currentStatus, setCurrentStatus] = useState<ScreeningStatus>(applicant.status);
  const [reviewNote, setReviewNote] = useState<string>(applicant.reviewNote ?? "");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleTransition(newStatus: "under_review" | "accepted" | "rejected") {
    setNotice(null);
    startTransition(async () => {
      const result = await updateScreeningStatus(applicant.id, newStatus, reviewNote);
      if (result.success) {
        setCurrentStatus(newStatus);
        setNotice({
          tone: "success",
          text: `Application status updated to '${STATUS_LABELS[newStatus]}'. Audit log preserved.`,
        });
      } else {
        setNotice({
          tone: "error",
          text: result.error || "Failed to update applicant screening status.",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div>
        <Link
          href="/super-admin/recruitment"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8a8ea3] transition-colors hover:text-white"
        >
          ‹ Back to Recruitment Screening
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] font-bold tracking-[-0.02em] text-white sm:text-[30px]">
                {applicant.fullName}
              </h1>
              <Badge
                tone={STATUS_TONES[currentStatus]}
                className="px-3 py-1 text-xs font-semibold"
              >
                {STATUS_LABELS[currentStatus]}
              </Badge>
            </div>
            <p className="mt-1 font-mono text-sm text-[#8a8ea3]">
              NIM: {applicant.nim} · Batch: {applicant.batch}
            </p>
          </div>

          <div className="text-right text-xs text-[#8a8ea3]">
            <p>Submitted: {formatTimestamp(applicant.submittedAt)}</p>
            {applicant.reviewedAt && (
              <p className="mt-0.5">
                Last reviewed: {formatTimestamp(applicant.reviewedAt)}
                {applicant.reviewerName ? ` by ${applicant.reviewerName}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
            notice.tone === "error"
              ? "border-[#f87171]/25 bg-[#f87171]/10 text-[#fca5a5]"
              : "border-[#34d399]/25 bg-[#34d399]/[0.08] text-[#6ee7b7]"
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="opacity-70 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols): Personal Info & Preferences */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Information */}
          <Card surface={compactCardSurface} className="p-6">
            <h2 className="text-base font-semibold text-white">
              Personal Information
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs text-[#8a8ea3]">Full Name</dt>
                <dd className="mt-1 font-medium text-white">{applicant.fullName}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#8a8ea3]">Student ID (NIM)</dt>
                <dd className="mt-1 font-mono font-medium text-white">{applicant.nim}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#8a8ea3]">Email Address</dt>
                <dd className="mt-1 text-white">
                  <a
                    href={`mailto:${applicant.email}`}
                    className="hover:underline hover:text-[#4f8dff]"
                  >
                    {applicant.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#8a8ea3]">Phone / WhatsApp</dt>
                <dd className="mt-1 text-white">
                  <a
                    href={`https://wa.me/${applicant.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-[#4ade80]"
                  >
                    {applicant.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#8a8ea3]">Major & Department</dt>
                <dd className="mt-1 font-medium text-white">{applicant.major}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#8a8ea3]">Batch (Angkatan)</dt>
                <dd className="mt-1 text-white">{applicant.batch}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#8a8ea3]">Place of Birth</dt>
                <dd className="mt-1 text-white">{applicant.birthPlace}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#8a8ea3]">Date of Birth</dt>
                <dd className="mt-1 text-white">{applicant.birthDate}</dd>
              </div>
            </dl>
          </Card>

          {/* Division Preferences */}
          <Card surface={compactCardSurface} className="p-6">
            <h2 className="text-base font-semibold text-white">
              Division Preferences & Motivation
            </h2>
            <div className="mt-4 space-y-6">
              {applicant.preferences.map((pref: PreferenceInfo) => (
                <div
                  key={pref.rank}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold text-[#8cb4ff]">
                      {pref.rank === 1 ? "1st Choice" : "2nd Choice"}
                    </span>
                    <span className="text-xs text-[#8a8ea3]">
                      Division: {pref.mainLabel}
                    </span>
                  </div>

                  <p className="mt-2 text-base font-bold text-white">
                    {pref.subLabel}
                  </p>

                  <div className="mt-3">
                    <p className="text-xs font-medium text-[#8a8ea3] uppercase tracking-wider">
                      Motivation:
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#c7c9d4]">
                      {pref.motivation}
                    </p>
                  </div>
                </div>
              ))}

              {applicant.preferences.length === 0 && (
                <p className="text-sm text-[#8a8ea3]">No preferences recorded.</p>
              )}
            </div>
          </Card>

          {/* Submitted Documents */}
          <Card surface={compactCardSurface} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Submitted Documents
                </h2>
                <p className="mt-0.5 text-xs text-[#8a8ea3]">
                  All files are stored in private storage and streamed via server-mediated access.
                </p>
              </div>
              <span className="text-xs font-medium text-[#8a8ea3]">
                {applicant.documents.length} files
              </span>
            </div>

            <div className="mt-4 divide-y divide-white/[0.06]">
              {applicant.documents.map((doc: DocumentInfo) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{doc.slotLabel}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[#8a8ea3]">
                      <span className="uppercase font-semibold text-[#8cb4ff]">
                        {doc.format}
                      </span>
                      <span>·</span>
                      <span>{formatBytes(doc.byteSize)}</span>
                      <span>·</span>
                      <span>Verified: {formatTimestamp(doc.verifiedAt)}</span>
                    </div>
                  </div>

                  <a
                    href={`/api/super-admin/recruitment/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-white transition-colors hover:border-[#4f8dff]/40 hover:bg-[#1b2a5c]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 3H3.5a1 1 0 0 0-1 1v8.5a1 1 0 0 0 1 1h8.5a1 1 0 0 0 1-1V10M9 2.5h4.5M13.5 2.5V7M7 9l6.5-6.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    View Document
                  </a>
                </div>
              ))}

              {applicant.documents.length === 0 && (
                <p className="py-4 text-sm text-[#8a8ea3]">No documents submitted.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (1 col): Review Actions & Screening Decision */}
        <div className="space-y-6">
          <Card surface={compactCardSurface} className="p-6">
            <h2 className="text-base font-semibold text-white">
              Screening Actions
            </h2>
            <p className="mt-1 text-xs text-[#8a8ea3]">
              Review transitions are enforced by strict database constraints and automatically recorded in the audit trail.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="review-note"
                  className="block text-xs font-medium text-[#8a8ea3]"
                >
                  Reviewer Notes / Feedback
                </label>
                <textarea
                  id="review-note"
                  rows={4}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  disabled={isPending || currentStatus === "accepted" || currentStatus === "rejected"}
                  maxLength={3000}
                  placeholder={
                    currentStatus === "accepted" || currentStatus === "rejected"
                      ? "Decision finalized."
                      : "Add evaluation notes, interview recommendations, or rejection reasons..."
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white placeholder:text-[#6f7286] focus-visible:border-[#4f8dff]/60 focus-visible:outline-none disabled:opacity-60"
                />
                <p className="mt-1 text-right text-[11px] text-[#6f7286]">
                  {reviewNote.length} / 3000
                </p>
              </div>

              {/* Action Buttons Based on Database Transition Rules */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                {currentStatus === "submitted" && (
                  <button
                    type="button"
                    onClick={() => handleTransition("under_review")}
                    disabled={isPending}
                    className={`${primaryButton} w-full`}
                  >
                    {isPending ? "Updating..." : "Start Screening (Mark Under Review)"}
                  </button>
                )}

                {currentStatus === "under_review" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTransition("accepted")}
                      disabled={isPending}
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[linear-gradient(90deg,#059669_0%,#10b981_100%)] px-6 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.7)] transition-all hover:brightness-110 disabled:opacity-50"
                    >
                      {isPending ? "Processing..." : "Accept Candidate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTransition("rejected")}
                      disabled={isPending}
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#f87171]/40 bg-[#f87171]/10 px-6 text-sm font-semibold text-[#fca5a5] transition-colors hover:bg-[#f87171]/20 hover:text-white disabled:opacity-50"
                    >
                      {isPending ? "Processing..." : "Reject Candidate"}
                    </button>
                  </>
                )}

                {(currentStatus === "accepted" || currentStatus === "rejected") && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                    <p className="text-xs text-[#8a8ea3]">Decision Status</p>
                    <p
                      className={`mt-1 text-sm font-bold ${
                        currentStatus === "accepted" ? "text-[#4ade80]" : "text-[#fca5a5]"
                      }`}
                    >
                      {currentStatus === "accepted" ? "Candidate Accepted" : "Candidate Rejected"}
                    </p>
                    <p className="mt-1 text-xs text-[#6f7286]">
                      Status transition is finalized per committee governance policy.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Review Log Metadata Card */}
          <Card surface={compactCardSurface} className="p-6">
            <h3 className="text-xs font-semibold text-[#8a8ea3] uppercase tracking-wider">
              Governance & Audit Info
            </h3>
            <div className="mt-3 space-y-2 text-xs text-[#a3a6b8]">
              <p>
                <span className="text-[#6f7286]">Application ID:</span>{" "}
                <span className="font-mono text-white select-all">{applicant.id}</span>
              </p>
              <p>
                <span className="text-[#6f7286]">Period ID:</span>{" "}
                <span className="font-mono text-white select-all">{applicant.periodId}</span>
              </p>
              <p>
                <span className="text-[#6f7286]">Access Level:</span>{" "}
                <span className="text-[#8cb4ff]">Super Admin Privileged</span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
