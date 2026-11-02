/* eslint-disable @typescript-eslint/no-require-imports -- Test utility module using CommonJS. */
// Test utilities for generating valid, minimal synthetic documents (PDF, PNG)
// Used exclusively in offline test suites and staging synthetic fixtures.
// Never used in production application routes.

const { deflateSync } = require("node:zlib");

/**
 * Checks if a PDF is a stub that lacks a page tree hierarchy.
 */
function isPdfStub(buffer) {
  if (buffer.length >= 200) return false;
  const str = buffer.toString("utf8");
  return str.startsWith("%PDF") && !str.includes("/Pages");
}

/**
 * Generates an ISO 32000-1 compliant minimal 1-page PDF for test fixtures.
 */
function buildValidSyntheticPdf(documentId) {
  const title = "SPE UGM SC — Synthetic Staging Document";
  const subtitle = `Document ID: ${documentId}`;
  const notice = "Verified synthetic recruitment test document. Staging environment only.";

  const content = [
    "BT",
    "/F1 16 Tf",
    "50 720 Td",
    `(${title}) Tj`,
    "/F1 11 Tf",
    "0 -28 Td",
    `(${subtitle}) Tj`,
    "/F1 10 Tf",
    "0 -24 Td",
    `(${notice}) Tj`,
    "ET",
  ].join("\n");

  const streamLen = Buffer.byteLength(content, "utf8");

  const obj1 = "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n";
  const obj2 = "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n";
  const obj3 =
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n";
  const obj4 = "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n";
  const obj5 = `5 0 obj << /Length ${streamLen} >> stream\n${content}\nendstream\nendobj\n`;

  const header = "%PDF-1.4\n";
  const offset1 = header.length;
  const offset2 = offset1 + obj1.length;
  const offset3 = offset2 + obj2.length;
  const offset4 = offset3 + obj3.length;
  const offset5 = offset4 + obj4.length;
  const xrefOffset = offset5 + obj5.length;

  const xref = [
    "xref",
    "0 6",
    "0000000000 65535 f ",
    String(offset1).padStart(10, "0") + " 00000 n ",
    String(offset2).padStart(10, "0") + " 00000 n ",
    String(offset3).padStart(10, "0") + " 00000 n ",
    String(offset4).padStart(10, "0") + " 00000 n ",
    String(offset5).padStart(10, "0") + " 00000 n ",
    "trailer << /Size 6 /Root 1 0 R >>",
    "startxref",
    String(xrefOffset),
    "%%EOF\n",
  ].join("\n");

  return Buffer.from(header + obj1 + obj2 + obj3 + obj4 + obj5 + xref, "utf8");
}

/**
 * Checks if a PNG is a minimal 1x1 transparent stub.
 */
function isPngStub(buffer) {
  return (
    buffer.length < 150 &&
    buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"
  );
}

/**
 * Generates a valid visible PNG image badge for test fixtures.
 */
function buildValidSyntheticPng() {
  function chunk(type, body) {
    const data = Buffer.concat([Buffer.from(type), body]);
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    const out = Buffer.alloc(body.length + 12);
    out.writeUInt32BE(body.length, 0);
    data.copy(out, 4);
    out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, out.length - 4);
    return out;
  }

  const width = 240;
  const height = 140;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB

  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0;
  for (let x = 0; x < width; x++) {
    const isBorder = x < 4 || x >= width - 4;
    row[1 + x * 3] = isBorder ? 79 : 27;
    row[1 + x * 3 + 1] = isBorder ? 141 : 42;
    row[1 + x * 3 + 2] = isBorder ? 255 : 92;
  }
  const rawData = Buffer.concat(Array.from({ length: height }, () => row));

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(rawData)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

module.exports = {
  isPdfStub,
  buildValidSyntheticPdf,
  isPngStub,
  buildValidSyntheticPng,
};
