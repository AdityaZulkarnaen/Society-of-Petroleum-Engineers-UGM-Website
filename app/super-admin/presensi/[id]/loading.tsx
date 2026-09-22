import {
  Skeleton,
  SkeletonCard,
  SkeletonHeading,
  SkeletonPage,
  SkeletonStats,
  SkeletonTable,
} from "@/modules/admin/components/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-4 w-28" />
      <SkeletonHeading />
      <SkeletonStats />
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <SkeletonCard lines={6} />
        <SkeletonTable rows={8} />
      </div>
    </SkeletonPage>
  );
}
