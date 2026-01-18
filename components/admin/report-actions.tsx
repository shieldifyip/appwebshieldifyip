"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { approveSchema, rejectSchema } from "@/lib/validation/report";
import { Report } from "@/types/db";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

interface Props {
  reportId: string;
  currentStatus: Report["status"];
  existingReportNumber: string | null;
}

type ApproveValues = { report_number: string };
type RejectValues = { note?: string | null };

export function AdminReportActions({
  reportId,
  currentStatus,
  existingReportNumber,
}: Props) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const approveForm = useForm<ApproveValues>({
    resolver: zodResolver(approveSchema),
    defaultValues: { report_number: existingReportNumber ?? "" },
  });

  const assignForm = useForm<ApproveValues>({
    resolver: zodResolver(approveSchema),
    defaultValues: { report_number: existingReportNumber ?? "" },
  });

  const rejectForm = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { note: "" },
  });

  const pendingForm = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { note: "" },
  });

  const handleAssignNumber = async (values: ApproveValues) => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("reports")
      .update({
        report_number: values.report_number,
      })
      .eq("id", reportId);

    if (!error && user?.id) {
      await supabase.from("report_audit_logs").insert({
        report_id: reportId,
        actor_id: user.id,
        action: "updated",
        note: `Assigned report number: ${values.report_number}`,
      });
    }

    if (error) {
      toast({ title: "Assign failed", description: error.message });
    } else {
      toast({ title: "Report number assigned" });
      setAssignOpen(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handleApprove = async (values: ApproveValues) => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("reports")
      .update({
        status: "approved",
        report_number: values.report_number,
      })
      .eq("id", reportId);

    if (!error && user?.id) {
      await supabase.from("report_audit_logs").insert({
        report_id: reportId,
        actor_id: user.id,
        action: "approved",
        note: `Report number: ${values.report_number}`,
      });
    }

    if (error) {
      toast({ title: "Approval failed", description: error.message });
    } else {
      toast({
        title: "Report approved",
        description: "Report number shared with the customer.",
      });
      setApproveOpen(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handleReject = async (values: RejectValues) => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("reports")
      .update({
        status: "rejected",
      })
      .eq("id", reportId);

    if (!error && user?.id) {
      await supabase.from("report_audit_logs").insert({
        report_id: reportId,
        actor_id: user.id,
        action: "rejected",
        note: values.note ?? null,
      });
    }

    if (error) {
      toast({ title: "Rejection failed", description: error.message });
    } else {
      toast({ title: "Report rejected" });
      setRejectOpen(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handleResetToPending = async (values: RejectValues) => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("reports")
      .update({ status: "pending" })
      .eq("id", reportId);

    if (!error && user?.id) {
      await supabase.from("report_audit_logs").insert({
        report_id: reportId,
        actor_id: user.id,
        action: "updated",
        note: values.note?.trim()?.length ? values.note : "Status set to pending",
      });
    }

    if (error) {
      toast({ title: "Update failed", description: error.message });
    } else {
      toast({ title: "Status updated to pending" });
      setPendingOpen(false);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogTrigger asChild>
          <Button size="sm" disabled={currentStatus === "approved"}>
            Approve
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve report</DialogTitle>
            <DialogDescription>
              Enter the report number (not auto-generated). This will be visible to the customer.
            </DialogDescription>
          </DialogHeader>
          <Form {...approveForm}>
            <form
              onSubmit={approveForm.handleSubmit(handleApprove)}
              className="space-y-4"
            >
              <FormField
                control={approveForm.control}
                name="report_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., TK-2024-0012" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setApproveOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Confirm approval"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="secondary">
            Assign number
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign report number</DialogTitle>
            <DialogDescription>
              Set or update the report number without changing status.
            </DialogDescription>
          </DialogHeader>
          <Form {...assignForm}>
            <form
              onSubmit={assignForm.handleSubmit(handleAssignNumber)}
              className="space-y-4"
            >
              <FormField
                control={assignForm.control}
                name="report_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., TK-2024-0012" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setAssignOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save number"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={currentStatus === "rejected"}>
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject report</DialogTitle>
            <DialogDescription>Optionally add a rejection note.</DialogDescription>
          </DialogHeader>
          <Form {...rejectForm}>
            <form
              onSubmit={rejectForm.handleSubmit(handleReject)}
              className="space-y-4"
            >
              <FormField
                control={rejectForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection note</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Optional note for the customer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Confirm rejection"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingOpen} onOpenChange={setPendingOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={currentStatus === "pending"}
          >
            Mark pending
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set status to pending?</DialogTitle>
            <DialogDescription>
              This will revert the report to pending. Existing report number will stay unchanged.
            </DialogDescription>
          </DialogHeader>
          <Form {...pendingForm}>
            <form
              onSubmit={pendingForm.handleSubmit(handleResetToPending)}
              className="space-y-4"
            >
              <FormField
                control={pendingForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Reason for moving back to pending" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setPendingOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Confirm"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
