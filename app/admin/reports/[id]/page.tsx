import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { AdminReportActions } from "@/components/admin/report-actions";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { CopyUrlsButton } from "@/components/reports/copy-urls-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PLATFORM_OPTIONS, REPORT_TYPE_OPTIONS } from "@/lib/utils";
import { Report, ReportAuditLog, UserProfile } from "@/types/db";

type AuditWithActor = ReportAuditLog & { actor?: Pick<UserProfile, "email" | "full_name"> };

export const dynamic = "force-dynamic";
const MAX_URLS = 50;

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function labelFor<T extends readonly { value: string; label: string }[]>(
  list: T,
  value: T[number]["value"] | string
) {
  return list.find((item) => item.value === value)?.label ?? value;
}

export default async function AdminReportDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
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
              <Link href="/admin">Back to list</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: report, error } = await supabase
    .from("reports")
    .select("*, user_profiles:customer_id(email,full_name,id)")
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
              <Link href="/admin">Back to list</Link>
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
            <CardDescription>This report may not exist or you may not have access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin">Back to list</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: logs = [] } = await supabase
    .from("report_audit_logs")
    .select("*, actor:user_profiles!report_audit_logs_actor_id_fkey(full_name,email)")
    .eq("report_id", report.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin" className="underline">
              Reports
            </Link>
            <span>/</span>
            <span>Detail</span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">
            {report.report_number ?? "Pending number assignment"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created at {formatDate(report.created_at)} (timestamp sourced from created_at).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={report.status} />
          <CopyLinkButton url={`/admin/reports/${report.id}`} />
          <AdminReportActions
            reportId={report.id}
            currentStatus={report.status}
            existingReportNumber={report.report_number}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report summary</CardTitle>
          <CardDescription>Admin-only view across all customers.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Customer">
            <div className="flex flex-col">
              <span className="font-semibold">{report.user_profiles?.full_name ?? "-"}</span>
              <span className="text-sm text-muted-foreground">
                {report.user_profiles?.email ?? ""}
              </span>
            </div>
          </InfoRow>
          <InfoRow label="Account/Page">{report.account_page_name}</InfoRow>
          <InfoRow label="Platform">
            {labelFor(PLATFORM_OPTIONS, report.platform)}
          </InfoRow>
          <InfoRow label="Report type">
            {labelFor(REPORT_TYPE_OPTIONS, report.report_type)}
          </InfoRow>
          {report.report_number && <InfoRow label="Report number">{report.report_number}</InfoRow>}
          <InfoRow label="Status">
            <StatusBadge status={report.status} />
          </InfoRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>URLs & description</CardTitle>
          <CardDescription>Customer supplied URLs.</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Actions performed by admins.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: AuditWithActor) => (
                  <TableRow key={log.id}>
                    <TableCell className="capitalize">{log.action}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{log.actor?.full_name ?? "-"}</span>
                        <span className="text-xs text-muted-foreground">
                          {log.actor?.email ?? ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.note ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link href="/admin">Back to list</Link>
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border bg-muted/40 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm font-semibold text-slate-900">{children}</div>
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
          <InfoRow label="Work description">{String(payload.work_description ?? "-")}</InfoRow>
          <InfoRow label="Proof links">
            {proofLinks.length > 0 ? (
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
            )}
          </InfoRow>
        </div>
      );
    }
    case "trademark":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <InfoRow label="Trademark name">{String(payload.trademark_name ?? "-")}</InfoRow>
          <InfoRow label="Registration #">
            {String(payload.registration_number ?? "-")}
          </InfoRow>
          <InfoRow label="Jurisdiction">{String(payload.jurisdiction ?? "-")}</InfoRow>
        </div>
      );
    case "counterfeit":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <InfoRow label="Brand">{String(payload.brand ?? "-")}</InfoRow>
          <InfoRow label="Product type">{String(payload.product_type ?? "-")}</InfoRow>
        </div>
      );
    case "impersonator": {
      const evidenceLinks = Array.isArray(payload.evidence_links)
        ? (payload.evidence_links as string[])
        : [];
      return (
        <div className="space-y-2">
          <InfoRow label="Impersonated entity">
            {String(payload.impersonated_entity ?? "-")}
          </InfoRow>
          <InfoRow label="Evidence links">
            {evidenceLinks.length > 0 ? (
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
            )}
          </InfoRow>
        </div>
      );
    }
    case "other":
      return <InfoRow label="Details">{String(payload.other_details ?? "-")}</InfoRow>;
    default:
      return <p className="text-sm text-muted-foreground">No payload recorded.</p>;
  }
}
