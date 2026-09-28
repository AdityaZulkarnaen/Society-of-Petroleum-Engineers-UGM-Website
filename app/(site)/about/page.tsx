import type { Metadata } from "next";

import { site } from "@/lib/site";
import { AboutPage } from "@/modules/about";

const description =
  "Get to know the SPE UGM Student Chapter: the students behind it and what drives the chapter.";

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    title: `About — ${site.name}`,
    description,
    url: "/about",
  },
  twitter: {
    card: "summary_large_image",
    title: `About — ${site.name}`,
    description,
  },
};

export default function Page() {
  return <AboutPage />;
}
