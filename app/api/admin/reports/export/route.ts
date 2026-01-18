import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Report, UserProfile } from "@/types/db";

type SearchParams = {
  status?: string;
  platform?: string;
  report_type?: string;
  q?: string;
  email?: string;
  created_from?: string;
  created_to?: string;
  sort?: string;
};

type ReportWithProfile = Report & {
  user_profiles?: Pick<UserProfile, "email" | "full_name">;
};

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const filters: SearchParams = {
    status: searchParams.get("status") || undefined,
    platform: searchParams.get("platform") || undefined,
    report_type: searchParams.get("report_type") || undefined,
    q: searchParams.get("q") || undefined,
    email: searchParams.get("email") || undefined,
    created_from: searchParams.get("created_from") || undefined,
    created_to: searchParams.get("created_to") || undefined,
    sort: searchParams.get("sort") || undefined,
  };

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("reports")
    .select("*, user_profiles:customer_id(email,full_name)", { count: "exact" })
    .limit(2000); // safeguard

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.platform) query = query.eq("platform", filters.platform);
  if (filters.report_type) query = query.eq("report_type", filters.report_type);
  if (filters.email) query = query.ilike("user_profiles.email", `%${filters.email}%`);
  if (filters.created_from) query = query.gte("created_at", filters.created_from);
  if (filters.created_to) query = query.lte("created_at", filters.created_to);
  if (filters.q) {
    const term = `%${filters.q}%`;
    query = query.or(
      `report_number.ilike.${term},account_page_name.ilike.${term},user_profiles.email.ilike.${term},user_profiles.full_name.ilike.${term}`
    );
  }

  if (filters.sort) {
    const [field, dir] = filters.sort.split(":");
    if (field === "created_at" || field === "status") {
      query = query.order(field as "created_at" | "status", {
        ascending: dir !== "desc",
      });
    }
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data = [], error } = await query.returns<ReportWithProfile[]>();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Unable to export" },
      { status: 500 }
    );
  }

  const headers = [
    "report_id",
    "report_number",
    "status",
    "platform",
    "report_type",
    "account_page_name",
    "customer_email",
    "customer_name",
    "created_at",
    "updated_at",
  ];

  const rows = data.map((row) => [
    row.id,
    row.report_number ?? "",
    row.status,
    row.platform,
    row.report_type,
    row.account_page_name,
    row.user_profiles?.email ?? "",
    row.user_profiles?.full_name ?? "",
    row.created_at,
    row.updated_at,
  ]);

  const csv = [headers, ...rows]
    .map((cells) =>
      cells
        .map((cell) => {
          const value = typeof cell === "string" ? cell : String(cell ?? "");
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    )
    .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"reports_export.csv\"",
    },
  });
}
