/* Shared by the proker dialogs (client) and their Server Functions. */

import {
  PROKER_STATUSES,
  type ProkerStatus,
} from "@/modules/admin/acara/status";

export type ProkerMember = { profileId: string; name: string; role: string };

/** A proker as the super admin's list shows it. */
export type ManagedProker = {
  id: string;
  name: string;
  description: string | null;
  divisionId: string;
  division: string;
  /** YYYY-MM-DD */
  startsOn: string | null;
  endsOn: string | null;
  status: ProkerStatus;
  /** In display order. */
  members: ProkerMember[];
};

/** Someone who can be added to a proker. */
export type PengurusOption = { id: string; fullName: string; division: string | null };

export type Division = { id: string; name: string };

/** What the Tambah / Edit form sends. */
export type ProkerInput = {
  name: string;
  description: string;
  startsOn: string;
  endsOn: string;
  status: string;
  members: { profileId: string; role: string }[];
};

/** Keyed 'name', 'endsOn', 'members.2.role', ... */
export type ProkerErrors = Record<string, string>;

export type ActionResult = { error?: string; errors?: ProkerErrors };

export const DESCRIPTION_MAX = 1000;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateProker(input: ProkerInput) {
  const errors: ProkerErrors = {};
  const name = input.name.trim();
  const description = input.description.trim();
  const startsOn = input.startsOn.trim();
  const endsOn = input.endsOn.trim();

  if (name.length < 2 || name.length > 120) {
    errors.name = "Enter work program name (2–120 characters).";
  }
  if (description.length > DESCRIPTION_MAX) {
    errors.description = `Maximum ${DESCRIPTION_MAX} characters.`;
  }
  if (startsOn && !DATE.test(startsOn)) errors.startsOn = "Invalid date.";
  if (endsOn && !DATE.test(endsOn)) errors.endsOn = "Invalid date.";
  if (startsOn && endsOn && endsOn < startsOn) {
    errors.endsOn = "End date must be after start date.";
  }
  if (!PROKER_STATUSES.includes(input.status as ProkerStatus)) {
    errors.status = "Select a status.";
  }

  const seen = new Set<string>();
  const members = input.members.map(({ profileId, role }, i) => {
    if (!profileId) errors[`members.${i}.profileId`] = "Select an officer.";
    else if (seen.has(profileId)) {
      errors[`members.${i}.profileId`] = "Officer has already been added.";
    }
    seen.add(profileId);
    const r = role.trim();
    if (!r) errors[`members.${i}.role`] = "Enter a role.";
    else if (r.length > 60) errors[`members.${i}.role`] = "Maximum 60 characters.";
    return { profileId, role: r };
  });

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: {
      name,
      description: description || null,
      startsOn: startsOn || null,
      endsOn: endsOn || null,
      status: input.status as ProkerStatus,
      members,
    },
  };
}
