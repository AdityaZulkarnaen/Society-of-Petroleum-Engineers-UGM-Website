import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/modules/footer";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
