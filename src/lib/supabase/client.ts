"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabasePublishableKey, supabaseUrl } from "./env";

/**
 * Supabase client for the browser, used by the live presensi table to
 * subscribe to Realtime. It reads the same session cookies as the server
 * client, so Row Level Security applies to what it receives.
 */
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  client ??= createBrowserClient(supabaseUrl(), supabasePublishableKey());
  return client;
}
