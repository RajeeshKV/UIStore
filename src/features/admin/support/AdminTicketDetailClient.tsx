"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Send, UserCheck, Lock, RefreshCw,
  ChevronDown, Paperclip, X, Image as ImageIcon, Video,
} from "lucide-react";
import { adminTicketsApi, ticketsApi } from "@/services/api/support";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/features/admin/AdminStatusBadge";
import { ConfirmDialog } from "@/features/admin/AdminDialog";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TicketStatusBadge, TicketPriorityBadge } from "@/features/support/TicketStatusBadge";
import { cn, extractApiError } from "@/lib/utils";
import type {
  TicketDetailResponse, TicketCommentResponse, TicketHistoryEntry,
  TicketAttachment, TicketAttachmentInput, TicketPriority,
} from "@/types/api";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 25 * 1024 * 1024;

// ── Attachment upload ─────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<TicketAttachmentInput | string> {
  const isImage = ALLOWED_IMAGE.includes(file.type);
  const isVideo = ALLOWED_VIDEO.includes(file.type);
  if (!isImage && !isVideo) return "Unsupported file type.";
  if (isImage && file.size > MAX_IMAGE) return "Image must be 10 MB or smaller.";
  if (isVideo && file.size > MAX_VIDEO) return "Video must be 25 MB or smaller.";
  const res = await ticketsApi.uploadMedia(file);
  if (!res.ok) return extractApiError(res.error, "Upload failed.");
  const a = res.data;
  return {
    kind: a.kind, publicId: a.publicId, secureUrl: a.secureUrl,
    format: a.format, contentType: a.contentType,
    width: a.width, height: a.height, durationSeconds: a.durationSeconds,
    sizeBytes: a.sizeBytes, altText: a.altText,
  };
}

// ── Attachment display ────────────────────────────────────────────────────

function AttachmentDisplay({ a }: { a: TicketAttachment }) {
  if (a.kind === "Image") {
    return (
      <a href={a.secureUrl} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.secureUrl} alt={a.altText ?? ""} loading="lazy" className="max-h-40 max-w-xs rounded-lg object-cover border border-border" />
      </a>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[12px]">
      <Video className="size-4 text-foreground-muted shrink-0" />
      <a href={a.secureUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
        {a.publicId.split("/").pop()}
      </a>
    </div>
  );
}

// ── Admin composer (normal + internal) ───────────────────────────────────

interface AdminComposerProps {
  ticketId: string;
  maxAttachments: number;
  parentCommentId?: string | null;
  defaultInternal?: boolean;
  onPosted: (c: TicketCommentResponse) => void;
  onCancel?: () => void;
  compact?: boolean;
}

function AdminComposer({
  ticketId, maxAttachments, parentCommentId,
  defaultInternal = false, onPosted, onCancel, compact,
}: AdminComposerProps) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(defaultInternal);
  const [uploads, setUploads] = useState<TicketAttachmentInput[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploads.length >= maxAttachments) return;
    if (e.target) e.target.value = "";
    setUploading(true); setUploadErr("");
    const result = await uploadFile(file);
    setUploading(false);
    if (typeof result === "string") setUploadErr(result);
    else setUploads((u) => [...u, result]);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && uploads.length === 0) return;
    setError(""); setSending(true);
    const res = await adminTicketsApi.postComment(
      ticketId,
      { body: body.trim(), parentCommentId: parentCommentId ?? null, attachments: uploads.length ? uploads : undefined },
      isInternal,
    );
    setSending(false);
    if (res.ok) { setBody(""); setUploads([]); onPosted(res.data); }
    else setError(extractApiError(res.error, "Failed to send."));
  }

  return (
    <form onSubmit={handleSend} noValidate className={cn("flex flex-col gap-2", compact ? "mt-2 ml-4 pl-3 border-l-2 border-border" : "")}>
      {/* Internal toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsInternal((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold border transition-all",
            isInternal
              ? "bg-warning/10 text-warning border-warning/30"
              : "bg-muted text-foreground-muted border-border hover:border-border-strong",
          )}
        >
          <Lock className="size-3" />
          {isInternal ? "Internal note" : "Customer reply"}
        </button>
        {isInternal && (
          <span className="text-[10px] text-warning font-medium">Not visible to customer</span>
        )}
      </div>

      {error && <p className="text-caption text-danger">{error}</p>}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={compact ? 2 : 3}
        maxLength={10000}
        placeholder={isInternal ? "Internal note — not visible to customer…" : "Reply to customer…"}
        aria-label="Message body"
        className={cn(
          "w-full rounded-md border px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none",
          isInternal ? "border-warning/40 bg-warning/5 focus:ring-warning/30" : "border-border bg-background",
        )}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {uploads.map((u, i) => (
            <div key={u.publicId} className="flex items-center gap-1 text-[11px] bg-muted px-2 py-1 rounded border border-border text-foreground-muted">
              {u.kind === "Image" ? <ImageIcon className="size-3" /> : <Video className="size-3" />}
              <span className="max-w-[80px] truncate">{u.publicId.split("/").pop()}</span>
              <button type="button" onClick={() => setUploads((u2) => u2.filter((_, j) => j !== i))}><X className="size-3 hover:text-danger" /></button>
            </div>
          ))}
          {uploads.length < maxAttachments && (
            <label className={cn(
              "flex items-center gap-1 h-7 px-2.5 rounded-md border border-dashed border-border text-[11px] text-foreground-muted cursor-pointer hover:border-border-strong transition-colors",
              uploading && "opacity-50 pointer-events-none",
            )}>
              <Paperclip className="size-3" />
              {uploading ? "…" : "Attach"}
              <input type="file" accept={[...ALLOWED_IMAGE, ...ALLOWED_VIDEO].join(",")} onChange={handleFile} className="sr-only" />
            </label>
          )}
          {uploadErr && <span className="text-caption text-danger">{uploadErr}</span>}
        </div>
        <div className="flex gap-2 shrink-0">
          {onCancel && <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={sending}>Cancel</Button>}
          <Button type="submit" variant="primary" size="sm" loading={sending} disabled={!body.trim() && uploads.length === 0} iconLeft={<Send className="size-3.5" />}>
            Send
          </Button>
        </div>
      </div>
    </form>
  );
}

// ── Comment node (recursive, with internal note styling) ──────────────────

interface AdminCommentNodeProps {
  comment: TicketCommentResponse;
  ticketId: string;
  maxAttachments: number;
  onPosted: (c: TicketCommentResponse, parentId: string) => void;
}

function AdminCommentNode({ comment, ticketId, maxAttachments, onPosted }: AdminCommentNodeProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const time = new Date(comment.createdAtUtc).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={cn("flex flex-col gap-2", comment.depth > 0 && "ml-6 pl-4 border-l-2 border-border")}>
      <div className={cn(
        "rounded-xl px-4 py-3 flex flex-col gap-2 border",
        comment.isInternalNote
          ? "bg-warning/5 border-warning/30"
          : comment.isAdminAuthor
            ? "bg-[#f8f9fb] border-[#e1e2e4]"
            : "bg-white border-[#e1e2e4]",
      )}>
        {/* Internal note badge */}
        {comment.isInternalNote && (
          <div className="flex items-center gap-1.5 mb-1">
            <Lock className="size-3 text-warning" />
            <span className="text-[10px] font-bold text-warning uppercase tracking-wide">Internal note — not visible to customer</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
            comment.isAdminAuthor ? "bg-[#0D0D0D] text-white" : "bg-[#f3f4f6] text-[#191c1e]",
          )}>
            {(comment.authorName?.[0] ?? "?").toUpperCase()}
          </span>
          <span className="text-body-sm font-semibold text-foreground">{comment.authorName ?? (comment.isAdminAuthor ? "Admin" : "Customer")}</span>
          <span className="text-caption text-foreground-muted">{time}</span>
        </div>

        {comment.body && <p className="text-body-sm text-foreground-muted whitespace-pre-wrap leading-relaxed">{comment.body}</p>}

        {comment.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {comment.attachments.map((a, i) => <AttachmentDisplay key={a.id ?? i} a={a} />)}
          </div>
        )}

        {/* Reply — cannot reply under internal note from customer side; admin can */}
        {comment.depth < 6 && (
          <button
            type="button"
            onClick={() => setReplyOpen((v) => !v)}
            className="self-start text-[11px] text-foreground-muted hover:text-foreground underline underline-offset-2 transition-colors"
          >
            {replyOpen ? "Cancel" : comment.isInternalNote ? "Reply as internal note" : "Reply"}
          </button>
        )}

        {replyOpen && (
          <AdminComposer
            ticketId={ticketId}
            maxAttachments={maxAttachments}
            parentCommentId={comment.id}
            defaultInternal={comment.isInternalNote}
            onPosted={(c) => { onPosted(c, comment.id); setReplyOpen(false); }}
            onCancel={() => setReplyOpen(false)}
            compact
          />
        )}
      </div>

      {comment.replies.map((r) => (
        <AdminCommentNode key={r.id} comment={r} ticketId={ticketId} maxAttachments={maxAttachments} onPosted={onPosted} />
      ))}
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: TicketHistoryEntry }) {
  const time = new Date(entry.occurredAtUtc).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const actor = entry.actor === "System" ? "System (auto)" : (entry.actorName ?? entry.actor);
  const desc = entry.toStatus
    ? `${actor} → ${entry.toStatus}${entry.fromStatus ? ` (was ${entry.fromStatus})` : ""}`
    : actor;

  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-none text-body-sm">
      <span className={cn(
        "h-2 w-2 rounded-full mt-1.5 shrink-0",
        entry.actor === "System" ? "bg-foreground-muted" : "bg-primary",
      )} />
      <div className="flex-1">
        <p className="text-foreground">{desc}</p>
        {entry.note && <p className="text-caption text-foreground-muted italic">"{entry.note}"</p>}
      </div>
      <span className="text-caption text-foreground-muted shrink-0 whitespace-nowrap">{time}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

interface Props { ticketId: string; maxAttachments?: number }

export function AdminTicketDetailClient({ ticketId, maxAttachments = 6 }: Props) {
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Actions
  const [resolveOpen, setResolveOpen]   = useState(false);
  const [resolveNote, setResolveNote]   = useState("");
  const [resolving, setResolving]       = useState(false);
  const [assigning, setAssigning]       = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [setPrioritySaving, setSetPrioritySaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await adminTicketsApi.get(ticketId);
    if (res.ok) setTicket(res.data.ticket);
    else setError(extractApiError(res.error, "Failed to load ticket."));
    setLoading(false);
  }, [ticketId]);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  function handlePosted(newComment: TicketCommentResponse, parentId?: string) {
    setTicket((prev) => {
      if (!prev) return prev;
      if (!parentId) return { ...prev, comments: [...prev.comments, newComment] };
      function insert(list: TicketCommentResponse[]): TicketCommentResponse[] {
        return list.map((c) => {
          if (c.id === parentId) return { ...c, replies: [...c.replies, newComment] };
          return { ...c, replies: insert(c.replies) };
        });
      }
      return { ...prev, comments: insert(prev.comments) };
    });
  }

  async function handleResolve() {
    if (!ticket) return;
    setResolving(true);
    const res = await adminTicketsApi.resolve(ticket.id, { resolutionNote: resolveNote.trim() || undefined });
    setResolving(false);
    if (res.ok) { setResolveOpen(false); setTicket((t) => t ? { ...t, status: "Resolved" } : t); }
  }

  async function handleAssign() {
    if (!ticket) return;
    setAssigning(true);
    const res = await adminTicketsApi.assign(ticket.id);
    setAssigning(false);
    if (res.ok) setTicket((t) => t ? { ...t, assignedAdminId: res.data.assignedAdminId } : t);
  }

  async function handleSetPriority(p: TicketPriority) {
    if (!ticket) return;
    setPriorityOpen(false);
    setSetPrioritySaving(true);
    const res = await adminTicketsApi.setPriority(ticket.id, { priority: p });
    setSetPrioritySaving(false);
    if (res.ok) setTicket((t) => t ? { ...t, priority: p } : t);
  }

  if (loading) return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );

  if (error || !ticket) return (
    <div className="flex flex-col gap-4 items-center py-12 text-center">
      <p className="text-body-sm text-foreground-muted">{error ?? "Ticket not found."}</p>
      <Button variant="outline" size="sm" onClick={load} iconLeft={<RefreshCw className="size-3.5" />}>Retry</Button>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/support")} aria-label="Back" className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-h3 font-bold text-foreground truncate">{ticket.subject}</h2>
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
            <div className="flex items-center gap-3 text-caption text-foreground-muted flex-wrap mt-0.5">
              <span>{ticket.ticketNumber}</span>
              <span>{ticket.customerName} · {ticket.customerEmail}</span>
              {ticket.orderNumber && <span>Order {ticket.orderNumber}</span>}
              {ticket.reopenCount > 0 && <span className="text-warning font-medium">Reopened {ticket.reopenCount}×</span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {!ticket.assignedAdminId && (
              <Button variant="outline" size="sm" loading={assigning} onClick={handleAssign} iconLeft={<UserCheck className="size-3.5" />}>
                Assign me
              </Button>
            )}
            {ticket.assignedAdminId && (
              <span className="text-caption text-foreground-muted flex items-center gap-1"><UserCheck className="size-3.5 text-success" /> Assigned</span>
            )}

            {/* Priority dropdown */}
            <div className="relative">
              <Button variant="outline" size="sm" loading={setPrioritySaving} onClick={() => setPriorityOpen((v) => !v)} iconLeft={<ChevronDown className="size-3.5" />}>
                Priority
              </Button>
              {priorityOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                  {(["Low", "Normal", "High", "Urgent"] as TicketPriority[]).map((p) => (
                    <button key={p} onClick={() => handleSetPriority(p)}
                      className={cn("w-full text-left px-3 py-2 text-body-sm hover:bg-muted transition-colors", ticket.priority === p && "font-bold text-primary")}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {ticket.status === "Open" && (
              <Button variant="secondary" size="sm" onClick={() => setResolveOpen(true)}>
                Resolve
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Thread — 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {ticket.comments.map((c) => (
              <AdminCommentNode key={c.id} comment={c} ticketId={ticket.id} maxAttachments={maxAttachments} onPosted={handlePosted} />
            ))}

            {ticket.comments.length === 0 && (
              <p className="text-body-sm text-foreground-muted">No messages yet.</p>
            )}

            {/* Main composer */}
            <div className="rounded-lg border border-border bg-background p-4">
              <AdminComposer ticketId={ticket.id} maxAttachments={maxAttachments} onPosted={(c) => handlePosted(c)} />
            </div>
          </div>

          {/* Sidebar — 1 col */}
          <div className="flex flex-col gap-4">
            {/* History */}
            {ticket.history && ticket.history.length > 0 && (
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="text-body-sm font-semibold text-foreground border-b border-border pb-2 mb-3">History</h3>
                <div className="flex flex-col">
                  {ticket.history.map((h) => <HistoryRow key={h.id} entry={h} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resolve dialog */}
      <ConfirmDialog
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        onConfirm={handleResolve}
        title="Resolve ticket"
        description=""
        confirmLabel="Resolve"
        confirmVariant="primary"
        loading={resolving}
      >
        <div className="flex flex-col gap-3 -mt-2">
          <p className="text-body-sm text-foreground-muted">
            The ticket will close automatically after 72 hours of inactivity unless the customer replies.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-foreground">Resolution note (optional, shown to customer)</label>
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="e.g. Refund raised with the courier."
              aria-label="Resolution note"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none"
            />
            <p className="text-caption text-foreground-muted">This note is customer-visible. Use an internal note for private reasoning.</p>
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
