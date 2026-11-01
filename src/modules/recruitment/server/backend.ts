import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import type { Catalog } from "./configuration";
import { assertOpen } from "./configuration";
import type { Payload } from "./payload";
import { SubmissionError } from "./security";

export function settings() {
  const origin = process.env.RECRUITMENT_ORIGIN;
  const secret = process.env.RECRUITMENT_SESSION_SECRET;
  const key = process.env.RECRUITMENT_STAGING_SECRET_KEY;
  const period = process.env.RECRUITMENT_PERIOD_ID;
  if (process.env.RECRUITMENT_STAGING_ENABLED !== "true" || process.env.RECRUITMENT_SINGLE_INSTANCE !== "true" || !origin || !secret || secret.length < 32 || !key || !period || !/^[0-9a-f-]{36}$/.test(period))
    throw new SubmissionError(503, "Pendaftaran belum tersedia. Silakan hubungi panitia.");
  const parsed = new URL(origin);
  if (parsed.origin !== origin || (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost","127.0.0.1"].includes(parsed.hostname)))) throw new SubmissionError(503, "Konfigurasi pendaftaran belum tersedia.");
  // A legacy JWT must name this project; modern sb_secret keys are project-bound
  // by Supabase and must be provisioned from this staging Dashboard only.
  if (!key.startsWith("sb_secret_")) {
    try { const claim = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()); if (claim.ref !== "lavxddhrrwsjcshmnwvu" || claim.role !== "service_role") throw new Error(); }
    catch { throw new SubmissionError(503, "Kredensial staging tidak sesuai."); }
  }
  return { origin, secret, key, period };
}
export function client(key: string) {
  return createClient("https://lavxddhrrwsjcshmnwvu.supabase.co", key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => {
      if (new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).origin !== "https://lavxddhrrwsjcshmnwvu.supabase.co") throw new Error("Unexpected destination");
      return fetch(input, { ...init, redirect: "error", signal: AbortSignal.timeout(20000) });
    } },
  });
}
export async function loadCatalog(db: SupabaseClient, period: string): Promise<Catalog> {
  const [p,o,r] = await Promise.all([
    db.from("recruitment_periods").select("id,label,config_version,approved_at,is_open,opens_at,closes_at,batches").eq("id",period).not("approved_at","is",null).single(),
    db.from("recruitment_options").select("main_code,sub_code,main_label,sub_label,assignment_state,instructions,formats,max_bytes").eq("period_id",period).order("main_code").order("sub_code"),
    db.from("recruitment_document_requirements").select("slot,required,formats,max_bytes").eq("period_id",period).order("slot"),
  ]);
  if (p.error || o.error || r.error || !p.data) throw new SubmissionError(503, "Periode pendaftaran resmi belum tersedia.");
  return { period:p.data, options:o.data, requirements:r.data } as Catalog;
}
function check(error: unknown) { if (error) throw new SubmissionError(503, "Pengiriman belum terkonfirmasi. Coba kembali dengan data dan file yang sama."); }
function documentId(key: string, slot: string) {
  const h = createHash("sha256").update(`recruitment:${key}:${slot}`).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}
export async function submit(db: SupabaseClient, catalog: Catalog, key: string, payload: Payload) {
  const v=payload.values;
  async function existing() {
    const result=await db.from("recruitment_applications").select("id,period_id,request_hash,status").eq("idempotency_key",key).maybeSingle(); check(result.error); return result.data;
  }
  let app=await existing();
  if (app && (app.period_id!==catalog.period.id || app.request_hash!==payload.hash)) throw new SubmissionError(409,"Pengiriman sebelumnya menggunakan data berbeda. Hubungi panitia untuk koreksi.");
  // Completed retries return only a receipt to the verified session owner,
  // including after closure. Never expose another NIM's application or email.
  if (app && app.status!=="uploading") return { applicationId:app.id };
  assertOpen(catalog);
  if (!app) {
    const inserted=await db.from("recruitment_applications").insert({ period_id:catalog.period.id,idempotency_key:key,request_hash:payload.hash,full_name:v.fullName,nim:v.nim,birth_place:v.birthPlace,birth_date:v.birthDate,email:v.ugmEmail,phone:v.phoneNumber,major:v.major,batch:v.batch }).select("id,period_id,request_hash,status").single();
    if (inserted.error?.code==="23505") {
      app=await existing();
      if (!app || app.request_hash!==payload.hash || app.period_id!==catalog.period.id) throw new SubmissionError(409,"Pendaftaran tidak dapat dibuat. Jika pernah mendaftar dengan NIM ini, hubungi panitia.");
      if (app.status!=="uploading") return { applicationId:app.id };
    } else { check(inserted.error); app=inserted.data; }
  }
  if (!app) throw new SubmissionError(503,"Pengiriman belum terkonfirmasi.");
  for (const rank of [1,2] as const) {
    const result=await db.from("recruitment_preferences").upsert({ application_id:app.id,period_id:catalog.period.id,rank,main_code:v[`division${rank}`],sub_code:v[`subDivision${rank}`],motivation:v[`motivation${rank}`] },{ onConflict:"application_id,rank",ignoreDuplicates:true });check(result.error);
  }
  for (const d of payload.documents) {
    const id=documentId(key,d.slot);const path=`${catalog.period.id}/${app.id}/${id}.${d.format}`;
    const prior=await db.from("recruitment_documents").select("sha256,object_name,byte_size").eq("application_id",app.id).eq("slot",d.slot).maybeSingle();check(prior.error);
    if (prior.data) {
      if (prior.data.sha256!==d.sha256 || prior.data.object_name!==path || prior.data.byte_size!==d.bytes.length) throw new SubmissionError(409,"Dokumen tidak cocok dengan pengiriman sebelumnya.");
      continue;
    }
    const upload=await db.storage.from("recruitment-documents").upload(path,d.bytes,{contentType:d.mime,upsert:false,cacheControl:"0"});
    if (upload.error) {
      // A previous attempt may have stored bytes before metadata was committed.
      // Only exact server-owned bytes are reusable. Never overwrite objects.
      if (String(upload.error.statusCode)!=="409" && String(upload.error.statusCode)!=="400") check(upload.error);
      const stored=await db.storage.from("recruitment-documents").download(path);check(stored.error);
      if (!stored.data || stored.data.size!==d.bytes.length || createHash("sha256").update(Buffer.from(await stored.data.arrayBuffer())).digest("hex")!==d.sha256) throw new SubmissionError(409,"Dokumen tidak cocok dengan pengiriman sebelumnya.");
    }
    const metadata=await db.from("recruitment_documents").upsert({ id,application_id:app.id,period_id:catalog.period.id,slot:d.slot,object_name:path,format:d.format,byte_size:d.bytes.length,sha256:d.sha256,verified_at:new Date().toISOString() },{onConflict:"application_id,slot",ignoreDuplicates:true});check(metadata.error);
  }
  const final=await db.rpc("recruitment_finalize",{p_application:app.id,p_key:key,p_hash:payload.hash});
  if (final.error) {
    if (final.error.message.includes("recruitment_not_open")) throw new SubmissionError(409,"Batas waktu pendaftaran telah berakhir. Hubungi panitia.");
    check(final.error);
  }
  return { applicationId:final.data as string };
}
