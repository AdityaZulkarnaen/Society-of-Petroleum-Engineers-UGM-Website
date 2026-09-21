import {
  SkeletonHeading,
  SkeletonPage,
  SkeletonTable,
} from "@/modules/admin/components/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHeading />
      <SkeletonTable />
    </SkeletonPage>
  );
}
