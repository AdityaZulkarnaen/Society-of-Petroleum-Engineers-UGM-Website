import type { Metadata } from "next";
import { RecruitmentLanding } from "@/modules/recruitment/landing";

export const metadata: Metadata = {
  title: "Staff Recruitment 2026/2027 — Preview",
  description: "Preview alur Open Recruitment Staff SPE UGM SC 2026/2027.",
  robots: { index: false, follow: false },
};

export default function JoinPage() {
  const backend =
    process.env.RECRUITMENT_ENABLED === "true" ||
    process.env.RECRUITMENT_STAGING_ENABLED === "true";
  return <RecruitmentLanding backend={backend} />;
}
