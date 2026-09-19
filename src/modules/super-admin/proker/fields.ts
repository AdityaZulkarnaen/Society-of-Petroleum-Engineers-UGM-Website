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
    errors.name = "Isi nama proker (2–120 karakter).";
  }
  if (description.length > DESCRIPTION_MAX) {
    errors.description = `Maksimal ${DESCRIPTION_MAX} karakter.`;
  }
  if (startsOn && !DATE.test(startsOn)) errors.startsOn = "Tanggal tidak valid.";
  if (endsOn && !DATE.test(endsOn)) errors.endsOn = "Tanggal tidak valid.";
  if (startsOn && endsOn && endsOn < startsOn) {
    errors.endsOn = "Tanggal selesai harus setelah tanggal mulai.";
  }
  if (!PROKER_STATUSES.includes(input.status as ProkerStatus)) {
    errors.status = "Pilih status.";
  }

  const seen = new Set<string>();
  const members = input.members.map(({ profileId, role }, i) => {
    if (!profileId) errors[`members.${i}.profileId`] = "Pilih pengurus.";
    else if (seen.has(profileId)) {
      errors[`members.${i}.profileId`] = "Pengurus sudah ditambahkan.";
    }
    seen.add(profileId);
    const r = role.trim();
    if (!r) errors[`members.${i}.role`] = "Isi peran.";
    else if (r.length > 60) errors[`members.${i}.role`] = "Maksimal 60 karakter.";
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
