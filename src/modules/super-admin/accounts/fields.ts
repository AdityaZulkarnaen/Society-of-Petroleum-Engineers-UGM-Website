/* Shared by the account form (client) and its Server Functions. */

export const POSITIONS = ["Head", "Vice Head", "Staff"] as const;

export type Account = {
  id: string;
  username: string;
  fullName: string;
  nim: string | null;
  /** Contact email; sign-in uses the internal auth email instead. */
  email: string | null;
  whatsapp: string | null;
  department: string | null;
  division: string | null;
  position: string | null;
  period: string | null;
  isActive: boolean;
};

/** What the Tambah / Edit form sends. */
export type AccountInput = {
  fullName: string;
  nim: string;
  email: string;
  whatsapp: string;
  department: string;
  position: string;
  period: string;
};

export type FieldErrors = Partial<Record<keyof AccountInput, string>>;

export type ActionResult = { error?: string; fieldErrors?: FieldErrors };

export type Credentials = { username: string; password: string };
