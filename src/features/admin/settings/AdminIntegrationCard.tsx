import { Shield, CheckCircle, XCircle } from "lucide-react";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { cn } from "@/lib/utils";
import type { IntegrationStatusResponse } from "@/types/api";

interface AdminIntegrationCardProps {
  title: string;
  description: string;
  status: IntegrationStatusResponse | null;
  loading?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function AdminIntegrationCard({
  title,
  description,
  status,
  loading,
  children,
  icon,
}: AdminIntegrationCardProps) {
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground-muted">
          {icon ?? <Shield className="size-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold text-foreground">{title}</p>
          <p className="text-caption text-foreground-muted">{description}</p>
        </div>
        {loading ? (
          <div className="h-5 w-20 animate-skeleton rounded-full bg-muted" />
        ) : status ? (
          <div className="flex items-center gap-2">
            {status.isConfigured ? (
              <CheckCircle className="size-4 text-success" aria-hidden="true" />
            ) : (
              <XCircle className="size-4 text-danger" aria-hidden="true" />
            )}
            <AdminStatusBadge
              status={status.enabled && status.isConfigured ? "configured" : status.isConfigured ? "disabled" : "not_configured"}
              label={status.enabled && status.isConfigured ? "Enabled" : status.isConfigured ? "Disabled" : "Not configured"}
            />
          </div>
        ) : null}
      </div>

      {/* Masked key display */}
      {status?.maskedKeyId && (
        <div className={cn("flex items-center gap-2 border-b border-border px-6 py-3 bg-surface")}>
          <Shield className="size-3.5 text-foreground-muted shrink-0" aria-hidden="true" />
          <span className="text-caption text-foreground-muted">Key ID ending in</span>
          <code className="text-caption font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">
            …{status.maskedKeyId}
          </code>
          {status.hasSecret && (
            <span className="text-caption text-foreground-muted ml-1">· Secret configured</span>
          )}
        </div>
      )}

      {/* Form */}
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  );
}
