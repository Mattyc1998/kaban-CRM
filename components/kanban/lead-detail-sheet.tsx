"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lead, LeadActivity } from "@prisma/client";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  addNote,
  deleteLead,
  getLeadActivities,
  triggerResearch,
} from "@/lib/actions/leads";

const ACTIVITY_LABEL: Record<LeadActivity["type"], string> = {
  REPLY: "Reply",
  NOTE: "Note",
  STAGE_CHANGE: "Stage change",
};

export function LeadDetailSheet({
  lead,
  onOpenChange,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!lead) return;
    getLeadActivities(lead.id).then(setActivities);
  }, [lead]);

  if (!lead) return null;

  function handleAddNote() {
    if (!note.trim() || !lead) return;
    startTransition(async () => {
      await addNote({ leadId: lead.id, content: note });
      setNote("");
      const fresh = await getLeadActivities(lead.id);
      setActivities(fresh);
      router.refresh();
    });
  }

  function handleResearch() {
    if (!lead) return;
    startTransition(async () => {
      await triggerResearch(lead.id);
      toast.success("Research complete");
      router.refresh();
      onOpenChange(false);
    });
  }

  function handleDelete() {
    if (!lead) return;
    startTransition(async () => {
      await deleteLead(lead.id);
      toast.success("Lead deleted");
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={!!lead} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{lead.name}</SheetTitle>
          <SheetDescription>
            {lead.company || "No company"} · {lead.email || "No email"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <div>
            <h3 className="mb-1 text-sm font-medium">AI Research</h3>
            <Badge variant="outline">{lead.aiResearchStatus}</Badge>
            {lead.aiSummary && (
              <p className="mt-2 text-sm text-muted-foreground">{lead.aiSummary}</p>
            )}
            {lead.aiPainPoints && (
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium">Pain points: </span>
                {lead.aiPainPoints}
              </p>
            )}
            {lead.aiCallAngle && (
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium">Call angle: </span>
                {lead.aiCallAngle}
              </p>
            )}
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              disabled={pending}
              onClick={handleResearch}
            >
              Run research
            </Button>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-medium">Add a note</h3>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Notes about this lead..."
              rows={3}
            />
            <Button size="sm" className="mt-2" disabled={pending} onClick={handleAddNote}>
              Save note
            </Button>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-medium">Activity</h3>
            <div className="space-y-3">
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}
              {activities.map((a) => (
                <div key={a.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {ACTIVITY_LABEL[a.type]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1">{a.content}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <Button variant="destructive" size="sm" disabled={pending} onClick={handleDelete}>
            Delete lead
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
