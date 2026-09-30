import type { ReactNode } from "react";

import { requireAdmin } from "../auth/session";
import { Badge, Card, EmptyState, Label } from "../components/ui";
import { Ballot } from "./ballot";
import { CandidateCard, CandidateSummary } from "./candidate-card";
import { getElection, type Election } from "./data";
import { formatRange, longDate, timeLeft } from "./format";
import { PhasePill } from "./phase-pill";

const castAtLabel = (timestamp: string) =>
  `${new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(timestamp))} WIB`;

function InfoTile({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <Card className="px-5 py-4">
      <Label>{label}</Label>
      <p className="mt-2 flex items-center gap-1.5 text-[17px] font-bold tracking-[-0.01em] text-white">
        <span aria-hidden="true" className="text-[15px]">
          {icon}
        </span>
        {children}
      </p>
    </Card>
  );
}

function CheckBadge() {
  return (
    <span className="relative mx-auto grid size-20 place-items-center rounded-full border border-[#34d399]/45 bg-[linear-gradient(135deg,#0f5a48_0%,#152d5e_100%)] shadow-[0_0_0_8px_rgba(52,211,153,0.05),0_12px_40px_-8px_rgba(52,211,153,0.35)] motion-safe:animate-pop-in">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m5 12.5 4.5 4.5L19 7.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Shown in place of the ballot once the admin has voted. */
function Receipt({ election }: { election: Election }) {
  const vote = election.myVote!;
  const candidate = election.candidates.find((c) => c.id === vote.candidateId);

  return (
    <Card className="px-6 py-12 text-center sm:px-10">
      <CheckBadge />
      <h2 className="mt-7 text-2xl font-bold tracking-[-0.01em]">
        Your vote has been recorded
      </h2>
      <p className="mt-3 text-[15px] text-[#8a8ea3]">
        You cast your vote for the following candidate:
      </p>
      {candidate && (
        <CandidateSummary
          candidate={candidate}
          className="mx-auto mt-6 max-w-[290px] border-[#34d399]/20 bg-[#0a2026]/70"
        />
      )}
      <p className="mt-5 text-xs text-[#6f7286]">
        Recorded on {castAtLabel(vote.castAt)}
      </p>
      <p className="mx-auto mt-8 max-w-md text-[13px] leading-relaxed text-[#5d6075]">
        {election.phase === "closed"
          ? "The voting period has ended. Election results will be announced by the committee."
          : `Election results will be announced after the voting period closes on ${longDate(election.closesOn)}.`}
      </p>
    </Card>
  );
}

/** Candidate profiles without the ballot: after voting, or outside the window. */
function CandidateList({ election }: { election: Election }) {
  return (
    <div className="space-y-6">
      {election.candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          selected={candidate.id === election.myVote?.candidateId}
          control={
            candidate.id === election.myVote?.candidateId && (
              <Badge tone="green">Your Choice</Badge>
            )
          }
        />
      ))}
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <Card className="px-6 py-5 text-sm text-[#8a8ea3] sm:px-7">{children}</Card>
  );
}

export async function VotingPage() {
  await requireAdmin();
  const election = await getElection();

  if (!election) {
    return (
      <div className="space-y-8">
        <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
          Voting
        </h1>
        <Card className="p-6 sm:p-7">
          <EmptyState
            title="No election available"
            description="Upcoming elections will appear here once announced by the committee."
          />
        </Card>
      </div>
    );
  }

  const { phase, myVote, candidates } = election;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
            {election.title}
          </h1>
          <PhasePill phase={phase} />
        </div>
        <p className="mt-3 text-[15px] text-[#8a8ea3]">
          One vote per active member. Cast your vote thoughtfully.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoTile label="Voting Period" icon="📅">
          {formatRange(election.opensOn, election.closesOn)}
        </InfoTile>
        <InfoTile label="Total Candidates" icon="👥">
          {candidates.length} Candidates
        </InfoTile>
        <InfoTile label="Turnout" icon="🗳️">
          {election.turnout
            ? `${election.turnout.votes} / ${election.turnout.eligible} votes`
            : "—"}
        </InfoTile>
        <InfoTile label="Time Remaining" icon="⏳">
          {timeLeft(election)}
        </InfoTile>
      </div>

      {candidates.length === 0 ? (
        <Card className="p-6 sm:p-7">
          <EmptyState
            title="Candidates not yet announced"
            description="Candidate profiles will appear here once finalized by the committee."
          />
        </Card>
      ) : myVote ? (
        <>
          <Receipt election={election} />
          <section aria-labelledby="candidates-heading" className="space-y-4">
            <h2
              id="candidates-heading"
              className="text-[13px] font-medium tracking-[0.08em] text-[#8a8ea3] uppercase"
            >
              Candidate Profiles
            </h2>
            <CandidateList election={election} />
          </section>
        </>
      ) : phase === "open" ? (
        <Ballot candidates={candidates} />
      ) : (
        <>
          <CandidateList election={election} />
          <Notice>
            {phase === "upcoming"
              ? `Voting opens on ${longDate(election.opensOn)}. You can review candidate profiles in advance.`
              : "The voting period has closed. You did not cast a vote in this election."}
          </Notice>
        </>
      )}
    </div>
  );
}
