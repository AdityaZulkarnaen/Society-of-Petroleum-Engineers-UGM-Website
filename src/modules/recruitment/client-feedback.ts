import type { Errors } from "./validation";

export type RequestStage = "session" | "init" | "upload" | "finalize";

const fields = {
  fullName: [0, "Full name"], nim: [0, "Student ID (NIM)"], birthPlace: [0, "Place of birth"],
  birthDate: [0, "Date of birth"], ugmEmail: [0, "UGM email"], phoneNumber: [0, "Phone number"],
  major: [0, "Study program"], batch: [0, "Cohort"], division1: [1, "First preference: main division"],
  subDivision1: [1, "First preference: sub-division"], motivation1: [1, "First preference: motivation"],
  assignment1: [1, "First preference assignment"], division2: [2, "Second preference: main division"],
  subDivision2: [2, "Second preference: sub-division"], motivation2: [2, "Second preference: motivation"],
  assignment2: [2, "Second preference assignment"], cv: [3, "Curriculum Vitae"],
  idCard: [3, "Student ID Card"], commitment: [3, "Commitment Letter"], followProof: [3, "Instagram Follow Proof"],
  storyProof: [3, "Instagram Story Proof"], mbti: [3, "MBTI Personality Test Result"],
  ugmGroupProof: [3, "UGM Group Sharing Proof"],
} as const;
export type ErrorField = keyof typeof fields;
export function isErrorField(key: string): key is ErrorField { return Object.hasOwn(fields, key); }
export function fieldStep(key: ErrorField) { return fields[key][0]; }
export function fieldLabel(key: string) { return isErrorField(key) ? fields[key][1] : "Application details"; }

// Only known validation copy may cross from the API into applicant feedback.
const safeFieldMessages = new Set([
  "This field is required.", "Use no more than 150 characters.",
  "Enter a valid date of birth that is not in the future.", "Enter a valid email address.",
  "Enter a phone number with 8\u201325 characters.", "Enter a phone number with 8\u201325 characters and at least 8 digits.",
  "Choose a main division from the list.", "Choose a sub-division within this main division.",
  "Choose two different sub-divisions. They may belong to the same main division.",
  "Invalid second sub-division selection.", "Assignment requirements are unconfirmed.",
  "Explain why you chose this sub-division.", "Use no more than 3,000 characters.",
  "Choose a file to continue.", "This file is empty. Choose another file.",
  "Check the document and size limit.", "Document exceeds the 3 MiB limit.",
  "Document format does not match requirements.", "File content does not match supported PDF/PNG format.",
  "Interactive or encrypted PDFs are not supported.",
]);
export function safeFieldErrors(input: unknown): Errors {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const result: Errors = {};
  for (const [key, value] of Object.entries(input)) {
    if (!isErrorField(key) || !value) continue;
    result[key] = typeof value === "string" && (safeFieldMessages.has(value) ||
      /^Format must be (?:PDF|PNG)(?: \/ (?:PDF|PNG))*\.$/.test(value))
      ? value : `Please check ${fieldLabel(key).toLowerCase()} and its requirements.`;
  }
  return result;
}

export class RecruitmentRequestError extends Error {
  constructor(public status: number, public fields: Errors, public reason: string) {
    super("Recruitment request could not be completed.");
  }
}
export async function recruitmentResponse(response: Response): Promise<Record<string, unknown>> {
  let data: Record<string, unknown>;
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    data = body as Record<string, unknown>;
  } catch {
    throw new RecruitmentRequestError(response.status, {}, "unreadable");
  }
  if (!response.ok) {
    // Classify known server wording; never display or log the response text.
    const text = typeof data.error === "string" ? data.error.toLowerCase() : "";
    const reason = /(?:session.*(?:invalid|expired)|invalid session|sesi.*(?:berakhir|tidak valid))/.test(text) ? "session"
      : /already registered|already (?:been )?submitted|pernah mendaftar/.test(text) ? "duplicate"
      : /not yet|open november|belum dibuka/.test(text) ? "not-open"
      : /closed|ditutup/.test(text) ? "closed" : "response";
    throw new RecruitmentRequestError(response.status, safeFieldErrors(data.fields), reason);
  }
  return data;
}

export function applicantError(error: unknown, stage: RequestStage, uncertain = false, document?: string): string {
  const known = error instanceof RecruitmentRequestError;
  if (known && error.reason === "session") {
    return uncertain
      ? "Your session has expired and your submission is not confirmed. Keep this page open and contact the committee with your NIM before trying again."
      : "Your session has expired. Your entries and files are still here. Keep this page open and contact the committee for help continuing.";
  }
  if (known && error.reason === "duplicate") return "An application already exists for this Student ID (NIM). Contact the committee if you need help or corrections. Do not submit using a different NIM.";
  if (known && error.reason === "not-open") return "Applications are not yet open. Check the recruitment schedule and try again when registration opens.";
  if (known && error.reason === "closed") return "Applications are now closed. Contact the recruitment committee if you need help.";
  if (uncertain) return "We could not confirm whether your application was received. Keep this page open and retry with the same information and files. If this continues, contact the committee with your NIM.";
  if (known && Object.values(error.fields).some(Boolean)) return "Please correct the listed fields, then try again. Your other entries and files are still here.";
  if (known && error.status === 422 && stage !== "upload") return "Some application details or documents need attention. Use Edit to check the review sections and requirements. Your entries and files are still here.";
  if (known && error.status === 429) return "Too many requests. Keep this page open, wait a minute, then try again with the same information and files.";
  if (stage === "upload" && known && error.status >= 500) return `The upload service is temporarily unavailable. Your ${document ?? "document"} and other entries are still here. Wait a moment, then retry with the same information and files.`;
  if (stage === "upload") return `We could not upload ${document ?? "your document"}. Check your connection and the file requirements, then retry with the same information and files.`;
  if (!known && error instanceof TypeError) return stage === "session"
    ? "We could not connect to the application system. Check your internet connection and try again."
    : "We could not connect to the application system. Check your connection, keep this page open, and retry with the same information and files.";
  return stage === "session"
    ? "The application system is temporarily unavailable. Please try again shortly."
    : "The application system is temporarily unavailable. Keep this page open and try again shortly with the same information and files.";
}

export function logRecruitmentError(error: unknown, stage: RequestStage) {
  // No payloads, NIMs, tokens, file names, response bodies, or exception messages.
  console.warn("Recruitment request unsuccessful", {
    stage, status: error instanceof RecruitmentRequestError ? error.status : undefined,
    category: error instanceof RecruitmentRequestError ? error.reason : "connection-or-client",
  });
}
