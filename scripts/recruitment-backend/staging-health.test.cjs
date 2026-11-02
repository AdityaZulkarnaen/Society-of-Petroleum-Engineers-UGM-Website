/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "../../");

// Setup TypeScript loader for Node test runner
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  if (id === "server-only") return {};
  if (id.startsWith("@/")) id = path.join(root, "src", id.slice(2));
  return originalLoad.call(this, id, parent, main);
};

require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );

const route = require("../../app/api/internal/staging-health/route.ts");

const TEST_DIAGNOSTIC_TOKEN = "diag_test_token_secure_high_entropy_32c";
const TEST_PROJECT_ID = "prj_Hj8Qjg7x5yWZvUnO8PxYG9wYJKgs";
const STAGING_REF = "lavxddhrrwsjcshmnwvu";

function cleanEnv() {
  delete process.env.DIAGNOSTIC_TOKEN;
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  delete process.env.VERCEL_PROJECT_ID;
  delete process.env.VERCEL_STAGING_PROJECT_ID;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_URL;
  delete process.env.RECRUITMENT_ENABLED;
  delete process.env.RECRUITMENT_STAGING_ENABLED;
}

test("Staging Health Diagnostic: Token and Access Restrictions", async (t) => {
  cleanEnv();

  await t.test("denies when DIAGNOSTIC_TOKEN is not configured on server", async () => {
    cleanEnv();
    process.env.VERCEL = "1";
    process.env.VERCEL_PROJECT_ID = TEST_PROJECT_ID;
    process.env.VERCEL_STAGING_PROJECT_ID = TEST_PROJECT_ID;

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health", {
      headers: { "x-diagnostic-token": TEST_DIAGNOSTIC_TOKEN },
    });
    const res = await route.GET(req);
    assert.equal(res.status, 404);
  });

  await t.test("denies when request is missing diagnostic token header", async () => {
    cleanEnv();
    process.env.DIAGNOSTIC_TOKEN = TEST_DIAGNOSTIC_TOKEN;
    process.env.VERCEL = "1";
    process.env.VERCEL_PROJECT_ID = TEST_PROJECT_ID;
    process.env.VERCEL_STAGING_PROJECT_ID = TEST_PROJECT_ID;

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health");
    const res = await route.GET(req);
    assert.equal(res.status, 404);
  });

  await t.test("denies when supplied diagnostic token does not match", async () => {
    cleanEnv();
    process.env.DIAGNOSTIC_TOKEN = TEST_DIAGNOSTIC_TOKEN;
    process.env.VERCEL = "1";
    process.env.VERCEL_PROJECT_ID = TEST_PROJECT_ID;
    process.env.VERCEL_STAGING_PROJECT_ID = TEST_PROJECT_ID;

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health", {
      headers: { "x-diagnostic-token": "wrong_token_that_does_not_match" },
    });
    const res = await route.GET(req);
    assert.equal(res.status, 404);
  });

  await t.test("denies non-Vercel runtime even with valid token and matching IDs", async () => {
    cleanEnv();
    process.env.DIAGNOSTIC_TOKEN = TEST_DIAGNOSTIC_TOKEN;
    // VERCEL and VERCEL_ENV unset
    process.env.VERCEL_PROJECT_ID = TEST_PROJECT_ID;
    process.env.VERCEL_STAGING_PROJECT_ID = TEST_PROJECT_ID;

    const req = new Request("http://localhost:3000/api/internal/staging-health", {
      headers: { "x-diagnostic-token": TEST_DIAGNOSTIC_TOKEN },
    });
    const res = await route.GET(req);
    assert.equal(res.status, 404);
  });
});

test("Staging Health Diagnostic: Vercel Project Identity Verification", async (t) => {
  cleanEnv();

  await t.test("denies when VERCEL_PROJECT_ID is absent", async () => {
    cleanEnv();
    process.env.DIAGNOSTIC_TOKEN = TEST_DIAGNOSTIC_TOKEN;
    process.env.VERCEL = "1";
    delete process.env.VERCEL_PROJECT_ID;
    process.env.VERCEL_STAGING_PROJECT_ID = TEST_PROJECT_ID;

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health", {
      headers: { "x-diagnostic-token": TEST_DIAGNOSTIC_TOKEN },
    });
    const res = await route.GET(req);
    assert.equal(res.status, 404);
  });

  await t.test("denies when VERCEL_STAGING_PROJECT_ID is absent", async () => {
    cleanEnv();
    process.env.DIAGNOSTIC_TOKEN = TEST_DIAGNOSTIC_TOKEN;
    process.env.VERCEL = "1";
    process.env.VERCEL_PROJECT_ID = TEST_PROJECT_ID;
    delete process.env.VERCEL_STAGING_PROJECT_ID;

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health", {
      headers: { "x-diagnostic-token": TEST_DIAGNOSTIC_TOKEN },
    });
    const res = await route.GET(req);
    assert.equal(res.status, 404);
  });

  await t.test("denies when VERCEL_PROJECT_ID does not match VERCEL_STAGING_PROJECT_ID", async () => {
    cleanEnv();
    process.env.DIAGNOSTIC_TOKEN = TEST_DIAGNOSTIC_TOKEN;
    process.env.VERCEL = "1";
    process.env.VERCEL_PROJECT_ID = "prj_mismatched_unauthorized_prod";
    process.env.VERCEL_STAGING_PROJECT_ID = TEST_PROJECT_ID;

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health", {
      headers: { "x-diagnostic-token": TEST_DIAGNOSTIC_TOKEN },
    });
    const res = await route.GET(req);
    assert.equal(res.status, 404);
  });
});

test("Staging Health Diagnostic: Successful Diagnostics & Supabase Ref Match", async (t) => {
  cleanEnv();

  const setValidConfig = () => {
    process.env.DIAGNOSTIC_TOKEN = TEST_DIAGNOSTIC_TOKEN;
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production"; // Dedicated staging project production branch
    process.env.VERCEL_PROJECT_ID = TEST_PROJECT_ID;
    process.env.VERCEL_STAGING_PROJECT_ID = TEST_PROJECT_ID;
    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${STAGING_REF}.supabase.co`;
  };

  await t.test("returns 200 with all booleans true on valid configuration via x-diagnostic-token", async () => {
    cleanEnv();
    setValidConfig();

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health", {
      headers: { "x-diagnostic-token": TEST_DIAGNOSTIC_TOKEN },
    });
    const res = await route.GET(req);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get("cache-control").includes("no-store"));

    const json = await res.json();
    assert.deepEqual(json, {
      vercelProjectIdPresent: true,
      vercelProjectIdMatches: true,
      stagingSupabaseMatches: true,
    });
  });

  await t.test("accepts diagnostic token via Authorization Bearer header", async () => {
    cleanEnv();
    setValidConfig();

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health", {
      headers: { authorization: `Bearer ${TEST_DIAGNOSTIC_TOKEN}` },
    });
    const res = await route.GET(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.stagingSupabaseMatches, true);
  });

  await t.test("returns stagingSupabaseMatches=false if NEXT_PUBLIC_SUPABASE_URL is not staging ref", async () => {
    cleanEnv();
    setValidConfig();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://different-prod-project.supabase.co";

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health", {
      headers: { "x-diagnostic-token": TEST_DIAGNOSTIC_TOKEN },
    });
    const res = await route.GET(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.deepEqual(json, {
      vercelProjectIdPresent: true,
      vercelProjectIdMatches: true,
      stagingSupabaseMatches: false,
    });
  });

  await t.test("returns stagingSupabaseMatches=false without falling back when NEXT_PUBLIC_SUPABASE_URL is unset", async () => {
    cleanEnv();
    setValidConfig();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_URL = `https://${STAGING_REF}.supabase.co`; // Fallback should be ignored

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health", {
      headers: { "x-diagnostic-token": TEST_DIAGNOSTIC_TOKEN },
    });
    const res = await route.GET(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.stagingSupabaseMatches, false);
  });

  await t.test("strictly leaks no secrets, tokens, IDs, or URLs in response body", async () => {
    cleanEnv();
    setValidConfig();

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health", {
      headers: { "x-diagnostic-token": TEST_DIAGNOSTIC_TOKEN },
    });
    const res = await route.GET(req);
    const text = await res.text();

    assert.ok(!text.includes(TEST_PROJECT_ID), "Response must not contain project ID");
    assert.ok(!text.includes(TEST_DIAGNOSTIC_TOKEN), "Response must not contain diagnostic token");
    assert.ok(!text.includes(STAGING_REF), "Response must not contain staging Supabase ref");
    assert.ok(!text.includes("supabase.co"), "Response must not contain Supabase hostname");

    const parsed = JSON.parse(text);
    const keys = Object.keys(parsed).sort();
    assert.deepEqual(keys, [
      "stagingSupabaseMatches",
      "vercelProjectIdMatches",
      "vercelProjectIdPresent",
    ]);
  });

  await t.test("operates safely while recruitment is completely disabled", async () => {
    cleanEnv();
    setValidConfig();
    // Explicitly verify recruitment remains disabled
    delete process.env.RECRUITMENT_ENABLED;
    delete process.env.RECRUITMENT_STAGING_ENABLED;

    const req = new Request("https://staging.speugmsc.org/api/internal/staging-health", {
      headers: { "x-diagnostic-token": TEST_DIAGNOSTIC_TOKEN },
    });
    const res = await route.GET(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.vercelProjectIdMatches, true);
  });
});

