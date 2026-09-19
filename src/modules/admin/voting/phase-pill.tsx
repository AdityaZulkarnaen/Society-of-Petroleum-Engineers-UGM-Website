import type { VotingPhase } from "./data";

/* Voting Dibuka / Belum Dibuka / Voting Ditutup, shared by the pengurus and
   super admin Voting pages. */

const PHASE: Record<VotingPhase, { label: string; className: string }> = {
  open: {
    label: "Voting Dibuka",
    className: "border-[#34d399]/30 bg-[#34d399]/10 text-[#4ade80]",
  },
  upcoming: {
    label: "Belum Dibuka",
    className: "border-[#f59e0b]/35 bg-[#f59e0b]/10 text-[#fbbf24]",
  },
  closed: {
    label: "Voting Ditutup",
    className: "border-white/15 bg-white/[0.03] text-[#c7c9d4]",
  },
};

export function PhasePill({ phase }: { phase: VotingPhase }) {
  const { label, className } = PHASE[phase];
  return (
    <span
      className={`inline-flex h-7 items-center gap-2 rounded-full border px-3 text-[11px] font-semibold tracking-[0.08em] whitespace-nowrap uppercase ${className}`}
    >
      <span className="relative flex size-1.5">
        {phase === "open" && (
          <span className="absolute inset-0 rounded-full bg-current opacity-60 motion-safe:animate-ping" />
        )}
        <span className="relative size-1.5 rounded-full bg-current" />
      </span>
      {label}
    </span>
  );
}
