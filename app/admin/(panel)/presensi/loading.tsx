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
      <SkeletonCard lines={2} />
      <SkeletonStats />
      <SkeletonCard lines={5} />
    </SkeletonPage>
  );
}
