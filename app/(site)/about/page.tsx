import type { Metadata } from "next";

import { AboutPage } from "@/modules/about";

export const metadata: Metadata = {
  title: "About — SPE UGM Student Chapter",
  description:
    "Get to know the SPE UGM Student Chapter: the students behind it and what drives the chapter.",
};

export default function Page() {
  return <AboutPage />;
}
