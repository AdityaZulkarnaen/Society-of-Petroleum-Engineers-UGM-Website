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

const {
  UpstashRateLimiter,
  MemoryRateLimiter,
  getRateLimiter,
  setRateLimiter,
  resolveClientIp,
} = require("../../src/modules/recruitment/server/security.ts");
const { settings } = require("../../src/modules/recruitment/server/backend.ts");

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
  delete process.env.TRUST_PROXY;
  setRateLimiter(null);
}

function makeJwt(ref, role = "service_role") {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ ref, role })).toString("base64url");
  return `${header}.${payload}.synthetic_signature`;
}

test("Requirement 9.1: Allowed request passes rate limit check", async () => {
  const mockRequester = {
    request: async (req) => {
      const cmd = req.body[0];
      if (cmd === "evalsha" || cmd === "eval") {
        // [remainingTokens, effectiveLimit]
        return { result: [4, 5] };
      }
      return { result: null };
    },
  };

  const limiter = new UpstashRateLimiter(
    "https://mock.upstash.io",
    "mock-token",
    mockRequester,
  );

  // Should resolve without error
  await limiter.limit("applicant:allowed-key", 5, 60000);
});

test("Requirement 9.2: Rate limit exceeded returns HTTP 429 with Retry-After", async () => {
  const mockRequester = {
    request: async (req) => {
      const cmd = req.body[0];
      if (cmd === "evalsha" || cmd === "eval") {
        // -1 remaining indicates quota exceeded
        return { result: [-1, 5] };
      }
      return { result: null };
    },
  };

  const limiter = new UpstashRateLimiter(
    "https://mock.upstash.io",
    "mock-token",
    mockRequester,
  );

  await assert.rejects(
    () => limiter.limit("applicant:throttled-key", 5, 60000),
    (err) => {
      assert.equal(err.status, 429);
      assert.ok(err.message.includes("Terlalu banyak permintaan"));
      assert.ok(typeof err.retryAfter === "number");
      assert.ok(err.retryAfter > 0);
      return true;
    },
  );
});

test("Requirement 9.3: Concurrent requests enforce atomic lock acquisition and owner-checked release", async () => {
  let lockState = null;
  const commandsLog = [];

  const mockRequester = {
    request: async (req) => {
      const cmd = req.body[0];
      commandsLog.push({ cmd, args: req.body.slice(1) });

      if (cmd === "set") {
        const key = req.body[1];
        const owner = req.body[2];
        if (lockState === null) {
          lockState = { key, owner };
          return { result: "OK" };
        }
        return { result: null }; // Already held
      }

      if (cmd === "eval") {
        // Release Lua script: [ 'eval', script, numkeys, key1, arg1 ]
        const key = req.body[3];
        const owner = req.body[4];
        if (lockState && lockState.key === key && lockState.owner === owner) {
          lockState = null;
          return { result: 1 };
        }
        return { result: 0 };
      }

      return { result: null };
    },
  };

  const limiter = new UpstashRateLimiter(
    "https://mock.upstash.io",
    "mock-token",
    mockRequester,
  );

  let unblockFirst;
  const firstOperation = limiter.singleSubmission("session-uuid-1", () => {
    return new Promise((resolve) => {
      unblockFirst = resolve;
    });
  });

  // Second concurrent attempt with same key must fail with 429
  await assert.rejects(
    () => limiter.singleSubmission("session-uuid-1", async () => "second-run"),
    (err) => {
      assert.equal(err.status, 429);
      assert.ok(err.message.includes("Pengiriman sedang diproses"));
      assert.equal(err.retryAfter, 5);
      return true;
    },
  );

  // Complete first operation
  unblockFirst("first-done");
  const firstResult = await firstOperation;
  assert.equal(firstResult, "first-done");

  // Lock is now released; subsequent operation with same key succeeds
  const thirdResult = await limiter.singleSubmission("session-uuid-1", async () => "third-run");
  assert.equal(thirdResult, "third-run");
});

test("Requirement 9.4: Redis timeout fails closed with controlled HTTP 503 without leaking credentials", async () => {
  const timeoutRequester = {
    request: async () => {
      // Simulate timeout / provider connection failure
      throw new Error("ETIMEDOUT: Connection to mock.upstash.io timed out with token secret-token-must-not-leak");
    },
  };

  const limiter = new UpstashRateLimiter(
    "https://mock.upstash.io",
    "secret-token-must-not-leak",
    timeoutRequester,
  );

  await assert.rejects(
    () => limiter.limit("test-timeout", 5, 60000),
    (err) => {
      assert.equal(err.status, 503);
      assert.ok(err.message.includes("Layanan pendaftaran sedang sibuk"));
      assert.ok(!err.message.includes("secret-token"));
      assert.ok(!err.message.includes("mock.upstash.io"));
      return true;
    },
  );

  await assert.rejects(
    () => limiter.singleSubmission("test-timeout-key", async () => "ok"),
    (err) => {
      assert.equal(err.status, 503);
      assert.ok(err.message.includes("Layanan pendaftaran sedang sibuk"));
      assert.ok(!err.message.includes("secret-token"));
      return true;
    },
  );
});

test("Requirement 9.5: Missing or invalid distributed limiter credentials fail closed", async () => {
  cleanEnv();
  process.env.RECRUITMENT_ENABLED = "true";
  process.env.RECRUITMENT_ORIGIN = "http://localhost:3000";
  process.env.RECRUITMENT_SESSION_SECRET = "a-very-long-and-secure-secret-key-32-chars";
  process.env.RECRUITMENT_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://my-project.supabase.co";
  process.env.SUPABASE_SECRET_KEY = makeJwt("my-project");
  process.env.RECRUITMENT_DISTRIBUTED_LIMITER = "upstash";

  // Missing URL and Token
  assert.throws(
    () => settings(),
    (err) => err.status === 503 && err.message.includes("Konfigurasi distributed rate limiter belum lengkap"),
  );
  assert.throws(
    () => getRateLimiter(),
    (err) => err.status === 503 && err.message.includes("Konfigurasi distributed rate limiter belum lengkap"),
  );

  // Invalid HTTP protocol instead of HTTPS
  process.env.UPSTASH_REDIS_REST_URL = "http://insecure.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
  assert.throws(
    () => settings(),
    (err) => err.status === 503 && err.message.includes("HTTPS"),
  );
  assert.throws(
    () => getRateLimiter(),
    (err) => err.status === 503 && err.message.includes("tidak valid"),
  );
});

test("Requirement 9.6: Vercel environment without distributed limiter fails closed", async () => {
  cleanEnv();
  process.env.VERCEL = "1";
  process.env.RECRUITMENT_ENABLED = "true";
  process.env.RECRUITMENT_ORIGIN = "https://speugmsc.vercel.app";
  process.env.RECRUITMENT_SESSION_SECRET = "a-very-long-and-secure-secret-key-32-chars";
  process.env.RECRUITMENT_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://my-project.supabase.co";
  process.env.SUPABASE_SECRET_KEY = makeJwt("my-project");

  // No distributed limiter configured on Vercel
  assert.throws(
    () => settings(),
    (err) => err.status === 503 && err.message.includes("distributed rate limiter provider"),
  );
  assert.throws(
    () => getRateLimiter(),
    (err) => err.status === 503 && err.message.includes("distributed rate limiter provider"),
  );
});

test("Requirement 9.7: Vercel strictly prohibits falling back to process memory", async () => {
  cleanEnv();
  process.env.VERCEL = "1";
  process.env.RECRUITMENT_ENABLED = "true";
  process.env.RECRUITMENT_SINGLE_INSTANCE = "true"; // False claim on Vercel
  process.env.RECRUITMENT_ORIGIN = "https://speugmsc.vercel.app";
  process.env.RECRUITMENT_SESSION_SECRET = "a-very-long-and-secure-secret-key-32-chars";
  process.env.RECRUITMENT_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://my-project.supabase.co";
  process.env.SUPABASE_SECRET_KEY = makeJwt("my-project");

  assert.throws(
    () => settings(),
    (err) => err.status === 503 && err.message.includes("RECRUITMENT_SINGLE_INSTANCE is prohibited on Vercel"),
  );

  assert.throws(
    () => getRateLimiter(),
    (err) => err.status === 503 && err.message.includes("RECRUITMENT_SINGLE_INSTANCE is prohibited on Vercel"),
  );
});

test("Requirement 9.8: Preview environment restrictions", async () => {
  cleanEnv();
  process.env.VERCEL_ENV = "preview";
  process.env.RECRUITMENT_ENABLED = "true";
  process.env.RECRUITMENT_DISTRIBUTED_LIMITER = "upstash";
  process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
  process.env.RECRUITMENT_SESSION_SECRET = "a-very-long-and-secure-secret-key-32-chars";
  process.env.RECRUITMENT_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://my-project.supabase.co";
  process.env.SUPABASE_SECRET_KEY = makeJwt("my-project");

  // Disabled in preview by default
  process.env.RECRUITMENT_ORIGIN = "https://preview-deployment.vercel.app";
  assert.throws(
    () => settings(),
    (err) => err.status === 503 && err.message.includes("preview deployment"),
  );

  // Forbidden from using production origin in preview
  process.env.RECRUITMENT_PREVIEW_SUBMISSIONS_ENABLED = "true";
  process.env.RECRUITMENT_ORIGIN = "https://www.speugmsc.org";
  assert.throws(
    () => settings(),
    (err) => err.status === 503 && err.message.includes("dilarang menggunakan origin produksi"),
  );

  // Permitted when preview flag is set and origin is preview
  process.env.RECRUITMENT_ORIGIN = "https://preview-deployment.vercel.app";
  const s = settings();
  assert.equal(s.origin, "https://preview-deployment.vercel.app");
});

test("Requirement 9.9: Existing staging compatibility preserves MemoryRateLimiter outside Vercel", async () => {
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

  const limiter = getRateLimiter();
  assert.ok(limiter instanceof MemoryRateLimiter);
});

test("Requirement 6: Trustworthy client IP resolution on Vercel vs Untrusted Boundaries", async () => {
  cleanEnv();

  // 1. Outside Vercel without TRUST_PROXY: ignores client-forged x-forwarded-for
  const untrustedReq = new Request("https://example.com/api", {
    headers: { "x-forwarded-for": "198.51.100.25", "x-real-ip": "198.51.100.26" },
  });
  assert.equal(resolveClientIp(untrustedReq), "untrusted-client-boundary");

  // 2. Outside Vercel with TRUST_PROXY=true
  process.env.TRUST_PROXY = "true";
  assert.equal(resolveClientIp(untrustedReq), "198.51.100.26");
  delete process.env.TRUST_PROXY;

  // 3. Localhost request
  const localReq = new Request("http://localhost:3000/api", {
    headers: { host: "localhost:3000" },
  });
  assert.equal(resolveClientIp(localReq), "127.0.0.1");

  // 4. On Vercel: trusts verified edge x-real-ip header
  process.env.VERCEL = "1";
  const vercelReq = new Request("https://speugmsc.vercel.app/api", {
    headers: {
      "x-real-ip": "203.0.113.88",
      "x-forwarded-for": "10.0.0.1, 203.0.113.88",
    },
  });
  assert.equal(resolveClientIp(vercelReq), "203.0.113.88");

  // 5. On Vercel without x-real-ip: selects rightmost connecting IP from x-forwarded-for, ignoring spoofed prefixes
  const vercelForwardedFallback = new Request("https://speugmsc.vercel.app/api", {
    headers: {
      "x-forwarded-for": "10.0.0.1, 198.51.100.99",
    },
  });
  assert.equal(resolveClientIp(vercelForwardedFallback), "198.51.100.99");
});

test("Route Integration: GET/POST endpoints handle distributed limiting, 429 Retry-After, and 503 errors", async () => {
  cleanEnv();
  const jar = new Map();
  jar.get = function (k) {
    const val = Map.prototype.get.call(this, k);
    return val ? { value: val } : undefined;
  };
  jar.set = function (k, val) {
    Map.prototype.set.call(this, k, val);
  };

  // Mock next/headers for route testing
  const originalLoadModule = Module._load;
  Module._load = function (id, parent, main) {
    if (id === "server-only") return {};
    if (id === "next/headers") return { cookies: async () => jar };
    if (id.startsWith("@/")) id = path.join(root, "src", id.slice(2));
    return originalLoadModule.call(this, id, parent, main);
  };

  process.env.VERCEL = "1";
  process.env.RECRUITMENT_ENABLED = "true";
  process.env.RECRUITMENT_ORIGIN = "https://speugmsc.org";
  process.env.RECRUITMENT_SESSION_SECRET = "a-very-long-and-secure-secret-key-32-chars";
  process.env.RECRUITMENT_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://my-project.supabase.co";
  process.env.SUPABASE_SECRET_KEY = makeJwt("my-project");
  process.env.RECRUITMENT_DISTRIBUTED_LIMITER = "upstash";
  process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";

  let limitResult = [5, 10]; // Allowed by default
  let lockAcquired = "OK";

  const mockRequester = {
    request: async (req) => {
      const cmd = req.body[0];
      if (cmd === "evalsha" || cmd === "eval") {
        return { result: limitResult };
      }
      if (cmd === "set") {
        return { result: lockAcquired };
      }
      return { result: null };
    },
  };

  const limiter = new UpstashRateLimiter(
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
    mockRequester,
  );
  setRateLimiter(limiter);

  // When rate limit is exceeded, GET returns 429 with Retry-After
  limitResult = [-1, 10];
  const route = require("../../app/api/recruitment/route.ts");
  const getReq = new Request("https://speugmsc.org/api/recruitment", {
    headers: { "x-real-ip": "203.0.113.195" },
  });

  const getRes = await route.GET(getReq);
  assert.equal(getRes.status, 429);
  assert.ok(getRes.headers.get("retry-after"));
  const getJson = await getRes.json();
  assert.ok(getJson.error.includes("Terlalu banyak permintaan"));

  // When Redis fails, GET returns 503 without leaking credentials
  const errorLimiter = new UpstashRateLimiter(
    process.env.UPSTASH_REDIS_REST_URL,
    process.env.UPSTASH_REDIS_REST_TOKEN,
    {
      request: async () => {
        throw new Error("Internal redis crash at https://secret-url.upstash.io");
      },
    },
  );
  setRateLimiter(errorLimiter);

  const errorRes = await route.GET(getReq);
  assert.equal(errorRes.status, 503);
  const errorJson = await errorRes.json();
  assert.ok(!errorJson.error.includes("secret-url"));
  assert.ok(errorJson.error.includes("Layanan pendaftaran sedang sibuk"));

  cleanEnv();
});
