import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { DUMMY_DATA } from "../dummy";
import { HOME_PATH } from "../constants";
import { dummyAdmin, dummySuperAdmin } from "../dummy/data";

export type AdminRole = "super_admin" | "admin";

export type Admin = {
  id: string;
  username: string;
  fullName: string;
  role: AdminRole;
  /** Super admins manage the admin accounts of this division. */
  division: { id: string; name: string; tags: string[] } | null;
  nim: string | null;
  department: string | null;
  position: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
};

/**
 * The signed-in dashboard account, or null. A Supabase user only counts as an
 * admin when they have an active profile row. Cached per request.
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  if (DUMMY_DATA) return dummyAdmin;

  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, role, is_active, nim, department, position, whatsapp, contact_email, division:divisions(id, name, tags)",
    )
    .eq("id", claims.sub)
    .maybeSingle();
  if (!profile?.is_active) return null;

  /* many-to-one, but untyped queries report embedded rows as an array */
  const division = Array.isArray(profile.division)
    ? (profile.division[0] ?? null)
    : profile.division;

  return {
    id: profile.id,
    username: profile.username,
    fullName: profile.full_name || profile.username,
    role: profile.role,
    division,
    nim: profile.nim,
    department: profile.department,
    position: profile.position,
    whatsapp: profile.whatsapp,
    contactEmail: profile.contact_email,
  };
});

/**
 * Use at the top of every pengurus (/admin) page or Server Function. Super
 * admins are sent to their own dashboard.
 */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "admin") redirect(HOME_PATH[admin.role]);
  return admin;
}

/** Use at the top of every /super-admin page or Server Function. */
export async function requireSuperAdmin() {
  if (DUMMY_DATA) return dummySuperAdmin;

  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "super_admin") redirect(HOME_PATH[admin.role]);
  return admin;
}
