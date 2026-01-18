import Link from "next/link";
import { FilePlus2, ShieldCheck } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PLATFORM_OPTIONS, REPORT_TYPE_OPTIONS } from "@/lib/utils";
import { Report } from "@/types/db";

const PAGE_SIZE = 10;

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function lookupLabel<T extends readonly { value: string; label: string }[]>(
  list: T,
  value: T[number]["value"] | string
) {
  return list.find((item) => item.value === value)?.label ?? value;
}

type SearchParams = { page?: string };

export default async function CustomerDashboard({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { user } = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const resolved = await searchParams;
  const page = Math.max(1, Number(resolved.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: reports = [], count = 0 } = await supabase
    .from("reports")
    .select("*", { count: "exact" })
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<Report[]>();

  const reportsList = reports ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
            Customer Portal
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Shieldify IP - Takedown Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Submit and track takedown requests across platforms.
          </p>
        </div>
        <Button asChild className="h-11 px-4 shadow">
          <Link href="/app/reports/new">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Create report
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardDescription className="text-xs uppercase text-primary">
              Total reports
            </CardDescription>
            <CardTitle className="text-3xl">{reportsList.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardDescription className="text-xs uppercase">Approved</CardDescription>
              <CardTitle className="text-2xl">
                {reportsList.filter((r) => r.status === "approved").length}
              </CardTitle>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="text-xs uppercase">Pending</CardDescription>
            <CardTitle className="text-2xl">
              {reportsList.filter((r) => r.status === "pending").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your reports</CardTitle>
            <CardDescription>Only you can see these entries (RLS enforced).</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/app/reports/new">New report</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {reportsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
              <p>No reports yet.</p>
              <Button asChild>
                <Link href="/app/reports/new">Create your first report</Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report #</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportsList.map((report: Report) => (
                    <TableRow key={report.id} className="hover:bg-muted/60">
                      <TableCell>
                        <Link
                          href={`/app/reports/${report.id}`}
                          className="font-semibold hover:underline"
                        >
                          {report.report_number ?? "Pending assignment"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {lookupLabel(PLATFORM_OPTIONS, report.platform)}
                      </TableCell>
                      <TableCell>
                        {lookupLabel(REPORT_TYPE_OPTIONS, report.report_type)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={report.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(report.created_at)}
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
                    <Link href={`/app?page=${page - 1}`}>Previous</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={!canNext}
                  >
                    <Link href={`/app?page=${page + 1}`}>Next</Link>
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
