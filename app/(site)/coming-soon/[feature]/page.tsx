import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/modules/coming-soon";

const FEATURES = {
  event: { title: "Events", description: "Our event directory is being prepared. Explore the chapter from Home while we put the details together." },
  apecx: { title: "APECX", description: "Details for the Annual Petroleum Competition and Exhibition will be shared here once confirmed." },
  contact: { title: "Contact", description: "Our contact page is being prepared. You can reach Andra, Ana, or the chapter by using the contact links in the footer." },
  cabinet: { title: "Cabinet", description: "Meet the people behind the chapter. Our cabinet directory is being prepared." },
  mentorship: { title: "Mentorship", description: "Our mentorship program details will be shared here once they are ready." },
  workshops: { title: "Workshops", description: "Workshop topics and participation details will be shared here once confirmed." },
  research: { title: "Research", description: "Explore our research opportunities here when program details are ready." },
  "company-visits": { title: "Company Visits", description: "Visit details and participation information will be shared here once confirmed." },
  "apecx-registration": { title: "APECX Registration", description: "Registration details for APECX will be shared here once confirmed." },
} as const;

type Props = { params: Promise<{ feature: string }> };
export function generateStaticParams() {
  return Object.keys(FEATURES).map((feature) => ({ feature }));
}
function getFeature(feature: string) {
  if (!Object.hasOwn(FEATURES, feature)) notFound();
  return FEATURES[feature as keyof typeof FEATURES];
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { title } = getFeature((await params).feature);
  return { title: `${title} | Coming Soon`, robots: { index: false, follow: true } };
}
export default async function Page({ params }: Props) {
  return <ComingSoon {...getFeature((await params).feature)} />;
}
