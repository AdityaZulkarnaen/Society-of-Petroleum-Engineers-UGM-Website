import type { Metadata } from "next";
import { RecruitmentLanding } from "@/modules/recruitment/landing";

export const metadata: Metadata = {
  title: "Staff Recruitment 2026/2027 — Preview",
  description: "Preview lokal alur Open Recruitment Staff SPE UGM SC 2026/2027. Tidak menerima pendaftaran resmi.",
  robots: { index: false, follow: false },
};

export default function JoinPage() {
  return <RecruitmentLanding backend={process.env.RECRUITMENT_STAGING_ENABLED === "true"} />;
}
