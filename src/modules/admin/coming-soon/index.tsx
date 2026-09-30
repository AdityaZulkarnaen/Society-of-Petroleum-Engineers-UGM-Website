import Link from "next/link";

import { Card } from "../components/ui";

export function ComingSoonPage({
  title,
  backHref = "/admin",
  backLabel = "Back to Overview",
  surface,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  /** Card glass; the super admin pages use compactCardSurface. */
  surface?: string;
}) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-[-0.02em]">{title}</h1>
      <Card surface={surface} className="mt-8 px-6 py-14 text-center">
        <p className="text-base font-semibold">This page is under construction</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[#8a8ea3]">
          The {title} feature will be available in an upcoming update.
        </p>
        <Link
          href={backHref}
          className="mt-6 inline-flex h-10 items-center rounded-lg border border-white/10 px-4 text-sm text-[#c7c9d4] transition-colors hover:border-white/20 hover:text-white"
        >
          {backLabel}
        </Link>
      </Card>
    </div>
  );
}
