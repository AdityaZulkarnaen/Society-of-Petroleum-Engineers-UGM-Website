import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export class SubmissionError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) { super(message); }
}
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  if (["localhost", "127.0.0.1"].includes(url.hostname)) {
    const rawHost = request.headers.get("host") ?? request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    if (rawHost) {
      const [hostname] = rawHost.split(":");
      if (["localhost", "127.0.0.1"].includes(hostname)) {
        const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? url.protocol.replace(":", "");
        if (proto === "http" || proto === "https") {
          return `${proto}://${rawHost}`;
        }
      }
    }
  }
  return url.origin;
}
export function requireOrigin(request: Request, origin: string) {
  if (request.headers.get("origin") !== origin || getRequestOrigin(request) !== origin)
    throw new SubmissionError(403, "Permintaan tidak diizinkan.");
}
export function issueSession(secret: string, now = Date.now()) {
  const data = `${randomUUID()}.${now + 86400000}`;
  return `${data}.${createHmac("sha256", secret).update(data).digest("hex")}`;
}
export function verifySession(token: string, secret: string, now = Date.now()) {
  const [key, expires, signature, extra] = token.split(".");
  if (extra || !/^[0-9a-f-]{36}$/.test(key ?? "") || !/^\d{13}$/.test(expires ?? "") || !/^[0-9a-f]{64}$/.test(signature ?? ""))
    throw new SubmissionError(403, "Sesi tidak valid. Muat ulang halaman.");
  const expected = createHmac("sha256", secret).update(`${key}.${expires}`).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex")) || Number(expires) <= now)
    throw new SubmissionError(403, "Sesi berakhir. Hubungi panitia jika pengiriman sebelumnya belum terkonfirmasi.");
  return key;
}
// Bounded per-process limiter. The staging slice is enabled only in explicitly
// acknowledged single-instance mode; distributed deployments need a shared limiter.
const counters = new Map<string, { count: number; until: number }>();
export function limit(key: string, maximum: number, now = Date.now()) {
  for (const [id, value] of counters) if (value.until <= now) counters.delete(id);
  const value = counters.get(key) ?? { count: 0, until: now + 60000 };
  if (value.count >= maximum || (!counters.has(key) && counters.size >= 2000))
    throw new SubmissionError(429, "Terlalu banyak permintaan. Tunggu satu menit sebelum mencoba kembali.");
  value.count++; counters.set(key, value);
}
const inFlight = new Set<string>();
export async function singleSubmission<T>(key: string, operation: () => Promise<T>): Promise<T> {
  if (inFlight.has(key)) throw new SubmissionError(429, "Pengiriman sedang diproses. Tunggu sebelum mencoba kembali.");
  inFlight.add(key);
  try { return await operation(); } finally { inFlight.delete(key); }
}
export async function boundedForm(request: Request) {
  const max = 22 * 1024 * 1024;
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;") || !request.body)
    throw new SubmissionError(400, "Format pengiriman tidak valid.");
  if (Number(request.headers.get("content-length")) > max) throw new SubmissionError(413, "Ukuran pengiriman terlalu besar.");
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  const deadline = Date.now() + 30000;
  try {
    while (true) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new SubmissionError(408, "Waktu unggah habis. Coba kembali.");
      const chunk = await Promise.race([reader.read(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new SubmissionError(408, "Waktu unggah habis. Coba kembali.")), remaining); })]).finally(() => clearTimeout(timer));
      const { done, value } = chunk; if (done) break;
      length += value.byteLength;
      if (length > max) throw new SubmissionError(413, "Ukuran pengiriman terlalu besar.");
      chunks.push(value);
    }
  } catch (error) { await reader.cancel(); throw error; }
  try { return await new Response(Buffer.concat(chunks), { headers: { "content-type": request.headers.get("content-type")! } }).formData(); }
  catch { throw new SubmissionError(400, "Format pengiriman tidak valid."); }
}
