"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Contact, Project, Lead } from "@prisma/client";
import { toast } from "sonner";
import { ExternalLink, Link2, Unlink } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_STAGES } from "@/lib/project-stages";
import { KANBAN_STAGES } from "@/lib/kanban-stages";
import {
  getContactDetail,
  updateContact,
  linkProjectToContact,
  unlinkProjectFromContact,
  listUnlinkedProjects,
} from "@/lib/actions/contacts";

export type ContactWithProjects = Contact & {
  projects: Pick<Project, "id" | "name" | "stage" | "budget" | "portalSlug">[];
  leads: Pick<Lead, "id" | "name" | "stage">[];
};

type UnlinkedProject = { id: string; name: string; clientName: string | null; clientCompany: string | null };

export function ContactDetailDialog({
  contact,
  onOpenChange,
}: {
  contact: ContactWithProjects | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [detail, setDetail] = useState<ContactWithProjects | null>(null);
  const [unlinkedProjects, setUnlinkedProjects] = useState<UnlinkedProject[]>([]);
  const [projectToLink, setProjectToLink] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Reset the form during render (React's recommended pattern) whenever a
  // different contact is opened.
  const [prevContactId, setPrevContactId] = useState<string | null>(null);
  if ((contact?.id ?? null) !== prevContactId) {
    setPrevContactId(contact?.id ?? null);
    setName(contact?.name ?? "");
    setEmail(contact?.email ?? "");
    setPhone(contact?.phone ?? "");
    setCompany(contact?.company ?? "");
    setNotes(contact?.notes ?? "");
    setDetail(null);
    setProjectToLink("");
  }

  useEffect(() => {
    if (!contact) return;
    getContactDetail(contact.id).then(setDetail);
    listUnlinkedProjects().then(setUnlinkedProjects);
  }, [contact]);

  if (!contact) return null;

  const projects = detail?.projects ?? contact.projects;
  const leads = detail?.leads ?? contact.leads;

  function refresh() {
    if (!contact) return;
    getContactDetail(contact.id).then(setDetail);
    listUnlinkedProjects().then(setUnlinkedProjects);
    router.refresh();
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    startTransition(async () => {
      await updateContact({ id: contact!.id, name, email, phone, company, notes });
      toast.success("Contact saved");
      refresh();
    });
  }

  function handleLinkProject() {
    if (!projectToLink) return;
    startTransition(async () => {
      await linkProjectToContact({ contactId: contact!.id, projectId: projectToLink });
      setProjectToLink("");
      toast.success("Project linked");
      refresh();
    });
  }

  function handleUnlinkProject(projectId: string) {
    startTransition(async () => {
      await unlinkProjectFromContact({ projectId });
      toast.success("Project unlinked");
      refresh();
    });
  }

  const totalSpent = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);

  return (
    <Dialog open={!!contact} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{detail?.name ?? contact.name}</DialogTitle>
          <DialogDescription>
            {projects.length} linked project{projects.length === 1 ? "" : "s"}
            {leads.length > 0 && ` · ${leads.length} lead${leads.length === 1 ? "" : "s"} in pipeline`} &middot; £
            {totalSpent.toLocaleString()} total spent
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ct-name">Name</Label>
            <Input id="ct-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ct-company">Company</Label>
              <Input id="ct-company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ct-phone">Phone</Label>
              <Input id="ct-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ct-email">Email</Label>
            <Input id="ct-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ct-notes">Notes</Label>
            <Textarea id="ct-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={pending} className="justify-self-start">
            Save changes
          </Button>
        </div>

        <div className="mt-2 border-t border-border/60 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Projects</p>
            <span className="text-xs font-semibold text-emerald-400">
              Total spent: £{totalSpent.toLocaleString()}
            </span>
          </div>

          <div className="space-y-1.5">
            {projects.length === 0 && (
              <p className="py-2 text-center text-sm text-muted-foreground">No projects linked yet.</p>
            )}
            {projects.map((p) => {
              const stageMeta = PROJECT_STAGES.find((s) => s.key === p.stage)!;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{p.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge variant="outline" className={stageMeta.badgeClassName}>
                        {stageMeta.label}
                      </Badge>
                      {p.budget != null && (
                        <span className="text-xs text-muted-foreground">£{p.budget.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => window.open(`/portal/${p.portalSlug}`, "_blank")}
                    >
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleUnlinkProject(p.id)}>
                      <Unlink className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {unlinkedProjects.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Select value={projectToLink} onValueChange={(v) => setProjectToLink(v ?? "")}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Link an existing project..." />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {(p.clientCompany || p.clientName) &&
                        ` — ${[p.clientCompany, p.clientName].filter(Boolean).join(" / ")}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="secondary" disabled={!projectToLink || pending} onClick={handleLinkProject}>
                <Link2 className="size-3.5" />
                Link
              </Button>
            </div>
          )}
        </div>

        {leads.length > 0 && (
          <div className="mt-2 border-t border-border/60 pt-4">
            <p className="mb-2 text-sm font-medium">Leads in Pipeline</p>
            <div className="space-y-1.5">
              {leads.map((l) => {
                const stageMeta = KANBAN_STAGES.find((s) => s.key === l.stage)!;
                return (
                  <div
                    key={l.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <p className="truncate text-sm">{l.name}</p>
                    <Badge variant="outline" className="shrink-0">
                      {stageMeta.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
