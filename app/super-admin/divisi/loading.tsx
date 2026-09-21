import {
  SkeletonCard,
  SkeletonHeading,
  SkeletonPage,
} from "@/modules/admin/components/skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHeading />
      <div className="space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    </SkeletonPage>
  );
}
