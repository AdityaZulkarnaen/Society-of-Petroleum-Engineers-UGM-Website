import { getAdmin } from "@/modules/admin/auth/session";
import { DUMMY_DATA } from "@/modules/admin/dummy";
import { createClient } from "@/lib/supabase/server";
import {
  generateApplicantsCsv,
  type ExportApplication,
} from "@/modules/super-admin/recruitment/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BATCH_SIZE = 100;

type ExportRpcRow = {
  application: ExportApplication;
};

export async function GET(request: Request) {
  // 1. Enforce super-admin session authorization
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return Response.json(
      { error: "Forbidden: Only active super-admins may export recruitment data." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get("periodId");

  if (!periodId || !UUID_REGEX.test(periodId)) {
    return Response.json(
      { error: "Missing or invalid periodId parameter." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Handle dummy preview mode if enabled
  if (DUMMY_DATA) {
    const dummyExport: ExportApplication[] = [
      {
        id: "82529724-1316-476b-a0b7-c5d5daee2525",
        period_id: periodId,
        full_name: "Synthetic Applicant B3",
        nim: "synthetic-b3-001",
        birth_place: "Yogyakarta",
        birth_date: "2005-01-01",
        email: "applicant@example.test",
        phone: "+6281234567890",
        major: "Teknik Geologi",
        batch: "2024",
        status: "submitted",
        submitted_at: "2026-11-01T20:00:00Z",
        preferences: [
          {
            rank: 1,
            main_code: "opt-it",
            sub_code: "opt-it-fe",
            motivation: "Eager to build high-performance web interfaces for SPE UGM.",
          },
          {
            rank: 2,
            main_code: "opt-it",
            sub_code: "opt-it-be",
            motivation: "Passionate about secure server architecture and API design.",
          },
        ],
      },
    ];

    const csvData = generateApplicantsCsv(dummyExport);
    return new Response(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="recruitment-export-${periodId}.csv"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  try {
    const userClient = await createClient();
    const allApplications: ExportApplication[] = [];
    let cursor: string | null = null;

    // Paginate through cursor-based RPC until all records are collected
    // The RPC logs `csv_export` to `recruitment_audit` upon initial execution
    while (true) {
      const response = await userClient.rpc("recruitment_export", {
        p_period: periodId,
        p_after: cursor,
        p_limit: BATCH_SIZE,
      });

      if (response.error) {
        const message = response.error.message;
        if (message.includes("not_allowed")) {
          return Response.json(
            { error: "Not authorized to export data for this recruitment period." },
            { status: 403, headers: { "Cache-Control": "no-store" } },
          );
        }
        return Response.json(
          { error: `Database error: ${message}` },
          { status: 500, headers: { "Cache-Control": "no-store" } },
        );
      }

      const rows: ExportRpcRow[] = (response.data as ExportRpcRow[] | null) ?? [];
      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        if (row && row.application) {
          allApplications.push(row.application);
        }
      }

      if (rows.length < BATCH_SIZE) {
        break;
      }

      const lastRow = rows[rows.length - 1];
      cursor = lastRow?.application?.id ?? null;
      if (!cursor) break;
    }

    const csvContent = generateApplicantsCsv(allApplications);
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `spe-recruitment-export-${dateStamp}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Length": String(Buffer.byteLength(csvContent, "utf8")),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "Failed to generate recruitment export." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
