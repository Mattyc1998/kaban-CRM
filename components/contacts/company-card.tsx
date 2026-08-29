"use client";

import Link from "next/link";
import { Mail, Users, FolderKanban, KanbanSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { monthlyRetainerValue, type CompanyWithRelations } from "@/lib/company-types";

export function CompanyCard({ company }: { company: CompanyWithRelations }) {
  const totalSpent = company.projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const monthlyRetainer = company.projects.reduce((sum, p) => sum + monthlyRetainerValue(p), 0);
  const primaryContact = company.contacts[0];

  return (
    <Link href={`/contacts/${company.id}`}>
      <Card className="gap-2 border-border/60 py-3 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="px-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-orange-400 text-sm font-bold text-primary-foreground">
              {company.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight">{company.name}</p>
              {primaryContact && (
                <p className="truncate text-xs text-muted-foreground">
                  {primaryContact.name}
                  {company.contacts.length > 1 && ` +${company.contacts.length - 1} more`}
                </p>
              )}
            </div>
          </div>

          {primaryContact?.email && (
            <p className="mt-2.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" />
              {primaryContact.email}
            </p>
          )}

          <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
            <div className="flex flex-wrap items-center gap-1">
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Users className="size-3" />
                {company.contacts.length}
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px]">
                <FolderKanban className="size-3" />
                {company.projects.length}
              </Badge>
              {company.leads.length > 0 && (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <KanbanSquare className="size-3" />
                  {company.leads.length}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-emerald-400">£{totalSpent.toLocaleString()}</p>
              {monthlyRetainer > 0 && (
                <p className="text-[10px] text-emerald-400/80">£{Math.round(monthlyRetainer).toLocaleString()}/mo</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
