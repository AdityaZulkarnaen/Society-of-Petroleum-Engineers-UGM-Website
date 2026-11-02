import type { Metadata } from "next";
import { ApplicationWizard } from "@/modules/recruitment/wizard";

export const metadata: Metadata = {
  title: "Recruitment Application",
  robots: { index: false, follow: false },
};

export default function ApplyPage() {
  const backend =
    process.env.RECRUITMENT_ENABLED === "true" ||
    process.env.RECRUITMENT_STAGING_ENABLED === "true";
  return <ApplicationWizard backend={backend} />;
}
