import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { Card, compactCardSurface, EmptyState } from "@/modules/admin/components/ui";
import { CURRENT_PERIOD } from "@/modules/admin/constants";

import { getAccounts } from "../accounts/data";
import { getRekap, getRekapProfileIds } from "./data";
import { RekapEditor } from "./editor";

export async function RekapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSuperAdmin();
  const [accounts, filled, params] = await Promise.all([
    getAccounts(),
    getRekapProfileIds(),
    searchParams,
  ]);

  if (accounts.length === 0) {
    return (
      <div className="space-y-8">
        <h1 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[32px]">
          Rekap Pengurus
        </h1>
        <Card surface={compactCardSurface} className="p-6">
          <EmptyState
            title="Belum ada pengurus"
            description="Buat akun pengurus di Manajemen Akun terlebih dahulu, lalu isi rekapnya di sini."
          />
        </Card>
      </div>
    );
  }

  /* active pengurus first, each group by name */
  const sorted = [...accounts].sort(
    (a, b) =>
      Number(b.isActive) - Number(a.isActive) ||
      a.fullName.localeCompare(b.fullName, "id"),
  );
  const selected = sorted.find((a) => a.id === params.pengurus) ?? sorted[0];
  const report = await getRekap(selected.id);

  return (
    <RekapEditor
      key={selected.id}
      accounts={sorted}
      selected={selected}
      report={report}
      hasRekap={[...filled]}
      period={CURRENT_PERIOD.label}
    />
  );
}
