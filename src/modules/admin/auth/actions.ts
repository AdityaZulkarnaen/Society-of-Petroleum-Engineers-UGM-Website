"use server";

import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { accountEmail } from "../constants";

export type SignInState = {
  error?: string;
  username?: string;
};

/* One message for unknown usernames and wrong passwords, so the form doesn't
   reveal which accounts exist. */
const INVALID = "Username atau password salah.";

const USERNAME = /^[a-z0-9._]{3,32}$/;

export async function signIn(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Isi username dan password.", username };
  }
  if (!USERNAME.test(username)) return { error: INVALID, username };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: accountEmail(username),
    password,
  });

  if (error) {
    /* The auth server couldn't be reached — don't blame the password. */
    if (isAuthRetryableFetchError(error)) {
      console.error("Sign-in could not reach Supabase Auth:", error.message);
      return {
        error: "Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.",
        username,
      };
    }
    if (error.code === "over_request_rate_limit") {
      return {
        error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit.",
        username,
      };
    }
    return { error: INVALID, username };
  }

  /* A valid Supabase account isn't enough: it needs a dashboard profile. */
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return {
      error: "Akun ini tidak memiliki akses ke dashboard.",
      username,
    };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
