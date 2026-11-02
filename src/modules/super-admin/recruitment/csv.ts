/**
 * CSV serialization with protection against Spreadsheet Formula Injection (CSV Injection / CWE-1236).
 *
 * When opened in spreadsheet applications (e.g. Microsoft Excel, LibreOffice Calc, Google Sheets),
 * cells starting with '=', '+', '-', '@', tab, or carriage return could be interpreted as executable
 * formulas or DDE commands. Prepending an apostrophe (') neutralizes formula execution.
 */

const FORMULA_TRIGGERS = /^[\s]*[=+\-@\t\r]/;

/**
 * Sanitizes a single cell value for CSV output:
 * 1. Checks for formula injection characters and prefixes with `'` if found.
 * 2. Escapes double quotes (`"` -> `""`).
 * 3. Wraps in quotes if the value contains commas, quotes, newlines, or whitespace.
 */
export function sanitizeCsvCell(raw: unknown): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  let text = String(raw);

  // If the field starts with a formula trigger (even with leading spaces), prefix with apostrophe (')
  if (FORMULA_TRIGGERS.test(text)) {
    text = `'${text}`;
  }

  // If the cell contains quotes, commas, newlines, or carriage returns, wrap in quotes
  const needsQuotes = /[",\r\n]/.test(text) || text.startsWith("'");

  if (needsQuotes) {
    // Escape existing double quotes by doubling them
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export type ExportApplication = {
  id: string;
  period_id: string;
  full_name: string;
  nim: string;
  birth_place: string;
  birth_date: string;
  email: string;
  phone: string;
  major: string;
  batch: string;
  status: string;
  submitted_at: string | null;
  preferences?: Array<{
    rank: number;
    main_code: string;
    sub_code: string;
    motivation: string;
  }>;
};

export const CSV_HEADERS = [
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
] as const;

/**
 * Builds RFC-4180 compliant CSV string from application export data.
 */
export function generateApplicantsCsv(applications: ExportApplication[]): string {
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

  // Use CRLF as standard CSV line separator
  return [headerLine, ...rows].join("\r\n");
}

