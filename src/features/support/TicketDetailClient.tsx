"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Paperclip, Send, RotateCcw, CheckCircle, X, RefreshCw, Image as ImageIcon, Video } from "lucide-react";
import { ticketsApi } from "@/services/api/support";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { cn, extractApiError } from "@/lib/utils";
import type {
  TicketDetailResponse, TicketCommentResponse, TicketHistoryEntry,
  TicketAttachment, TicketAttachmentInput,
} from "@/types/api";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

// ── Attachment picker ─────────────────────────────────────────────────────

interface AttachmentPickerProps {
  uploads: TicketAttachmentInput[];
  onChange: (u: TicketAttachmentInput[]) => void;
  maxCount: number;
}

function AttachmentPicker({ uploads, onChange, maxCount }: AttachmentPickerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = "";

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      setUploadError("Unsupported file type. Allowed: JPEG, PNG, WebP, GIF, AVIF, MP4, WebM, MOV.");
      return;
    }
    if (isImage && file.size > MAX_IMAGE_BYTES) {
      setUploadError("Image must be 10 MB or smaller.");
      return;
    }
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      setUploadError("Video must be 25 MB or smaller.");
      return;
    }
    if (uploads.length >= maxCount) {
      setUploadError(`Maximum ${maxCount} attachments per message.`);
      return;
    }

    setUploadError(""); setUploading(true);
    const res = await ticketsApi.uploadMedia(file);
    setUploading(false);
    if (res.ok) {
      const a = res.data;
      onChange([...uploads, {
        kind: a.kind, publicId: a.publicId, secureUrl: a.secureUrl,
        format: a.format, contentType: a.contentType,
        width: a.width, height: a.height, durationSeconds: a.durationSeconds,
        sizeBytes: a.sizeBytes, altText: a.altText,
      }]);
    } else {
      const code = (res.error as { code?: string }).code;
      if (code === "UPLOAD_FAILED") {
        setUploadError("Upload failed — you can still send your message without this file, or try again.");
      } else {
        setUploadError(extractApiError(res.error, "Upload failed."));
      }
    }
  }

  function remove(idx: number) {
    onChange(uploads.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {uploads.map((u, i) => (
          <div key={u.publicId} className="relative group flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-[11px] text-foreground-muted">
            {u.kind === "Image" ? <ImageIcon className="size-3 shrink-0" /> : <Video className="size-3 shrink-0" />}
            <span className="max-w-[100px] truncate">{u.publicId.split("/").pop()}</span>
            <button type="button" onClick={() => remove(i)} aria-label="Remove" className="ml-1 text-foreground-muted hover:text-danger">
              <X className="size-3" />
            </button>
          </div>
        ))}
        {uploads.length < maxCount && (
          <label className={cn(
            "flex items-center gap-1.5 h-8 px-3 rounded-lg border-2 border-dashed border-border cursor-pointer text-[11px] text-foreground-muted",
            "hover:border-border-strong hover:text-foreground transition-colors",
            uploading && "opacity-50 pointer-events-none",
          )}>
            <Paperclip className="size-3" />
            {uploading ? "Uploading…" : "Attach"}
            <input ref={inputRef} type="file" accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",")} onChange={handleFile} className="sr-only" />
          </label>
        )}
      </div>
      {uploadError && <p className="text-caption text-danger">{uploadError}</p>}
    </div>
  );
}

// ── Comment composer ──────────────────────────────────────────────────────

interface ComposerProps {
  ticketId: string;
  parentCommentId?: string | null;
  maxAttachments: number;
  isClosed: boolean;
  onPosted: (comment: TicketCommentResponse) => void;
  onCancel?: () => void;
  compact?: boolean;
}

function Composer({ ticketId, parentCommentId, maxAttachments, isClosed, onPosted, onCancel, compact }: ComposerProps) {
  const [body, setBody] = useState("");
  const [uploads, setUploads] = useState<TicketAttachmentInput[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && uploads.length === 0) return;
    setError(""); setSending(true);
    const res = await ticketsApi.postComment(ticketId, {
      body: body.trim(),
      parentCommentId: parentCommentId ?? null,
      attachments: uploads.length ? uploads : undefined,
    });
    setSending(false);
    if (res.ok) {
      setBody(""); setUploads([]);
      onPosted(res.data);
    } else {
      setError(extractApiError(res.error, "Failed to send message."));
    }
  }

  return (
    <form onSubmit={handleSend} noValidate className={cn("flex flex-col gap-2", compact ? "mt-2 pl-4 border-l-2 border-border" : "mt-4")}>
      {isClosed && (
        <p className="text-caption text-foreground-muted bg-muted rounded-md px-3 py-2">
          Replying will reopen this request.
        </p>
      )}
      {error && <p className="text-caption text-danger">{error}</p>}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={compact ? 2 : 3}
        placeholder={isClosed ? "Reopen this request…" : "Write a reply…"}
        maxLength={10000}
        aria-label="Reply"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-focus resize-none"
      />
      <div className="flex items-center justify-between gap-3">
        <AttachmentPicker uploads={uploads} onChange={setUploads} maxCount={maxAttachments} />
        <div className="flex gap-2 shrink-0">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={sending}>Cancel</Button>
          )}
          <Button type="submit" variant="primary" size="sm" loading={sending} disabled={!body.trim() && uploads.length === 0} iconLeft={<Send className="size-3.5" />}>
            {isClosed ? "Reopen & Send" : "Send"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ── Attachment display ────────────────────────────────────────────────────

function AttachmentDisplay({ attachment }: { attachment: TicketAttachment }) {
  if (attachment.kind === "Image") {
    return (
      <a href={attachment.secureUrl} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.secureUrl}
          alt={attachment.altText ?? "Attachment"}
          loading="lazy"
          style={attachment.width && attachment.height ? { aspectRatio: `${attachment.width}/${attachment.height}` } : undefined}
          className="max-h-48 max-w-xs rounded-lg object-cover border border-border"
        />
      </a>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[12px]">
      <Video className="size-4 text-foreground-muted shrink-0" />
      <span className="text-foreground-muted">{attachment.publicId.split("/").pop()}</span>
      {attachment.durationSeconds && (
        <span className="text-foreground-muted">
          {Math.floor(attachment.durationSeconds / 60)}:{String(Math.floor(attachment.durationSeconds % 60)).padStart(2, "0")}
        </span>
      )}
      <a href={attachment.secureUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-primary text-[11px] underline underline-offset-2">
        Open
      </a>
    </div>
  );
}

// ── Comment tree (recursive) ──────────────────────────────────────────────

interface CommentNodeProps {
  comment: TicketCommentResponse;
  ticketId: string;
  maxAttachments: number;
  isClosed: boolean;
  onPosted: (c: TicketCommentResponse, parentId: string) => void;
}

function CommentNode({ comment, ticketId, maxAttachments, isClosed, onPosted }: CommentNodeProps) {
  const [replyOpen, setReplyOpen] = useState(false);

  const time = new Date(comment.createdAtUtc).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className={cn(
      "flex flex-col gap-2",
      comment.depth > 0 && "ml-6 pl-4 border-l-2 border-border",
    )}>
      <div className={cn(
        "rounded-xl px-4 py-3 flex flex-col gap-2",
        comment.isAdminAuthor
          ? "bg-[#f8f9fb] border border-[#e1e2e4]"
          : "bg-white border border-[#e1e2e4]",
      )}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
              comment.isAdminAuthor ? "bg-[#0D0D0D] text-white" : "bg-[#f3f4f6] text-[#191c1e]",
            )}>
              {(comment.authorName?.[0] ?? "?").toUpperCase()}
            </span>
            <div>
              <span className="text-[13px] font-semibold text-[#191c1e]">
                {comment.isAdminAuthor ? "Support Team" : comment.authorName ?? "You"}
              </span>
              <span className="text-[11px] text-[#5A6578] ml-2">{time}</span>
            </div>
          </div>
        </div>

        {comment.body && (
          <p className="text-[13px] text-[#444748] leading-relaxed whitespace-pre-wrap">{comment.body}</p>
        )}

        {comment.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {comment.attachments.map((a, i) => (
              <AttachmentDisplay key={a.id ?? i} attachment={a} />
            ))}
          </div>
        )}

        {comment.depth < 6 && (
          <button
            type="button"
            onClick={() => setReplyOpen((v) => !v)}
            className="self-start text-[11px] text-[#5A6578] hover:text-[#191c1e] underline underline-offset-2 transition-colors"
          >
            {replyOpen ? "Cancel reply" : "Reply"}
          </button>
        )}

        {replyOpen && (
          <Composer
            ticketId={ticketId}
            parentCommentId={comment.id}
            maxAttachments={maxAttachments}
            isClosed={isClosed}
            onPosted={(c) => { onPosted(c, comment.id); setReplyOpen(false); }}
            onCancel={() => setReplyOpen(false)}
            compact
          />
        )}
      </div>

      {comment.replies.map((r) => (
        <CommentNode
          key={r.id}
          comment={r}
          ticketId={ticketId}
          maxAttachments={maxAttachments}
          isClosed={isClosed}
          onPosted={onPosted}
        />
      ))}
    </div>
  );
}

// ── History row ───────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: TicketHistoryEntry }) {
  const time = new Date(entry.occurredAtUtc).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const actor = entry.actor === "System" ? "Automatically" : (entry.actorName ?? entry.actor);
  const desc = entry.toStatus
    ? `${actor} ${entry.fromStatus ? "changed status" : "opened"} → ${entry.toStatus}`
    : `${actor} updated`;

  return (
    <div className="flex items-start gap-3 py-2 border-b border-[#f3f4f6] last:border-none">
      <div className={cn(
        "h-2 w-2 rounded-full mt-1.5 shrink-0",
        entry.actor === "System" ? "bg-foreground-muted" : entry.isAdminAuthor ? "bg-[#0D0D0D]" : "bg-blue-500",
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[#444748]">{desc}</p>
        {entry.note && <p className="text-[12px] text-[#5A6578] italic mt-0.5">"{entry.note}"</p>}
      </div>
      <span className="text-[11px] text-[#5A6578] shrink-0">{time}</span>
    </div>
  );
}

// Extend history entry type for isAdminAuthor (not in spec but useful)
declare module "@/types/api" {
  interface TicketHistoryEntry {
    isAdminAuthor?: boolean;
  }
}

// ── Main client ───────────────────────────────────────────────────────────

interface TicketDetailClientProps {
  ticketId: string;
  maxAttachments?: number;
}

export function TicketDetailClient({ ticketId, maxAttachments = 6 }: TicketDetailClientProps) {
  const [ticket, setTicket] = useState<TicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await ticketsApi.get(ticketId);
    if (res.ok) setTicket(res.data.ticket);
    else setError("Failed to load this request.");
    setLoading(false);
  }, [ticketId]);

  // Refetch on window focus — auto-close may have fired
  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  // Append a newly posted comment into the tree
  function handlePosted(newComment: TicketCommentResponse, parentId?: string) {
    setTicket((prev) => {
      if (!prev) return prev;
      // Optimistically update status if closed ticket was replied to
      const updatedStatus = prev.status === "Closed" ? "Open" : prev.status;
      if (!parentId) {
        return { ...prev, status: updatedStatus, comments: [...prev.comments, newComment] };
      }
      function insertReply(comments: TicketCommentResponse[]): TicketCommentResponse[] {
        return comments.map((c) => {
          if (c.id === parentId) return { ...c, replies: [...c.replies, newComment] };
          return { ...c, replies: insertReply(c.replies) };
        });
      }
      return { ...prev, status: updatedStatus, comments: insertReply(prev.comments) };
    });
  }

  async function handleClose() {
    if (!ticket) return;
    setClosing(true);
    const res = await ticketsApi.close(ticket.id, { note: undefined });
    setClosing(false);
    if (res.ok) setTicket((t) => t ? { ...t, status: "Closed", closedAtUtc: new Date().toISOString() } : t);
    else if ((res.error as { status?: number }).status === 409) void load();
  }

  async function handleReopen() {
    if (!ticket) return;
    setReopening(true);
    const res = await ticketsApi.reopen(ticket.id);
    setReopening(false);
    if (res.ok) setTicket((t) => t ? { ...t, status: "Open", reopenCount: (t.reopenCount ?? 0) + 1 } : t);
  }

  if (loading) return <TicketDetailSkeleton />;
  if (error || !ticket) return (
    <div className="flex flex-col gap-4 items-center py-12 text-center">
      <p className="text-body-sm text-foreground-muted">{error ?? "Request not found."}</p>
      <Button variant="outline" size="sm" onClick={load} iconLeft={<RefreshCw className="size-3.5" />}>Retry</Button>
    </div>
  );

  const isClosed = ticket.status === "Closed";
  const isResolved = ticket.status === "Resolved";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Back */}
      <Link href="/account/support" className="inline-flex items-center gap-1.5 text-[13px] text-[#5A6578] hover:text-[#191c1e] w-fit">
        <ArrowLeft className="size-3.5" />
        Back to requests
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-[18px] font-bold text-[#191c1e] leading-snug">{ticket.subject}</h1>
            <p className="text-[11px] font-mono text-[#5A6578] mt-0.5">{ticket.ticketNumber}</p>
          </div>
          <TicketStatusBadge status={ticket.status} />
        </div>
        <div className="flex items-center gap-3 flex-wrap text-[12px] text-[#5A6578]">
          {ticket.orderNumber && (
            <Link href={`/account/orders/${ticket.relatedOrderId}`} className="underline underline-offset-2 hover:text-[#191c1e]">
              Order {ticket.orderNumber}
            </Link>
          )}
          <span>Opened {new Date(ticket.createdAtUtc).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          {ticket.reopenCount > 0 && (
            <span className="text-warning font-medium">Reopened {ticket.reopenCount}×</span>
          )}
          {isResolved && ticket.autoCloseAtUtc && (
            <span className="text-[#5A6578]">
              Auto-closes {new Date(ticket.autoCloseAtUtc).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex flex-col gap-4">
        {ticket.comments.map((c) => (
          <CommentNode
            key={c.id}
            comment={c}
            ticketId={ticket.id}
            maxAttachments={maxAttachments}
            isClosed={isClosed}
            onPosted={handlePosted}
          />
        ))}
      </div>

      {/* Top-level composer */}
      <div className="rounded-2xl border border-[#e1e2e4] bg-white p-4">
        <Composer
          ticketId={ticket.id}
          maxAttachments={maxAttachments}
          isClosed={isClosed}
          onPosted={(c) => handlePosted(c)}
        />
      </div>

      {/* Resolved actions */}
      {isResolved && (
        <div className="rounded-2xl border border-success/20 bg-success/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-[#191c1e]">Was your issue resolved?</p>
            <p className="text-[12px] text-[#5A6578] mt-0.5">Close the request if you're satisfied, or reopen if you still need help.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              loading={reopening}
              onClick={handleReopen}
              iconLeft={<RotateCcw className="size-3.5" />}
            >
              Reopen
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={closing}
              onClick={handleClose}
              iconLeft={<CheckCircle className="size-3.5" />}
            >
              Yes, it&apos;s resolved
            </Button>
          </div>
        </div>
      )}

      {/* Closed reopen */}
      {isClosed && (
        <div className="rounded-2xl border border-border bg-muted/40 p-4 flex items-center justify-between gap-4">
          <p className="text-[13px] text-[#5A6578]">This request is closed.</p>
          <Button variant="outline" size="sm" loading={reopening} onClick={handleReopen} iconLeft={<RotateCcw className="size-3.5" />}>
            Reopen
          </Button>
        </div>
      )}

      {/* History */}
      {ticket.history && ticket.history.length > 0 && (
        <div className="rounded-2xl border border-[#e1e2e4] bg-white p-4">
          <h2 className="text-[13px] font-semibold text-[#191c1e] mb-3">Activity</h2>
          <div className="flex flex-col">
            {ticket.history.map((h) => <HistoryRow key={h.id} entry={h} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl" aria-hidden="true">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-64" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}
