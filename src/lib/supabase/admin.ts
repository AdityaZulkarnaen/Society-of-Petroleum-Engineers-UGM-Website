import "server-only";

import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "./env";

/**
 * Supabase client with the secret key. It bypasses Row Level Security, so it
 * must only run on the server and only after the caller has been authorised.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY. Copy .env.example to .env.local and fill in your Supabase project keys.",
    );
  }

  return createClient(supabaseUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
