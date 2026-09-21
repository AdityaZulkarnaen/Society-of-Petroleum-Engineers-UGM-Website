import { cardSurface, compactCardSurface } from "./ui";

/* Placeholders shown while a dashboard page loads. They mirror the real
   layout's boxes so the page doesn't jump when the data lands. */

/** One shimmering block. Give it a height and width with `className`. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/[0.07] ${className}`}
      /* decorative: the live region on the page announces the loading state */
      aria-hidden="true"
    />
  );
}

/** A heading with its supporting line, as every page opens with. */
export function SkeletonHeading() {
  return (
    <div className="space-y-2.5">
      <Skeleton className="h-8 w-56 sm:h-9 sm:w-72" />
      <Skeleton className="h-4 w-40 sm:w-64" />
    </div>
  );
}

/** A row of stat cards. */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${cardSurface} p-5`}>
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-4 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

/** A card with a title and a few lines of content. */
export function SkeletonCard({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`${compactCardSurface} p-6 ${className}`}>
      <Skeleton className="h-5 w-40" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

/** The table shells of the super admin pages. */
export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className={`${compactCardSurface} overflow-hidden`}>
      <div className="border-b border-white/[0.06] px-5 py-4">
        <Skeleton className="h-3.5 w-full max-w-[560px]" />
      </div>
      <div className="divide-y divide-white/[0.04]">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-28 sm:block" />
            <Skeleton className="hidden h-4 w-20 md:block" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Wraps a page's placeholders. Screen readers hear one "memuat" rather than
 * the shapes, which carry no meaning on their own.
 */
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Memuat…</span>
      {children}
    </div>
  );
}
