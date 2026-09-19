import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { CURRENT_PERIOD } from "@/modules/admin/constants";

import { AccountManager } from "./account-manager";
import { getAccounts } from "./data";

export async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireSuperAdmin();
  const [accounts, params] = await Promise.all([getAccounts(), searchParams]);

  return (
    <AccountManager
      accounts={accounts}
      division={me.division?.name ?? null}
      defaultPeriod={CURRENT_PERIOD.label}
      openCreate={params.tambah === "1"}
    />
  );
}
