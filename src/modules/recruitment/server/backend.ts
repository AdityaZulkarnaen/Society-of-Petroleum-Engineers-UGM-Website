import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import type { Catalog } from "./configuration";
import { assertOpen } from "./configuration";
import type { Payload } from "./payload";
import { SubmissionError } from "./security";

export const STAGING_SUPABASE_PROJECT_REF = "lavxddhrrwsjcshmnwvu";

export type BackendSettings = {
  origin: string;
  secret: string;
  key: string;
  period: string;
  url: string;
  projectRef: string;
};

export function settings(): BackendSettings {
  // 1. Activation Check: disabled by default
  const enabled =
    process.env.RECRUITMENT_ENABLED === "true" ||
    process.env.RECRUITMENT_STAGING_ENABLED === "true";
  if (!enabled) {
    throw new SubmissionError(503, "Pendaftaran belum tersedia. Silakan hubungi panitia.");
  }

  // 2. Vercel Preview Deployment Safety Guard
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview") {
    if (process.env.RECRUITMENT_PREVIEW_SUBMISSIONS_ENABLED !== "true") {
      throw new SubmissionError(
        503,
        "Pendaftaran tidak menerima pengiriman di lingkungan preview deployment.",
      );
    }
  }

  // 3. Topology & Multi-Instance Rate Limiting Policy
  const isSingleInstance = process.env.RECRUITMENT_SINGLE_INSTANCE === "true";
  const distributedLimiter = process.env.RECRUITMENT_DISTRIBUTED_LIMITER;

  if (isVercel) {
    // Vercel serverless functions are ephemeral and distributed across multiple instances.
    // RECRUITMENT_SINGLE_INSTANCE=true must not be used as a workaround on Vercel.
    if (!distributedLimiter) {
      throw new SubmissionError(
        503,
        "Vercel multi-instance hosting requires a configured distributed rate limiter provider. RECRUITMENT_SINGLE_INSTANCE is prohibited on Vercel.",
      );
    }
    if (distributedLimiter !== "upstash" && distributedLimiter !== "redis") {
      throw new SubmissionError(
        503,
        `Distributed rate limiter provider '${distributedLimiter}' tidak didukung. Gunakan 'upstash'.`,
      );
    }
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!redisUrl || !redisToken) {
      throw new SubmissionError(
        503,
        "Konfigurasi distributed rate limiter belum lengkap. UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN diperlukan.",
      );
    }
    try {
      const parsed = new URL(redisUrl);
      if (parsed.protocol !== "https:") {
        throw new Error();
      }
    } catch {
      throw new SubmissionError(503, "UPSTASH_REDIS_REST_URL harus berupa URL HTTPS yang valid.");
    }
  } else {
    // Non-Vercel environment (standalone single-process server, local staging launcher)
    if (!isSingleInstance && !distributedLimiter) {
      throw new SubmissionError(
        503,
        "Pendaftaran memerlukan konfigurasi topologi: RECRUITMENT_SINGLE_INSTANCE=true untuk standalone atau distributed rate limiter.",
      );
    }
    if (distributedLimiter) {
      if (distributedLimiter !== "upstash" && distributedLimiter !== "redis") {
        throw new SubmissionError(
          503,
          `Distributed rate limiter provider '${distributedLimiter}' tidak didukung. Gunakan 'upstash'.`,
        );
      }
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!redisUrl || !redisToken) {
        throw new SubmissionError(
          503,
          "Konfigurasi distributed rate limiter belum lengkap. UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN diperlukan.",
        );
      }
      try {
        const parsed = new URL(redisUrl);
        if (parsed.protocol !== "https:") {
          throw new Error();
        }
      } catch {
        throw new SubmissionError(503, "UPSTASH_REDIS_REST_URL harus berupa URL HTTPS yang valid.");
      }
    }
  }

  // 4. Origin & Session Secret Validation
  const autoPreviewOrigin =
    vercelEnv === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined;
  const origin =
    process.env.RECRUITMENT_ORIGIN === "auto" || (!process.env.RECRUITMENT_ORIGIN && autoPreviewOrigin)
      ? autoPreviewOrigin
      : process.env.RECRUITMENT_ORIGIN;
  const secret = process.env.RECRUITMENT_SESSION_SECRET;
  const period = process.env.RECRUITMENT_PERIOD_ID;

  if (!origin || !secret || secret.length < 32 || !period || !/^[0-9a-f-]{36}$/i.test(period)) {
    throw new SubmissionError(503, "Konfigurasi pendaftaran belum lengkap.");
  }

  const parsedOrigin = new URL(origin);
  if (
    parsedOrigin.origin !== origin ||
    (parsedOrigin.protocol !== "https:" &&
      !(
        parsedOrigin.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(parsedOrigin.hostname)
      ))
  ) {
    throw new SubmissionError(503, "Konfigurasi origin pendaftaran belum sesuai.");
  }

  // Prevent preview deployments from using production origin
  if (
    vercelEnv === "preview" &&
    (origin === "https://www.speugmsc.org" || origin === "https://speugmsc.org")
  ) {
    throw new SubmissionError(503, "Preview deployment dilarang menggunakan origin produksi.");
  }

  // 5. Supabase URL and Project Reference Resolution
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  // If not explicitly provided, allow staging default ONLY when RECRUITMENT_STAGING_ENABLED === "true"
  const url =
    rawUrl ||
    (process.env.RECRUITMENT_STAGING_ENABLED === "true"
      ? `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`
      : undefined);
  if (!url) {
    throw new SubmissionError(503, "Konfigurasi URL database belum tersedia.");
  }

  const parsedUrl = new URL(url);
  if (
    parsedUrl.protocol !== "https:" &&
    !(
      parsedUrl.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(parsedUrl.hostname)
    )
  ) {
    throw new SubmissionError(503, "URL database harus menggunakan protokol HTTPS.");
  }

  let projectRef: string | null = null;
  const hostMatch = parsedUrl.hostname.match(/^([a-z0-9_-]+)\.supabase\.(co|in|net)$/i);
  if (hostMatch) {
    projectRef = hostMatch[1];
  } else if (["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) {
    projectRef = process.env.SUPABASE_PROJECT_REF || STAGING_SUPABASE_PROJECT_REF;
  } else if (process.env.SUPABASE_PROJECT_REF) {
    projectRef = process.env.SUPABASE_PROJECT_REF;
  }

  // 6. Secret Key Resolution & Claim Verification
  const key = process.env.SUPABASE_SECRET_KEY || process.env.RECRUITMENT_STAGING_SECRET_KEY;
  if (!key) {
    throw new SubmissionError(503, "Kredensial database belum tersedia.");
  }

  // Verify JWT claims if legacy JWT format
  if (!key.startsWith("sb_secret_")) {
    try {
      const parts = key.split(".");
      if (parts.length !== 3) throw new Error("Invalid JWT format");
      const claim = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      if (claim.role !== "service_role") {
        throw new Error("Invalid role claim");
      }
      if (projectRef && claim.ref !== projectRef) {
        throw new Error("Project ref mismatch");
      }
    } catch {
      throw new SubmissionError(
        503,
        "Kredensial database tidak sesuai dengan proyek yang dikonfigurasi.",
      );
    }
  }

  // Verify public key project reference match if provided
  const pubKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (pubKey && !pubKey.startsWith("sb_publishable_")) {
    try {
      const parts = pubKey.split(".");
      if (parts.length === 3) {
        const claim = JSON.parse(Buffer.from(parts[1], "base64url").toString());
        if (projectRef && claim.ref && claim.ref !== projectRef) {
          throw new Error("Public key project ref mismatch");
        }
      }
    } catch {
      throw new SubmissionError(
        503,
        "Kredensial publik database tidak sesuai dengan proyek yang dikonfigurasi.",
      );
    }
  }

  // 7. Vercel Staging Project Identification Guard
  // Distinguishes the dedicated staging Vercel project from the real production project.
  const isStagingDeployment =
    projectRef === STAGING_SUPABASE_PROJECT_REF ||
    process.env.RECRUITMENT_STAGING_ENABLED === "true" ||
    Boolean(process.env.VERCEL_STAGING_PROJECT_ID || process.env.RECRUITMENT_STAGING_PROJECT_ID);

  if (isVercel && isStagingDeployment) {
    // A. Must target the authorized staging Supabase project reference
    if (projectRef !== STAGING_SUPABASE_PROJECT_REF) {
      throw new SubmissionError(
        503,
        "Staging deployment dilarang menggunakan database non-staging.",
      );
    }

    // B. Project identity verification using Vercel system-provided VERCEL_PROJECT_ID
    const expectedProjectId =
      process.env.VERCEL_STAGING_PROJECT_ID || process.env.RECRUITMENT_STAGING_PROJECT_ID;
    if (!expectedProjectId || expectedProjectId.trim().length === 0) {
      throw new SubmissionError(
        503,
        "Vercel staging requires VERCEL_STAGING_PROJECT_ID to verify deployment project identity.",
      );
    }

    const actualProjectId = process.env.VERCEL_PROJECT_ID;
    if (!actualProjectId || actualProjectId.trim().length === 0) {
      throw new SubmissionError(
        503,
        "Vercel system project identity (VERCEL_PROJECT_ID) is missing. Enable System Environment Variables in Vercel project settings.",
      );
    }

    if (actualProjectId !== expectedProjectId) {
      throw new SubmissionError(
        503,
        "Vercel project identity mismatch: this Vercel project is not authorized for staging deployment.",
      );
    }

    // C. Origin protection: staging deployment must never use production origin
    if (origin === "https://www.speugmsc.org" || origin === "https://speugmsc.org") {
      throw new SubmissionError(
        503,
        "Staging deployment dilarang menggunakan origin produksi.",
      );
    }
  }

  return { origin, secret, key, period, url, projectRef: projectRef || "" };
}

export function client(key: string, customUrl?: string) {
  let targetUrl = customUrl;
  if (!targetUrl) {
    try {
      targetUrl = settings().url;
    } catch {
      targetUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        `https://${STAGING_SUPABASE_PROJECT_REF}.supabase.co`;
    }
  }
  const origin = new URL(targetUrl).origin;
  return createClient(origin, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => {
        const dest = new URL(
          typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
        ).origin;
        if (dest !== origin) throw new Error("Unexpected destination");
        return fetch(input, { ...init, redirect: "error", signal: AbortSignal.timeout(20000) });
      },
    },
  });
}

export async function loadCatalog(db: SupabaseClient, period: string): Promise<Catalog> {
  const [p, o, r] = await Promise.all([
    db
      .from("recruitment_periods")
      .select("id,label,config_version,approved_at,is_open,opens_at,closes_at,batches")
      .eq("id", period)
      .not("approved_at", "is", null)
      .single(),
    db
      .from("recruitment_options")
      .select(
        "main_code,sub_code,main_label,sub_label,assignment_state,instructions,formats,max_bytes",
      )
      .eq("period_id", period)
      .order("main_code")
      .order("sub_code"),
    db
      .from("recruitment_document_requirements")
      .select("slot,required,formats,max_bytes")
      .eq("period_id", period)
      .order("slot"),
  ]);
  if (p.error || o.error || r.error || !p.data) {
    throw new SubmissionError(503, "Periode pendaftaran resmi belum tersedia.");
  }
  return { period: p.data, options: o.data, requirements: r.data } as Catalog;
}

function check(error: unknown) {
  if (error) {
    throw new SubmissionError(
      503,
      "Pengiriman belum terkonfirmasi. Coba kembali dengan data dan file yang sama.",
    );
  }
}

function documentId(key: string, slot: string) {
  const h = createHash("sha256").update(`recruitment:${key}:${slot}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export async function submit(db: SupabaseClient, catalog: Catalog, key: string, payload: Payload) {
  const v = payload.values;
  async function existing() {
    const result = await db
      .from("recruitment_applications")
      .select("id,period_id,request_hash,status")
      .eq("idempotency_key", key)
      .maybeSingle();
    check(result.error);
    return result.data;
  }
  let app = await existing();
  if (app && (app.period_id !== catalog.period.id || app.request_hash !== payload.hash)) {
    throw new SubmissionError(
      409,
      "Pengiriman sebelumnya menggunakan data berbeda. Hubungi panitia untuk koreksi.",
    );
  }
  // Completed retries return only a receipt to the verified session owner,
  // including after closure. Never expose another NIM's application or email.
  if (app && app.status !== "uploading") return { applicationId: app.id };
  assertOpen(catalog);
  if (!app) {
    const inserted = await db
      .from("recruitment_applications")
      .insert({
        period_id: catalog.period.id,
        idempotency_key: key,
        request_hash: payload.hash,
        full_name: v.fullName,
        nim: v.nim,
        birth_place: v.birthPlace,
        birth_date: v.birthDate,
        email: v.ugmEmail,
        phone: v.phoneNumber,
        major: v.major,
        batch: v.batch,
      })
      .select("id,period_id,request_hash,status")
      .single();
    if (inserted.error?.code === "23505") {
      app = await existing();
      if (!app || app.request_hash !== payload.hash || app.period_id !== catalog.period.id) {
        throw new SubmissionError(
          409,
          "Pendaftaran tidak dapat dibuat. Jika pernah mendaftar dengan NIM ini, hubungi panitia.",
        );
      }
      if (app.status !== "uploading") return { applicationId: app.id };
    } else {
      check(inserted.error);
      app = inserted.data;
    }
  }
  if (!app) throw new SubmissionError(503, "Pengiriman belum terkonfirmasi.");
  for (const rank of [1, 2] as const) {
    const result = await db.from("recruitment_preferences").upsert(
      {
        application_id: app.id,
        period_id: catalog.period.id,
        rank,
        main_code: v[`division${rank}`],
        sub_code: v[`subDivision${rank}`],
        motivation: v[`motivation${rank}`],
      },
      { onConflict: "application_id,rank", ignoreDuplicates: true },
    );
    check(result.error);
  }
  for (const d of payload.documents) {
    const id = documentId(key, d.slot);
    const path = `${catalog.period.id}/${app.id}/${id}.${d.format}`;
    const prior = await db
      .from("recruitment_documents")
      .select("sha256,object_name,byte_size")
      .eq("application_id", app.id)
      .eq("slot", d.slot)
      .maybeSingle();
    check(prior.error);
    if (prior.data) {
      if (
        prior.data.sha256 !== d.sha256 ||
        prior.data.object_name !== path ||
        prior.data.byte_size !== d.bytes.length
      ) {
        throw new SubmissionError(409, "Dokumen tidak cocok dengan pengiriman sebelumnya.");
      }
      continue;
    }
    const upload = await db.storage
      .from("recruitment-documents")
      .upload(path, d.bytes, { contentType: d.mime, upsert: false, cacheControl: "0" });
    if (upload.error) {
      // A previous attempt may have stored bytes before metadata was committed.
      // Only exact server-owned bytes are reusable. Never overwrite objects.
      if (String(upload.error.statusCode) !== "409" && String(upload.error.statusCode) !== "400") {
        check(upload.error);
      }
      const stored = await db.storage.from("recruitment-documents").download(path);
      check(stored.error);
      if (
        !stored.data ||
        stored.data.size !== d.bytes.length ||
        createHash("sha256")
          .update(Buffer.from(await stored.data.arrayBuffer()))
          .digest("hex") !== d.sha256
      ) {
        throw new SubmissionError(409, "Dokumen tidak cocok dengan pengiriman sebelumnya.");
      }
    }
    const metadata = await db.from("recruitment_documents").upsert(
      {
        id,
        application_id: app.id,
        period_id: catalog.period.id,
        slot: d.slot,
        object_name: path,
        format: d.format,
        byte_size: d.bytes.length,
        sha256: d.sha256,
        verified_at: new Date().toISOString(),
      },
      { onConflict: "application_id,slot", ignoreDuplicates: true },
    );
    check(metadata.error);
  }
  const final = await db.rpc("recruitment_finalize", {
    p_application: app.id,
    p_key: key,
    p_hash: payload.hash,
  });
  if (final.error) {
    if (final.error.message.includes("recruitment_not_open")) {
      throw new SubmissionError(409, "Batas waktu pendaftaran telah berakhir. Hubungi panitia.");
    }
    check(final.error);
  }
  return { applicationId: final.data as string };
}
