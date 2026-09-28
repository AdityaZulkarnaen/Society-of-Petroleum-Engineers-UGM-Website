import type { Metadata } from "next";

import { site, siteUrl } from "@/lib/site";
import { HomePage } from "@/modules/home";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  alternateName: [site.shortName, "SPE UGM"],
  url: siteUrl,
  logo: `${siteUrl}/footer/logo-spe.png`,
  description: site.description,
  email: site.email,
  sameAs: site.socials,
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "Universitas Gadjah Mada",
    url: "https://ugm.ac.id",
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organization).replace(/</g, "\\u003c"),
        }}
      />
      <HomePage />
    </>
  );
}
