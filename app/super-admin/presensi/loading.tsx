import {
  SkeletonHeading,
  SkeletonPage,
  SkeletonStats,
  SkeletonTable,
} from "@/modules/admin/components/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHeading />
      <SkeletonStats />
      <SkeletonTable />
    </SkeletonPage>
  );
}
