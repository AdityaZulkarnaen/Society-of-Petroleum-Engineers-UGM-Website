import type { Metadata } from "next";
import { ApplicantDetailPage } from "@/modules/super-admin/recruitment/detail";

export const metadata: Metadata = {
  title: "Applicant Detail — Recruitment Screening SPE UGM",
};

export default async function Page({
  params,
}: PageProps<"/super-admin/recruitment/[id]">) {
  const { id } = await params;
  return <ApplicantDetailPage id={id} />;
}

