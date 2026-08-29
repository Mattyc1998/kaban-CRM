"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Proposal } from "@prisma/client";
import { toast } from "sonner";
import { Copy, ExternalLink, CheckCircle2, XCircle, FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_TEMPLATES } from "@/lib/project-templates";
import { PROPOSAL_STATUS_BADGE } from "@/components/proposals/proposal-card";
import { getProposalDetail, updateProposal, markProposalSent, convertProposalToProject } from "@/lib/actions/proposals";

export type ProposalSummary = Proposal & {
  contact: { id: string; name: string; company: string | null } | null;
};

type ProposalDetail = Proposal & {
  contact: { id: string; name: string; company: string | null } | null;
  project: { id: string; name: string; portalSlug: string } | null;
};

function proposalPath(slug: string) {
  return `/proposal/${slug}`;
}

export function ProposalDetailDialog({
  proposal,
  onOpenChange,
}: {
  proposal: ProposalSummary | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [scope, setScope] = useState("");
  const [price, setPrice] = useState("");
  const [templateKey, setTemplateKey] = useState("");
  const [detail, setDetail] = useState<ProposalDetail | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [prevId, setPrevId] = useState<string | null>(null);
  if ((proposal?.id ?? null) !== prevId) {
    setPrevId(proposal?.id ?? null);
    setTitle(proposal?.title ?? "");
    setClientName(proposal?.clientName ?? "");
    setClientCompany(proposal?.clientCompany ?? "");
    setClientEmail(proposal?.clientEmail ?? "");
    setScope(proposal?.scope ?? "");
    setPrice(proposal?.price?.toString() ?? "");
    setTemplateKey("");
    setDetail(null);
  }

  useEffect(() => {
    if (!proposal) return;
    getProposalDetail(proposal.id).then(setDetail);
  }, [proposal]);

  if (!proposal) return null;

  const current = detail ?? proposal;
  const locked = current.status === "SIGNED" || current.status === "DECLINED";

  function refresh() {
    if (!proposal) return;
    getProposalDetail(proposal.id).then(setDetail);
    router.refresh();
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}${proposalPath(proposal!.publicSlug)}`);
    toast.success("Proposal link copied");
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProposal({
          id: proposal!.id,
          title,
          clientName,
          clientCompany,
          clientEmail,
          scope,
          price: price || undefined,
        });
        toast.success("Proposal saved");
        refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function handleMarkSent() {
    startTransition(async () => {
      await markProposalSent({ id: proposal!.id });
      toast.success("Marked as sent");
      refresh();
    });
  }

  function handleConvert() {
    startTransition(async () => {
      try {
        const project = await convertProposalToProject({
          proposalId: proposal!.id,
          templateKey: templateKey || undefined,
        });
        toast.success("Project created");
        refresh();
        window.open(`/portal/${project.portalSlug}`, "_blank");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to convert");
      }
    });
  }

  return (
    <Dialog open={!!proposal} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{current.title}</DialogTitle>
            <Badge variant="outline" className={cn("text-[10px]", PROPOSAL_STATUS_BADGE[current.status])}>
              {current.status}
            </Badge>
          </div>
          <DialogDescription>
            {current.contact ? `Linked to contact: ${current.contact.name}` : "Not linked to a contact"}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Shareable proposal link
          </p>
          <div className="flex items-center justify-between gap-2">
            <code className="truncate text-xs text-muted-foreground">{proposalPath(proposal.publicSlug)}</code>
            <div className="flex shrink-0 gap-1.5">
              <Button variant="secondary" size="sm" onClick={copyLink}>
                <Copy className="size-3.5" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(proposalPath(proposal.publicSlug), "_blank")}
              >
                View
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {current.status === "SIGNED" && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            Signed by {current.signedName} on{" "}
            {current.signedAt && new Date(current.signedAt).toLocaleString()}
          </div>
        )}
        {current.status === "DECLINED" && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
            <XCircle className="size-4 shrink-0" />
            This proposal was declined.
          </div>
        )}

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pd-title">Title</Label>
            <Input id="pd-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={locked} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pd-client">Client name</Label>
              <Input id="pd-client" value={clientName} onChange={(e) => setClientName(e.target.value)} disabled={locked} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pd-company">Client business</Label>
              <Input id="pd-company" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} disabled={locked} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pd-email">Client email</Label>
            <Input id="pd-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} disabled={locked} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pd-scope">Scope of work</Label>
            <Textarea id="pd-scope" rows={6} value={scope} onChange={(e) => setScope(e.target.value)} disabled={locked} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pd-price">Price (£)</Label>
            <Input id="pd-price" type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)} disabled={locked} />
          </div>

          {!locked && (
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={pending}>
                Save changes
              </Button>
              {current.status === "DRAFT" && (
                <Button variant="secondary" onClick={handleMarkSent} disabled={pending}>
                  Mark as Sent
                </Button>
              )}
            </div>
          )}
        </div>

        {current.status === "SIGNED" && detail && (
          <div className="mt-2 border-t border-border/60 pt-4">
            {detail.project ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
                <p className="text-sm">
                  Converted to project: <span className="font-medium">{detail.project.name}</span>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/portal/${detail.project!.portalSlug}`, "_blank")}
                >
                  View Portal
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Convert to project</p>
                <div className="flex items-center gap-2">
                  <Select value={templateKey} onValueChange={(v) => setTemplateKey(v ?? "")}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Blank project (no preset tasks)" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TEMPLATES.map((t) => (
                        <SelectItem key={t.key} value={t.key}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button disabled={pending} onClick={handleConvert}>
                    <FolderPlus className="size-3.5" />
                    Create Project
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
