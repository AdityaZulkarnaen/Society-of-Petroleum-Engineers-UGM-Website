import { getAdmin } from "@/modules/admin/auth/session";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  // 1. Enforce super-admin session authorization
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return Response.json(
      { error: "Forbidden: Only active super-admins may access recruitment documents." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await props.params;
  if (!id || !UUID_REGEX.test(id)) {
    return Response.json(
      { error: "Invalid document identifier." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Handle dummy preview mode if enabled
  if (DUMMY_DATA) {
    return new Response(new Uint8Array(0), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": "0",
        "Content-Disposition": 'inline; filename="dummy-document.pdf"',
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  try {
    // 2. Invoke RPC using caller's authenticated Supabase client
    // This logs `document_download_authorized` in `recruitment_audit` and asserts RLS permissions
    const userClient = await createClient();
    const { data, error } = await userClient.rpc("recruitment_document_access", {
      p_document: id,
    });

    if (error || !data || data.length === 0) {
      return Response.json(
        { error: "Document not found or access denied." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { bucket_id, object_name } = data[0];

    // 3. Securely fetch file bytes via server-side admin client (never exposed to browser)
    const adminStorage = createAdminClient();
    const { data: fileBlob, error: downloadError } = await adminStorage.storage
      .from(bucket_id)
      .download(object_name);

    if (downloadError || !fileBlob) {
      return Response.json(
        { error: "Failed to retrieve storage file." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    // 4. Determine content type and filename
    const ext = object_name.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME_TYPES[ext] || fileBlob.type || "application/octet-stream";
    const filename = `document-${id}.${ext || "bin"}`;

    // 5. Stream exact original stored bytes with byte-for-byte integrity (no dynamic stub substitution)
    const rawBuffer = Buffer.from(await fileBlob.arrayBuffer());

    return new Response(new Uint8Array(rawBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(rawBuffer.byteLength),
        "Content-Disposition": `inline; filename="${filename}"`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "Internal server error processing document request." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
