import { cookies } from "next/headers";
import { settings, client, loadCatalog, submit } from "@/modules/recruitment/server/backend";
import { publicPeriod, assertOpen } from "@/modules/recruitment/server/configuration";
import { validatePayload } from "@/modules/recruitment/server/payload";
import {
  SubmissionError,
  getRequestOrigin,
  requireOrigin,
  resolveClientIp,
  issueSession,
  verifySession,
  limit,
  boundedForm,
  singleSubmission,
} from "@/modules/recruitment/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cookieName = "spe-recruitment-session";
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function failure(error: unknown) {
  const known = error instanceof SubmissionError;
  const status = known ? error.status : 503;
  const resHeaders: Record<string, string> = { ...headers };
  if (known && error.retryAfter !== undefined) {
    resHeaders["Retry-After"] = String(error.retryAfter);
  }
  return Response.json(
    {
      error: known
        ? error.message
        : "Pengiriman belum terkonfirmasi. Coba kembali dengan data dan file yang sama.",
      fields: known ? error.fields : undefined,
    },
    { status, headers: resHeaders },
  );
}

function getLimitThreshold(envVar: string, fallback: number): number {
  const raw = process.env[envVar];
  if (!raw) return fallback;
  const num = parseInt(raw, 10);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

export async function GET(request: Request) {
  try {
    const s = settings();
    if (
      getRequestOrigin(request) !== s.origin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    ) {
      throw new SubmissionError(403, "Permintaan tidak diizinkan.");
    }
    const clientIp = resolveClientIp(request);
    const sessionIpLimit = getLimitThreshold("RECRUITMENT_LIMIT_SESSION_IP", 60);
    const sessionGlobalLimit = getLimitThreshold("RECRUITMENT_LIMIT_SESSION_GLOBAL", 300);
    await limit(`session:ip:${clientIp}`, sessionIpLimit, 60000);
    await limit("global-config", sessionGlobalLimit, 60000);

    const db = client(s.key);
    const catalog = await loadCatalog(db, s.period);
    assertOpen(catalog);
    const jar = await cookies();
    let token = jar.get(cookieName)?.value;
    try {
      if (!token) throw new Error();
      verifySession(token, s.secret);
    } catch {
      token = issueSession(s.secret);
    }
    jar.set(cookieName, token!, {
      httpOnly: true,
      secure: new URL(s.origin).protocol === "https:",
      sameSite: "strict",
      path: "/api/recruitment",
      maxAge: 86400,
    });
    return Response.json({ period: publicPeriod(catalog), token }, { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const s = settings();
    requireOrigin(request, s.origin);

    const clientIp = resolveClientIp(request);
    const submitIpLimit = getLimitThreshold("RECRUITMENT_LIMIT_SUBMIT_IP", 15);
    const submitGlobalLimit = getLimitThreshold("RECRUITMENT_LIMIT_SUBMIT_GLOBAL", 120);
    const submitSessionLimit = getLimitThreshold("RECRUITMENT_LIMIT_SUBMIT_SESSION", 10);
    await limit(`submit:ip:${clientIp}`, submitIpLimit, 60000);
    await limit("global-submission", submitGlobalLimit, 60000);

    const token = (await cookies()).get(cookieName)?.value;
    if (!token || request.headers.get("x-recruitment-session") !== token) {
      throw new SubmissionError(403, "Sesi tidak valid. Muat ulang halaman.");
    }
    const key = verifySession(token, s.secret);
    await limit(`submission:${key}`, submitSessionLimit, 60000);

    return await singleSubmission(key, async () => {
      const form = await boundedForm(request);
      const db = client(s.key);
      const catalog = await loadCatalog(db, s.period);
      const payload = await validatePayload(form, catalog);
      return Response.json(await submit(db, catalog, key, payload), { headers });
    });
  } catch (error) {
    return failure(error);
  }
}
