/**
 * Preview the dashboard filled with sample data (./data.ts) instead of
 * Supabase: no login, no database, voting is kept in memory until the dev
 * server restarts. Only takes effect under `next dev`, never in a build.
 */
const ENABLED = true;

export const DUMMY_DATA = ENABLED && process.env.NODE_ENV === "development";
