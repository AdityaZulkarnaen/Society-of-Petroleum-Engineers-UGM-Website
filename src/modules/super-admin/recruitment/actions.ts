"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import type { ScreeningStatus } from "./types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES: readonly ScreeningStatus[] = ["under_review", "accepted", "rejected"];

export type ReviewActionResult =
  | { success: true; error?: never }
  | { success: false; error: string };

export async function updateScreeningStatus(
  applicationId: string,
  targetStatus: ScreeningStatus,
  note?: string,
): Promise<ReviewActionResult> {
  await requireSuperAdmin();

  if (!applicationId || !UUID_REGEX.test(applicationId)) {
    return { success: false, error: "Invalid application identifier." };
  }

  if (!ALLOWED_STATUSES.includes(targetStatus)) {
    return {
      success: false,
      error: "Status must be 'under_review', 'accepted', or 'rejected'.",
    };
  }

  const trimmedNote = note ? note.trim() : null;
  if (trimmedNote && trimmedNote.length > 3000) {
    return {
      success: false,
      error: "Review note cannot exceed 3,000 characters.",
    };
  }

  if (DUMMY_DATA) {
    return { success: true };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("recruitment_review", {
    p_application: applicationId,
    p_status: targetStatus,
    p_note: trimmedNote,
  });

  if (error) {
    let message = error.message;
    if (message.includes("not_allowed")) {
      message = "You are not authorized to perform recruitment screening on this application.";
    } else if (message.includes("review_transition_invalid")) {
      message =
        "Invalid status transition. Applications must be marked as 'under_review' before they can be accepted or rejected.";
    } else if (message.includes("review_status_invalid")) {
      message = "The selected review status is invalid.";
    }
    return { success: false, error: message };
  }

  revalidatePath("/super-admin/recruitment");
  revalidatePath(`/super-admin/recruitment/${applicationId}`);

  return { success: true };
}

