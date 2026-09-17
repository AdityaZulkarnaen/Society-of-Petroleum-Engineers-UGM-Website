// Creates the divisions and one super admin account per division coordinator.
//
//   node --env-file=.env.local scripts/seed-super-admins.mjs
//   (or: pnpm seed:super-admins)
//
// Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY and
// SEED_SUPER_ADMIN_PASSWORD in .env.local. Safe to re-run: existing divisions
// and accounts are updated, and their password is reset to the seed password.

import { createClient } from "@supabase/supabase-js";

/* Accounts sign in with a username only. Supabase Auth still needs an email,
   so each account gets an internal one derived from its username. Keep in
   sync with ACCOUNT_EMAIL_DOMAIN in src/modules/admin/constants.ts. */
const ACCOUNT_EMAIL_DOMAIN = "accounts.spe-ugm.internal";

const DIVISIONS = [
  { slug: "medcre", name: "MedCre" },
  { slug: "hrd", name: "HRD" },
  { slug: "rne", name: "RnE" },
  { slug: "ea", name: "EA" },
  { slug: "compdev", name: "CompDev" },
  { slug: "finance", name: "Finance" },
  { slug: "executive", name: "Executive" },
];

function env(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} in .env.local`);
    process.exit(1);
  }
  return value;
}

const password = env("SEED_SUPER_ADMIN_PASSWORD");
const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SECRET_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function fail(step, error) {
  console.error(`✖ ${step}: ${error.message}`);
  process.exit(1);
}

/* existing auth users by email, so re-runs update instead of duplicating */
const { data: userList, error: listError } =
  await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) fail("list users", listError);
const usersByEmail = new Map(userList.users.map((u) => [u.email, u]));

for (const division of DIVISIONS) {
  const username = `spe${division.slug}`;
  const email = `${username}@${ACCOUNT_EMAIL_DOMAIN}`;

  const { data: divisionRow, error: divisionError } = await supabase
    .from("divisions")
    .upsert(division, { onConflict: "slug" })
    .select("id")
    .single();
  if (divisionError) fail(`division ${division.slug}`, divisionError);

  let userId = usersByEmail.get(email)?.id;
  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
    });
    if (error) fail(`update ${username}`, error);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error) fail(`create ${username}`, error);
    userId = data.user.id;
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username,
      full_name: `Koordinator ${division.name}`,
      role: "super_admin",
      division_id: divisionRow.id,
    },
    { onConflict: "id" },
  );
  if (profileError) fail(`profile ${username}`, profileError);

  console.log(`✓ ${username} → ${division.name}`);
}

console.log("\nDone. Every account uses the seed password — change them soon.");
