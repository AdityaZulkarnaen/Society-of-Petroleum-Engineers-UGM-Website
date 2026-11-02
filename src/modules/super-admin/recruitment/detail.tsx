import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { ApplicantDetailView } from "./applicant-detail";
import { getApplicantDetail } from "./data";

export async function ApplicantDetailPage({ id }: { id: string }) {
  await requireSuperAdmin();

  const applicant = await getApplicantDetail(id);
  if (!applicant) {
    notFound();
  }

  return <ApplicantDetailView applicant={applicant} />;
}

