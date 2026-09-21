import {
  SkeletonCard,
  SkeletonHeading,
  SkeletonPage,
  SkeletonStats,
} from "@/modules/admin/components/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHeading />
      <SkeletonStats />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    </SkeletonPage>
  );
}
