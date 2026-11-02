import { timingSafeEqual } from "node:crypto";

/**
 * TEMPORARY DIAGNOSTIC ENDPOINT (B6G.10)
 *
 * Purpose:
 * Safely verify Vercel runtime identity and staging Supabase configuration
 * on the dedicated staging Vercel deployment without activating recruitment
 * or exposing any secrets, tokens, or environment values.
 *
 * Security Guarantees:
 * - Read-only GET only.
 * - Does not use recruitment settings() gate, Supabase client, Upstash, or network.
 * - Recruitment is NOT activated.
 * - Requires Vercel runtime and exact match of VERCEL_PROJECT_ID === VERCEL_STAGING_PROJECT_ID.
 * - Requires high-entropy DIAGNOSTIC_TOKEN via x-diagnostic-token header.
 * - Returns ONLY 3 booleans. Never logs or outputs credentials, IDs, or URLs.
 * - Fails closed with HTTP 404 on any missing or mismatched check.
 *
 * Removal steps:
 * 1. Delete this file: app/api/internal/staging-health/route.ts
 * 2. Delete test file: scripts/recruitment-backend/staging-health.test.cjs
 * 3. Delete documentation: docs/staging/B6G10-diagnostic-guide.md
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGING_SUPABASE_PROJECT_REF = "lavxddhrrwsjcshmnwvu";

const responseHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "Content-Type": "application/json",
};

function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function GET(request: Request): Promise<Response> {
  // 1. Diagnostic token check
  const serverToken = process.env.DIAGNOSTIC_TOKEN;
  const clientToken =
    request.headers.get("x-diagnostic-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!serverToken || serverToken.length < 16 || !clientToken || !safeCompare(clientToken, serverToken)) {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: responseHeaders,
    });
  }

  // 2. Vercel runtime check
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;
  if (!isVercel) {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: responseHeaders,
    });
  }

  // 3. Vercel Project ID check
  const actualProjectId = process.env.VERCEL_PROJECT_ID;
  const expectedProjectId = process.env.VERCEL_STAGING_PROJECT_ID;

  const vercelProjectIdPresent = Boolean(actualProjectId && actualProjectId.trim().length > 0);
  const vercelProjectIdMatches =
    vercelProjectIdPresent &&
    Boolean(expectedProjectId && expectedProjectId.trim().length > 0) &&
    actualProjectId === expectedProjectId;

  if (!vercelProjectIdMatches) {
    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: responseHeaders,
    });
  }

  // 4. Staging Supabase reference check derived strictly from NEXT_PUBLIC_SUPABASE_URL
  let stagingSupabaseMatches = false;
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      const hostMatch = parsed.hostname.match(/^([a-z0-9_-]+)\.supabase\.(co|in|net)$/i);
      if (hostMatch && hostMatch[1] === STAGING_SUPABASE_PROJECT_REF) {
        stagingSupabaseMatches = true;
      }
    } catch {
      stagingSupabaseMatches = false;
    }
  }

  // 5. Response: Return ONLY the three booleans. No secrets, IDs, URLs, or tokens.
  return new Response(
    JSON.stringify({
      vercelProjectIdPresent,
      vercelProjectIdMatches,
      stagingSupabaseMatches,
    }),
    {
      status: 200,
      headers: responseHeaders,
    },
  );
}

