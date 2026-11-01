import type { Metadata } from "next";
import { ApplicationWizard } from "@/modules/recruitment/wizard";

export const metadata: Metadata = {
  title: "Application Form — Local Simulation",
  robots: { index: false, follow: false },
};

export default function ApplyPage() {
  return <ApplicationWizard />;
}
