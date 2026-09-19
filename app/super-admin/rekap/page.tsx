import { RekapPage } from "@/modules/super-admin/rekap";

export default function Page({ searchParams }: PageProps<"/super-admin/rekap">) {
  return <RekapPage searchParams={searchParams} />;
}
