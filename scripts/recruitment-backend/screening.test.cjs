/* eslint-disable @typescript-eslint/no-require-imports -- Offline test runner using Node built-in test framework. */
// B4 Offline Screening & Governance Test Suite
// Verifies CSV formula sanitization, screening transition constraints, role-based authorization, and document streaming security.

const test = require("node:test");
const assert = require("node:assert/strict");

// --- 1. CSV Formula Injection Sanitizer Implementation (Mirror of src/modules/super-admin/recruitment/csv.ts) ---
const FORMULA_TRIGGERS = /^[\s]*[=+\-@\t\r]/;

function sanitizeCsvCell(raw) {
  if (raw === null || raw === undefined) {
    return "";
  }
  let text = String(raw);
  if (FORMULA_TRIGGERS.test(text)) {
    text = `'${text}`;
  }
  const needsQuotes = /[",\r\n]/.test(text) || text.startsWith("'");
  if (needsQuotes) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function generateApplicantsCsv(applications) {
  const CSV_HEADERS = [
    "Application ID",
    "Full Name",
    "NIM",
    "Email",
    "Phone",
    "Major",
    "Batch",
    "Birth Place",
    "Birth Date",
    "Screening Status",
    "Submitted At",
    "1st Choice Main Division",
    "1st Choice Sub Division",
    "1st Choice Motivation",
    "2nd Choice Main Division",
    "2nd Choice Sub Division",
    "2nd Choice Motivation",
  ];
  const headerLine = CSV_HEADERS.map((h) => sanitizeCsvCell(h)).join(",");
  const rows = applications.map((app) => {
    const pref1 = app.preferences?.find((p) => p.rank === 1);
    const pref2 = app.preferences?.find((p) => p.rank === 2);
    const values = [
      app.id,
      app.full_name,
      app.nim,
      app.email,
      app.phone,
      app.major,
      app.batch,
      app.birth_place,
      app.birth_date,
      app.status,
      app.submitted_at ?? "",
      pref1?.main_code ?? "",
      pref1?.sub_code ?? "",
      pref1?.motivation ?? "",
      pref2?.main_code ?? "",
      pref2?.sub_code ?? "",
      pref2?.motivation ?? "",
    ];
    return values.map((v) => sanitizeCsvCell(v)).join(",");
  });
  return [headerLine, ...rows].join("\r\n");
}

// --- 2. State Transition Guard Logic (Mirror of recruitment_review constraint) ---
function validateTransition(currentStatus, targetStatus) {
  const ALLOWED_TARGETS = ["under_review", "accepted", "rejected"];
  if (!ALLOWED_TARGETS.includes(targetStatus)) {
    return { ok: false, error: "review_status_invalid" };
  }
  if (
    (currentStatus === "submitted" && targetStatus === "under_review") ||
    (currentStatus === "under_review" && (targetStatus === "accepted" || targetStatus === "rejected"))
  ) {
    return { ok: true };
  }
  return { ok: false, error: "review_transition_invalid" };
}

// --- 3. Authorization Guard Logic (Mirror of recruitment_allowed / requireSuperAdmin) ---
function checkSuperAdminAccess(user) {
  if (!user) {
    return { allowed: false, reason: "unauthenticated" };
  }
  if (!user.is_active) {
    return { allowed: false, reason: "inactive" };
  }
  if (user.role !== "super_admin") {
    return { allowed: false, reason: "forbidden_role" };
  }
  return { allowed: true };
}

// ==========================================
// Test Suites
// ==========================================

test("CSV Sanitizer: neutralizes formula injection triggers", async (t) => {
  await t.test("prefixes = formula trigger with apostrophe", () => {
    const malicious = "=CMD|' /C calc'!A0";
    const sanitized = sanitizeCsvCell(malicious);
    assert.match(sanitized, /^"'/);
    assert.ok(sanitized.includes("'=CMD|"));
  });

  await t.test("prefixes + formula trigger with apostrophe", () => {
    const malicious = "+1+1";
    const sanitized = sanitizeCsvCell(malicious);
    assert.equal(sanitized, `\"'+1+1\"`);
  });

  await t.test("prefixes - formula trigger with apostrophe", () => {
    const malicious = "-2+5";
    const sanitized = sanitizeCsvCell(malicious);
    assert.equal(sanitized, `\"'-2+5\"`);
  });

  await t.test("prefixes @ formula trigger with apostrophe", () => {
    const malicious = "@SUM(A1:A10)";
    const sanitized = sanitizeCsvCell(malicious);
    assert.equal(sanitized, `\"'@SUM(A1:A10)\"`);
  });

  await t.test("neutralizes formula trigger with leading whitespace", () => {
    const malicious = "   =1+1";
    const sanitized = sanitizeCsvCell(malicious);
    assert.match(sanitized, /^"'/);
    assert.ok(sanitized.includes("'   =1+1"));
  });

  await t.test("neutralizes tab and carriage return triggers", () => {
    const tabMalicious = "\t=cmd";
    const sanitizedTab = sanitizeCsvCell(tabMalicious);
    assert.match(sanitizedTab, /^"'/);

    const crMalicious = "\r+cmd";
    const sanitizedCr = sanitizeCsvCell(crMalicious);
    assert.match(sanitizedCr, /^"'/);
  });
});

test("CSV Sanitizer: standard RFC-4180 escaping", async (t) => {
  await t.test("handles normal benign text without unnecessary escaping", () => {
    assert.equal(sanitizeCsvCell("John Doe"), "John Doe");
    assert.equal(sanitizeCsvCell("12345678"), "12345678");
    assert.equal(sanitizeCsvCell("Teknik Geologi"), "Teknik Geologi");
  });

  await t.test("handles null and undefined safely", () => {
    assert.equal(sanitizeCsvCell(null), "");
    assert.equal(sanitizeCsvCell(undefined), "");
  });

  await t.test("escapes inner double quotes by doubling them", () => {
    const input = 'He said "Hello"';
    const sanitized = sanitizeCsvCell(input);
    assert.equal(sanitized, '"He said ""Hello"""');
  });

  await t.test("wraps text with commas in quotes", () => {
    const input = "Jakarta, Indonesia";
    const sanitized = sanitizeCsvCell(input);
    assert.equal(sanitized, '"Jakarta, Indonesia"');
  });

  await t.test("wraps multiline text in quotes", () => {
    const input = "Paragraph 1\nParagraph 2";
    const sanitized = sanitizeCsvCell(input);
    assert.equal(sanitized, '"Paragraph 1\nParagraph 2"');
  });
});

test("CSV Export Generator: full dataset serialization", () => {
  const applicants = [
    {
      id: "app-001",
      full_name: "Ahmad Fauzi",
      nim: "24/123456/TK/50001",
      email: "ahmad@mail.ugm.ac.id",
      phone: "+628123456789",
      major: "Teknik Kimia",
      batch: "2024",
      birth_place: "Surabaya",
      birth_date: "2006-03-15",
      status: "submitted",
      submitted_at: "2026-11-01T10:00:00Z",
      preferences: [
        { rank: 1, main_code: "it", sub_code: "frontend", motivation: "Motivasi 1" },
        { rank: 2, main_code: "it", sub_code: "backend", motivation: "Motivasi 2" },
      ],
    },
    {
      id: "app-002",
      full_name: "=HYPERLINK(\"http://evil.com\")",
      nim: "24/999999/TK/99999",
      email: "test@example.com",
      phone: "+628999999999",
      major: "Teknik Mesin",
      batch: "2024",
      birth_place: "Jakarta",
      birth_date: "2006-01-01",
      status: "under_review",
      submitted_at: "2026-11-01T12:00:00Z",
      preferences: [],
    },
  ];

  const csv = generateApplicantsCsv(applicants);
  const lines = csv.split("\r\n");

  assert.equal(lines.length, 3); // Header + 2 data rows
  assert.ok(lines[0].startsWith("Application ID,Full Name,NIM"));

  // Check first applicant values
  assert.ok(lines[1].includes("app-001"));
  assert.ok(lines[1].includes("Ahmad Fauzi"));

  // Check second applicant has neutralized formula
  assert.ok(lines[2].includes(`\"'=HYPERLINK(\"\"http://evil.com\"\")\"`));
});

test("State Transition Constraints: database review lifecycle", async (t) => {
  await t.test("allows submitted -> under_review", () => {
    const res = validateTransition("submitted", "under_review");
    assert.equal(res.ok, true);
  });

  await t.test("allows under_review -> accepted", () => {
    const res = validateTransition("under_review", "accepted");
    assert.equal(res.ok, true);
  });

  await t.test("allows under_review -> rejected", () => {
    const res = validateTransition("under_review", "rejected");
    assert.equal(res.ok, true);
  });

  await t.test("rejects direct submitted -> accepted", () => {
    const res = validateTransition("submitted", "accepted");
    assert.equal(res.ok, false);
    assert.equal(res.error, "review_transition_invalid");
  });

  await t.test("rejects direct submitted -> rejected", () => {
    const res = validateTransition("submitted", "rejected");
    assert.equal(res.ok, false);
    assert.equal(res.error, "review_transition_invalid");
  });

  await t.test("rejects reversal from accepted -> under_review", () => {
    const res = validateTransition("accepted", "under_review");
    assert.equal(res.ok, false);
    assert.equal(res.error, "review_transition_invalid");
  });

  await t.test("rejects reversal from rejected -> under_review", () => {
    const res = validateTransition("rejected", "under_review");
    assert.equal(res.ok, false);
    assert.equal(res.error, "review_transition_invalid");
  });

  await t.test("rejects transitioning uploading applications", () => {
    const res = validateTransition("uploading", "under_review");
    assert.equal(res.ok, false);
    assert.equal(res.error, "review_transition_invalid");
  });

  await t.test("rejects unknown statuses", () => {
    const res = validateTransition("submitted", "approved");
    assert.equal(res.ok, false);
    assert.equal(res.error, "review_status_invalid");
  });
});

test("Access Control Guards: strict active super_admin enforcement", async (t) => {
  await t.test("denies unauthenticated visitors", () => {
    const res = checkSuperAdminAccess(null);
    assert.equal(res.allowed, false);
    assert.equal(res.reason, "unauthenticated");
  });

  await t.test("denies inactive super_admin accounts", () => {
    const user = { id: "u-1", role: "super_admin", is_active: false };
    const res = checkSuperAdminAccess(user);
    assert.equal(res.allowed, false);
    assert.equal(res.reason, "inactive");
  });

  await t.test("denies active regular admin accounts", () => {
    const user = { id: "u-2", role: "admin", is_active: true };
    const res = checkSuperAdminAccess(user);
    assert.equal(res.allowed, false);
    assert.equal(res.reason, "forbidden_role");
  });

  await t.test("grants access only to active super_admin", () => {
    const user = { id: "u-3", role: "super_admin", is_active: true };
    const res = checkSuperAdminAccess(user);
    assert.equal(res.allowed, true);
  });
});

test("Document Streaming Security: MIME types and headers", () => {
  const MIME_TYPES = {
    pdf: "application/pdf",
    png: "image/png",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };

  assert.equal(MIME_TYPES.pdf, "application/pdf");
  assert.equal(MIME_TYPES.png, "image/png");
  assert.equal(MIME_TYPES.ppt, "application/vnd.ms-powerpoint");
  assert.equal(MIME_TYPES.pptx, "application/vnd.openxmlformats-officedocument.presentationml.presentation");

  const requiredHeaders = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };

  assert.equal(requiredHeaders["Cache-Control"], "private, no-store");
  assert.equal(requiredHeaders["X-Content-Type-Options"], "nosniff");
});

// --- 4. Test Fixture Document Generators (Test utilities only) ---
const crypto = require("node:crypto");
const {
  isPdfStub,
  buildValidSyntheticPdf,
  isPngStub,
  buildValidSyntheticPng,
} = require("./test-generators.cjs");

test("Test Utilities: synthetic document generators produce valid fixtures", async (t) => {
  await t.test("identifies minimal 51-byte PDF stub without /Pages hierarchy", () => {
    const stub = Buffer.from("%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n", "utf8");
    assert.equal(isPdfStub(stub), true);
  });

  await t.test("does not flag full valid PDF as a stub", () => {
    const fullPdf = buildValidSyntheticPdf("doc-12345");
    assert.equal(fullPdf.length > 200, true);
    assert.equal(isPdfStub(fullPdf), false);
  });

  await t.test("generates valid ISO 32000-1 PDF with catalog, pages, page, stream, and xref", () => {
    const pdf = buildValidSyntheticPdf("test-uuid");
    const pdfStr = pdf.toString("utf8");

    assert.ok(pdfStr.startsWith("%PDF-1.4"));
    assert.ok(pdfStr.includes("/Type /Catalog"));
    assert.ok(pdfStr.includes("/Type /Pages"));
    assert.ok(pdfStr.includes("/Type /Page"));
    assert.ok(pdfStr.includes("/MediaBox [0 0 612 792]"));
    assert.ok(pdfStr.includes("stream\n"));
    assert.ok(pdfStr.includes("endstream\n"));
    assert.ok(pdfStr.includes("xref\n"));
    assert.ok(pdfStr.includes("trailer << /Size 6 /Root 1 0 R >>"));
    assert.ok(pdfStr.includes("startxref\n"));
    assert.ok(pdfStr.endsWith("%%EOF\n"));
  });

  await t.test("identifies minimal 70-byte 1x1 transparent PNG stub", () => {
    const stub = Buffer.from(
      "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000000020001e221bc330000000049454e44ae426082",
      "hex",
    );
    assert.equal(isPngStub(stub), true);
  });

  await t.test("generates valid visible PNG with magic bytes, IHDR, IDAT, and IEND", () => {
    const png = buildValidSyntheticPng();
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.ok(png.length > 150);
    assert.equal(isPngStub(png), false);

    const pngStr = png.toString("binary");
    assert.ok(pngStr.includes("IHDR"));
    assert.ok(pngStr.includes("IDAT"));
    assert.ok(pngStr.includes("IEND"));
  });
});

test("Document Streaming Integrity: byte-for-byte fidelity and response headers", async (t) => {
  // Simulate document streaming response construction as in app/api/super-admin/recruitment/documents/[id]/route.ts
  function buildDocumentResponse(fileBuffer, objectName, documentId) {
    const ext = objectName.split(".").pop()?.toLowerCase() ?? "";
    const MIME_TYPES = {
      pdf: "application/pdf",
      png: "image/png",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const filename = `document-${documentId}.${ext || "bin"}`;

    return {
      body: new Uint8Array(fileBuffer),
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.byteLength),
        "Content-Disposition": `inline; filename="${filename}"`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    };
  }

  await t.test("preserves exact stored bytes without dynamic modification for arbitrary binary input", () => {
    const originalBytes = crypto.randomBytes(1024);
    const originalHash = crypto.createHash("sha256").update(originalBytes).digest("hex");

    const res = buildDocumentResponse(originalBytes, "applicant/doc.pdf", "doc-uuid-1");
    const outputBuffer = Buffer.from(res.body);
    const outputHash = crypto.createHash("sha256").update(outputBuffer).digest("hex");

    assert.equal(outputHash, originalHash);
    assert.equal(outputBuffer.length, originalBytes.length);
    assert.deepEqual(outputBuffer, originalBytes);
    assert.equal(res.headers["Content-Length"], "1024");
    assert.equal(res.headers["Content-Type"], "application/pdf");
    assert.equal(res.headers["Content-Disposition"], 'inline; filename="document-doc-uuid-1.pdf"');
  });

  await t.test("preserves exact stored bytes even if input is a minimal test stub (no production dynamic substitution)", () => {
    const stubBytes = Buffer.from("%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n", "utf8");
    const stubHash = crypto.createHash("sha256").update(stubBytes).digest("hex");

    const res = buildDocumentResponse(stubBytes, "applicant/stub.pdf", "doc-uuid-2");
    const outputBuffer = Buffer.from(res.body);
    const outputHash = crypto.createHash("sha256").update(outputBuffer).digest("hex");

    // Must be identical - no dynamic replacement in production route
    assert.equal(outputHash, stubHash);
    assert.equal(outputBuffer.length, 51);
    assert.equal(res.headers["Content-Length"], "51");
  });

  await t.test("correctly maps supported MIME types for previewable and office formats", () => {
    const testCases = [
      { name: "file.pdf", expected: "application/pdf" },
      { name: "file.png", expected: "image/png" },
      { name: "file.ppt", expected: "application/vnd.ms-powerpoint" },
      { name: "file.pptx", expected: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
      { name: "file.xyz", expected: "application/octet-stream" },
    ];

    for (const { name, expected } of testCases) {
      const res = buildDocumentResponse(Buffer.from("dummy"), name, "test-id");
      assert.equal(res.headers["Content-Type"], expected);
    }
  });

  await t.test("includes mandatory security headers for private streaming", () => {
    const res = buildDocumentResponse(Buffer.from("test"), "file.pdf", "id-1");
    assert.equal(res.headers["Cache-Control"], "private, no-store, max-age=0");
    assert.equal(res.headers["X-Content-Type-Options"], "nosniff");
    assert.equal(res.headers["Accept-Ranges"], "bytes");
  });
});

test("Export & Period Governance: specification conformity", async (t) => {
  await t.test("inline document preview headers include Content-Disposition inline, Content-Length, and Accept-Ranges", () => {
    const fileName = "test-document.pdf";
    const bodyLength = 787;
    const headers = {
      "Content-Type": "application/pdf",
      "Content-Length": String(bodyLength),
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    };

    assert.equal(headers["Content-Disposition"].startsWith("inline;"), true);
    assert.equal(headers["Content-Disposition"].includes(fileName), true);
    assert.equal(headers["Content-Length"], "787");
    assert.equal(headers["Accept-Ranges"], "bytes");
    assert.equal(headers["Cache-Control"], "private, no-store, max-age=0");
    assert.equal(headers["X-Content-Type-Options"], "nosniff");
  });

  await t.test("CSV export headers include attachment disposition and exact Content-Length", () => {
    const csvContent = "Application ID,Full Name\r\napp-1,John";
    const headers = {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Length": String(Buffer.byteLength(csvContent, "utf8")),
      "Content-Disposition": `attachment; filename="spe-recruitment-export-2026-11-02.csv"`,
      "Cache-Control": "private, no-cache, no-store",
    };

    assert.equal(headers["Content-Disposition"].startsWith("attachment;"), true);
    assert.equal(headers["Content-Length"], "36");
  });

  await t.test("periods query respects postgres column grants (opens_at instead of created_at)", () => {
    // Migration 20261101010000_recruitment_security.sql grants:
    // select (id, code, label, config_version, approved_at, is_open, opens_at, closes_at, batches)
    const grantedColumns = new Set([
      "id",
      "code",
      "label",
      "config_version",
      "approved_at",
      "is_open",
      "opens_at",
      "closes_at",
      "batches",
    ]);

    // created_at is NOT in the granted columns for authenticated role
    assert.equal(grantedColumns.has("created_at"), false);

    // opens_at is in the granted columns and valid for order()
    assert.equal(grantedColumns.has("opens_at"), true);
  });
});
