import type { MainDivision, RecruitmentPeriod } from "./recruitment-types";

// Names transcribed from GUIDEBOOK.md, not an approved recruitment catalogue.
// A draft brief (including Human Capital's PDF/PowerPoint note) is not approval.
const pendingMessage = "Ketentuan assignment dan format file belum dikonfirmasi panitia. Submit simulasi diblokir untuk pilihan ini.";

function division(id: string, label: string, children: readonly [string, string][]): MainDivision {
  return {
    id,
    label,
    subDivisions: children.map(([childId, childLabel]) => ({
      id: childId,
      label: childLabel,
      assignment: { status: "unconfirmed", message: pendingMessage },
    })),
  };
}

export const draftPeriod: RecruitmentPeriod = {
  id: "2026-2027",
  label: "2026/2027",
  contentState: "draft",
  notice: "Daftar divisi dari draft guidebook, belum menjadi data rekrutmen yang disahkan. Seluruh aturan assignment masih menunggu konfirmasi panitia.",
  batches: ["2025", "2026"],
  divisions: [
    division("internal-affairs", "Internal Affairs", [
      ["human-capital", "Human Capital"],
      ["internal-engagement", "Internal Engagement"],
    ]),
    division("external-affairs", "External Affairs", [
      ["relations-partnership", "Relations & Partnership"],
      ["external-engagement", "External Engagement"],
    ]),
    division("research-education", "Research & Education", [
      ["research-exploration", "Research & Exploration"],
      ["education-professional-growth", "Education & Professional Growth"],
    ]),
    division("compdev-iem", "Compdev & IEM", [
      ["competency-development", "Competency Development"],
      ["international-event-manager", "International Event Manager"],
    ]),
    division("finance", "Finance", [
      ["sponsorship", "Sponsorship"],
      ["fundraising", "Fundraising"],
    ]),
    division("media-creative", "Media Creative", [
      ["visual-design", "Visual design"],
      ["documentation", "Documentation"],
      ["website-development", "Website Development"],
    ]),
  ],
};
