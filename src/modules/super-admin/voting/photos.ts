import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/* Candidate photos in Supabase Storage (see the candidate_photos migration). */

export const PHOTO_BUCKET = "candidate-photos";

const PUBLIC_PREFIX = `/storage/v1/object/public/${PHOTO_BUCKET}/`;

/** The object path of one of our photos, or null for any other URL. */
export function photoPath(url: string | null | undefined) {
  if (!url) return null;
  try {
    const { pathname } = new URL(url);
    return pathname.startsWith(PUBLIC_PREFIX)
      ? decodeURIComponent(pathname.slice(PUBLIC_PREFIX.length))
      : null;
  } catch {
    return null;
  }
}

/** Removes our photos among `urls`; other URLs are ignored. Best effort. */
export async function removePhotos(
  supabase: SupabaseClient,
  urls: (string | null | undefined)[],
) {
  const paths = urls.map(photoPath).filter((p): p is string => Boolean(p));
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  if (error) console.error("removePhotos", error.message);
}
