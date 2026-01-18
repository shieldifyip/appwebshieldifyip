import { CreateReportWizard } from "@/components/reports/create-report-wizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";

export default async function NewReportPage() {
  const { user } = await requireAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
          Create report
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          New takedown request
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a platform and report type to reveal the required details.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Report wizard</CardTitle>
          <CardDescription>
            Report numbers are assigned by admins only after approval. Created timestamp uses{" "}
            <code>created_at</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateReportWizard customerId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
