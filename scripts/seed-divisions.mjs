// Creates or updates the divisions, including their tags.
//
//   node --env-file=.env.local scripts/seed-divisions.mjs
//   (or: pnpm seed:divisions)
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local. Safe
// to re-run: divisions are matched by slug, so their ids — and every account,
// proker and meeting that points at them — stay the same.

import { createClient } from "@supabase/supabase-js";

import { DIVISIONS } from "./divisions.mjs";

function env(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} in .env.local`);
    process.exit(1);
  }
  return value;
}

const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SECRET_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data, error } = await supabase
  .from("divisions")
  .upsert(DIVISIONS, { onConflict: "slug" })
  .select("slug, name");
if (error) {
  console.error(`✖ divisions: ${error.message}`);
  process.exit(1);
}

for (const division of data) {
  console.log(`✓ ${division.slug} → ${division.name}`);
}
console.log(`\nDone. ${data.length} divisions seeded.`);
