import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { dummyAccounts } from "@/modules/admin/dummy/data";

import type { Account } from "./fields";

/** Pengurus accounts of the super admin's division, newest first. */
export const getAccounts = cache(async (): Promise<Account[]> => {
  if (DUMMY_DATA) return dummyAccounts.list();

  /* RLS limits super admins to profiles in their own division */
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, nim, contact_email, whatsapp, department, position, period, is_active, division:divisions(name)",
    )
    .eq("role", "admin")
    .order("created_at", { ascending: false });

  return (data ?? []).map((p) => {
    const division = Array.isArray(p.division) ? p.division[0] : p.division;
    return {
      id: p.id,
      username: p.username,
      fullName: p.full_name || p.username,
      nim: p.nim,
      email: p.contact_email,
      whatsapp: p.whatsapp,
      department: p.department,
      division: division?.name ?? null,
      position: p.position,
      period: p.period,
      isActive: p.is_active,
    };
  });
});
