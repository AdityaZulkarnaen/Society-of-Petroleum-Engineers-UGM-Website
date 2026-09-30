/* Sample data for the super admin's Acara & Proker (see ./index.ts). */

import type {
  Division,
  ManagedProker,
  PengurusOption,
} from "@/modules/super-admin/proker/fields";

import { dummyAccounts } from "./data";

/* As seeded by scripts/seed-super-admins.mjs; d1 is dummySuperAdmin's. */
export const dummyDivisions: Division[] = [
  { id: "00000000-0000-0000-0000-0000000000d1", name: "Media Creative" },
  { id: "00000000-0000-0000-0000-0000000000d2", name: "Competency Development" },
  { id: "00000000-0000-0000-0000-0000000000d3", name: "Research & Education" },
  { id: "00000000-0000-0000-0000-0000000000d4", name: "Human Resource Development" },
  { id: "00000000-0000-0000-0000-0000000000d5", name: "External Affairs" },
  { id: "00000000-0000-0000-0000-0000000000d6", name: "Finance" },
  { id: "00000000-0000-0000-0000-0000000000d7", name: "Executive" },
];

const OTHER_PENGURUS: PengurusOption[] = [
  { id: "o1", fullName: "Nadia Putri Kusuma", division: "Competency Development" },
  { id: "o2", fullName: "Yoga Aditama", division: "Competency Development" },
  { id: "o3", fullName: "Laras Wulandari", division: "Research & Education" },
  { id: "o4", fullName: "Bayu Firmansyah", division: "Research & Education" },
  { id: "o5", fullName: "Intan Permatasari", division: "Human Resource Development" },
];

/** Active pengurus of every division, as list_pengurus() returns them. */
export function dummyPengurusOptions(): PengurusOption[] {
  return [
    ...dummyAccounts
      .list()
      .filter((a) => a.isActive)
      .map((a) => ({ id: a.id, fullName: a.fullName, division: a.division })),
    ...OTHER_PENGURUS,
  ].sort(
    (a, b) =>
      (a.division ?? "").localeCompare(b.division ?? "") ||
      a.fullName.localeCompare(b.fullName, "en"),
  );
}

const [MEDCRE, COMPDEV, RNE] = dummyDivisions;

const member = (profileId: string, name: string, role: string) => ({
  profileId,
  name,
  role,
});

const PROKER: ManagedProker[] = [
  {
    id: "k1",
    name: "APECX 2025",
    description:
      "Annual Petroleum Engineering Conference & Exhibition, national conference and exhibition.",
    divisionId: COMPDEV.id,
    division: COMPDEV.name,
    startsOn: "2025-08-01",
    endsOn: "2025-10-15",
    status: "berlangsung",
    members: [
      member("a2", "Reza Rasendriya Hemawan", "Coordinator"),
      member("a3", "Budi Santoso", "Logistics PIC"),
      member("o1", "Nadia Putri Kusuma", "Secretary"),
      member("o2", "Yoga Aditama", "Treasurer"),
      member("a4", "Citra Dewi", "Publications"),
    ],
  },
  {
    id: "k2",
    name: "Workshop Reservoir Engineering",
    description:
      "Reservoir simulation workshop using Eclipse software with industry practitioners.",
    divisionId: RNE.id,
    division: RNE.name,
    startsOn: "2025-08-01",
    endsOn: "2025-10-15",
    status: "selesai",
    members: [
      member("o3", "Laras Wulandari", "Coordinator"),
      member("o4", "Bayu Firmansyah", "Curriculum PIC"),
      member("a5", "Ahmad Faruq Hakim", "Documentation"),
    ],
  },
  {
    id: "k3",
    name: "Renewable Energy Webinar",
    description: "Alumni collaboration webinar discussing energy transition in Indonesia.",
    divisionId: COMPDEV.id,
    division: COMPDEV.name,
    startsOn: "2025-11-03",
    endsOn: "2025-11-03",
    status: "direncanakan",
    members: [
      member("o2", "Yoga Aditama", "Coordinator"),
      member("a6", "Siti Nuraini Fadillah", "Moderator"),
    ],
  },
  {
    id: "k4",
    name: "Weekly Oil & Gas Educational Content",
    description:
      "Weekly Instagram content series explaining fundamental concepts of the oil & gas industry.",
    divisionId: MEDCRE.id,
    division: MEDCRE.name,
    startsOn: "2025-09-01",
    endsOn: "2026-06-30",
    status: "berlangsung",
    members: [
      member("a1", "Rizky Ananda", "Coordinator"),
      member("a4", "Citra Dewi", "Designer"),
      member("a7", "Dewi Lestari", "Copywriter"),
    ],
  },
  {
    id: "k5",
    name: "Industrial Visit Documentation",
    description: "Photo and video coverage of industrial field visit to oil & gas facilities.",
    divisionId: MEDCRE.id,
    division: MEDCRE.name,
    startsOn: "2025-07-12",
    endsOn: "2025-07-14",
    status: "selesai",
    members: [
      member("a3", "Budi Santoso", "Coordinator"),
      member("a8", "Fajar Nugroho", "Videographer"),
    ],
  },
  {
    id: "k6",
    name: "National Energy Seminar 2025",
    description:
      "National seminar on energy resilience featuring speakers from regulators and industry.",
    divisionId: RNE.id,
    division: RNE.name,
    startsOn: "2025-05-20",
    endsOn: "2025-05-20",
    status: "selesai",
    members: [member("o3", "Laras Wulandari", "Coordinator")],
  },
  {
    id: "k7",
    name: "SPE UGM Visual Identity Rebranding",
    description:
      "Refresh of sub-brand logos, color palettes, and publication templates across all divisions.",
    divisionId: MEDCRE.id,
    division: MEDCRE.name,
    startsOn: "2025-12-01",
    endsOn: "2026-02-28",
    status: "direncanakan",
    members: [],
  },
  {
    id: "k8",
    name: "Pertamina Hulu Company Visit",
    description:
      "Visit to production facilities, canceled due to partner schedule changes.",
    divisionId: COMPDEV.id,
    division: COMPDEV.name,
    startsOn: "2025-06-10",
    endsOn: "2025-06-10",
    status: "dibatalkan",
    members: [member("o1", "Nadia Putri Kusuma", "Coordinator")],
  },
];

/* Kept on globalThis so edits survive hot reloads until the server restarts. */
const store = globalThis as { __speDummyProker?: ManagedProker[] };

export const dummyManagedProker = {
  list: (): ManagedProker[] => (store.__speDummyProker ??= structuredClone(PROKER)),
  save: (proker: ManagedProker[]) => {
    store.__speDummyProker = proker;
  },
};
