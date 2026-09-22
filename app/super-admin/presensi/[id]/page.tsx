import { MeetingSessionPage } from "@/modules/super-admin/presensi/session";

export default async function Page({
  params,
}: PageProps<"/super-admin/presensi/[id]">) {
  const { id } = await params;
  return <MeetingSessionPage id={id} />;
}
