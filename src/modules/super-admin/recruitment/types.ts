export type ScreeningStatus = "submitted" | "under_review" | "accepted" | "rejected";

export type PreferenceInfo = {
  rank: 1 | 2;
  mainCode: string;
  subCode: string;
  mainLabel: string;
  subLabel: string;
  motivation: string;
};

export type DocumentInfo = {
  id: string;
  slot: "cv" | "idCard" | "commitment" | "followProof" | "storyProof" | "assignment1" | "assignment2" | string;
  slotLabel: string;
  format: "pdf" | "png" | "ppt" | "pptx" | string;
  byteSize: number;
  verifiedAt: string;
};

export type ApplicantSummary = {
  id: string;
  periodId: string;
  fullName: string;
  nim: string;
  email: string;
  phone: string;
  major: string;
  batch: string;
  status: ScreeningStatus;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  firstPreference?: {
    mainCode: string;
    subCode: string;
    mainLabel: string;
    subLabel: string;
  } | null;
  secondPreference?: {
    mainCode: string;
    subCode: string;
    mainLabel: string;
    subLabel: string;
  } | null;
};

export type ApplicantDetail = ApplicantSummary & {
  birthPlace: string;
  birthDate: string;
  preferences: PreferenceInfo[];
  documents: DocumentInfo[];
  reviewerName?: string | null;
  reviewerUsername?: string | null;
};

export type RecruitmentPeriodInfo = {
  id: string;
  code: string;
  label: string;
  isOpen: boolean;
  approvedAt: string | null;
  opensAt: string;
  closesAt: string;
  batches: string[];
};

export const SLOT_LABELS: Record<string, string> = {
  cv: "Curriculum Vitae (CV)",
  idCard: "Kartu Tanda Mahasiswa (KTM)",
  commitment: "Surat Komitmen",
  followProof: "Bukti Follow Media Sosial",
  storyProof: "Bukti Repost Story",
  assignment1: "Penugasan Pilihan 1",
  assignment2: "Penugasan Pilihan 2",
};

export const STATUS_LABELS: Record<ScreeningStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

