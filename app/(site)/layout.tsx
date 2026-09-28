import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";
import { SiteFooter } from "@/modules/footer";

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
};

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
