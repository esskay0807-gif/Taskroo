"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  getConversations,
  getMe,
  getMessages,
  sendMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MessageThread({ conversationId }: { conversationId: string }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getMe(await getToken()),
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => getConversations(await getToken()),
    refetchInterval: 4000,
  });
  const conv = conversations?.find((c) => c.id === conversationId);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => getMessages(await getToken(), conversationId),
    refetchInterval: 4000,
  });

  const mutation = useMutation({
    mutationFn: async (text: string) =>
      sendMessage(await getToken(), conversationId, text),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (text) mutation.mutate(text);
  }

  return (
    <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
          {conv?.other_user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={conv.other_user.avatar_url}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            initials(conv?.other_user.name ?? null)
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">
            {conv?.other_user.name ?? "Conversation"}
          </p>
          {conv && (
            <Link
              href={`/tasks/${conv.task.id}`}
              className="truncate text-xs text-muted-foreground hover:underline"
            >
              {conv.task.title}
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/20 p-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {messages && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello 👋
          </p>
        )}
        {messages?.map((m) => {
          const mine = me && m.sender_id === me.id;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                  mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border bg-card text-foreground",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    mine
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {timeLabel(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <form onSubmit={submit} className="flex gap-2 border-t p-3">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="h-11 rounded-full"
        />
        <Button
          type="submit"
          className="rounded-full px-6"
          disabled={!body.trim() || mutation.isPending}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
