import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Dashboard Pengurus — SPE UGM",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0e1022",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
