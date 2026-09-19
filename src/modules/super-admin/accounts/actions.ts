"use server";

import { randomInt } from "node:crypto";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { accountEmail } from "@/modules/admin/constants";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { dummyAccounts } from "@/modules/admin/dummy/data";

import {
  NIM_HINT,
  NIM_PATTERN,
  POSITIONS,
  type AccountInput,
  type ActionResult,
  type Credentials,
  type FieldErrors,
} from "./fields";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s-]{8,20}$/;
const PERIOD = /^\d{4}\/\d{4}$/;

function revalidate() {
  revalidatePath("/super-admin/akun");
  revalidatePath("/super-admin");
}

/* Trim, turn blanks into null, and check each field. */
function validate(input: AccountInput) {
  const v = Object.fromEntries(
    Object.entries(input).map(([k, value]) => [k, String(value ?? "").trim()]),
  ) as AccountInput;
  const errors: FieldErrors = {};

  if (v.fullName.length < 2) errors.fullName = "Isi nama lengkap.";
  if (v.nim && !NIM_PATTERN.test(v.nim)) errors.nim = NIM_HINT;
  if (v.email && !EMAIL.test(v.email)) errors.email = "Email tidak valid.";
  if (v.whatsapp && !PHONE.test(v.whatsapp)) {
    errors.whatsapp = "Nomor WhatsApp tidak valid.";
  }
  if (!POSITIONS.includes(v.position as (typeof POSITIONS)[number])) {
    errors.position = "Pilih jabatan.";
  }
  if (!PERIOD.test(v.period)) errors.period = "Format periode: 2025/2026.";

  const profile = {
    full_name: v.fullName,
    nim: v.nim.toUpperCase() || null,
    contact_email: v.email.toLowerCase() || null,
    whatsapp: v.whatsapp || null,
    department: v.department || null,
    position: v.position,
    period: v.period,
  };
  return { errors, profile, ok: Object.keys(errors).length === 0 };
}

/** 'Siti Nuraini Fadillah' → 'siti.fadillah', within the username rules. */
function usernameBase(fullName: string) {
  const words = fullName
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const base =
    words.length > 1 ? `${words[0]}.${words[words.length - 1]}` : (words[0] ?? "");
  return (base.length >= 3 ? base : `pengurus${base}`).slice(0, 26);
}

function uniqueUsername(base: string, taken: Set<string>) {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    if (!taken.has(`${base}${n}`)) return `${base}${n}`;
  }
}

/* No look-alike characters, since it's read out or typed by hand. */
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function temporaryPassword() {
  return Array.from(
    { length: 12 },
    () => PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)],
  ).join("");
}

export async function createAccount(
  input: AccountInput,
): Promise<ActionResult & { credentials?: Credentials }> {
  const me = await requireSuperAdmin();
  const { errors, profile, ok } = validate(input);
  if (!ok) return { fieldErrors: errors };
  if (!me.division) return { error: "Akun super admin ini belum terhubung ke divisi." };

  const base = usernameBase(profile.full_name);
  const password = temporaryPassword();

  if (DUMMY_DATA) {
    const accounts = dummyAccounts.list();
    const username = uniqueUsername(base, new Set(accounts.map((a) => a.username)));
    dummyAccounts.save([
      {
        id: crypto.randomUUID(),
        username,
        fullName: profile.full_name,
        nim: profile.nim,
        email: profile.contact_email,
        whatsapp: profile.whatsapp,
        department: profile.department,
        division: me.division.name,
        position: profile.position,
        period: profile.period,
        isActive: true,
      },
      ...accounts,
    ]);
    revalidate();
    return { credentials: { username, password } };
  }

  const admin = createAdminClient();
  const { data: similar } = await admin
    .from("profiles")
    .select("username")
    .like("username", `${base}%`);
  const username = uniqueUsername(
    base,
    new Set((similar ?? []).map((row) => row.username)),
  );

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: accountEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username },
  });
  if (authError) {
    console.error("createAccount: auth user", authError.message);
    return { error: "Akun gagal dibuat. Coba lagi." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    username,
    role: "admin",
    division_id: me.division.id,
    ...profile,
  });
  if (profileError) {
    /* don't leave a login without a profile behind */
    await admin.auth.admin.deleteUser(created.user.id);
    console.error("createAccount: profile", profileError.message);
    return { error: "Akun gagal dibuat. Coba lagi." };
  }

  revalidate();
  return { credentials: { username, password } };
}

/* Updates one pengurus of the caller's division; false if there's none. */
async function updateOwnAccount(
  id: string,
  patch: Record<string, unknown>,
): Promise<boolean> {
  const me = await requireSuperAdmin();
  if (!me.division) return false;

  const { data } = await createAdminClient()
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .eq("role", "admin")
    .eq("division_id", me.division.id)
    .select("id");
  return (data?.length ?? 0) > 0;
}

const NOT_FOUND = "Akun tidak ditemukan. Muat ulang halaman ini.";

export async function updateAccount(
  id: string,
  input: AccountInput,
): Promise<ActionResult> {
  await requireSuperAdmin();
  const { errors, profile, ok } = validate(input);
  if (!ok) return { fieldErrors: errors };

  if (DUMMY_DATA) {
    dummyAccounts.save(
      dummyAccounts.list().map((a) =>
        a.id === id
          ? {
              ...a,
              fullName: profile.full_name,
              nim: profile.nim,
              email: profile.contact_email,
              whatsapp: profile.whatsapp,
              department: profile.department,
              position: profile.position,
              period: profile.period,
            }
          : a,
      ),
    );
    revalidate();
    return {};
  }

  if (!(await updateOwnAccount(id, profile))) return { error: NOT_FOUND };
  revalidate();
  return {};
}

/** Deactivated accounts can't sign in; their history stays. */
export async function setAccountActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  await requireSuperAdmin();

  if (DUMMY_DATA) {
    dummyAccounts.save(
      dummyAccounts.list().map((a) => (a.id === id ? { ...a, isActive: active } : a)),
    );
    revalidate();
    return {};
  }

  if (!(await updateOwnAccount(id, { is_active: active }))) {
    return { error: NOT_FOUND };
  }
  revalidate();
  return {};
}

/** Deletes the login and profile for good (their vote goes with it). */
export async function deleteAccount(id: string): Promise<ActionResult> {
  const me = await requireSuperAdmin();

  if (DUMMY_DATA) {
    dummyAccounts.save(dummyAccounts.list().filter((a) => a.id !== id));
    revalidate();
    return {};
  }

  if (!me.division) return { error: NOT_FOUND };
  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("id")
    .eq("id", id)
    .eq("role", "admin")
    .eq("division_id", me.division.id)
    .maybeSingle();
  if (!target) return { error: NOT_FOUND };

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    console.error("deleteAccount", error.message);
    return { error: "Akun gagal dihapus. Coba lagi." };
  }

  revalidate();
  return {};
}
