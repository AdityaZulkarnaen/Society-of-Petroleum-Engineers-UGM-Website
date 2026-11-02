/* eslint-disable @typescript-eslint/no-require-imports -- Live Upstash Redis integration verification script */
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
const Module = require("node:module");
const ts = require("typescript");
const { Redis } = require("@upstash/redis");

const root = path.resolve(__dirname, "../../");

// Setup TypeScript loader for Node
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
} = require("../../src/modules/recruitment/server/security.ts");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 1. Read ONLY UPSTASH_REDIS_REST_* from private staging env file
const stagingEnvPath = path.join(root, ".env.staging.private/recruitment-backend.env");
if (!fs.existsSync(stagingEnvPath)) {
  console.error("FAIL: Staging environment file not found.");
  process.exit(1);
}

const rawEnv = fs.readFileSync(stagingEnvPath, "utf8");
let redisUrl = "";
let redisToken = "";

for (const line of rawEnv.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx <= 0) continue;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  if (key === "UPSTASH_REDIS_REST_URL") redisUrl = val;
  if (key === "UPSTASH_REDIS_REST_TOKEN") redisToken = val;
}

if (!redisUrl || !redisToken) {
  console.error("FAIL: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing in staging env.");
  process.exit(1);
}

if (!redisUrl.startsWith("https://")) {
  console.error("FAIL: UPSTASH_REDIS_REST_URL must be HTTPS.");
  process.exit(1);
}

// Ensure secret credentials are never exposed
const maskedUrl = redisUrl.replace(/^https:\/\/([^.]+)\..*$/, "https://$1.[masked].upstash.io");

async function runLiveVerification() {
  console.log("=================================================");
  console.log("  SPE UGM SC — Live Upstash Redis Verification   ");
  console.log("=================================================");
  console.log(`Endpoint: ${maskedUrl}`);
  console.log(`Token:    [REDACTED (${redisToken.length} chars)]`);
  console.log("");

  const createdKeys = [];
  const testRunId = randomUUID().slice(0, 8);
  const testPrefix = `spe:live-test:${testRunId}:`;

  const redis = new Redis({
    url: redisUrl,
    token: redisToken,
    signal: () => AbortSignal.timeout(5000),
  });

  try {
    // -------------------------------------------------------------
    // Task 2: Verify Redis REST connection and ping latency
    // -------------------------------------------------------------
    console.log("1. Verifying Redis REST connectivity...");
    const t0 = performance.now();
    const pong = await redis.ping();
    const pingLatency = performance.now() - t0;
    assert.equal(pong, "PONG", "Expected PONG from Upstash Redis");
    console.log(`   ✓ Connectivity confirmed (PING/PONG: ${pingLatency.toFixed(1)} ms)`);

    // -------------------------------------------------------------
    // Task 3A: Real @upstash/redis command behavior (SET / GET / DEL)
    // -------------------------------------------------------------
    console.log("2. Testing real @upstash/redis command behavior (SET, GET, DEL)...");
    const pingKey = `${testPrefix}kv-check`;
    createdKeys.push(pingKey);

    const tSet0 = performance.now();
    const setResult = await redis.set(pingKey, "live-verified", { px: 30000 });
    const setLatency = performance.now() - tSet0;
    assert.equal(setResult, "OK", "SET with PX must return OK");

    const tGet0 = performance.now();
    const getResult = await redis.get(pingKey);
    const getLatency = performance.now() - tGet0;
    assert.equal(getResult, "live-verified", "GET must return exact stored string");

    await redis.del(pingKey);
    const delResult = await redis.get(pingKey);
    assert.equal(delResult, null, "Key must be deleted");
    console.log(`   ✓ Real Redis commands verified (SET: ${setLatency.toFixed(1)} ms, GET: ${getLatency.toFixed(1)} ms)`);

    // -------------------------------------------------------------
    // Task 3B: UpstashRateLimiter Live Integration (Allowed & Exceeded)
    // -------------------------------------------------------------
    console.log("3. Testing UpstashRateLimiter live sliding-window enforcement...");
    const limiter = new UpstashRateLimiter(redisUrl, redisToken);
    const rlKey = `${testPrefix}rl-applicant`;

    // 2 allowed requests (max: 2, window: 60s)
    const tRl0 = performance.now();
    await limiter.limit(rlKey, 2, 60000);
    const rl1Latency = performance.now() - tRl0;
    console.log(`   ✓ Allowed request 1 passed (${rl1Latency.toFixed(1)} ms)`);

    await limiter.limit(rlKey, 2, 60000);
    console.log("   ✓ Allowed request 2 passed");

    // 3rd request must exceed quota
    let caught429 = null;
    try {
      await limiter.limit(rlKey, 2, 60000);
    } catch (err) {
      caught429 = err;
    }

    assert.ok(caught429, "Expected limit() to throw when quota exceeded");
    assert.equal(caught429.status, 429, "Status must be HTTP 429");
    assert.ok(caught429.message.includes("Terlalu banyak permintaan"), "Expected user-facing Indonesian message");
    assert.ok(typeof caught429.retryAfter === "number" && caught429.retryAfter > 0, "Expected positive Retry-After");
    console.log(`   ✓ Rate limit exceeded returned HTTP 429 (Retry-After: ${caught429.retryAfter}s)`);

    // -------------------------------------------------------------
    // Task 3C: Concurrent lock acquisition & Owner-checked release
    // -------------------------------------------------------------
    console.log("4. Testing atomic concurrency lock & owner-checked release...");
    const sessionKey = `live-session-${testRunId}`;
    const lockKey = `spe:recruitment:lock:${sessionKey}`;
    createdKeys.push(lockKey);

    let op1Started = false;
    let op1Finish = null;

    const op1Promise = limiter.singleSubmission(sessionKey, async () => {
      op1Started = true;
      await new Promise((resolve) => { op1Finish = resolve; });
      return "op1-complete";
    });

    // Wait until Op 1 has acquired the lock
    while (!op1Started) {
      await sleep(10);
    }

    // Op 2 concurrently tries the same session key
    let caughtOp2 = null;
    try {
      await limiter.singleSubmission(sessionKey, async () => "op2-unreachable");
    } catch (err) {
      caughtOp2 = err;
    }

    assert.ok(caughtOp2, "Op 2 must be rejected while Op 1 holds the lock");
    assert.equal(caughtOp2.status, 429, "Op 2 status must be HTTP 429");
    assert.equal(caughtOp2.retryAfter, 5, "Op 2 retry-after must be 5s");
    assert.ok(caughtOp2.message.includes("Pengiriman sedang diproses"), "Expected in-flight message");
    console.log("   ✓ Concurrent request rejected with HTTP 429 while lock held");

    // Release Op 1
    op1Finish();
    const op1Result = await op1Promise;
    assert.equal(op1Result, "op1-complete");

    // Now that Op 1 released lock via Lua script, Op 3 succeeds
    const op3Result = await limiter.singleSubmission(sessionKey, async () => "op3-success");
    assert.equal(op3Result, "op3-success");
    console.log("   ✓ Owner-checked Lua script released lock; subsequent operation succeeded");

    // -------------------------------------------------------------
    // Task 3D: Lock TTL expiration on crash / timeout
    // -------------------------------------------------------------
    console.log("5. Testing lock TTL automatic expiration (simulated crash)...");
    const crashKey = `spe:recruitment:lock:${sessionKey}-crash`;
    createdKeys.push(crashKey);

    // Acquire lock with 1200ms TTL without releasing
    const crashAcquired = await redis.set(crashKey, "crashed-worker-uuid", { nx: true, px: 1200 });
    assert.equal(crashAcquired, "OK");

    // Verify key exists in Redis
    const lockVal = await redis.get(crashKey);
    assert.equal(lockVal, "crashed-worker-uuid");

    // Wait 1400ms for TTL to expire
    await sleep(1400);

    // Verify key is now gone
    const expiredVal = await redis.get(crashKey);
    assert.equal(expiredVal, null, "Lock must automatically expire after PX TTL");

    // New worker can acquire the lock
    const recoverAcquired = await redis.set(crashKey, "recovered-worker-uuid", { nx: true, px: 5000 });
    assert.equal(recoverAcquired, "OK", "New worker must acquire expired lock");
    await redis.del(crashKey);
    console.log("   ✓ TTL expiration confirmed: lock auto-evicted; user never permanently locked out");

    // -------------------------------------------------------------
    // Task 4: Clean up test keys
    // -------------------------------------------------------------
    console.log("6. Cleaning up test keys...");
    // Find rate limiter keys created under test prefix
    // In @upstash/ratelimit, prefix is spe:recruitment:rl
    // Rate limit keys: spe:recruitment:rl:<testPrefix>...
    const ratelimitPattern = `spe:recruitment:rl:${rlKey}*`;
    try {
      const rlKeys = await redis.keys(ratelimitPattern);
      if (rlKeys && rlKeys.length > 0) {
        for (const k of rlKeys) {
          await redis.del(k);
        }
      }
    } catch {
      // Keys command may be disabled or empty; fallback to explicit deletes
    }

    for (const k of createdKeys) {
      await redis.del(k);
    }
    console.log("   ✓ All test keys cleaned up successfully");

    // -------------------------------------------------------------
    // Task 6: Verify local staging compatibility with MemoryRateLimiter
    // -------------------------------------------------------------
    console.log("7. Verifying local staging MemoryRateLimiter compatibility...");
    setRateLimiter(null);
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.RECRUITMENT_DISTRIBUTED_LIMITER;
    process.env.RECRUITMENT_STAGING_ENABLED = "true";
    process.env.RECRUITMENT_SINGLE_INSTANCE = "true";

    const stagingLimiter = getRateLimiter();
    assert.ok(stagingLimiter instanceof MemoryRateLimiter, "Staging outside Vercel must use MemoryRateLimiter");
    console.log("   ✓ Staging without Redis uses MemoryRateLimiter cleanly");

    // -------------------------------------------------------------
    // Task 7: Verify Vercel mode fail-closed enforcement
    // -------------------------------------------------------------
    console.log("8. Verifying Vercel fail-closed enforcement (no silent fallback)...");
    setRateLimiter(null);
    process.env.VERCEL = "1";
    process.env.RECRUITMENT_ENABLED = "true";
    process.env.RECRUITMENT_SINGLE_INSTANCE = "true"; // False claim on Vercel
    delete process.env.RECRUITMENT_DISTRIBUTED_LIMITER;

    assert.throws(
      () => getRateLimiter(),
      (err) => err.status === 503 && err.message.includes("prohibited on Vercel"),
      "Vercel must reject MemoryRateLimiter and throw HTTP 503",
    );
    console.log("   ✓ Vercel strictly rejects memory fallback and fails closed");

    console.log("");
    console.log("=================================================");
    console.log("  ALL LIVE INTEGRATION CHECKS PASSED (7/7)       ");
    console.log("=================================================");
  } catch (error) {
    console.error("FATAL ERROR during live integration verification:", error);
    process.exit(1);
  } finally {
    // Ensure all test keys deleted
    for (const k of createdKeys) {
      try { await redis.del(k); } catch {}
    }
  }
}

runLiveVerification();
