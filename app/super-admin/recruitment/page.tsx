import type { Metadata } from "next";
import { RecruitmentScreeningPage } from "@/modules/super-admin/recruitment";

export const metadata: Metadata = {
  title: "Recruitment Screening — Super Admin SPE UGM",
};

export default function Page({
  searchParams,
}: PageProps<"/super-admin/recruitment">) {
  return <RecruitmentScreeningPage searchParams={searchParams} />;
}

