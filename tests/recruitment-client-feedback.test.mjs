import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
// Compile this dependency-free client helper using the existing TypeScript install.
const filename = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/modules/recruitment/client-feedback.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = new Module(filename);
loaded._compile(compiled, filename);
const { applicantError, recruitmentResponse, RecruitmentRequestError, safeFieldErrors, fieldStep, fieldLabel, logRecruitmentError } = loaded.exports;

test("connection failures never expose exception details", () => {
  const message = applicantError(new TypeError("Failed to fetch: secret-token"), "init");
  assert.match(message, /connection/);
  assert.doesNotMatch(message, /Failed to fetch|secret-token/);
});
test("unknown exceptions and HTML server responses use safe unavailability feedback", async () => {
  await assert.rejects(() => recruitmentResponse(new Response("<html>internal secret</html>", { status: 503 })), error => {
    assert.match(applicantError(error, "init"), /temporarily unavailable/);
    assert.doesNotMatch(applicantError(error, "init"), /secret|html/);
    return true;
  });
  assert.doesNotMatch(applicantError(new Error("sensitive stack"), "init"), /sensitive|stack/);
});
test("response errors retain only recognized fields and safe descriptions", async () => {
  await assert.rejects(() => recruitmentResponse(Response.json({ error: "private server detail", fields: { nim: "This field is required.", ugmEmail: "secret-token", unknown: "private" } }, { status: 422 })), error => {
    assert.deepEqual(error.fields, { nim: "This field is required.", ugmEmail: "Please check ugm email and its requirements." });
    assert.match(applicantError(error, "init"), /listed fields/);
    return true;
  });
});
test("invalid field payload shapes are ignored safely", () => {
  assert.deepEqual(safeFieldErrors(["secret"]), {});
  assert.deepEqual(safeFieldErrors(null), {});
  assert.deepEqual(safeFieldErrors({ cv: "Format must be PDF / PNG." }), { cv: "Format must be PDF / PNG." });
});
test("finalization loss remains uncertain rather than declaring failure", () => {
  for (const error of [new TypeError("Failed to fetch"), new RecruitmentRequestError(503, {}, "response")]) {
    assert.match(applicantError(error, "finalize", true), /could not confirm whether/);
    assert.match(applicantError(error, "init", true), /same information and files/);
  }
});
test("session expiration preserves entered information and does not advise reloading", async () => {
  await assert.rejects(() => recruitmentResponse(Response.json({ error: "Invalid session. Please reload the page." }, { status: 403 })), error => {
    assert.match(applicantError(error, "init"), /session has expired/);
    assert.doesNotMatch(applicantError(error, "init"), /reload/);
    assert.match(applicantError(error, "finalize", true), /not confirmed/);
    return true;
  });
});
test("duplicate NIM directs applicants to committee without changing identity", async () => {
  await assert.rejects(() => recruitmentResponse(Response.json({ error: "An application has already been submitted with this Student ID (NIM)." }, { status: 409 })), error => {
    assert.match(applicantError(error, "init"), /already exists/);
    assert.match(applicantError(error, "init"), /Do not submit using a different NIM/);
    return true;
  });
});
test("upload feedback identifies the document and distinguishes service outages", () => {
  assert.match(applicantError(new TypeError("Failed to fetch"), "upload", false, "Curriculum Vitae"), /could not upload Curriculum Vitae/);
  assert.match(applicantError(new RecruitmentRequestError(503, {}, "response"), "upload", false, "Curriculum Vitae"), /upload service is temporarily unavailable/);
});
test("rate limits and opening/closing statuses remain actionable", () => {
  assert.match(applicantError(new RecruitmentRequestError(429, {}, "response"), "init"), /wait a minute/);
  assert.match(applicantError(new RecruitmentRequestError(409, {}, "not-open"), "session"), /not yet open/);
  assert.match(applicantError(new RecruitmentRequestError(409, {}, "closed"), "session"), /now closed/);
});
test("field destinations match the actual wizard steps", () => {
  assert.equal(fieldStep("nim"), 0); assert.equal(fieldStep("assignment1"), 1);
  assert.equal(fieldStep("motivation2"), 2); assert.equal(fieldStep("cv"), 3);
  assert.equal(fieldLabel("nim"), "Student ID (NIM)");
});
test("successful staged responses retain recovery data", async () => {
  const data = { status: "already_submitted", applicationId: "synthetic-receipt" };
  assert.deepEqual(await recruitmentResponse(Response.json(data)), data);
});
test("developer diagnostics exclude input, response and exception secrets", () => {
  const original = console.warn, calls = [];
  console.warn = (...args) => calls.push(args);
  try { logRecruitmentError(new TypeError("secret-token NIM filename.pdf"), "upload"); }
  finally { console.warn = original; }
  assert.deepEqual(calls, [["Recruitment request unsuccessful", { stage: "upload", status: undefined, category: "connection-or-client" }]]);
});

test("validation without field metadata is not described as a server outage", () => {
  assert.match(applicantError(new RecruitmentRequestError(422, {}, "response"), "init"), /details or documents need attention/);
});

test("internal session configuration and NIM details are not mistaken for applicant errors", async () => {
  for (const message of ["Application session configuration is incomplete.", "Internal NIM service detail: secret-token"]) {
    await assert.rejects(() => recruitmentResponse(Response.json({ error: message }, { status: 503 })), error => {
      assert.match(applicantError(error, "session"), /temporarily unavailable/);
      assert.doesNotMatch(applicantError(error, "session"), /expired|secret-token|configuration/);
      return true;
    });
  }
});
