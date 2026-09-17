import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type AdminRole = "super_admin" | "admin";

export type Admin = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: AdminRole;
  /** Super admins manage the admin accounts of this division. */
  division: { id: string; name: string } | null;
};

/**
 * The signed-in dashboard account, or null. A Supabase user only counts as an
 * admin when they have a profile row. Cached per request.
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, role, division:divisions(id, name)")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!profile) return null;

  /* many-to-one, but untyped queries report embedded rows as an array */
  const division = Array.isArray(profile.division)
    ? (profile.division[0] ?? null)
    : profile.division;

  return {
    id: profile.id,
    email: claims.email ?? "",
    username: profile.username,
    fullName: profile.full_name,
    role: profile.role,
    division,
  };
});

/** Use at the top of every protected admin page or Server Function. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
