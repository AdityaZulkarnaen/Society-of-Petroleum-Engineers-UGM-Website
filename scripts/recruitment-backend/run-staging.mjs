/** Launch only this staging slice without loading legacy environment files. */
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));

// 1. Preserve critical safety guard: strictly reject legacy/production environment files
for (const name of [".env", ".env.local", ".env.development", ".env.development.local"]) {
  if (existsSync(path.join(root, name))) {
    throw new Error(
      "Legacy environment file present; refusing to load it. Use a separate clean staging worktree.",
    );
  }
}

// 2. Load protected staging-only environment file
const file = path.join(root, ".env.staging.private/recruitment-backend.env");
if (!existsSync(file)) {
  throw new Error(
    "Protected staging API configuration has not been provisioned. See recruitment-backend-integration.md.",
  );
}

const values = parseEnv(readFileSync(file, "utf8"));

// 3. Allowed keys whitelist
const allowed = new Set([
  "RECRUITMENT_ENABLED",
  "RECRUITMENT_STAGING_ENABLED",
  "RECRUITMENT_SINGLE_INSTANCE",
  "RECRUITMENT_ORIGIN",
  "RECRUITMENT_SESSION_SECRET",
  "RECRUITMENT_STAGING_SECRET_KEY",
  "RECRUITMENT_PERIOD_ID",
  "RECRUITMENT_DISTRIBUTED_LIMITER",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RECRUITMENT_LIMIT_SESSION_IP",
  "RECRUITMENT_LIMIT_SESSION_GLOBAL",
  "RECRUITMENT_LIMIT_SUBMIT_IP",
  "RECRUITMENT_LIMIT_SUBMIT_GLOBAL",
  "RECRUITMENT_LIMIT_SUBMIT_SESSION",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "VERCEL_STAGING_PROJECT_ID",
  "RECRUITMENT_STAGING_PROJECT_ID",
]);

if (Object.keys(values).some((k) => !allowed.has(k))) {
  throw new Error("Unexpected staging environment variable; refusing to launch.");
}

// 4. Staging safety checks
if (values.RECRUITMENT_ORIGIN !== "http://127.0.0.1:3000") {
  throw new Error("This launcher requires the explicit loopback origin http://127.0.0.1:3000.");
}

const STAGING_URL = "https://lavxddhrrwsjcshmnwvu.supabase.co";
if (values.NEXT_PUBLIC_SUPABASE_URL && values.NEXT_PUBLIC_SUPABASE_URL !== STAGING_URL) {
  throw new Error(`NEXT_PUBLIC_SUPABASE_URL must target the staging project ${STAGING_URL}.`);
}

// 5. Build clean, minimal process environment
const env = {};
for (const [key, value] of Object.entries(process.env)) {
  if (
    [
      "SYSTEMROOT",
      "WINDIR",
      "TEMP",
      "TMP",
      "COMSPEC",
      "PATH",
      "PATHEXT",
      "USERPROFILE",
      "LOCALAPPDATA",
      "APPDATA",
      "NUMBER_OF_PROCESSORS",
      "PROCESSOR_ARCHITECTURE",
    ].includes(key.toUpperCase())
  ) {
    env[key] = value;
  }
}

Object.assign(env, values, {
  NEXT_TELEMETRY_DISABLED: "1",
});

// Map secret key for server-side admin client if not already explicitly defined
if (!env.SUPABASE_SECRET_KEY && values.RECRUITMENT_STAGING_SECRET_KEY) {
  env.SUPABASE_SECRET_KEY = values.RECRUITMENT_STAGING_SECRET_KEY;
}

// Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is available if client code uses that alias
if (values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

// 6. Spawn Next.js dev server with staging environment
const child = spawn(
  process.execPath,
  [
    path.join(root, "node_modules/next/dist/bin/next"),
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3000",
  ],
  { cwd: root, env, stdio: "inherit", windowsHide: true },
);

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
