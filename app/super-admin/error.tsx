"use client";

import { ErrorState } from "@/modules/admin/components/error-state";

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} home="/super-admin" />;
}
