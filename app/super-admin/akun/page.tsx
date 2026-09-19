import { AccountsPage } from "@/modules/super-admin/accounts";

export default function Page({ searchParams }: PageProps<"/super-admin/akun">) {
  return <AccountsPage searchParams={searchParams} />;
}
