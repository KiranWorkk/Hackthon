import { cn } from "cn";

export type StatusBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

const VARIANT_CLASSES: Record<StatusBadgeVariant, string> = {
  default: "bg-slate-50 text-slate-700 border-slate-200",
  success:
    "bg-status-success-bg text-status-success border-status-success-border",
  warning:
    "bg-status-warning-bg text-status-warning border-status-warning-border",
  error: "bg-status-error-bg text-status-error border-status-error-border",
  info: "bg-status-info-bg text-status-info border-status-info-border",
  neutral: "bg-[#FAFAFA] text-[#0A0A0A] border-[#E5E5E5]",
};

const DOT_CLASSES: Record<StatusBadgeVariant, string> = {
  default: "bg-slate-400",
  success: "bg-status-success",
  warning: "bg-status-warning",
  error: "bg-status-error",
  info: "bg-status-info",
  neutral: "bg-slate-400",
};

function formatTitle(label: string) {
  return label
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({
  label,
  variant = "default",
  className,
}: {
  label: string;
  variant?: StatusBadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASSES[variant])} />
      {formatTitle(label)}
    </span>
  );
}

const COMMON_STATUS_MAP: Record<string, StatusBadgeVariant> = {
  CONFIRMED: "success",
  COMPLETED: "success",
  SIGNED: "success",
  CANCELLED: "error",
  CANCELED: "error",
  VOID: "error",
  "NO SHOW": "error",
  PENDING: "warning",
  "FOR REVIEW": "warning",
  RESCHEDULED: "warning",
  "WALK IN": "warning",
  "CHECKED IN": "info",
  "IN PROGRESS": "info",
  "NOT STARTED": "default",
};

export function getStatusConfig(status: string | null | undefined): {
  label: string;
  variant: StatusBadgeVariant;
} {
  const normalized = (status ?? "").toUpperCase().replace(/_/g, " ").trim();
  return {
    label: status ?? "Unknown",
    variant: COMMON_STATUS_MAP[normalized] ?? "default",
  };
}
