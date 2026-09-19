import Image from "next/image";
import type { ReactNode } from "react";

import { cardSurface, initials } from "../components/ui";
import type { Candidate } from "./data";

/** Portrait, or the candidate's initials when there's no photo. */
export function CandidatePhoto({
  candidate,
  className,
  sizes,
}: {
  candidate: Candidate;
  className: string;
  sizes: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden border bg-[radial-gradient(circle_at_50%_30%,#1d2a5e_0%,#0d1230_100%)] ${className}`}
    >
      {candidate.photoUrl ? (
        <Image
          src={candidate.photoUrl}
          alt={`Foto ${candidate.fullName}`}
          fill
          sizes={sizes}
          unoptimized
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-full place-items-center font-display text-[1.6em] font-bold text-white/70"
        >
          {initials(candidate.fullName)}
        </span>
      )}
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.08em] text-[#4f8dff] uppercase">
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="relative pl-3 text-[13px] leading-[1.45] text-[#c7c9d4] before:absolute before:top-[0.5em] before:left-0 before:size-[5px] before:rounded-full before:bg-[#3b82f6]"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const primaryButton =
  "inline-flex h-11 items-center justify-center rounded-xl bg-[linear-gradient(90deg,#2f7bff_0%,#4e4eff_100%)] px-6 text-sm font-semibold text-white " +
  "shadow-[0_8px_24px_-8px_rgba(59,111,255,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] transition-[filter,box-shadow] hover:brightness-110 " +
  "disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/[0.06] disabled:text-[#5b5e71] disabled:shadow-none disabled:hover:brightness-100";

/**
 * A candidate's full profile. `control` sits in the top-right corner (the
 * radio, or a "Pilihanmu" badge); `overlay` lies under the content and above
 * the surface, for making the whole card a click target.
 */
export function CandidateCard({
  candidate,
  selected = false,
  control,
  overlay,
  className = "",
}: {
  candidate: Candidate;
  selected?: boolean;
  control?: ReactNode;
  overlay?: ReactNode;
  className?: string;
}) {
  return (
    <article
      aria-labelledby={`candidate-${candidate.id}`}
      className={`${cardSurface} relative p-5 transition-[box-shadow,background-color] duration-200 sm:p-7 ${
        selected
          ? "bg-[#1a3a8a]/15 ring-1 ring-[#4f8dff]/70"
          : ""
      } ${className}`}
    >
      {overlay}

      <div
        className={`relative flex flex-col gap-6 md:flex-row md:gap-7 ${
          overlay ? "pointer-events-none" : ""
        }`}
      >
        <div className="relative w-fit">
          <CandidatePhoto
            candidate={candidate}
            sizes="200px"
            className="aspect-[200/276] w-[150px] rounded-xl border-white/15 text-4xl md:w-[200px]"
          />
          <span
            aria-hidden="true"
            className="absolute -top-2 -left-2 grid size-6 place-items-center rounded-full bg-[#2f7bff] text-xs font-bold text-white shadow-[0_0_0_3px_#0c1030,0_0_14px_rgba(47,123,255,0.6)]"
          >
            {candidate.number}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 pt-1">
              <h2
                id={`candidate-${candidate.id}`}
                className="text-xl font-bold tracking-[-0.01em] text-white"
              >
                <span className="sr-only">Kandidat {candidate.number}: </span>
                {candidate.fullName}
              </h2>
              {candidate.nim && (
                <p className="mt-1.5 text-[13px] text-[#6f7286]">
                  NIM {candidate.nim}
                </p>
              )}
            </div>
            {control}
          </div>

          {candidate.vision && (
            <p className="mt-3.5 text-sm leading-relaxed text-[#c7c9d4]">
              {candidate.vision}
            </p>
          )}

          {(candidate.programs.length > 0 ||
            candidate.achievements.length > 0) && (
            <div className="mt-6 grid gap-6 border-t border-white/[0.06] pt-6 sm:grid-cols-2 sm:gap-8">
              <List title="Program Unggulan" items={candidate.programs} />
              <List title="Pencapaian" items={candidate.achievements} />
            </div>
          )}

          {candidate.grandDesignUrl && (
            <div className="mt-6 flex justify-end">
              <a
                href={candidate.grandDesignUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${primaryButton} pointer-events-auto relative`}
              >
                Akses Grand Design
                <span className="sr-only"> {candidate.fullName} (tab baru)</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/** Compact photo + name + NIM row, for the confirmation and receipt. */
export function CandidateSummary({
  candidate,
  className = "",
}: {
  candidate: Candidate;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left ${className}`}>
      <CandidatePhoto
        candidate={candidate}
        sizes="48px"
        className="h-[62px] w-12 rounded-lg border-[#4f8dff]/50 text-sm"
      />
      <div className="min-w-0">
        <p className="truncate text-[17px] font-bold text-white">
          {candidate.fullName}
        </p>
        {candidate.nim && (
          <p className="mt-1 truncate text-[13px] text-[#6f7286]">{candidate.nim}</p>
        )}
      </div>
    </div>
  );
}
