import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Report } from "@/types/db";

export function StatusBadge({ status }: { status: Report["status"] }) {
  const variant: BadgeProps["variant"] =
    status === "approved"
      ? "success"
      : status === "rejected"
        ? "destructive"
        : "warning";

  const label =
    status === "approved"
      ? "Approved"
      : status === "rejected"
        ? "Rejected"
        : "Pending";

  const Icon =
    status === "approved" ? CheckCircle2 : status === "rejected" ? XCircle : Clock;

  return (
    <Badge variant={variant} className="gap-1.5">
      <Icon className="h-4 w-4" />
      {label}
    </Badge>
  );
}
