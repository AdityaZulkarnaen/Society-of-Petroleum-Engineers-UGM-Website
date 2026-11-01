import { cookies } from "next/headers";
import { settings, client, loadCatalog, submit } from "@/modules/recruitment/server/backend";
import { publicPeriod, assertOpen } from "@/modules/recruitment/server/configuration";
import { validatePayload } from "@/modules/recruitment/server/payload";
import { SubmissionError, getRequestOrigin, requireOrigin, issueSession, verifySession, limit, boundedForm, singleSubmission } from "@/modules/recruitment/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cookieName = "spe-recruitment-session";
const headers = { "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" };
function failure(error: unknown) {
  const known = error instanceof SubmissionError;
  return Response.json({ error: known ? error.message : "Pengiriman belum terkonfirmasi. Coba kembali dengan data dan file yang sama.", fields: known ? error.fields : undefined }, { status: known ? error.status : 503, headers });
}
export async function GET(request: Request) {
  try {
    const s=settings();
    if (getRequestOrigin(request) !== s.origin || request.headers.get("sec-fetch-site") === "cross-site") {
      throw new SubmissionError(403, "Permintaan tidak diizinkan.");
    }
    limit("global-config",60);
    const db=client(s.key);const catalog=await loadCatalog(db,s.period);assertOpen(catalog);
    const jar=await cookies();let token=jar.get(cookieName)?.value;
    try { if (!token) throw new Error();verifySession(token,s.secret); } catch { token=issueSession(s.secret); }
    jar.set(cookieName,token!,{httpOnly:true,secure:new URL(s.origin).protocol==="https:",sameSite:"strict",path:"/api/recruitment",maxAge:86400});
    return Response.json({period:publicPeriod(catalog),token}, {headers});
  } catch(error) {return failure(error);}
}
export async function POST(request: Request) {
  try {
    const s=settings();requireOrigin(request,s.origin);limit("global-submission",20);
    const token=(await cookies()).get(cookieName)?.value;
    if (!token || request.headers.get("x-recruitment-session")!==token) throw new SubmissionError(403,"Sesi tidak valid. Muat ulang halaman.");
    const key=verifySession(token,s.secret);limit(`submission:${key}`,5);
    return await singleSubmission(key, async () => {
    const form=await boundedForm(request);
    const db=client(s.key);const catalog=await loadCatalog(db,s.period);
    const payload=await validatePayload(form,catalog);
    return Response.json(await submit(db,catalog,key,payload),{headers});
    });
  } catch(error) {return failure(error);}
}
