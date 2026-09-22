import { requireAdmin } from "@/modules/admin/auth/session";
import { ScanScreen } from "@/modules/admin/presensi/scan-screen";

export default async function Page({
  searchParams,
}: PageProps<"/admin/presensi/scan">) {
  /* the QR sends people straight here, so make sure they are signed in */
  await requireAdmin();
  const { t } = await searchParams;
  return <ScanScreen token={typeof t === "string" ? t : null} />;
}
