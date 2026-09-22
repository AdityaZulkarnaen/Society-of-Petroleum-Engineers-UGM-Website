import { requireSuperAdmin } from "@/modules/admin/auth/session";

import { getMeetings } from "./data";
import { MeetingManager } from "./meeting-manager";

export async function MeetingsPage() {
  const admin = await requireSuperAdmin();
  const meetings = await getMeetings();

  return (
    <MeetingManager
      meetings={meetings}
      myDivision={
        admin.division
          ? { id: admin.division.id, name: admin.division.name }
          : null
      }
    />
  );
}
