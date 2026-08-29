"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Proposal } from "@prisma/client";
import { CheckCircle2, XCircle, FileText, PoundSterling, Download, CreditCard, ClipboardList, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { signProposal, declineProposal } from "@/lib/actions/proposal-public";

export function ProposalView({ proposal }: { proposal: Proposal }) {
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const clientDisplayName = proposal.clientCompany || proposal.clientName || "there";
  const isPending = proposal.status === "DRAFT" || proposal.status === "SENT";
  const isExpired = isPending && proposal.validUntil != null && new Date(proposal.validUntil) < new Date();

  function handleSign() {
    if (!name.trim()) {
      toast.error("Enter your full name to sign");
      return;
    }
    if (!agreed) {
      toast.error("Please confirm you agree to the scope and price above");
      return;
    }
    startTransition(async () => {
      try {
        await signProposal({ slug: proposal.publicSlug, name });
        toast.success("Proposal signed — thank you!");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to sign");
      }
    });
  }

  function handleDecline() {
    if (!confirm("Decline this proposal? This can't be undone.")) return;
    startTransition(async () => {
      try {
        await declineProposal({ slug: proposal.publicSlug });
        toast.success("Response recorded");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to decline");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-5 flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no benefit from next/image optimization */}
        <img src="/clearflow-mark.svg" alt="ClearFlow AI" className="size-7" />
        <span className="text-sm font-semibold tracking-tight text-muted-foreground">
          ClearFlow AI Proposal
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-border/60 bg-card p-5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{proposal.title}</h1>
            <Badge
              variant="outline"
              className={
                proposal.status === "SIGNED"
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                  : proposal.status === "DECLINED"
                  ? "border-rose-500/25 bg-rose-500/10 text-rose-400"
                  : "border-primary/25 bg-primary/10 text-primary"
              }
            >
              {proposal.status === "DRAFT" ? "PENDING REVIEW" : proposal.status}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => window.open(`/api/proposals/${proposal.publicSlug}/pdf`, "_blank")}
          >
            <Download className="size-3.5" />
            Download PDF
          </Button>
        </div>
        {(proposal.clientCompany || proposal.clientName) && (
          <p className="text-sm text-muted-foreground">
            Prepared for {[proposal.clientCompany, proposal.clientName].filter(Boolean).join(" — ")}
          </p>
        )}
        {proposal.validUntil && (
          <p className="mt-1 text-xs text-muted-foreground">
            Valid until {new Date(proposal.validUntil).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {isExpired && (
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          This proposal&rsquo;s validity date has passed — contact us if you&rsquo;d like an updated quote before signing.
        </div>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-primary" />
            Scope of Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{proposal.scope}</p>
        </CardContent>
      </Card>

      {proposal.price != null && (
        <Card className="mb-4">
          <CardContent className="flex items-center justify-between pt-4">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <PoundSterling className="size-4 text-primary" />
              Total Price
            </p>
            <p className="text-2xl font-bold">£{proposal.price.toLocaleString()}</p>
          </CardContent>
        </Card>
      )}

      {proposal.paymentTerms && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="size-4 text-primary" />
              Payment Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{proposal.paymentTerms}</p>
          </CardContent>
        </Card>
      )}

      {proposal.clientProvides && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ClipboardList className="size-4 text-primary" />
              What We Need From You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{proposal.clientProvides}</p>
          </CardContent>
        </Card>
      )}

      {proposal.status === "SIGNED" && (
        <Card className="border-emerald-500/25 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 pt-4">
            <CheckCircle2 className="size-8 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">Signed &amp; Accepted</p>
              <p className="text-xs text-muted-foreground">
                Signed by {proposal.signedName} on{" "}
                {proposal.signedAt && new Date(proposal.signedAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {proposal.status === "DECLINED" && (
        <Card className="border-rose-500/25 bg-rose-500/5">
          <CardContent className="flex items-center gap-3 pt-4">
            <XCircle className="size-8 shrink-0 text-rose-400" />
            <p className="text-sm font-semibold text-rose-400">This proposal was declined.</p>
          </CardContent>
        </Card>
      )}

      {(proposal.status === "DRAFT" || proposal.status === "SENT") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Accept this proposal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Hi {clientDisplayName} — type your full name below to accept the scope and price
              outlined above. This acts as your signature.
            </p>
            <Input
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
              I agree to the scope of work and price outlined above.
            </label>
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleDecline}
                disabled={pending}
                className="text-xs text-muted-foreground hover:text-rose-400 hover:underline"
              >
                Decline this proposal
              </button>
              <Button disabled={pending} onClick={handleSign}>
                {pending ? "Submitting..." : "Accept & Sign"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
