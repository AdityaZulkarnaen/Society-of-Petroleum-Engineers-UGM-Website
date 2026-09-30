/* Sample data for previewing the dashboard (see ./index.ts). */

import type { Proker } from "../acara/data";
import type { Admin } from "../auth/session";
import type { DivisionSummary } from "../overview/data";
import type { SelfReport } from "../rekap-diri/data";
import type { Candidate } from "../voting/data";
import type { Account } from "@/modules/super-admin/accounts/fields";
import type { SuperAdminSummary } from "@/modules/super-admin/dashboard/data";

export const dummyAdmin: Admin = {
  id: "00000000-0000-0000-0000-000000000001",
  username: "reza",
  fullName: "Reza Aditya Pratama",
  role: "admin",
  division: {
    id: "00000000-0000-0000-0000-0000000000d1",
    name: "Media Creative",
    tags: ["Graphic Design", "Videography", "Social Media", "Documentation"],
  },
  nim: "22/498765/TK/54321",
  department: "Petroleum Engineering",
  position: "Vice Head",
  whatsapp: "+62 812-3456-7890",
  contactEmail: "reza.pratama@example.com",
};

/** A division account, as seeded by scripts/seed-super-admins.mjs. */
export const dummySuperAdmin: Admin = {
  id: "00000000-0000-0000-0000-000000000002",
  username: "spemedcre",
  fullName: "Media Creative Coordinator",
  role: "super_admin",
  division: {
    id: "00000000-0000-0000-0000-0000000000d1",
    name: "Media Creative",
    tags: ["Graphic Design", "Videography", "Social Media", "Documentation"],
  },
  nim: null,
  department: null,
  position: "Coordinator",
  whatsapp: null,
  contactEmail: null,
};

export const dummySuperAdminSummary: SuperAdminSummary = {
  totalAccounts: 10,
  activeAccounts: 9,
  /* derived from the dummy accounts and rekap in dashboard/data.ts */
  rekapFilled: null,
  pendingRekap: null,
  divisionCount: 7,
  /* signed in 25 minutes ago */
  lastSignInAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
};

export const dummyDivisionSummary: DivisionSummary = {
  memberCount: 12,
  headName: "Nadia Putri Kusuma",
  activeProker: 3,
};

export const dummyProker: Proker[] = [
  { id: "p1", name: "Reservoir Engineering Workshop", division: "Media Creative", role: "Event Committee", status: "selesai" },
  { id: "p2", name: "APECX 2026", division: "Media Creative", role: "Creative Media Committee", status: "berlangsung" },
  { id: "p3", name: "Renewable Energy Webinar", division: "Media Creative", role: "Moderator", status: "selesai" },
  { id: "p4", name: "SPE Scholar Fund", division: "Media Creative", role: "Sponsorship Team", status: "direncanakan" },
  { id: "p5", name: "Pertamina Hulu Company Visit", division: "Media Creative", role: "Documentation", status: "dibatalkan" },
  { id: "p6", name: "Field Industrial Visit", division: "Media Creative", role: "Coordinator", status: "selesai" },
  { id: "p7", name: "National Energy Seminar 2025", division: "Media Creative", role: "Committee", status: "selesai" },
  { id: "p8", name: "Alumni Fundraising", division: "Media Creative", role: "Team Member", status: "direncanakan" },
];

export const dummySelfReport: SelfReport = {
  proker: { done: 5, total: 8 },
  workHours: { done: 126, total: 150 },
  attendance: { done: 22, total: 24 },
  points: { done: 340, total: 400 },
  competencies: [
    { name: "Grit / Perseverance", initial: 3.5, current: 4 },
    { name: "Empower Others", initial: 3, current: 4 },
    { name: "Teamwork", initial: 3.5, current: 4 },
    { name: "Caring", initial: 4, current: 5 },
    { name: "Accountability", initial: 4, current: 5 },
    { name: "Integrity", initial: 4, current: 5 },
    { name: "Agility", initial: 3, current: 4 },
    { name: "Innovation", initial: 3, current: 4 },
    { name: "Communication", initial: 3, current: 4 },
    { name: "Self Awareness", initial: 4, current: 5 },
    { name: "Strive for Excellence", initial: 4, current: 5 },
    { name: "Self Purpose", initial: 3, current: 4 },
  ],
  notes: {
    achievements:
      "Led the APECX 2026 publication team reaching over 650 participants, and redesigned the SPE UGM visual identity guidelines now adopted across all divisions.",
    strengths:
      "Consistently completes tasks on time, responds promptly to urgent requests, and actively assists new members in understanding division workflows.",
    improvements:
      "Time management across concurrent work programs. Recommended to delegate earlier and utilize shared timelines for balanced workloads.",
  },
};

/* Voting ---------------------------------------------------------------- */

const PROGRAMS = [
  "Expand industry and academic research collaboration networks nationally and internationally",
  "Encourage each division to produce publications or technical innovations every semester",
  "Build a structured, sustainable cross-cohort mentorship system",
];

const CANDIDATES: Candidate[] = [
  {
    id: "c1",
    number: 1,
    fullName: "Bintang Aryadita",
    nim: "24/123456/TK/12345",
    position: "Head of Engineering",
    photoUrl: null,
    vision:
      "To establish SPE UGM as a globally relevant renewable energy innovation hub by bridging academic research and Indonesia's oil & gas industry.",
    programs: PROGRAMS,
    achievements: [
      "Coordinator of APECX 2025 (650+ participants)",
      "SPE APOGCE Perth Delegate 2024",
      "SPE Young Professional Essay Finalist 2024",
    ],
    grandDesignUrl: "https://example.com/grand-design-bintang.pdf",
  },
  {
    id: "c2",
    number: 2,
    fullName: "Salsabila Rahmawati",
    nim: "24/234567/TK/23456",
    position: "Project Officer of National Seminar",
    photoUrl: null,
    vision:
      "An inclusive and impactful SPE UGM: every member has room to grow, and every program delivers tangible value to students and the broader community.",
    programs: [
      "Joint internship program with industry partners for active members",
      "Monthly technical competency classes led by alumni",
      "Transparent quarterly division performance reviews",
    ],
    achievements: [
      "Project Officer of National Energy Seminar 2025",
      "2nd Place Petrobowl Asia Pacific Regional 2024",
    ],
    grandDesignUrl: "https://example.com/grand-design-salsabila.pdf",
  },
  {
    id: "c3",
    number: 3,
    fullName: "Dimas Prasetyo",
    nim: "24/345678/TK/34567",
    position: "Head of Research & Development",
    photoUrl: null,
    vision:
      "To make SPE UGM an organization adaptable to the energy transition, with a professional, collaborative, and data-driven culture.",
    programs: [
      "Digitization of organization administration and archives",
      "Collaborative student research on carbon capture",
      "Regular discussion forums with other SPE student chapters",
    ],
    achievements: [
      "Head of Research & Development 2025/2026",
      "Speaker at SPE Asia Pacific Student Symposium 2025",
      "SPE Foundation Scholarship Recipient 2024",
    ],
    grandDesignUrl: null,
  },
];

const DAY = 24 * 60 * 60 * 1000;

/** Jakarta date `offset` days from today, as YYYY-MM-DD. */
function jakartaDate(offset: number) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(Date.now() + offset * DAY),
  );
}

/** Always open: started 6 days ago, 8 days to go. */
const ELECTION = {
  id: "e1",
  title: "SPE UGM SC President Election 2027",
  termLabel: "2026/2027",
  opensOn: jakartaDate(-6),
  closesOn: jakartaDate(8),
  isOpen: true,
  turnout: { votes: 47, eligible: 68 },
};

export type DummyElection = typeof ELECTION;

/* The election and its candidates, editable from the super admin's Voting
   page; kept on globalThis so edits survive hot reloads. */
type VotingState = { election: DummyElection | null; candidates: Candidate[] };
const votingStore = globalThis as { __speDummyVoting?: VotingState };

export const dummyVoting = {
  get: (): VotingState =>
    (votingStore.__speDummyVoting ??= structuredClone({
      election: ELECTION as DummyElection | null,
      candidates: CANDIDATES,
    })),
  save: (state: VotingState) => {
    votingStore.__speDummyVoting = state;
  },
};

/* The dummy vote lives on globalThis so it survives hot reloads. */
type DummyVote = { candidateId: string; castAt: string };
const store = globalThis as { __speDummyVote?: DummyVote | null };

export const dummyVote = {
  get: () => store.__speDummyVote ?? null,
  set: (vote: DummyVote) => {
    store.__speDummyVote = vote;
  },
  clear: () => {
    store.__speDummyVote = null;
  },
};

/* Manajemen Akun --------------------------------------------------------- */

const account = (
  id: string,
  fullName: string,
  username: string,
  position: string,
  isActive = true,
): Account => ({
  id,
  username,
  fullName,
  nim: "24/123456/TK/12345",
  email: `${username.replace(".", "")}@mail.ugm.ac.id`,
  whatsapp: "+62 812-3456-7890",
  department: "Petroleum Engineering",
  division: "Media Creative",
  position,
  period: "2025/2026",
  isActive,
});

const ACCOUNTS: Account[] = [
  account("a1", "Rizky Ananda", "rizky.ananda", "Head"),
  account("a2", "Reza Rasendriya Hemawan", "reza.hemawan", "Vice Head"),
  account("a3", "Budi Santoso", "budi.santoso", "Staff"),
  account("a4", "Citra Dewi", "citra.dewi", "Staff"),
  account("a5", "Ahmad Faruq Hakim", "ahmad.hakim", "Vice Head"),
  account("a6", "Siti Nuraini Fadillah", "siti.fadillah", "Vice Head"),
  account("a7", "Dewi Lestari", "dewi.lestari", "Staff"),
  account("a8", "Fajar Nugroho", "fajar.nugroho", "Staff"),
  account("a9", "Galih Pratama", "galih.pratama", "Staff"),
  account("a10", "Hana Maharani", "hana.maharani", "Staff", false),
];

/* Kept on globalThis so edits survive hot reloads until the server restarts. */
const accountStore = globalThis as { __speDummyAccounts?: Account[] };

export const dummyAccounts = {
  list: (): Account[] => (accountStore.__speDummyAccounts ??= structuredClone(ACCOUNTS)),
  save: (accounts: Account[]) => {
    accountStore.__speDummyAccounts = accounts;
  },
};

/* Rekap Pengurus --------------------------------------------------------- */

const REKAP: Record<string, SelfReport> = {
  a2: {
    proker: { done: 6, total: 8 },
    workHours: null,
    attendance: { done: 22, total: 24 },
    points: { done: 340, total: 400 },
    competencies: [
      { name: "Grit / Perseverance", initial: 3, current: 4 },
      { name: "Empower Others", initial: 3, current: 4 },
      { name: "Teamwork", initial: 3.5, current: 4 },
      { name: "Caring", initial: 4, current: 5 },
      { name: "Accountability", initial: 4, current: 5 },
      { name: "Integrity", initial: 4, current: 5 },
      { name: "Agility", initial: 3.5, current: 4 },
      { name: "Innovation", initial: 3, current: 4 },
      { name: "Communication", initial: 3.5, current: 4 },
      { name: "Self Awareness", initial: 4, current: 5 },
      { name: "Strive for Excellence", initial: 4, current: 4.5 },
      { name: "Self Purpose", initial: 3, current: 4 },
    ],
    notes: {
      achievements:
        "Reza demonstrated consistent and dependable performance throughout the 2025/2026 term. His most notable contribution was at APECX 2026, where he served as Logistics PIC and successfully coordinated venue and catering preparations across divisions for over 300 participants.",
      strengths:
        "Teamwork and accountability are his strongest competencies. Reza consistently attended meetings (22 out of 24) and completed assignments on time. Division peers noted his active support in helping new members adapt.",
      improvements:
        "Based on observations throughout the term, time management remains an area for improvement — particularly when SPE project timelines overlap with the academic calendar.",
    },
  },
};

/* Kept on globalThis so saves survive hot reloads until the server restarts. */
const rekapStore = globalThis as { __speDummyRekap?: Record<string, SelfReport> };
const rekapRecords = () => (rekapStore.__speDummyRekap ??= structuredClone(REKAP));

export const dummyRekap = {
  ids: () => Object.keys(rekapRecords()),
  get: (id: string): SelfReport | null => rekapRecords()[id] ?? null,
  set: (id: string, report: SelfReport) => {
    rekapRecords()[id] = report;
  },
};
