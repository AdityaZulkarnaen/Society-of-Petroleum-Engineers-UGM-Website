"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/modules/admin/auth/session";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { dummyVote, dummyVoting } from "@/modules/admin/dummy/data";
import type { Candidate } from "@/modules/admin/voting/data";

import {
  PHOTO_MAX_BYTES,
  PHOTO_TYPES,
  validateCandidate,
  validateElection,
  type ActionResult,
  type CandidateInput,
  type ElectionInput,
} from "./fields";
import { PHOTO_BUCKET, photoPath, removePhotos } from "./photos";

/* Raised by the election functions in the database. */
const MESSAGES: Record<string, string> = {
  not_allowed: "Hanya super admin yang bisa mengatur pemilihan.",
  not_found: "Data tidak ditemukan. Muat ulang halaman ini.",
  voting_started:
    "Voting sudah dibuka, jadi kandidat tidak bisa ditambah atau dihapus lagi.",
};

const failed = (message: string, fallback: string) => ({
  error: MESSAGES[message] ?? fallback,
});

function revalidate() {
  revalidatePath("/super-admin/voting");
  revalidatePath("/super-admin");
  revalidatePath("/admin/voting");
}

const jakartaToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

/** Creates (id null) or updates the election. */
export async function saveElection(
  id: string | null,
  input: ElectionInput,
): Promise<ActionResult> {
  await requireSuperAdmin();
  const { ok, errors, values } = validateElection(input);
  if (!ok) return { errors, error: "Periksa kembali isian yang ditandai." };

  if (DUMMY_DATA) {
    const state = dummyVoting.get();
    dummyVoting.save({
      ...state,
      election: {
        id: state.election?.id ?? crypto.randomUUID(),
        turnout: state.election?.turnout ?? { votes: 0, eligible: 68 },
        isOpen: state.election?.isOpen ?? true,
        ...values,
      },
    });
    revalidate();
    return {};
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_election", {
    p_id: id,
    p_title: values.title,
    p_term_label: values.termLabel,
    p_opens_on: values.opensOn,
    p_closes_on: values.closesOn,
  });
  if (error) {
    console.error("saveElection", error.message);
    return failed(error.message, "Pemilihan gagal disimpan. Coba lagi.");
  }
  revalidate();
  return {};
}

/** The Status Voting switch. */
export async function setVotingOpen(id: string, open: boolean): Promise<ActionResult> {
  await requireSuperAdmin();

  if (DUMMY_DATA) {
    const state = dummyVoting.get();
    if (!state.election || state.election.id !== id) return { error: MESSAGES.not_found };
    dummyVoting.save({ ...state, election: { ...state.election, isOpen: open } });
    revalidate();
    return {};
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_election_open", { p_id: id, p_open: open });
  if (error) {
    console.error("setVotingOpen", error.message);
    return failed(error.message, "Status voting gagal diubah. Coba lagi.");
  }
  revalidate();
  return {};
}

/** Deletes the election with its candidates and every vote cast in it. */
export async function deleteElection(id: string): Promise<ActionResult> {
  await requireSuperAdmin();

  if (DUMMY_DATA) {
    dummyVoting.save({ election: null, candidates: [] });
    dummyVote.clear();
    revalidate();
    return {};
  }

  const supabase = await createClient();
  const { data: candidates } = await supabase
    .from("election_candidates")
    .select("photo_url")
    .eq("election_id", id);
  const { error } = await supabase.rpc("delete_election", { p_id: id });
  if (error) {
    console.error("deleteElection", error.message);
    return failed(error.message, "Pemilihan gagal dihapus. Coba lagi.");
  }
  await removePhotos(
    supabase,
    (candidates ?? []).map((c) => c.photo_url),
  );
  revalidate();
  return {};
}

/** Stores a candidate photo (already resized by the browser); returns its public URL. */
export async function uploadCandidatePhoto(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  await requireSuperAdmin();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih foto terlebih dahulu." };
  if (!PHOTO_TYPES.includes(file.type)) {
    return { error: "Format foto harus JPG, PNG, atau WebP." };
  }
  if (file.size > PHOTO_MAX_BYTES) return { error: "Ukuran foto terlalu besar." };

  /* the preview has no storage, so the photo lives in memory as a data URL */
  if (DUMMY_DATA) {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    return { url: `data:${file.type};base64,${base64}` };
  }

  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `candidates/${crypto.randomUUID()}.${extension}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) {
    console.error("uploadCandidatePhoto", error.message);
    return { error: "Foto gagal diupload. Coba lagi." };
  }
  return { url: supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl };
}

/** Removes photos uploaded in a dialog that were never saved to a candidate. */
export async function discardCandidatePhotos(urls: string[]) {
  await requireSuperAdmin();
  if (DUMMY_DATA || urls.length === 0) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("election_candidates")
    .select("photo_url")
    .in("photo_url", urls);
  const inUse = new Set((data ?? []).map((row) => row.photo_url));
  await removePhotos(
    supabase,
    urls.filter((url) => !inUse.has(url)),
  );
}

/** Creates (id null) or updates a candidate of the election. */
export async function saveCandidate(
  electionId: string,
  id: string | null,
  input: CandidateInput,
): Promise<ActionResult> {
  await requireSuperAdmin();
  const { ok, errors, values } = validateCandidate(input);
  if (!ok) return { errors, error: "Periksa kembali isian yang ditandai." };

  if (DUMMY_DATA) {
    const state = dummyVoting.get();
    if (!id && state.election && jakartaToday() >= state.election.opensOn) {
      return { error: MESSAGES.voting_started };
    }
    const existing = state.candidates.find((c) => c.id === id);
    const candidate: Candidate = {
      id: id ?? crypto.randomUUID(),
      number:
        existing?.number ??
        Math.max(0, ...state.candidates.map((c) => c.number)) + 1,
      ...values,
    };
    dummyVoting.save({
      ...state,
      candidates: id
        ? state.candidates.map((c) => (c.id === id ? candidate : c))
        : [...state.candidates, candidate],
    });
    revalidate();
    return {};
  }

  const supabase = await createClient();
  const { data: previous } = id
    ? await supabase.from("election_candidates").select("photo_url").eq("id", id).maybeSingle()
    : { data: null };
  /* only our own uploads, or the photo the candidate already had */
  if (
    values.photoUrl &&
    values.photoUrl !== previous?.photo_url &&
    !photoPath(values.photoUrl)
  ) {
    return { errors: { photoUrl: "Upload ulang fotonya." }, error: "Foto tidak valid." };
  }

  const { error } = await supabase.rpc("save_candidate", {
    p_id: id,
    p_election_id: electionId,
    p_full_name: values.fullName,
    p_nim: values.nim,
    p_position: values.position,
    p_photo_url: values.photoUrl,
    p_vision: values.vision,
    p_programs: values.programs,
    p_achievements: values.achievements,
    p_grand_design_url: values.grandDesignUrl,
  });
  if (error) {
    console.error("saveCandidate", error.message);
    return failed(error.message, "Kandidat gagal disimpan. Coba lagi.");
  }
  if (previous?.photo_url && previous.photo_url !== values.photoUrl) {
    await removePhotos(supabase, [previous.photo_url]);
  }
  revalidate();
  return {};
}

/** Removes a candidate before voting opens; later numbers move up. */
export async function deleteCandidate(id: string): Promise<ActionResult> {
  await requireSuperAdmin();

  if (DUMMY_DATA) {
    const state = dummyVoting.get();
    if (state.election && jakartaToday() >= state.election.opensOn) {
      return { error: MESSAGES.voting_started };
    }
    const removed = state.candidates.find((c) => c.id === id);
    if (!removed) return { error: MESSAGES.not_found };
    dummyVoting.save({
      ...state,
      candidates: state.candidates
        .filter((c) => c.id !== id)
        .map((c) => (c.number > removed.number ? { ...c, number: c.number - 1 } : c)),
    });
    revalidate();
    return {};
  }

  const supabase = await createClient();
  const { data: candidate } = await supabase
    .from("election_candidates")
    .select("photo_url")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.rpc("delete_candidate", { p_id: id });
  if (error) {
    console.error("deleteCandidate", error.message);
    return failed(error.message, "Kandidat gagal dihapus. Coba lagi.");
  }
  await removePhotos(supabase, [candidate?.photo_url]);
  revalidate();
  return {};
}
