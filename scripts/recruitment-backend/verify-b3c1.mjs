/**
 * B3C1 Read-only staging verification.
 * Reads RECRUITMENT_STAGING_SECRET_KEY from the protected env file.
 * Makes NO writes. Exits non-zero on any unexpected result.
 *
 * Run: node scripts/recruitment-backend/verify-b3c1.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const envFile = path.join(root, ".env.staging.private/recruitment-backend.env");

if (!existsSync(envFile)) {
  console.error("ERROR: recruitment-backend.env not provisioned. See integration doc.");
  process.exit(1);
}

const env = parseEnv(readFileSync(envFile, "utf8"));
const key = env.RECRUITMENT_STAGING_SECRET_KEY;
const periodId = env.RECRUITMENT_PERIOD_ID;

if (!key) { console.error("ERROR: RECRUITMENT_STAGING_SECRET_KEY missing from env file."); process.exit(1); }
if (!periodId || !/^[0-9a-f-]{36}$/.test(periodId)) { console.error("ERROR: RECRUITMENT_PERIOD_ID missing or malformed."); process.exit(1); }

const BASE = "https://lavxddhrrwsjcshmnwvu.supabase.co";
const EXPECTED_PERIOD_ID = "87e7c760-1fb2-4e61-a803-b82a41b7847c";

if (periodId !== EXPECTED_PERIOD_ID) {
  console.error(`ERROR: RECRUITMENT_PERIOD_ID in env file (${periodId}) does not match expected B3C1 UUID (${EXPECTED_PERIOD_ID}).`);
  process.exit(1);
}

function headers() {
  return { "apikey": key, "Authorization": `Bearer ${key}`, "Accept": "application/json" };
}

async function get(path) {
  const url = `${BASE}/rest/v1/${path}`;
  const res = await fetch(url, { headers: headers(), redirect: "error", signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — GET ${url}`);
  return res.json();
}

function assert(condition, message) {
  if (!condition) { console.error(`FAIL: ${message}`); process.exitCode = 1; }
  else            { console.log(`  OK: ${message}`); }
}

console.log("\n=== B3C1 Staging Verification ===");
console.log(`Target:    ${BASE}`);
console.log(`Period ID: ${periodId}\n`);

// ── 1. Period row ────────────────────────────────────────────────────────────
console.log("── 1. recruitment_periods ──");
const periods = await get(
  `recruitment_periods?id=eq.${periodId}&select=id,code,label,config_version,approved_at,is_open,opens_at,closes_at,batches,approval_reference`
);
assert(periods.length === 1,                                            "exactly 1 period row found");
const p = periods[0] ?? {};
assert(p.id === EXPECTED_PERIOD_ID,                                     `id = ${EXPECTED_PERIOD_ID}`);
assert(p.code === "b3c1-synthetic-test",                                `code = b3c1-synthetic-test`);
assert(p.label === "[SYNTHETIC] B3-C1 Integration Test Period",         `label is synthetic`);
assert(p.approved_at !== null,                                          `approved_at is not null`);
assert(p.is_open === true,                                              `is_open = true`);
assert(p.approval_reference === "B3-C1-SYNTHETIC-INTEGRATION-TEST-NOT-OFFICIAL", `approval_reference sentinel matches`);
assert(Array.isArray(p.batches) && p.batches.includes("2026"),         `batches includes 2026`);
const now = Date.now();
assert(Date.parse(p.opens_at) < now,                                    `opens_at is in the past`);
assert(Date.parse(p.closes_at) > now,                                   `closes_at is in the future`);

// ── 2. Options ───────────────────────────────────────────────────────────────
console.log("\n── 2. recruitment_options ──");
const options = await get(
  `recruitment_options?period_id=eq.${periodId}&select=main_code,sub_code,main_label,sub_label,assignment_state,formats,max_bytes&order=main_code,sub_code`
);
assert(options.length === 5, `exactly 5 options found (got ${options.length})`);

const expectedOptions = [
  { main_code: "syn-acara",  sub_code: "program",       main_label: "Divisi Acara [SYN]",  sub_label: "Program [SYN]"       },
  { main_code: "syn-humas",  sub_code: "eksternal",     main_label: "Divisi Humas [SYN]",  sub_label: "Eksternal [SYN]"     },
  { main_code: "syn-humas",  sub_code: "internal",      main_label: "Divisi Humas [SYN]",  sub_label: "Internal [SYN]"      },
  { main_code: "syn-teknis", sub_code: "instrumentasi", main_label: "Divisi Teknis [SYN]", sub_label: "Instrumentasi [SYN]" },
  { main_code: "syn-teknis", sub_code: "komputasi",     main_label: "Divisi Teknis [SYN]", sub_label: "Komputasi [SYN]"     },
];
for (const exp of expectedOptions) {
  const found = options.find(o => o.main_code === exp.main_code && o.sub_code === exp.sub_code);
  assert(found !== undefined,                       `option (${exp.main_code}, ${exp.sub_code}) exists`);
  assert(found?.assignment_state === "none",        `  → assignment_state = none`);
  assert(found?.formats === null,                   `  → formats = null`);
  assert(found?.max_bytes === null,                 `  → max_bytes = null`);
  assert(found?.main_label === exp.main_label,      `  → main_label correct`);
  assert(found?.sub_label  === exp.sub_label,       `  → sub_label correct`);
}

// ── 3. Document requirements ─────────────────────────────────────────────────
console.log("\n── 3. recruitment_document_requirements ──");
const reqs = await get(
  `recruitment_document_requirements?period_id=eq.${periodId}&select=slot,required,formats,max_bytes&order=slot`
);
assert(reqs.length === 5, `exactly 5 document requirements found (got ${reqs.length})`);

const expectedReqs = [
  { slot: "commitment",  formats: ["pdf"],       max_bytes: 3145728 },
  { slot: "cv",          formats: ["pdf"],       max_bytes: 3145728 },
  { slot: "followProof", formats: ["pdf","png"], max_bytes: 3145728 },
  { slot: "idCard",      formats: ["pdf","png"], max_bytes: 3145728 },
  { slot: "storyProof",  formats: ["pdf","png"], max_bytes: 3145728 },
];
for (const exp of expectedReqs) {
  const found = reqs.find(r => r.slot === exp.slot);
  assert(found !== undefined,                               `requirement slot '${exp.slot}' exists`);
  assert(found?.required === true,                          `  → required = true`);
  assert(found?.max_bytes === exp.max_bytes,                `  → max_bytes = ${exp.max_bytes}`);
  assert(JSON.stringify([...(found?.formats ?? [])].sort()) === JSON.stringify([...exp.formats].sort()),
                                                            `  → formats = [${exp.formats.join(",")}]`);
}

// ── 4. Safety: no applications yet ──────────────────────────────────────────
console.log("\n── 4. application pre-condition ──");
const apps = await get(`recruitment_applications?period_id=eq.${periodId}&select=id&limit=1`);
assert(apps.length === 0, `no applications exist yet for this period`);

// ── Summary ──────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(44));
if ((process.exitCode ?? 0) === 0) {
  console.log("✓ All assertions passed. Period is ready for test submission.");
} else {
  console.log("✗ One or more assertions failed. Do not proceed with submissions.");
}
console.log("─".repeat(44) + "\n");
