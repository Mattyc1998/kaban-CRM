"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { CopilotMessage } from "@prisma/client";
import { toast } from "sonner";
import { Bot, Send, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getCopilotHistory, sendCopilotMessage, resetCopilotConversation } from "@/lib/actions/copilot";

type LocalMessage = Pick<CopilotMessage, "role" | "content"> & { pending?: boolean };

export function CopilotLauncher() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [resetting, startReset] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    getCopilotHistory().then(setMessages);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "USER", content: text }]);

    startTransition(async () => {
      const { reply } = await sendCopilotMessage(text);
      setMessages((prev) => [...prev, { role: "ASSISTANT", content: reply }]);
    });
  }

  function handleNewChat() {
    startReset(async () => {
      await resetCopilotConversation();
      setMessages([]);
      toast.success("Started a new conversation");
    });
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-6 bottom-6 z-40 h-11 gap-2 rounded-full px-4 shadow-lg shadow-primary/30",
          open && "hidden"
        )}
      >
        <Bot className="size-4" />
        ClearFlow Copilot
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader>
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="flex items-center gap-2">
                <Bot className="size-4 text-primary" />
                ClearFlow Copilot
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground"
                disabled={resetting || messages.length === 0}
                onClick={handleNewChat}
              >
                <RotateCcw className="size-3.5" />
                New Chat
              </Button>
            </div>
            <SheetDescription>
              Ask about leads, projects, or the pipeline — it can also add tasks, notes, and move
              things you name explicitly.
            </SheetDescription>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
            {messages.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Try: “How many leads are ready to call?” or “Add a task to the Vanguard project.”
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.role === "USER"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {m.content}
              </div>
            ))}
            {pending && (
              <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                Thinking…
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 border-t border-border/60 p-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message ClearFlow Copilot..."
              rows={2}
              className="resize-none"
            />
            <Button size="icon" onClick={handleSend} disabled={pending}>
              <Send className="size-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
