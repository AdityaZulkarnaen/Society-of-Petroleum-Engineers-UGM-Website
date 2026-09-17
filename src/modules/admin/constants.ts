/** Where people without an account, or who forgot their password, can ask. */
export const ADMIN_CONTACT_EMAIL = "admin@spe-ugm.ac.id";

/**
 * Accounts sign in with a username only. Supabase Auth still needs an email,
 * so every account gets an internal one: `<username>@ACCOUNT_EMAIL_DOMAIN`.
 * It is never shown or mailed. Keep in sync with scripts/seed-super-admins.mjs.
 */
export const ACCOUNT_EMAIL_DOMAIN = "accounts.spe-ugm.internal";

export const accountEmail = (username: string) =>
  `${username.toLowerCase()}@${ACCOUNT_EMAIL_DOMAIN}`;
