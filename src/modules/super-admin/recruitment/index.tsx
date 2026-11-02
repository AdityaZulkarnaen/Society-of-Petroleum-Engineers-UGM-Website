import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { ApplicantTable } from "./applicant-table";
import { getRecruitmentPeriods, getScreeningApplicants } from "./data";

export async function RecruitmentScreeningPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSuperAdmin();

  const [periods, params] = await Promise.all([
    getRecruitmentPeriods(),
    searchParams,
  ]);

  const rawPeriod = params.period;
  const requestedPeriodId = typeof rawPeriod === "string" ? rawPeriod : undefined;

  const currentPeriodId =
    requestedPeriodId ||
    periods.find((p) => p.isOpen)?.id ||
    periods[0]?.id ||
    "";

  const applicants = await getScreeningApplicants(currentPeriodId || undefined);

  return (
    <ApplicantTable
      applicants={applicants}
      periods={periods}
      currentPeriodId={currentPeriodId}
    />
  );
}

