"use client";

import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { getMe, getMessages, sendMessage } from "@/lib/api";
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

export function MessageThread({ conversationId }: { conversationId: string }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getMe(await getToken()),
  });

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
    <div className="flex h-[60vh] flex-col rounded-lg border">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading && <p className="text-sm">Loading…</p>}
        {messages && messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No messages yet. Say hello.
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
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                  mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
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
      <form onSubmit={submit} className="flex gap-2 border-t p-3">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
        />
        <Button type="submit" disabled={!body.trim() || mutation.isPending}>
          Send
        </Button>
      </form>
    </div>
  );
}
