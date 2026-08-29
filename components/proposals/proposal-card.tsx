"use client";

import type { Proposal } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const PROPOSAL_STATUS_BADGE: Record<Proposal["status"], string> = {
  DRAFT: "bg-slate-500/15 text-slate-300 border-slate-500/20",
  SENT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  SIGNED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  DECLINED: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

export function ProposalCard({
  proposal,
  onClick,
}: {
  proposal: Proposal & { contact: { name: string; company: string | null } | null };
  onClick?: () => void;
}) {
  return (
    <Card
      className="cursor-pointer gap-2 border-border/60 py-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="px-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={cn("text-[10px]", PROPOSAL_STATUS_BADGE[proposal.status])}>
            {proposal.status}
          </Badge>
          {proposal.price != null && (
            <span className="text-xs font-semibold text-foreground/80">
              £{proposal.price.toLocaleString()}
            </span>
          )}
        </div>

        <p className="mt-2 truncate text-sm font-medium leading-tight">{proposal.title}</p>
        {(proposal.clientCompany || proposal.clientName || proposal.contact) && (
          <p className="truncate text-xs text-muted-foreground">
            {proposal.clientCompany ||
              proposal.contact?.company ||
              proposal.clientName ||
              proposal.contact?.name}
          </p>
        )}

        {proposal.status === "SIGNED" && proposal.signedAt && (
          <p className="mt-2 text-[11px] text-emerald-400">
            Signed {new Date(proposal.signedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
