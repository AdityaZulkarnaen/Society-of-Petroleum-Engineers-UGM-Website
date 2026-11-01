/** Phase A only. No environment variables, remote configuration, or backend. */
import { draftPeriod } from "./draft-config";
import { mockPeriod } from "./mock-config";
import type { RecruitmentPeriod } from "./recruitment-types";

export type RecruitmentStatus = "open" | "closed" | "pending";

// No official catalogue or assignment policy has been approved in this phase.
// Future periods get their own key; do not overwrite a previous period's data.
export const approvedRecruitmentPeriods: Readonly<Record<string, RecruitmentPeriod & { contentState: "approved" }>> = {};

export const recruitmentCatalogs = { draft: draftPeriod, demo: mockPeriod };
export type RecruitmentCatalog = keyof typeof recruitmentCatalogs;

export const recruitmentConfig: {
  period: string;
  status: RecruitmentStatus;
  divisions: RecruitmentPeriod["divisions"];
} = {
  period: draftPeriod.label,
  status: "open",
  divisions: draftPeriod.divisions,
};

export const statusLabels: Record<RecruitmentStatus, string> = {
  open: "Simulasi dibuka",
  closed: "Simulasi ditutup",
  pending: "Informasi menunggu konfirmasi",
};

export const MOCK_NOTICE = "Simulasi lokal — data tidak dikirim.";
export const MAX_FILE_BYTES = 3 * 1024 * 1024;

export const documentSlots = [
  { key: "cv", label: "Curriculum Vitae", format: "PDF", filename: "Name_CV.pdf", step: 3 },
  { key: "idCard", label: "Kartu mahasiswa", format: "PDF", filename: "Name_IDCard.pdf", step: 3 },
  { key: "commitment", label: "Surat komitmen", format: "PDF", filename: "Name_LetterCommitment.pdf", step: 3 },
  { key: "followProof", label: "Bukti mengikuti SPE", format: "PNG", filename: "Name_ProofFollowSPE.png", step: 3 },
  { key: "storyProof", label: "Bukti berbagi Instagram Story", format: "PNG", filename: "Name_ProofSG.png", step: 3 },
] as const;

export const steps = ["Data pribadi", "Divisi pertama", "Divisi kedua", "Dokumen & review"] as const;
