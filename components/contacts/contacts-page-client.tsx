"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Building2, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewCompanyDialog } from "@/components/contacts/new-company-dialog";
import { CompanyCard } from "@/components/contacts/company-card";
import { syncExistingContacts } from "@/lib/actions/contacts";
import { monthlyRetainerValue, type CompanyWithRelations } from "@/lib/company-types";

export function ContactsPageClient({ initialCompanies }: { initialCompanies: CompanyWithRelations[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [syncing, startSync] = useTransition();
  const router = useRouter();

  function handleSync() {
    startSync(async () => {
      const { linked } = await syncExistingContacts();
      toast.success(linked > 0 ? `Linked ${linked} existing lead${linked === 1 ? "" : "s"}/project${linked === 1 ? "" : "s"}` : "Everything is already synced");
      router.refresh();
    });
  }

  const totalSpent = initialCompanies.reduce(
    (sum, c) => sum + c.projects.reduce((s, p) => s + (p.budget ?? 0), 0),
    0
  );
  const totalMrr = initialCompanies.reduce(
    (sum, c) => sum + c.projects.reduce((s, p) => s + monthlyRetainerValue(p), 0),
    0
  );

  const filtered = initialCompanies.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.contacts.some((p) => p.name.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
            <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
              {initialCompanies.length} Compan{initialCompanies.length === 1 ? "y" : "ies"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Companies, their people, projects, and spend.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 gap-1.5 border-emerald-500/25 bg-emerald-500/10 px-3 text-sm text-emerald-400">
            Total Spent: £{totalSpent.toLocaleString()}
          </Badge>
          {totalMrr > 0 && (
            <Badge variant="outline" className="h-8 gap-1.5 border-teal-500/25 bg-teal-500/10 px-3 text-sm text-teal-400">
              MRR: £{Math.round(totalMrr).toLocaleString()}/mo
            </Badge>
          )}
          <Button variant="outline" size="sm" disabled={syncing} onClick={handleSync}>
            <RotateCw className={syncing ? "size-3.5 animate-spin" : "size-3.5"} />
            Sync Existing
          </Button>
          <NewCompanyDialog />
          <Button variant="outline" size="icon" onClick={() => router.refresh()}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      <Input
        placeholder="Search company, contact name, or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 py-16 text-center text-muted-foreground">
          <Building2 className="size-8" />
          <p className="text-sm">
            {initialCompanies.length === 0 ? "No companies yet — add one to get started." : "No companies match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
          {filtered.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      )}
    </div>
  );
}
