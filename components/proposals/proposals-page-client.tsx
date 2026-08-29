"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Proposal } from "@prisma/client";
import { RefreshCw, FileSignature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewProposalDialog } from "@/components/proposals/new-proposal-dialog";
import { ProposalCard } from "@/components/proposals/proposal-card";
import { ProposalDetailDialog, type ProposalSummary } from "@/components/proposals/proposal-detail-dialog";

type ProposalWithContact = Proposal & { contact: { id: string; name: string; company: string | null } | null };
type ContactOption = { id: string; name: string; company: string | null; email: string | null };

export function ProposalsPageClient({
  initialProposals,
  contacts,
}: {
  initialProposals: ProposalWithContact[];
  contacts: ContactOption[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<ProposalSummary | null>(null);
  const router = useRouter();

  const signedCount = initialProposals.filter((p) => p.status === "SIGNED").length;

  const filtered = initialProposals.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.clientName?.toLowerCase().includes(q) ||
      p.clientCompany?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Proposals</h1>
            <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
              {initialProposals.length} Total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Send a scope of work, get it signed, then convert it straight to a project.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 gap-1.5 border-emerald-500/25 bg-emerald-500/10 px-3 text-sm text-emerald-400">
            {signedCount} Signed
          </Badge>
          <NewProposalDialog contacts={contacts} />
          <Button variant="outline" size="icon" onClick={() => router.refresh()}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      <Input
        placeholder="Search title, client, or company..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 py-16 text-center text-muted-foreground">
          <FileSignature className="size-8" />
          <p className="text-sm">
            {initialProposals.length === 0
              ? "No proposals yet — create one to get started."
              : "No proposals match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
          {filtered.map((p) => (
            <ProposalCard key={p.id} proposal={p} onClick={() => setSelected(p)} />
          ))}
        </div>
      )}

      <ProposalDetailDialog proposal={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
