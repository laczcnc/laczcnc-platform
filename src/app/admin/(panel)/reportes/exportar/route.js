import {
  hasPermission,
  PERMISSIONS,
} from "@/core/auth/permissions";
import { createClient } from "@/infrastructure/supabase/server";
import {
  createBusinessReportCsv,
  loadBusinessReport,
  resolveReportRange,
} from "@/modules/reports/server/business-report";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json(
      {
        error:
          "Debes iniciar sesión para exportar reportes.",
      },
      {
        status: 401,
      }
    );
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.is_active !== true ||
    !hasPermission(
      profile.role,
      PERMISSIONS.REPORTS_VIEW
    )
  ) {
    return Response.json(
      {
        error:
          "No tienes permiso para exportar reportes.",
      },
      {
        status: 403,
      }
    );
  }

  const url = new URL(request.url);

  const queryParams =
    Object.fromEntries(
      url.searchParams.entries()
    );

  const range =
    resolveReportRange(queryParams);

  const report =
    await loadBusinessReport({
      supabase,
      range,
    });

  const csv =
    createBusinessReportCsv(report);

  const fileName = [
    "laczcnc-reporte",
    range.fromDate,
    range.toDate,
  ].join("-");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type":
        "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="' +
        fileName +
        '.csv"',
      "Cache-Control":
        "private, no-store, max-age=0",
    },
  });
}
