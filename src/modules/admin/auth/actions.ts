"use server";

import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { accountEmail, HOME_PATH } from "../constants";
import { DUMMY_DATA } from "../dummy";

export type SignInState = {
  error?: string;
  username?: string;
};

/* One message for unknown usernames and wrong passwords, so the form doesn't
   reveal which accounts exist. */
const INVALID = "Invalid username or password.";

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
    return { error: "Please enter your username and password.", username };
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
        error: "Unable to connect to the server. Please check your internet connection and try again.",
        username,
      };
    }
    if (error.code === "over_request_rate_limit") {
      return {
        error: "Too many attempts. Please try again in a few minutes.",
        username,
      };
    }
    return { error: INVALID, username };
  }

  /* A valid Supabase account isn't enough: it needs a dashboard profile. */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return {
      error: profile
        ? "This account has been deactivated. Please contact your division coordinator."
        : "This account does not have access to the dashboard.",
      username,
    };
  }

  redirect(HOME_PATH[profile.role as keyof typeof HOME_PATH]);
}

export async function signOut() {
  /* the sample-data preview has no session; the login page sends it back */
  if (!DUMMY_DATA) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
