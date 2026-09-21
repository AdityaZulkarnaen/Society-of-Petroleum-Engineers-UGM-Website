import {
  SkeletonCard,
  SkeletonHeading,
  SkeletonPage,
} from "@/modules/admin/components/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHeading />
      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard lines={6} />
        <SkeletonCard lines={6} />
      </div>
    </SkeletonPage>
  );
}
