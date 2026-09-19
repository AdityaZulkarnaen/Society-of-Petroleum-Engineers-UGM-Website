/** Where people without an account, or who forgot their password, can ask. */
export const ADMIN_CONTACT_EMAIL = "admin@spe-ugm.ac.id";

/**
 * Where each role's dashboard lives. Super admins are the division accounts;
 * admins are the pengurus they create.
 */
export const HOME_PATH = {
  super_admin: "/super-admin",
  admin: "/admin",
} as const;

/**
 * Accounts sign in with a username only. Supabase Auth still needs an email,
 * so every account gets an internal one: `<username>@ACCOUNT_EMAIL_DOMAIN`.
 * It is never shown or mailed. Keep in sync with scripts/seed-super-admins.mjs.
 */
export const ACCOUNT_EMAIL_DOMAIN = "accounts.spe-ugm.internal";

export const accountEmail = (username: string) =>
  `${username.toLowerCase()}@${ACCOUNT_EMAIL_DOMAIN}`;

/**
 * The current management period. Drives the period progress card; update it
 * when a new period starts.
 */
export const CURRENT_PERIOD = {
  label: "2025/2026",
  startsOn: "2025-10-01",
  endsOn: "2026-09-30",
};
