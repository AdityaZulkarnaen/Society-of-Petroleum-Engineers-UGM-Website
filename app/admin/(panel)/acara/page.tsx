import { EventsPage } from "@/modules/admin/acara";

export default function Page({ searchParams }: PageProps<"/admin/acara">) {
  return <EventsPage searchParams={searchParams} />;
}
