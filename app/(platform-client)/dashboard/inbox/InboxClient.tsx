"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  Send,
  Loader2,
  Globe,
  MessageCircle,
  Camera,
  MessagesSquare as MessengerIcon,
  UserCheck,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { isFallbackReply } from "@/lib/chat/lead-capture";
import { formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonBlock } from "@/components/platform/Skeleton";
import type {
  InboxConversationRow,
  InboxMessageRow,
  ConversationStatus,
} from "@/lib/inbox/queries";
import {
  takeoverConversation,
  handBackToAI,
  resolveConversation,
  sendHumanReply,
  markInboxSeen,
} from "./actions";

const CHANNEL_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  website: Globe,
  whatsapp: MessageCircle,
  instagram: Camera,
  messenger: MessengerIcon,
};

const STATUS_LABEL: Record<ConversationStatus, string> = {
  ai_handling: "AI handling",
  human_handling: "You're handling",
  resolved: "Resolved",
  archived: "Archived",
};

const STATUS_VARIANT: Record<
  ConversationStatus,
  "success" | "warning" | "secondary" | "outline"
> = {
  ai_handling: "secondary",
  human_handling: "warning",
  resolved: "success",
  archived: "outline",
};

/**
 * Mirrors the server-side heuristic in lib/inbox/queries.ts
 * (computeNeedsAttention) so Realtime updates can recompute the flag
 * client-side without a round trip. If you change the heuristic,
 * update both places — kept simple/duplicated on purpose rather than
 * sharing a client+server module for one small pure function.
 */
function needsAttentionClient(row: InboxConversationRow): boolean {
  if (row.status !== "ai_handling") return false;
  const fallbackTriggered =
    row.lastMessageRole === "assistant" &&
    !!row.lastMessagePreview &&
    isFallbackReply(row.lastMessagePreview);
  return fallbackTriggered;
}

export function InboxClient({
  organizationId,
  currentUserId,
  initialConversations,
}: {
  organizationId: string;
  currentUserId: string | null;
  initialConversations: InboxConversationRow[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] =
    useState<InboxConversationRow[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<InboxMessageRow[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [attentionOnly, setAttentionOnly] = useState(false);
  // Mobile only: which single pane is visible. Desktop always shows both
  // panes side by side regardless of this value (see md:flex overrides
  // below), so this never affects tablet/desktop layout.
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const threadRef = useRef<HTMLDivElement>(null);

  // Mark the inbox "seen" once on mount — clears the sidebar badge.
  useEffect(() => {
    markInboxSeen(organizationId);
  }, [organizationId]);

  // ---- Realtime subscription — scoped to this organization only. -------
  useEffect(() => {
    const channel = supabase
      .channel(`inbox-${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            conversation_id: string;
            role: string;
            content: string;
            created_at: string;
          };

          setConversations((prev) => {
            const next = prev.map((c) =>
              c.id === row.conversation_id
                ? {
                    ...c,
                    lastMessageAt: row.created_at,
                    lastMessagePreview: row.content,
                    lastMessageRole: row.role,
                    isUnread: row.conversation_id !== selectedIdRef.current,
                  }
                : c,
            );
            return next
              .map((c) =>
                c.id === row.conversation_id
                  ? { ...c, needsAttention: needsAttentionClient(c) }
                  : c,
              )
              .sort(
                (a, b) =>
                  new Date(b.lastMessageAt).getTime() -
                  new Date(a.lastMessageAt).getTime(),
              );
          });

          if (row.conversation_id === selectedIdRef.current) {
            setMessages((prev) =>
              prev.some((m) => m.id === row.id)
                ? prev
                : [
                    ...prev,
                    {
                      id: row.id,
                      role: row.role,
                      content: row.content,
                      createdAt: row.created_at,
                    },
                  ],
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            status: ConversationStatus;
            assigned_user_id: string | null;
            last_message_at: string;
          };
          setConversations((prev) =>
            prev.map((c) =>
              c.id === row.id
                ? {
                    ...c,
                    status: row.status,
                    assignedUserId: row.assigned_user_id,
                    needsAttention: needsAttentionClient({
                      ...c,
                      status: row.status,
                    }),
                  }
                : c,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            channel: string;
            channel_thread_id: string | null;
            visitor_id: string;
            visitor_display_name: string | null;
            status: ConversationStatus;
            assigned_user_id: string | null;
            started_at: string;
            last_message_at: string;
          };
          setConversations((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [
              {
                id: row.id,
                channel: row.channel,
                channelThreadId: row.channel_thread_id,
                visitorId: row.visitor_id,
                visitorLabel: row.visitor_display_name || row.visitor_id,
                status: row.status,
                assignedUserId: row.assigned_user_id,
                startedAt: row.started_at,
                lastMessageAt: row.last_message_at,
                lastMessagePreview: null,
                lastMessageRole: null,
                needsAttention: false,
                isUnread: true,
              },
              ...prev,
            ];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // Keep a ref of selectedId so the Realtime closure above (created
  // once per subscription) always reads the current selection.
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // ---- Load thread when selection changes. -------------------------------
  const loadThread = useCallback(
    async (conversationId: string) => {
      setMessagesLoading(true);
      setActionError(null);
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!error) {
        setMessages(
          (data ?? []).map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.created_at,
          })),
        );
      }
      setMessagesLoading(false);

      // Optimistically clear the unread flag for this row locally.
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, isUnread: false } : c,
        ),
      );
    },
    [supabase],
  );

  useEffect(() => {
    if (selectedId) loadThread(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages]);

  const filteredConversations = conversations.filter((c) => {
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (attentionOnly && !c.needsAttention) return false;
    return true;
  });

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const isMine = selected?.assignedUserId === currentUserId;

  const handleTakeover = () => {
    if (!selected) return;
    setIsBusy(true);
    setActionError(null);
    takeoverConversation(selected.id).then((result) => {
      setIsBusy(false);
      if (result.error) setActionError(result.error);
    });
  };

  const handleHandBack = () => {
    if (!selected) return;
    setIsBusy(true);
    setActionError(null);
    handBackToAI(selected.id).then((result) => {
      setIsBusy(false);
      if (result.error) setActionError(result.error);
    });
  };

  const handleResolve = () => {
    if (!selected) return;
    setIsBusy(true);
    setActionError(null);
    resolveConversation(selected.id).then((result) => {
      setIsBusy(false);
      if (result.error) setActionError(result.error);
    });
  };

  const handleSend = () => {
    if (!selected || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    setIsBusy(true);
    setActionError(null);
    sendHumanReply(selected.id, text).then((result) => {
      setIsBusy(false);
      if (result.error) setActionError(result.error);
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 md:grid md:grid-cols-[340px_1fr]">
      {/* Left pane — conversation list */}
      <div
        className={`min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card md:flex md:flex-none ${
          mobileView === "thread" ? "hidden" : "flex"
        }`}
      >
        {" "}
        <div className="flex flex-none flex-col gap-2 border-b border-border p-3">
          <div className="flex gap-2">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 font-body text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All channels</option>
              <option value="website">Website</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="messenger">Messenger</option>
              <option value="instagram">Instagram</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 font-body text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All statuses</option>
              <option value="ai_handling">AI handling</option>
              <option value="human_handling">You&apos;re handling</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <label className="flex items-center gap-2 font-body text-xs text-secondary-text">
            <input
              type="checkbox"
              checked={attentionOnly}
              onChange={(e) => setAttentionOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border accent-[var(--color-primary)]"
            />
            Needs attention only
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <p className="p-4 font-body text-sm text-secondary-text">
              No conversations match these filters.
            </p>
          ) : (
            filteredConversations.map((c) => {
              const Icon = CHANNEL_ICONS[c.channel] ?? Globe;
              const isSelected = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(c.id);
                    setMobileView("thread");
                  }}
                  className={`flex w-full flex-col gap-1 border-b border-border px-3 py-3 text-left transition-colors duration-150 ${
                    isSelected ? "bg-primary/10" : "hover:bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Icon
                        className="h-3.5 w-3.5 flex-none text-secondary-text"
                        strokeWidth={1.75}
                      />
                      <span className="truncate font-body text-sm font-medium text-foreground">
                        {c.visitorLabel}
                      </span>
                      {c.isUnread && (
                        <span className="h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="flex-none font-body text-[10px] text-secondary-text">
                      {formatDate(c.lastMessageAt)}
                    </span>
                  </div>
                  <p className="truncate font-body text-xs text-secondary-text">
                    {c.lastMessagePreview ?? "No messages yet"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={STATUS_VARIANT[c.status]}
                      className="text-[10px]"
                    >
                      {STATUS_LABEL[c.status]}
                    </Badge>
                    {c.needsAttention && (
                      <span className="flex animate-pulse items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[10px] font-semibold text-white motion-reduce:animate-none">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Needs attention
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right pane — thread + composer */}
      <div
        className={`min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card md:flex ${
          mobileView === "thread" ? "flex" : "hidden"
        }`}
      >
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
            <MessageCircle
              className="h-8 w-8 text-secondary-text"
              strokeWidth={1.5}
            />
            <p className="font-body text-sm text-secondary-text">
              Select a conversation from the left to view it.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-none items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  aria-label="Back to conversation list"
                  className="-ml-1.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg text-secondary-text hover:bg-background hover:text-foreground md:hidden"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-semibold text-foreground">
                    {selected.visitorLabel}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[selected.status]}>
                      {STATUS_LABEL[selected.status]}
                    </Badge>
                    <span className="font-body text-xs capitalize text-secondary-text">
                      {selected.channel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-none gap-2">
                {selected.status === "ai_handling" && (
                  <Button size="sm" onClick={handleTakeover} disabled={isBusy}>
                    {isBusy ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                    Take over
                  </Button>
                )}
                {selected.status === "human_handling" && isMine && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleHandBack}
                      disabled={isBusy}
                    >
                      <Undo2 className="h-4 w-4" />
                      Hand back to AI
                    </Button>
                    <Button size="sm" onClick={handleResolve} disabled={isBusy}>
                      <CheckCircle2 className="h-4 w-4" />
                      Mark resolved
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto p-4">
              {messagesLoading ? (
                <div className="flex flex-col gap-2.5" aria-hidden="true">
                  <div className="flex items-end gap-2">
                    <SkeletonBlock className="h-6 w-6 flex-none rounded-full" />
                    <SkeletonBlock className="h-9 w-2/5 rounded-2xl rounded-bl-md" />
                  </div>
                  <div className="flex flex-row-reverse items-end gap-2">
                    <SkeletonBlock className="h-6 w-6 flex-none rounded-full" />
                    <SkeletonBlock className="h-12 w-1/2 rounded-2xl rounded-br-md" />
                  </div>
                  <div className="flex items-end gap-2">
                    <SkeletonBlock className="h-6 w-6 flex-none rounded-full" />
                    <SkeletonBlock className="h-9 w-1/3 rounded-2xl rounded-bl-md" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {messages.map((m) => (
                    <MessageRow key={m.id} message={m} />
                  ))}
                </div>
              )}
            </div>

            {selected.status === "human_handling" && isMine ? (
              <div className="flex flex-none items-center gap-2 border-t border-border p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Reply as yourself…"
                  disabled={isBusy}
                  className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2.5 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!draft.trim() || isBusy}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : selected.status === "human_handling" ? (
              <div className="flex-none border-t border-border p-3 text-center font-body text-xs text-secondary-text">
                Another team member is currently handling this conversation.
              </div>
            ) : null}

            {actionError && (
              <p
                role="alert"
                className="flex-none border-t border-border px-3 py-2 font-body text-xs text-error"
              >
                {actionError}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: InboxMessageRow }) {
  const isHuman = message.role === "human_agent";
  const isUser = message.role === "user";

  const avatar = (
    <div
      className={`flex h-6 w-6 flex-none items-center justify-center rounded-full font-body text-[10px] font-bold ${
        isUser
          ? "bg-border text-foreground"
          : isHuman
            ? "bg-success text-primary-foreground"
            : "bg-primary text-primary-foreground"
      }`}
    >
      {isUser ? "V" : isHuman ? "H" : "AI"}
    </div>
  );

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? "justify-start" : "flex-row-reverse justify-start"}`}
    >
      {avatar}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 font-body text-sm leading-relaxed ${
          isUser
            ? "rounded-bl-md border border-border bg-background text-foreground"
            : isHuman
              ? "rounded-br-md bg-success text-primary-foreground"
              : "rounded-br-md bg-primary text-primary-foreground"
        }`}
      >
        {!isUser && (
          <p className="mb-1 font-body text-[10px] font-semibold uppercase tracking-wide opacity-75">
            {isHuman ? "You (human)" : "AI Assistant"}
          </p>
        )}
        {message.content}
      </div>
    </div>
  );
}
