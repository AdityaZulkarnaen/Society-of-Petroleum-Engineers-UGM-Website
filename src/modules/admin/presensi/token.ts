import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The QR shown on the session page carries a signed token instead of the plain
 * rapat id, so a screenshot passed around after the fact is worthless: the
 * token is only valid for the window it was minted in, plus the one before it,
 * and the signing key never leaves the server.
 */

/** How often the QR rotates, in seconds. */
export const TOKEN_WINDOW_SECONDS = 30;

/* The previous window stays valid, so a scan that starts just before the QR
   rotates still lands. A token is therefore good for 30–60 seconds. */
const GRACE_WINDOWS = 1;

function signingKey() {
  const key =
    process.env.PRESENSI_TOKEN_SECRET ?? process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing PRESENSI_TOKEN_SECRET (or SUPABASE_SECRET_KEY). Copy .env.example to .env.local and fill it in.",
    );
  }
  return key;
}

const windowOf = (ms: number) =>
  Math.floor(ms / 1000 / TOKEN_WINDOW_SECONDS);

const sign = (meetingId: string, slot: number) =>
  createHmac("sha256", signingKey())
    .update(`${meetingId}.${slot}`)
    .digest("base64url")
    .slice(0, 22);

/** A token for the current window, with when it stops being shown. */
export function mintScanToken(meetingId: string, now = Date.now()) {
  const slot = windowOf(now);
  return {
    token: `${meetingId}.${slot}.${sign(meetingId, slot)}`,
    /* the QR is replaced on the window boundary */
    expiresAt: (slot + 1) * TOKEN_WINDOW_SECONDS * 1000,
  };
}

/** The rapat id a token vouches for, or null when it is forged or stale. */
export function readScanToken(token: string, now = Date.now()) {
  const [meetingId, slot, signature] = token.trim().split(".");
  if (!meetingId || !slot || !signature) return null;

  const current = windowOf(now);
  const claimed = Number(slot);
  if (!Number.isInteger(claimed)) return null;
  if (claimed > current || claimed < current - GRACE_WINDOWS) return null;

  const expected = Buffer.from(sign(meetingId, claimed));
  const given = Buffer.from(signature);
  if (expected.length !== given.length) return null;
  return timingSafeEqual(expected, given) ? meetingId : null;
}
