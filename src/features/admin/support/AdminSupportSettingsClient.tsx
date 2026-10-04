"use client";

import { useEffect, useState, useCallback } from "react";
import { Info } from "lucide-react";
import { adminTicketsApi } from "@/services/api/support";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { extractApiError } from "@/lib/utils";
import type { SupportSettingsResponse } from "@/types/api";

export function AdminSupportSettingsClient() {
  const [settings, setSettings] = useState<SupportSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state — mirrors the partial-update contract
  const [autoClose, setAutoClose]           = useState("72");
  const [notifyCreated, setNotifyCreated]   = useState(true);
  const [notifyReopened, setNotifyReopened] = useState(true);
  const [notifyResolved, setNotifyResolved] = useState(true);
  const [maxAttachments, setMaxAttachments] = useState("6");

  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await adminTicketsApi.getSettings();
    if (res.ok) {
      const d = res.data;
      setSettings(d);
      setAutoClose(String(d.autoCloseIdleHours));
      setNotifyCreated(d.notifyAdminOnTicketCreated);
      setNotifyReopened(d.notifyAdminOnTicketReopened);
      setNotifyResolved(d.notifyCustomerOnTicketResolved);
      setMaxAttachments(String(d.maxAttachmentsPerComment));
    } else {
      setError(extractApiError(res.error, "Failed to load support settings."));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveError(""); setSaveSuccess(false);

    const hrs = parseInt(autoClose);
    const att = parseInt(maxAttachments);

    if (isNaN(hrs) || hrs < 1 || hrs > 720) {
      setSaveError("Auto-close hours must be between 1 and 720.");
      setSaving(false); return;
    }
    if (isNaN(att) || att < 0 || att > 6) {
      setSaveError("Max attachments must be between 0 and 6.");
      setSaving(false); return;
    }

    const res = await adminTicketsApi.updateSettings({
      autoCloseIdleHours: hrs,
      notifyAdminOnTicketCreated: notifyCreated,
      notifyAdminOnTicketReopened: notifyReopened,
      notifyCustomerOnTicketResolved: notifyResolved,
      maxAttachmentsPerComment: att,
    });
    setSaving(false);
    if (res.ok) {
      setSettings(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(extractApiError(res.error, "Failed to save settings."));
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load" description={error} onRetry={load} />;

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
      <AdminPageHeader
        title="Support Settings"
        description="Auto-close window, notifications and attachment limits."
        action={<Button type="submit" variant="primary" size="sm" loading={saving}>Save Changes</Button>}
      />

      {saveError && <p role="alert" className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-md px-4 py-2">{saveError}</p>}
      {saveSuccess && <p className="text-body-sm text-success bg-success/5 border border-success/20 rounded-md px-4 py-2">Support settings saved.</p>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Auto-close + attachments */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Behaviour</h3>
          <Input
            label="Auto-close after (hours)"
            type="number"
            min={1}
            max={720}
            value={autoClose}
            onChange={(e) => setAutoClose(e.target.value)}
            hint="A resolved ticket closes automatically after this many hours of customer silence."
          />
          <Input
            label="Max attachments per message"
            type="number"
            min={0}
            max={6}
            value={maxAttachments}
            onChange={(e) => setMaxAttachments(e.target.value)}
            hint="0 to 6. Customers cannot attach more than this limit per reply."
          />
        </div>

        {/* Notifications */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-4">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Notifications</h3>
          <Toggle
            id="notify-created"
            label="Email support when a ticket is opened"
            checked={notifyCreated}
            onChange={setNotifyCreated}
          />
          <Toggle
            id="notify-reopened"
            label="Email support when a ticket is reopened"
            checked={notifyReopened}
            onChange={setNotifyReopened}
          />
          <Toggle
            id="notify-resolved"
            label="Email the customer when a ticket is resolved"
            checked={notifyResolved}
            onChange={setNotifyResolved}
          />
        </div>

        {/* Admin notification address — read-only */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col gap-3">
          <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2">Admin notifications</h3>
          <div className="flex items-start gap-2 text-caption text-foreground-muted bg-muted/50 rounded-md px-3 py-2.5">
            <Info className="size-3.5 shrink-0 mt-0.5" />
            <span>Admin notification address is configured at deployment via <code className="text-[10px] font-mono">Support__AdminNotificationEmail</code> — it cannot be changed here.</span>
          </div>
          {settings && (
            <div className="flex flex-col gap-1">
              <label className="text-caption font-medium text-foreground-muted uppercase tracking-wide">Current address</label>
              {settings.adminNotificationConfigured ? (
                <code className="text-body-sm font-mono text-foreground bg-muted px-3 py-2 rounded-md border border-border">
                  {settings.adminNotificationTarget}
                </code>
              ) : (
                <span className="text-body-sm text-warning">Not configured — internal alerts will not be sent.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
