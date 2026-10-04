/**
 * Support Desk API
 * Customer routes: /api/v1/tickets/**
 * Admin routes:    /api/v1/admin/tickets/** and /api/v1/admin/support/settings
 *
 * Invoice endpoints (Part 2) are NOT implemented here — they are not live yet.
 * Do not add them until the backend ships.
 */
import { apiClient } from "./client";
import type {
  PagedResponse,
  TicketSummaryResponse,
  TicketDetailEnvelope,
  TicketCommentResponse,
  TicketAttachment,
  SupportSettingsResponse,
  UpdateSupportSettingsRequest,
  CreateTicketRequest,
  PostTicketCommentRequest,
  CloseTicketRequest,
  ReopenTicketRequest,
  ResolveTicketRequest,
  SetTicketPriorityRequest,
  TicketStatus,
  TicketPriority,
} from "@/types/api";

// ── Customer ──────────────────────────────────────────────────────────────────

export const ticketsApi = {
  /**
   * GET /api/v1/tickets?status=&page=&pageSize=
   * Scoped to the authenticated customer from the token.
   */
  list: (params: { status?: TicketStatus; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    qs.set("page", String(params.page ?? 1));
    qs.set("pageSize", String(params.pageSize ?? 20));
    return apiClient.get<PagedResponse<TicketSummaryResponse>>(`/api/v1/tickets?${qs}`);
  },

  /**
   * POST /api/v1/tickets — create a new ticket.
   * Returns 201 TicketSummaryResponse.
   */
  create: (data: CreateTicketRequest) =>
    apiClient.post<TicketSummaryResponse>("/api/v1/tickets", data),

  /**
   * GET /api/v1/tickets/{ticketId}
   * Returns { ticket, fullHistory }. Use ticket.history on customer screens.
   */
  get: (ticketId: string) =>
    apiClient.get<TicketDetailEnvelope>(`/api/v1/tickets/${ticketId}`),

  /**
   * POST /api/v1/tickets/{ticketId}/comments
   * Returns 201 TicketCommentResponse — append directly to the thread.
   * Replying to a closed ticket silently reopens it.
   */
  postComment: (ticketId: string, data: PostTicketCommentRequest) =>
    apiClient.post<TicketCommentResponse>(`/api/v1/tickets/${ticketId}/comments`, data),

  /**
   * POST /api/v1/tickets/media — multipart/form-data
   * Step 1 of the two-step attachment flow.
   * Returns TicketAttachment (without id — that is assigned on the comment).
   */
  uploadMedia: (file: File, altText?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (altText) fd.append("altText", altText);
    return apiClient.postForm<TicketAttachment>("/api/v1/tickets/media", fd);
  },

  /**
   * POST /api/v1/tickets/{ticketId}/close
   * Only valid when status === "Resolved".
   */
  close: (ticketId: string, data: CloseTicketRequest = {}) =>
    apiClient.post<TicketSummaryResponse>(`/api/v1/tickets/${ticketId}/close`, data),

  /**
   * POST /api/v1/tickets/{ticketId}/reopen
   * Valid from Resolved and Closed.
   */
  reopen: (ticketId: string, data: ReopenTicketRequest = {}) =>
    apiClient.post<TicketSummaryResponse>(`/api/v1/tickets/${ticketId}/reopen`, data),
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminTicketsApi = {
  /**
   * GET /api/v1/admin/tickets
   * Unknown status/priority values return 400 — never silently ignored.
   */
  list: (params: {
    status?: TicketStatus;
    priority?: TicketPriority;
    search?: string;
    unansweredOnly?: boolean;
    page?: number;
    pageSize?: number;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.priority) qs.set("priority", params.priority);
    if (params.search) qs.set("search", params.search);
    if (params.unansweredOnly) qs.set("unansweredOnly", "true");
    qs.set("page", String(params.page ?? 1));
    qs.set("pageSize", String(params.pageSize ?? 20));
    return apiClient.get<PagedResponse<TicketSummaryResponse>>(`/api/v1/admin/tickets?${qs}`);
  },

  /** GET /api/v1/admin/tickets/{ticketId} */
  get: (ticketId: string) =>
    apiClient.get<TicketDetailEnvelope>(`/api/v1/admin/tickets/${ticketId}`),

  /**
   * POST /api/v1/admin/tickets/{ticketId}/comments?isInternalNote=true
   * isInternalNote is a QUERY PARAMETER — not a body field.
   */
  postComment: (ticketId: string, data: PostTicketCommentRequest, isInternalNote = false) =>
    apiClient.post<TicketCommentResponse>(
      `/api/v1/admin/tickets/${ticketId}/comments?isInternalNote=${isInternalNote}`,
      data,
    ),

  /** POST /api/v1/admin/tickets/{ticketId}/resolve */
  resolve: (ticketId: string, data: ResolveTicketRequest = {}) =>
    apiClient.post<TicketSummaryResponse>(`/api/v1/admin/tickets/${ticketId}/resolve`, data),

  /** POST /api/v1/admin/tickets/{ticketId}/priority */
  setPriority: (ticketId: string, data: SetTicketPriorityRequest) =>
    apiClient.post<TicketSummaryResponse>(`/api/v1/admin/tickets/${ticketId}/priority`, data),

  /**
   * POST /api/v1/admin/tickets/{ticketId}/assign
   * Assigns the ticket to the calling admin (no body needed).
   */
  assign: (ticketId: string) =>
    apiClient.post<TicketSummaryResponse>(`/api/v1/admin/tickets/${ticketId}/assign`),

  /**
   * GET /api/v1/admin/support/settings
   * PUT /api/v1/admin/support/settings — partial update, omit fields to leave as-is
   */
  getSettings: () =>
    apiClient.get<SupportSettingsResponse>("/api/v1/admin/support/settings"),

  updateSettings: (data: UpdateSupportSettingsRequest) =>
    apiClient.put<SupportSettingsResponse>("/api/v1/admin/support/settings", data),
};
