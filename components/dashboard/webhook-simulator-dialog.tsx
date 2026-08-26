"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { simulateWebhook } from "@/lib/actions/webhooks";

type Source = "N8N" | "INSTANTLY";

export function WebhookSimulatorDialog() {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<Source>("N8N");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (source === "N8N") {
          await simulateWebhook("N8N", {
            name: formData.get("name"),
            company: formData.get("company"),
            email: formData.get("email") || undefined,
            note: formData.get("note") || undefined,
          });
        } else {
          await simulateWebhook("INSTANTLY", {
            name: formData.get("name"),
            company: formData.get("company"),
            email: formData.get("email"),
            replyBody: formData.get("replyBody"),
          });
        }
        toast.success(`Simulated ${source === "N8N" ? "n8n" : "Instantly.ai"} webhook call`);
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Webhook simulation failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Zap className="size-4" />
            Webhook Simulator
          </Button>
        }
      />
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Simulate an inbound webhook</DialogTitle>
            <DialogDescription>
              Sends a real payload through the same ingestion code the live
              n8n / Instantly.ai endpoints use.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 py-3">
            {(["N8N", "INSTANTLY"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  source === s
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {s === "N8N" ? "n8n HTTP call" : "Instantly.ai reply"}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sim-name">Name</Label>
              <Input id="sim-name" name="name" required={source === "N8N"} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sim-company">Company</Label>
              <Input id="sim-company" name="company" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sim-email">Email</Label>
              <Input
                id="sim-email"
                name="email"
                type="email"
                required={source === "INSTANTLY"}
              />
            </div>
            {source === "N8N" ? (
              <div className="grid gap-2">
                <Label htmlFor="sim-note">Note (optional)</Label>
                <Textarea id="sim-note" name="note" rows={2} />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="sim-reply">Reply body</Label>
                <Textarea id="sim-reply" name="replyBody" rows={3} required />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending..." : "Send simulated webhook"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
