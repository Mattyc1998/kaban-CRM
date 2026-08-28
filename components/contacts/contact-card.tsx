"use client";

import { Mail, Phone, Building2, FolderKanban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContactWithProjects } from "@/components/contacts/contact-detail-dialog";

export function ContactCard({
  contact,
  onClick,
}: {
  contact: ContactWithProjects;
  onClick?: () => void;
}) {
  const totalSpent = contact.projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);

  return (
    <Card
      className="cursor-pointer gap-2 border-border/60 py-3 shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="px-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-orange-400 text-sm font-bold text-primary-foreground">
            {(contact.company || contact.name)[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">{contact.name}</p>
            {contact.company && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Building2 className="size-3 shrink-0" />
                {contact.company}
              </p>
            )}
          </div>
        </div>

        <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
          {contact.email && (
            <p className="flex items-center gap-1.5 truncate">
              <Mail className="size-3 shrink-0" />
              {contact.email}
            </p>
          )}
          {contact.phone && (
            <p className="flex items-center gap-1.5 truncate">
              <Phone className="size-3 shrink-0" />
              {contact.phone}
            </p>
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
          <Badge variant="outline" className="gap-1 text-[10px]">
            <FolderKanban className="size-3" />
            {contact.projects.length} Project{contact.projects.length === 1 ? "" : "s"}
          </Badge>
          <span className="text-xs font-semibold text-emerald-400">
            £{totalSpent.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
