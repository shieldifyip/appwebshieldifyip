import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { CopyUrlsButton } from "@/components/reports/copy-urls-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PLATFORM_OPTIONS, REPORT_TYPE_OPTIONS } from "@/lib/utils";
import { Report, ReportAuditLog } from "@/types/db";

export const dynamic = "force-dynamic";
const MAX_URLS = 50;

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function labelFor(list: readonly { value: string; label: string }[], value: string) {
  return list.find((item) => item.value === value)?.label ?? value;
}

export default async function ReportDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const resolvedParams = await params;
  const supabase = await createSupabaseServerClient();

  const reportId = resolvedParams.id;

  if (!reportId || reportId === "undefined") {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load report</CardTitle>
            <CardDescription>Missing or invalid report ID.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/app">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load report</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/app">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Report not found</CardTitle>
            <CardDescription>This report may not belong to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/app">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: logs = [] } = await supabase
    .from("report_audit_logs")
    .select("*")
    .eq("report_id", report.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/app" className="underline">
            Dashboard
          </Link>
          <span>/</span>
          <span>Report detail</span>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
              Report detail
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              {report.report_number ?? "Awaiting report number"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Created at {formatDate(report.created_at)} (uses created_at, no date_of_infringement field).
            </p>
          </div>
          <StatusBadge status={report.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>High-level information about this report.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Platform" value={labelFor(PLATFORM_OPTIONS, report.platform)} />
          <InfoRow label="Report type" value={labelFor(REPORT_TYPE_OPTIONS, report.report_type)} />
          <InfoRow label="Account/Page name" value={report.account_page_name} />
          <InfoRow label="Status" value={<StatusBadge status={report.status} />} />
          {report.report_number && <InfoRow label="Report number" value={report.report_number} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>URLs & description</CardTitle>
          <CardDescription>Infringing links provided by you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                Infringing URLs{" "}
                <span className="text-xs text-muted-foreground">
                  ({report.infringing_urls.length}/{MAX_URLS})
                </span>
              </p>
              <CopyUrlsButton urls={report.infringing_urls} />
            </div>
            <ul className="list-inside list-disc space-y-1 text-sm text-blue-700">
              {report.infringing_urls.map((url) => (
                <li key={url}>
                  <Link href={url} target="_blank" className="flex items-center gap-1 underline">
                    {url}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {report.description && (
            <div>
              <p className="text-sm font-semibold">Description</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {report.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Type-specific details</CardTitle>
          <CardDescription>Stored inside form_payload.</CardDescription>
        </CardHeader>
        <CardContent>
          <PayloadDetails report={report} />
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Audit log</CardTitle>
            <CardDescription>Actions taken on this report.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: ReportAuditLog) => (
                  <TableRow key={log.id}>
                    <TableCell className="capitalize">{log.action}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.note || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link href="/app">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border bg-muted/40 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function PayloadDetails({ report }: { report: Report }) {
  const payload = (report.form_payload as Record<string, unknown>) ?? {};

  switch (report.report_type) {
    case "copyright": {
      const proofLinks = Array.isArray(payload.proof_links)
        ? (payload.proof_links as string[])
        : [];
      return (
        <div className="space-y-2">
          <InfoRow label="Work description" value={String(payload.work_description ?? "-")} />
          <InfoRow
            label="Proof links"
            value={
              proofLinks.length > 0 ? (
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {proofLinks.map((url) => (
                    <li key={url}>
                      <Link href={url} className="underline" target="_blank">
                        {url}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                "-"
              )
            }
          />
        </div>
      );
    }
    case "trademark":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <InfoRow label="Trademark name" value={String(payload.trademark_name ?? "-")} />
          <InfoRow label="Registration #" value={String(payload.registration_number ?? "-")} />
          <InfoRow label="Jurisdiction" value={String(payload.jurisdiction ?? "-")} />
        </div>
      );
    case "counterfeit":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <InfoRow label="Brand" value={String(payload.brand ?? "-")} />
          <InfoRow label="Product type" value={String(payload.product_type ?? "-")} />
        </div>
      );
    case "impersonator": {
      const evidenceLinks = Array.isArray(payload.evidence_links)
        ? (payload.evidence_links as string[])
        : [];
      return (
        <div className="space-y-2">
          <InfoRow
            label="Impersonated entity"
            value={String(payload.impersonated_entity ?? "-")}
          />
          <InfoRow
            label="Evidence links"
            value={
              evidenceLinks.length > 0 ? (
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {evidenceLinks.map((url) => (
                    <li key={url}>
                      <Link href={url} className="underline" target="_blank">
                        {url}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                "-"
              )
            }
          />
        </div>
      );
    }
    case "other":
      return <InfoRow label="Details" value={String(payload.other_details ?? "-")} />;
    default:
      return <p className="text-sm text-muted-foreground">No payload recorded.</p>;
  }
}
