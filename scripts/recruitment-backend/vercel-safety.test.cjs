/* eslint-disable @typescript-eslint/no-require-imports -- Test runner using Node built-in test framework. */
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

const { settings, client } = require("../../src/modules/recruitment/server/backend.ts");
const { MemoryRateLimiter } = require("../../src/modules/recruitment/server/security.ts");

function cleanEnv() {
  delete process.env.RECRUITMENT_ENABLED;
  delete process.env.RECRUITMENT_STAGING_ENABLED;
  delete process.env.RECRUITMENT_SINGLE_INSTANCE;
  delete process.env.RECRUITMENT_DISTRIBUTED_LIMITER;
  delete process.env.RECRUITMENT_ORIGIN;
  delete process.env.RECRUITMENT_SESSION_SECRET;
  delete process.env.RECRUITMENT_PERIOD_ID;
  delete process.env.RECRUITMENT_STAGING_SECRET_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_PROJECT_REF;
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  delete process.env.RECRUITMENT_PREVIEW_SUBMISSIONS_ENABLED;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.VERCEL_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function makeJwt(ref, role = "service_role") {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ ref, role })).toString("base64url");
  return `${header}.${payload}.synthetic_signature`;
}

test("Vercel & Safe Configuration: Disabled by default", async (t) => {
  cleanEnv();

  await t.test("throws 503 when recruitment is not enabled", () => {
    assert.throws(() => settings(), (err) => err.status === 503 && err.message.includes("Pendaftaran belum tersedia"));
  });

  await t.test("accepts RECRUITMENT_ENABLED='true' or RECRUITMENT_STAGING_ENABLED='true'", () => {
    process.env.RECRUITMENT_ENABLED = "true";
    process.env.RECRUITMENT_SINGLE_INSTANCE = "true";
    process.env.RECRUITMENT_ORIGIN = "http://localhost:3000";
    process.env.RECRUITMENT_SESSION_SECRET = "a-very-long-and-secure-secret-key-32-chars";
    process.env.RECRUITMENT_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://my-project.supabase.co";
    process.env.SUPABASE_SECRET_KEY = makeJwt("my-project");

    const s = settings();
    assert.equal(s.projectRef, "my-project");
    assert.equal(s.url, "https://my-project.supabase.co");
  });
});

test("Vercel & Safe Configuration: Missing environment variables fail closed", async (t) => {
  cleanEnv();
  process.env.RECRUITMENT_ENABLED = "true";
  process.env.RECRUITMENT_SINGLE_INSTANCE = "true";
  process.env.RECRUITMENT_ORIGIN = "http://localhost:3000";
  process.env.RECRUITMENT_SESSION_SECRET = "a-very-long-and-secure-secret-key-32-chars";
  process.env.RECRUITMENT_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://my-project.supabase.co";
  process.env.SUPABASE_SECRET_KEY = makeJwt("my-project");

  await t.test("fails on short secret (<32 chars)", () => {
    process.env.RECRUITMENT_SESSION_SECRET = "too-short";
    assert.throws(() => settings(), (err) => err.status === 503);
    process.env.RECRUITMENT_SESSION_SECRET = "a-very-long-and-secure-secret-key-32-chars";
  });

  await t.test("fails on invalid period UUID", () => {
    process.env.RECRUITMENT_PERIOD_ID = "not-a-uuid";
    assert.throws(() => settings(), (err) => err.status === 503);
    process.env.RECRUITMENT_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";
  });

  await t.test("fails on missing Supabase URL", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    assert.throws(() => settings(), (err) => err.status === 503 && err.message.includes("URL database"));
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://my-project.supabase.co";
  });

  await t.test("fails on missing Supabase secret key", () => {
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.RECRUITMENT_STAGING_SECRET_KEY;
    assert.throws(() => settings(), (err) => err.status === 503 && err.message.includes("Kredensial database"));
  });
});

test("Vercel & Safe Configuration: Dynamic project ref and URL matching", async (t) => {
  cleanEnv();
  process.env.RECRUITMENT_ENABLED = "true";
  process.env.RECRUITMENT_SINGLE_INSTANCE = "true";
  process.env.RECRUITMENT_ORIGIN = "http://localhost:3000";
  process.env.RECRUITMENT_SESSION_SECRET = "a-very-long-and-secure-secret-key-32-chars";
  process.env.RECRUITMENT_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";

  await t.test("rejects mismatch between URL project ref and JWT claim ref", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://production-project.supabase.co";
    process.env.SUPABASE_SECRET_KEY = makeJwt("staging-project"); // Mismatched!

    assert.throws(() => settings(), (err) => err.status === 503 && err.message.includes("tidak sesuai dengan proyek"));
  });

  await t.test("rejects JWT with non-service_role claim", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://production-project.supabase.co";
    process.env.SUPABASE_SECRET_KEY = makeJwt("production-project", "anon");

    assert.throws(() => settings(), (err) => err.status === 503 && err.message.includes("tidak sesuai dengan proyek"));
  });

  await t.test("accepts matching project ref and service_role key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://prod-spe-ugm.supabase.co";
    process.env.SUPABASE_SECRET_KEY = makeJwt("prod-spe-ugm", "service_role");

    const s = settings();
    assert.equal(s.projectRef, "prod-spe-ugm");
    assert.equal(s.url, "https://prod-spe-ugm.supabase.co");
  });

  await t.test("client() pins outbound requests to configured domain", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://prod-spe-ugm.supabase.co";
    process.env.SUPABASE_SECRET_KEY = makeJwt("prod-spe-ugm", "service_role");

    const c = client(process.env.SUPABASE_SECRET_KEY);
    assert.ok(c);
  });

  await t.test("rejects public key with mismatched project ref", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://staging-project.supabase.co";
    process.env.SUPABASE_SECRET_KEY = makeJwt("staging-project", "service_role");
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = makeJwt("production-project", "anon");

    assert.throws(
      () => settings(),
      (err) => err.status === 503 && err.message.includes("Kredensial publik database tidak sesuai"),
    );

    // Matching public key is accepted
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = makeJwt("staging-project", "anon");
    const s = settings();
    assert.equal(s.projectRef, "staging-project");
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });
});

test("Vercel & Safe Configuration: Vercel multi-instance & Preview deployment guards", async (t) => {
  cleanEnv();
  process.env.RECRUITMENT_ENABLED = "true";
  process.env.RECRUITMENT_ORIGIN = "https://preview-deploy.vercel.app";
  process.env.RECRUITMENT_SESSION_SECRET = "a-very-long-and-secure-secret-key-32-chars";
  process.env.RECRUITMENT_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://my-project.supabase.co";
  process.env.SUPABASE_SECRET_KEY = makeJwt("my-project");

  await t.test("rejects RECRUITMENT_SINGLE_INSTANCE=true on Vercel environment", () => {
    process.env.VERCEL = "1";
    process.env.RECRUITMENT_SINGLE_INSTANCE = "true";

    assert.throws(
      () => settings(),
      (err) => err.status === 503 && err.message.includes("RECRUITMENT_SINGLE_INSTANCE is prohibited on Vercel"),
    );
  });

  await t.test("rejects Vercel deployment when no distributed rate limiter is configured", () => {
    process.env.VERCEL = "1";
    delete process.env.RECRUITMENT_SINGLE_INSTANCE;

    assert.throws(
      () => settings(),
      (err) => err.status === 503 && err.message.includes("distributed rate limiter provider"),
    );
  });

  await t.test("rejects Vercel deployment when distributed rate limiter credentials are missing", () => {
    process.env.VERCEL = "1";
    process.env.RECRUITMENT_DISTRIBUTED_LIMITER = "upstash";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    assert.throws(
      () => settings(),
      (err) => err.status === 503 && err.message.includes("Konfigurasi distributed rate limiter belum lengkap"),
    );
  });

  await t.test("accepts Vercel deployment when distributed rate limiter is configured", () => {
    process.env.VERCEL = "1";
    process.env.RECRUITMENT_DISTRIBUTED_LIMITER = "upstash";
    process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";

    const s = settings();
    assert.equal(s.projectRef, "my-project");
  });

  await t.test("blocks recruitment submissions in preview deployments by default", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.RECRUITMENT_DISTRIBUTED_LIMITER = "upstash";
    process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";

    assert.throws(
      () => settings(),
      (err) => err.status === 503 && err.message.includes("preview deployment"),
    );
  });

  await t.test("blocks preview deployment from using production origin", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.RECRUITMENT_PREVIEW_SUBMISSIONS_ENABLED = "true";
    process.env.RECRUITMENT_DISTRIBUTED_LIMITER = "upstash";
    process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
    process.env.RECRUITMENT_ORIGIN = "https://www.speugmsc.org";

    assert.throws(
      () => settings(),
      (err) => err.status === 503 && err.message.includes("dilarang menggunakan origin produksi"),
    );
  });

  await t.test("auto-derives preview origin from VERCEL_URL when RECRUITMENT_ORIGIN is unset or auto", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.RECRUITMENT_PREVIEW_SUBMISSIONS_ENABLED = "true";
    process.env.RECRUITMENT_DISTRIBUTED_LIMITER = "upstash";
    process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
    process.env.VERCEL_URL = "spe-website-git-feat-preview.vercel.app";
    delete process.env.RECRUITMENT_ORIGIN;

    const s = settings();
    assert.equal(s.origin, "https://spe-website-git-feat-preview.vercel.app");

    // Setting RECRUITMENT_ORIGIN explicitly overrides VERCEL_URL
    process.env.RECRUITMENT_ORIGIN = "https://custom-preview.vercel.app";
    const s2 = settings();
    assert.equal(s2.origin, "https://custom-preview.vercel.app");
    delete process.env.VERCEL_URL;
  });
});

test("Rate Limiter Abstraction: MemoryRateLimiter functionality", async (t) => {
  const limiter = new MemoryRateLimiter();

  await t.test("throttles after maximum limit is exceeded", () => {
    limiter.limit("ip-1", 2, 60000, 1000);
    limiter.limit("ip-1", 2, 60000, 1001);
    assert.throws(() => limiter.limit("ip-1", 2, 60000, 1002));
  });

  await t.test("resets window after expiry time", () => {
    limiter.limit("ip-1", 2, 60000, 70000); // 69 seconds later
  });

  await t.test("enforces single submission lock per session key", async () => {
    let unblock;
    const pending = limiter.singleSubmission("session-1", () => new Promise((resolve) => { unblock = resolve; }));

    await assert.rejects(
      () => limiter.singleSubmission("session-1", async () => {}),
      (err) => err.status === 429,
    );

    unblock("ok");
    await pending;

    // After completion, next attempt with same key succeeds
    const next = await limiter.singleSubmission("session-1", async () => "success");
    assert.equal(next, "success");
  });
});

test("Staging Launcher Compatibility: preserves staging workflow", () => {
  cleanEnv();
  process.env.RECRUITMENT_STAGING_ENABLED = "true";
  process.env.RECRUITMENT_SINGLE_INSTANCE = "true";
  process.env.RECRUITMENT_ORIGIN = "http://127.0.0.1:3000";
  process.env.RECRUITMENT_SESSION_SECRET = "a-very-long-and-secure-secret-key-32-chars";
  process.env.RECRUITMENT_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lavxddhrrwsjcshmnwvu.supabase.co";
  process.env.RECRUITMENT_STAGING_SECRET_KEY = makeJwt("lavxddhrrwsjcshmnwvu");

  const s = settings();
  assert.equal(s.projectRef, "lavxddhrrwsjcshmnwvu");
  assert.equal(s.url, "https://lavxddhrrwsjcshmnwvu.supabase.co");
  assert.equal(s.origin, "http://127.0.0.1:3000");
});

