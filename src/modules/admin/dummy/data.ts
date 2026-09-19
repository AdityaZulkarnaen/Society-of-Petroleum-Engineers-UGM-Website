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
    tags: ["Desain Grafis", "Videografi", "Social Media", "Dokumentasi"],
  },
  nim: "22/498765/TK/54321",
  department: "Teknik Perminyakan",
  position: "Vice Head",
  whatsapp: "+62 812-3456-7890",
  contactEmail: "reza.pratama@example.com",
};

/** A division account, as seeded by scripts/seed-super-admins.mjs. */
export const dummySuperAdmin: Admin = {
  id: "00000000-0000-0000-0000-000000000002",
  username: "spemedcre",
  fullName: "Koordinator Media Creative",
  role: "super_admin",
  division: {
    id: "00000000-0000-0000-0000-0000000000d1",
    name: "Media Creative",
    tags: ["Desain Grafis", "Videografi", "Social Media", "Dokumentasi"],
  },
  nim: null,
  department: null,
  position: "Koordinator",
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
  { id: "p1", name: "Workshop Reservoir Engineering", division: "Media Creative", role: "Panitia Acara", status: "selesai" },
  { id: "p2", name: "APECX 2026", division: "Media Creative", role: "Panitia Creative Media", status: "berlangsung" },
  { id: "p3", name: "Webinar Energi Terbarukan", division: "Media Creative", role: "Moderator", status: "selesai" },
  { id: "p4", name: "SPE Scholar Fund", division: "Media Creative", role: "Tim Sponsorship", status: "direncanakan" },
  { id: "p5", name: "Company Visit Pertamina Hulu", division: "Media Creative", role: "Dokumentasi", status: "dibatalkan" },
  { id: "p6", name: "Kunjungan Industri Lapangan", division: "Media Creative", role: "Koordinator", status: "selesai" },
  { id: "p7", name: "Seminar Nasional Energi 2025", division: "Media Creative", role: "Panitia", status: "selesai" },
  { id: "p8", name: "Penggalangan Dana Alumni", division: "Media Creative", role: "Anggota Tim", status: "direncanakan" },
];

export const dummySelfReport: SelfReport = {
  proker: { done: 5, total: 8 },
  workHours: { done: 126, total: 150 },
  attendance: { done: 22, total: 24 },
  points: { done: 340, total: 400 },
  competencies: [
    { name: "Kepemimpinan", initial: 2.5, current: 4, rating: "baik" },
    { name: "Kerja Tim", initial: 3.5, current: 4.5, rating: "sangat_baik" },
    { name: "Tanggung Jawab", initial: 3, current: 4.5, rating: "sangat_baik" },
    { name: "Inisiatif", initial: 2.5, current: 3.5, rating: "baik" },
    { name: "Komunikasi", initial: 3, current: 4, rating: "baik" },
    { name: "Manajemen Waktu", initial: 2, current: 3, rating: "perlu_ditingkatkan" },
  ],
  notes: {
    achievements:
      "Memimpin tim publikasi APECX 2026 hingga menjangkau lebih dari 650 peserta, dan menyusun ulang panduan identitas visual SPE UGM yang kini dipakai seluruh divisi.",
    strengths:
      "Konsisten menyelesaikan tugas tepat waktu, cepat tanggap saat ada kebutuhan mendadak, dan aktif membantu anggota baru memahami alur kerja divisi.",
    improvements:
      "Pembagian waktu antara proker yang berjalan bersamaan. Disarankan mendelegasikan lebih awal dan memakai timeline bersama agar beban kerja lebih merata.",
  },
};

/* Voting ---------------------------------------------------------------- */

const PROGRAMS = [
  "Memperluas jaringan kerja sama industri dan penelitian nasional & internasional",
  "Mendorong setiap divisi menghasilkan karya publikasi atau inovasi teknis per semester",
  "Membangun sistem mentorship lintas angkatan yang terstruktur dan berkelanjutan",
];

export const dummyCandidates: Candidate[] = [
  {
    id: "c1",
    number: 1,
    fullName: "Bintang Aryadita",
    nim: "24/123456/TK/12345",
    photoUrl: null,
    vision:
      "Mewujudkan SPE UGM sebagai pusat inovasi energi terbarukan yang relevan secara global, dengan membangun jembatan antara riset akademik dan industri minyak & gas di Indonesia.",
    programs: PROGRAMS,
    achievements: [
      "Koordinator APECX 2025 (650+ peserta)",
      "Delegasi SPE APOGCE Perth 2024",
      "Paper finalis SPE Young Professional Essay 2024",
    ],
    grandDesignUrl: "https://example.com/grand-design-bintang.pdf",
  },
  {
    id: "c2",
    number: 2,
    fullName: "Salsabila Rahmawati",
    nim: "24/234567/TK/23456",
    photoUrl: null,
    vision:
      "SPE UGM yang inklusif dan berdampak: setiap anggota punya ruang bertumbuh, dan setiap program memberi manfaat nyata bagi mahasiswa dan masyarakat sekitar.",
    programs: [
      "Program magang bersama mitra industri untuk anggota aktif",
      "Kelas kompetensi teknis bulanan yang dibawakan alumni",
      "Evaluasi kinerja divisi yang transparan setiap kuartal",
    ],
    achievements: [
      "Ketua Pelaksana Seminar Nasional Energi 2025",
      "Juara 2 Petrobowl Regional Asia Pasifik 2024",
    ],
    grandDesignUrl: "https://example.com/grand-design-salsabila.pdf",
  },
  {
    id: "c3",
    number: 3,
    fullName: "Dimas Prasetyo",
    nim: "24/345678/TK/34567",
    photoUrl: null,
    vision:
      "Menjadikan SPE UGM organisasi yang adaptif terhadap transisi energi, dengan budaya kerja yang profesional, kolaboratif, dan berbasis data.",
    programs: [
      "Digitalisasi administrasi dan arsip organisasi",
      "Riset kolaboratif mahasiswa tentang carbon capture",
      "Forum diskusi rutin bersama SPE chapter kampus lain",
    ],
    achievements: [
      "Head of Research & Development 2025/2026",
      "Pemakalah SPE Asia Pacific Student Symposium 2025",
      "Penerima SPE Foundation Scholarship 2024",
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
export const dummyElection = {
  id: "e1",
  title: "Pemilihan President SPE UGM SC 2027",
  termLabel: "2026/2027",
  opensOn: jakartaDate(-6),
  closesOn: jakartaDate(8),
  turnout: { votes: 47, eligible: 68 },
};

/* The dummy vote lives on globalThis so it survives hot reloads. */
type DummyVote = { candidateId: string; castAt: string };
const store = globalThis as { __speDummyVote?: DummyVote | null };

export const dummyVote = {
  get: () => store.__speDummyVote ?? null,
  set: (vote: DummyVote) => {
    store.__speDummyVote = vote;
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
  department: "Teknik Perminyakan",
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
      { name: "Kepemimpinan", initial: 3, current: 4, rating: "baik" },
      { name: "Kerja Tim", initial: 3.5, current: 4.5, rating: "sangat_baik" },
      { name: "Tanggung Jawab", initial: 4, current: 4.5, rating: "sangat_baik" },
      { name: "Inisiatif", initial: 3, current: 4, rating: "baik" },
      { name: "Komunikasi", initial: 3.5, current: 4, rating: "baik" },
      { name: "Manajemen Waktu", initial: 2.5, current: 3, rating: "perlu_ditingkatkan" },
    ],
    notes: {
      achievements:
        "Reza menunjukkan kinerja yang konsisten dan dapat diandalkan selama periode 2025/2026. Kontribusi paling menonjol tercatat pada APECX 2026, di mana ia berperan sebagai PIC Logistik dan berhasil mengkoordinasikan persiapan venue dan konsumsi untuk lebih dari 300 peserta secara lintas divisi.",
      strengths:
        "Kerja tim dan tanggung jawab menjadi dua kompetensi yang paling menonjol. Reza secara konsisten hadir dalam rapat (22 dari 24 pertemuan) dan menyelesaikan tugas tepat waktu. Rekan satu divisi mencatat bahwa ia aktif membantu anggota baru beradaptasi.",
      improvements:
        "Berdasarkan observasi sepanjang periode, manajemen waktu masih menjadi area yang perlu mendapat perhatian — terutama saat jadwal kegiatan SPE berbenturan dengan kalender akademik.",
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
