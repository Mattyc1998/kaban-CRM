"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProposal } from "@/lib/actions/proposals";

export type CompanyOption = {
  id: string;
  name: string;
  primaryContact: { name: string; email: string | null } | null;
};

function defaultValidUntil() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function NewProposalDialog({ companies }: { companies: CompanyOption[] }) {
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleCompanyChange(value: string | null) {
    const id = value ?? "";
    setCompanyId(id);
    const company = companies.find((c) => c.id === id);
    if (company) {
      setClientCompany(company.name);
      setClientName(company.primaryContact?.name ?? "");
      setClientEmail(company.primaryContact?.email ?? "");
    }
  }

  function reset() {
    setCompanyId("");
    setClientName("");
    setClientCompany("");
    setClientEmail("");
    setValidUntil(defaultValidUntil());
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createProposal({
          title: formData.get("title"),
          companyId: companyId || undefined,
          clientName,
          clientCompany,
          clientEmail,
          scope: formData.get("scope"),
          price: formData.get("price") || undefined,
          clientProvides: formData.get("clientProvides") || undefined,
          paymentTerms: formData.get("paymentTerms") || undefined,
          validUntil: validUntil || undefined,
        });
        toast.success("Proposal created");
        setOpen(false);
        reset();
        router.refresh();
      } catch {
        toast.error("Failed to create proposal");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            New Proposal
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New proposal</DialogTitle>
            <DialogDescription>
              Generates a shareable link the client can review and sign.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pr-title">Title</Label>
              <Input id="pr-title" name="title" placeholder="e.g. Website Redesign — Composite Interiors" required />
            </div>
            <div className="grid gap-2">
              <Label>Existing company (optional)</Label>
              <Select value={companyId} onValueChange={handleCompanyChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None — enter client details manually" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.primaryContact && ` — ${c.primaryContact.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pr-client">Client name</Label>
                <Input id="pr-client" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pr-company">Client business</Label>
                <Input id="pr-company" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pr-email">Client email</Label>
              <Input
                id="pr-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pr-scope">Scope of work</Label>
              <Textarea id="pr-scope" name="scope" rows={6} required placeholder="What's included, timeline, revision rounds..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pr-price">Price (£)</Label>
                <Input id="pr-price" name="price" type="number" min={0} step={1} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pr-valid">Valid until</Label>
                <Input
                  id="pr-valid"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pr-terms">Payment terms</Label>
              <Textarea
                id="pr-terms"
                name="paymentTerms"
                rows={2}
                placeholder="e.g. 50% deposit on signing, 50% on completion"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pr-provides">What we need from the client</Label>
              <Textarea
                id="pr-provides"
                name="clientProvides"
                rows={2}
                placeholder="e.g. Logo & brand assets, page copy, domain/hosting login"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create proposal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
