import type { Metadata, Viewport } from "next";

import { SuperAdminShell } from "@/modules/super-admin/shell";

export const metadata: Metadata = {
  title: "Dashboard Super Admin — SPE UGM",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0e1022",
};

export default function SuperAdminLayout({
  children,
}: LayoutProps<"/super-admin">) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
