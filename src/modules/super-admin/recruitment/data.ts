import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { DUMMY_DATA } from "@/modules/admin/dummy";

import {
  type ApplicantDetail,
  type ApplicantSummary,
  type DocumentInfo,
  type PreferenceInfo,
  type RecruitmentPeriodInfo,
  type ScreeningStatus,
  SLOT_LABELS,
} from "./types";

const DUMMY_PERIOD: RecruitmentPeriodInfo = {
  id: "87e7c760-1fb2-4e61-a803-b82a41b7847c",
  code: "oprec-2026-synthetic",
  label: "Synthetic Staging Period 2026/2027",
  isOpen: true,
  approvedAt: "2026-11-01T00:00:00Z",
  opensAt: "2026-11-01T00:00:00Z",
  closesAt: "2026-12-01T00:00:00Z",
  batches: ["2023", "2024"],
};

const DUMMY_APPLICANTS: ApplicantSummary[] = [
  {
    id: "82529724-1316-476b-a0b7-c5d5daee2525",
    periodId: "87e7c760-1fb2-4e61-a803-b82a41b7847c",
    fullName: "Synthetic Applicant B3",
    nim: "synthetic-b3-001",
    email: "applicant@example.test",
    phone: "+6281234567890",
    major: "Teknik Geologi",
    batch: "2024",
    status: "submitted",
    submittedAt: "2026-11-01T20:00:00Z",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    firstPreference: {
      mainCode: "opt-it",
      subCode: "opt-it-fe",
      mainLabel: "Information Technology",
      subLabel: "Frontend Engineering",
    },
    secondPreference: {
      mainCode: "opt-it",
      subCode: "opt-it-be",
      mainLabel: "Information Technology",
      subLabel: "Backend Engineering",
    },
  },
];

export const getRecruitmentPeriods = cache(async (): Promise<RecruitmentPeriodInfo[]> => {
  if (DUMMY_DATA) return [DUMMY_PERIOD];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recruitment_periods")
    .select("id, code, label, is_open, approved_at, opens_at, closes_at, batches")
    .order("opens_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((p) => ({
    id: p.id,
    code: p.code,
    label: p.label,
    isOpen: p.is_open,
    approvedAt: p.approved_at,
    opensAt: p.opens_at,
    closesAt: p.closes_at,
    batches: p.batches,
  }));
});

export const getScreeningApplicants = cache(
  async (periodId?: string): Promise<ApplicantSummary[]> => {
    if (DUMMY_DATA) return DUMMY_APPLICANTS;

    const supabase = await createClient();

    let query = supabase
      .from("recruitment_applications")
      .select(
        "id, period_id, full_name, nim, birth_place, birth_date, email, phone, major, batch, status, submitted_at, reviewed_by, reviewed_at, review_note, created_at, updated_at",
      )
      .neq("status", "uploading")
      .order("submitted_at", { ascending: false, nullsFirst: false });

    if (periodId) {
      query = query.eq("period_id", periodId);
    }

    const { data: apps, error } = await query;
    if (error || !apps || apps.length === 0) {
      return [];
    }

    const appIds = apps.map((a) => a.id);
    const targetPeriodId = periodId || apps[0].period_id;

    // Fetch preferences for these applications and catalogue options for labelling
    const [prefsRes, optsRes] = await Promise.all([
      supabase
        .from("recruitment_preferences")
        .select("application_id, rank, main_code, sub_code")
        .in("application_id", appIds),
      supabase
        .from("recruitment_options")
        .select("period_id, main_code, sub_code, main_label, sub_label")
        .eq("period_id", targetPeriodId),
    ]);

    const optsMap = new Map<string, { mainLabel: string; subLabel: string }>();
    (optsRes.data ?? []).forEach((opt) => {
      optsMap.set(`${opt.main_code}:${opt.sub_code}`, {
        mainLabel: opt.main_label,
        subLabel: opt.sub_label,
      });
    });

    const prefsMap = new Map<
      string,
      {
        first?: { mainCode: string; subCode: string; mainLabel: string; subLabel: string };
        second?: { mainCode: string; subCode: string; mainLabel: string; subLabel: string };
      }
    >();

    (prefsRes.data ?? []).forEach((p) => {
      const entry = prefsMap.get(p.application_id) || {};
      const opt = optsMap.get(`${p.main_code}:${p.sub_code}`);
      const prefInfo = {
        mainCode: p.main_code,
        subCode: p.sub_code,
        mainLabel: opt?.mainLabel ?? p.main_code,
        subLabel: opt?.subLabel ?? p.sub_code,
      };
      if (p.rank === 1) entry.first = prefInfo;
      if (p.rank === 2) entry.second = prefInfo;
      prefsMap.set(p.application_id, entry);
    });

    return apps.map((a) => {
      const p = prefsMap.get(a.id);
      return {
        id: a.id,
        periodId: a.period_id,
        fullName: a.full_name,
        nim: a.nim,
        email: a.email,
        phone: a.phone,
        major: a.major,
        batch: a.batch,
        status: a.status as ScreeningStatus,
        submittedAt: a.submitted_at,
        reviewedBy: a.reviewed_by,
        reviewedAt: a.reviewed_at,
        reviewNote: a.review_note,
        firstPreference: p?.first ?? null,
        secondPreference: p?.second ?? null,
      };
    });
  },
);

export const getApplicantDetail = cache(
  async (id: string): Promise<ApplicantDetail | null> => {
    if (DUMMY_DATA) {
      const dummy = DUMMY_APPLICANTS.find((a) => a.id === id);
      if (!dummy) return null;
      return {
        ...dummy,
        birthPlace: "Yogyakarta",
        birthDate: "2005-01-01",
        preferences: [
          {
            rank: 1,
            mainCode: "opt-it",
            subCode: "opt-it-fe",
            mainLabel: "Information Technology",
            subLabel: "Frontend Engineering",
            motivation: "Eager to build high-performance web interfaces for SPE UGM.",
          },
          {
            rank: 2,
            mainCode: "opt-it",
            subCode: "opt-it-be",
            mainLabel: "Information Technology",
            subLabel: "Backend Engineering",
            motivation: "Passionate about secure server architecture and API design.",
          },
        ],
        documents: [
          {
            id: "doc-cv-001",
            slot: "cv",
            slotLabel: SLOT_LABELS.cv,
            format: "pdf",
            byteSize: 102400,
            verifiedAt: "2026-11-01T20:00:00Z",
          },
          {
            id: "doc-id-002",
            slot: "idCard",
            slotLabel: SLOT_LABELS.idCard,
            format: "png",
            byteSize: 204800,
            verifiedAt: "2026-11-01T20:00:00Z",
          },
          {
            id: "doc-com-003",
            slot: "commitment",
            slotLabel: SLOT_LABELS.commitment,
            format: "pdf",
            byteSize: 102400,
            verifiedAt: "2026-11-01T20:00:00Z",
          },
          {
            id: "doc-fol-004",
            slot: "followProof",
            slotLabel: SLOT_LABELS.followProof,
            format: "png",
            byteSize: 300000,
            verifiedAt: "2026-11-01T20:00:00Z",
          },
          {
            id: "doc-sto-005",
            slot: "storyProof",
            slotLabel: SLOT_LABELS.storyProof,
            format: "png",
            byteSize: 320000,
            verifiedAt: "2026-11-01T20:00:00Z",
          },
        ],
        reviewerName: null,
      };
    }

    const supabase = await createClient();

    const { data: app, error } = await supabase
      .from("recruitment_applications")
      .select(
        "id, period_id, full_name, nim, birth_place, birth_date, email, phone, major, batch, status, submitted_at, reviewed_by, reviewed_at, review_note, created_at, updated_at",
      )
      .eq("id", id)
      .neq("status", "uploading")
      .maybeSingle();

    if (error || !app) {
      return null;
    }

    // Parallel fetch preferences, options, documents, and reviewer profile
    const [prefsRes, optsRes, docsRes, profileRes] = await Promise.all([
      supabase
        .from("recruitment_preferences")
        .select("rank, main_code, sub_code, motivation")
        .eq("application_id", id)
        .order("rank", { ascending: true }),
      supabase
        .from("recruitment_options")
        .select("main_code, sub_code, main_label, sub_label")
        .eq("period_id", app.period_id),
      supabase
        .from("recruitment_documents")
        .select("id, slot, format, byte_size, verified_at")
        .eq("application_id", id)
        .order("slot", { ascending: true }),
      app.reviewed_by
        ? supabase
            .from("profiles")
            .select("full_name, username")
            .eq("id", app.reviewed_by)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const optsMap = new Map<string, { mainLabel: string; subLabel: string }>();
    (optsRes.data ?? []).forEach((opt) => {
      optsMap.set(`${opt.main_code}:${opt.sub_code}`, {
        mainLabel: opt.main_label,
        subLabel: opt.sub_label,
      });
    });

    const preferences: PreferenceInfo[] = (prefsRes.data ?? []).map((p) => {
      const opt = optsMap.get(`${p.main_code}:${p.sub_code}`);
      return {
        rank: p.rank as 1 | 2,
        mainCode: p.main_code,
        subCode: p.sub_code,
        mainLabel: opt?.mainLabel ?? p.main_code,
        subLabel: opt?.subLabel ?? p.sub_code,
        motivation: p.motivation,
      };
    });

    const documents: DocumentInfo[] = (docsRes.data ?? []).map((d) => ({
      id: d.id,
      slot: d.slot,
      slotLabel: SLOT_LABELS[d.slot] ?? d.slot,
      format: d.format,
      byteSize: d.byte_size,
      verifiedAt: d.verified_at,
    }));

    const reviewerProfile = profileRes.data;
    const reviewerName = reviewerProfile?.full_name || reviewerProfile?.username || null;

    const firstPref = preferences.find((p) => p.rank === 1);
    const secondPref = preferences.find((p) => p.rank === 2);

    return {
      id: app.id,
      periodId: app.period_id,
      fullName: app.full_name,
      nim: app.nim,
      birthPlace: app.birth_place,
      birthDate: app.birth_date,
      email: app.email,
      phone: app.phone,
      major: app.major,
      batch: app.batch,
      status: app.status as ScreeningStatus,
      submittedAt: app.submitted_at,
      reviewedBy: app.reviewed_by,
      reviewedAt: app.reviewed_at,
      reviewNote: app.review_note,
      firstPreference: firstPref
        ? {
            mainCode: firstPref.mainCode,
            subCode: firstPref.subCode,
            mainLabel: firstPref.mainLabel,
            subLabel: firstPref.subLabel,
          }
        : null,
      secondPreference: secondPref
        ? {
            mainCode: secondPref.mainCode,
            subCode: secondPref.subCode,
            mainLabel: secondPref.mainLabel,
            subLabel: secondPref.subLabel,
          }
        : null,
      preferences,
      documents,
      reviewerName,
      reviewerUsername: reviewerProfile?.username ?? null,
    };
  },
);

