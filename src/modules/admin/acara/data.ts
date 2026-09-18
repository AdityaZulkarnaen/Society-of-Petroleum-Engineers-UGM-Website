export const PROKER_STATUSES = [
  "berlangsung",
  "selesai",
  "direncanakan",
  "rutin",
] as const;

export type ProkerStatus = (typeof PROKER_STATUSES)[number];

export type Proker = {
  id: string;
  name: string;
  division: string;
  /** The admin's own role in this work program. */
  role: string;
  status: ProkerStatus;
};

/**
 * Work programs the signed-in admin takes part in this period. Work programs
 * aren't recorded yet, so the list is empty and the page renders its empty
 * state. Scope this query to the admin once the table exists.
 */
export async function getMyProker(): Promise<Proker[]> {
  return [];
}
