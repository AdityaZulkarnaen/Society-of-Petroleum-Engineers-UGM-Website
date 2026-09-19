import { ComingSoonPage } from "@/modules/admin/coming-soon";
import { compactCardSurface } from "@/modules/admin/components/ui";

export default function Page() {
  return (
    <ComingSoonPage
      title="Voting"
      backHref="/super-admin"
      backLabel="Kembali ke Dashboard"
      surface={compactCardSurface}
    />
  );
}
