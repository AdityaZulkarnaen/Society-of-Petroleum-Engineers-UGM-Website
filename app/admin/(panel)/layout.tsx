import { AdminShell } from "@/modules/admin/shell";

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
