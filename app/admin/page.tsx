import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";

import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PLATFORM_OPTIONS, REPORT_TYPE_OPTIONS, STATUS_OPTIONS } from "@/lib/utils";
import { Report, UserProfile } from "@/types/db";

type SearchParams = {
  status?: string;
  platform?: string;
  report_type?: string;
  q?: string;
  email?: string;
  created_from?: string;
  created_to?: string;
  page?: string;
  sort?: string;
};

type ReportWithProfile = Report & { user_profiles?: Pick<UserProfile, "email" | "full_name"> };

const PAGE_SIZE = 20;

function buildParams(resolved: SearchParams, override?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  const source = { ...resolved, ...(override ?? {}) };
  if (source.q) params.set("q", source.q);
  if (source.email) params.set("email", source.email);
  if (source.status) params.set("status", source.status);
  if (source.platform) params.set("platform", source.platform);
  if (source.report_type) params.set("report_type", source.report_type);
  if (source.created_from) params.set("created_from", source.created_from);
  if (source.created_to) params.set("created_to", source.created_to);
  if (source.sort) params.set("sort", source.sort);
  if (source.page) params.set("page", String(source.page));
  return params.toString();
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const resolved = await searchParams;
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, Number(resolved.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("reports")
    .select("*, user_profiles:customer_id(email,full_name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (resolved.status) query = query.eq("status", resolved.status);
  if (resolved.platform) query = query.eq("platform", resolved.platform);
  if (resolved.report_type) query = query.eq("report_type", resolved.report_type);
  if (resolved.email) query = query.ilike("user_profiles.email", `%${resolved.email}%`);
  if (resolved.created_from) query = query.gte("created_at", resolved.created_from);
  if (resolved.created_to) query = query.lte("created_at", resolved.created_to);
  if (resolved.q) {
    const term = `%${resolved.q}%`;
    query = query.or(
      `report_number.ilike.${term},account_page_name.ilike.${term},user_profiles.email.ilike.${term},user_profiles.full_name.ilike.${term}`
    );
  }

  if (resolved.sort) {
    const [field, dir] = resolved.sort.split(":");
    if (field === "created_at" || field === "status") {
      query = query.order(field as "created_at" | "status", {
        ascending: dir !== "desc",
      });
    }
  }

  const { data: reports, error, count = 0 } = await query
    .range(from, to)
    .returns<ReportWithProfile[]>();

  const safeReports = reports ?? [];

  if (error) {
    console.error(error);
    redirect("/login");
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const makeHref = (nextPage: number) => {
    const params = buildParams(resolved, { page: nextPage });
    return `/admin?${params}`;
  };

  const exportHref = `/api/admin/reports/export?${buildParams(resolved)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin portal</p>
        <h1 className="text-3xl font-semibold text-slate-900">All reports</h1>
        <p className="text-sm text-muted-foreground">
          Approve requests and assign report numbers. Customers never see other customers&apos; data
          (RLS enforced).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search by report number, customer email/name, or account name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" method="get">
            <Input
              name="q"
              placeholder="Search report #, email, name, account"
              defaultValue={resolved.q}
              className="md:col-span-2"
            />
            <Input
              name="email"
              placeholder="Filter by customer email"
              defaultValue={resolved.email}
              className="md:col-span-2"
            />
            <select
              name="status"
              defaultValue={resolved.status}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm"
            >
              <option value="">Any status</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              name="platform"
              defaultValue={resolved.platform}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm"
            >
              <option value="">Any platform</option>
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              name="report_type"
              defaultValue={resolved.report_type}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm"
            >
              <option value="">Any type</option>
              {REPORT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Input
              type="date"
              name="created_from"
              defaultValue={resolved.created_from}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm"
            />
            <Input
              type="date"
              name="created_to"
              defaultValue={resolved.created_to}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm"
            />
            <select
              name="sort"
              defaultValue={resolved.sort ?? "created_at:desc"}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm"
            >
              <option value="created_at:desc">Newest first</option>
              <option value="created_at:asc">Oldest first</option>
              <option value="status:asc">Status A-Z</option>
              <option value="status:desc">Status Z-A</option>
            </select>
            <div className="flex gap-2 md:col-span-4">
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                Apply
              </Button>
              <Button type="reset" variant="outline" asChild>
                <Link href="/admin">Clear</Link>
              </Button>
              <Button variant="secondary" asChild className="ml-auto">
                <Link href={exportHref}>Export CSV</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Click a row to open the detail view.</CardDescription>
        </CardHeader>
        <CardContent>
          {safeReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-8 text-sm text-muted-foreground">
              No reports found with these filters.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Report #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {safeReports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-muted/60">
                      <TableCell>
                        <Link
                          href={`/admin/reports/${report.id}`}
                          className="font-semibold underline decoration-dotted underline-offset-4"
                        >
                          {report.report_number ?? "-"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {report.user_profiles?.full_name ?? "-"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {report.user_profiles?.email ?? ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{report.account_page_name}</TableCell>
                      <TableCell className="capitalize">{report.platform}</TableCell>
                      <TableCell className="capitalize">{report.report_type}</TableCell>
                      <TableCell>
                        <StatusBadge status={report.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(report.created_at).toLocaleString()}
                      </TableCell>
                    <TableCell className="text-right">
                      <CopyLinkButton url={`/admin/reports/${report.id}`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {from + 1}-{Math.min(to + 1, count ?? 0)} of {count ?? 0}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={!canPrev}
                  >
                    <Link href={makeHref(page - 1)}>Previous</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={!canNext}
                  >
                    <Link href={makeHref(page + 1)}>Next</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
