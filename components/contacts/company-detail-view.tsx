"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Link2,
  Unlink,
  Mail,
  Send,
  MailOpen,
  Trash2,
  Plus,
  Pencil,
  Users,
  Paperclip,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { monthlyRetainerValue, type CompanyWithRelations } from "@/lib/company-types";
import {
  updateCompany,
  deleteCompany,
  addContactPerson,
  updateContactPerson,
  deleteContactPerson,
  linkProjectToContact,
  unlinkProjectFromContact,
  listUnlinkedProjects,
  addEmailLog,
  deleteEmailLog,
} from "@/lib/actions/contacts";

type UnlinkedProject = { id: string; name: string; clientName: string | null; clientCompany: string | null };
type EmailDirection = "SENT" | "RECEIVED";

export function CompanyDetailView({ company }: { company: CompanyWithRelations }) {
  const [name, setName] = useState(company.name);
  const [notes, setNotes] = useState(company.notes ?? "");
  const [editingCompany, setEditingCompany] = useState(false);

  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [personName, setPersonName] = useState("");
  const [personEmail, setPersonEmail] = useState("");
  const [personPhone, setPersonPhone] = useState("");
  const [personRole, setPersonRole] = useState("");

  const [unlinkedProjects, setUnlinkedProjects] = useState<UnlinkedProject[]>([]);
  const [projectToLink, setProjectToLink] = useState("");

  const [emailDirection, setEmailDirection] = useState<EmailDirection>("SENT");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailSummary, setEmailSummary] = useState("");
  const [emailFiles, setEmailFiles] = useState<File[]>([]);
  const emailFileRef = useRef<HTMLInputElement>(null);

  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Reset local edit state during render (React's recommended pattern) if
  // the page navigates to a different company while this stays mounted.
  const [prevId, setPrevId] = useState(company.id);
  if (company.id !== prevId) {
    setPrevId(company.id);
    setName(company.name);
    setNotes(company.notes ?? "");
    setEditingCompany(false);
    setEditingPersonId(null);
    setShowAddPerson(false);
    setProjectToLink("");
  }

  useEffect(() => {
    listUnlinkedProjects().then(setUnlinkedProjects);
  }, [company.id]);

  function refresh() {
    listUnlinkedProjects().then(setUnlinkedProjects);
    router.refresh();
  }

  function resetPersonForm() {
    setPersonName("");
    setPersonEmail("");
    setPersonPhone("");
    setPersonRole("");
    setShowAddPerson(false);
    setEditingPersonId(null);
  }

  function handleSaveCompany() {
    if (!name.trim()) {
      toast.error("Company name is required");
      return;
    }
    startTransition(async () => {
      await updateCompany({ id: company.id, name, notes });
      toast.success("Company saved");
      setEditingCompany(false);
      refresh();
    });
  }

  function handleDeleteCompany() {
    if (
      !confirm(
        `Delete "${company.name}"? Its contacts and email log will be deleted too. Linked projects and leads will just be unlinked, not deleted.`
      )
    )
      return;
    startTransition(async () => {
      await deleteCompany({ id: company.id });
      toast.success("Company deleted");
      router.push("/contacts");
    });
  }

  function startEditPerson(p: CompanyWithRelations["contacts"][number]) {
    setEditingPersonId(p.id);
    setShowAddPerson(false);
    setPersonName(p.name);
    setPersonEmail(p.email ?? "");
    setPersonPhone(p.phone ?? "");
    setPersonRole(p.role ?? "");
  }

  function handleSavePerson() {
    if (!personName.trim()) {
      toast.error("Name is required");
      return;
    }
    startTransition(async () => {
      if (editingPersonId) {
        await updateContactPerson({
          id: editingPersonId,
          companyId: company.id,
          name: personName,
          email: personEmail,
          phone: personPhone,
          role: personRole,
        });
        toast.success("Contact saved");
      } else {
        await addContactPerson({
          companyId: company.id,
          name: personName,
          email: personEmail,
          phone: personPhone,
          role: personRole,
        });
        toast.success("Contact added");
      }
      resetPersonForm();
      refresh();
    });
  }

  function handleDeletePerson(id: string) {
    if (!confirm("Remove this contact?")) return;
    startTransition(async () => {
      await deleteContactPerson({ id });
      refresh();
    });
  }

  function handleLinkProject() {
    if (!projectToLink) return;
    startTransition(async () => {
      await linkProjectToContact({ companyId: company.id, projectId: projectToLink });
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

  function handleAddEmailLog() {
    if (!emailSubject.trim() || !emailSummary.trim()) {
      toast.error("Enter a subject and summary");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("companyId", company.id);
      formData.set("direction", emailDirection);
      formData.set("subject", emailSubject);
      formData.set("summary", emailSummary);
      emailFiles.forEach((f) => formData.append("attachments", f));

      await addEmailLog(formData);
      setEmailSubject("");
      setEmailSummary("");
      setEmailFiles([]);
      if (emailFileRef.current) emailFileRef.current.value = "";
      toast.success("Email logged");
      refresh();
    });
  }

  function handleDeleteEmailLog(id: string) {
    startTransition(async () => {
      await deleteEmailLog({ id });
      refresh();
    });
  }

  const totalSpent = company.projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const monthlyRetainer = company.projects.reduce((sum, p) => sum + monthlyRetainerValue(p), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/contacts"
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to Contacts
      </Link>

      <div className="mb-4 rounded-xl border border-border/60 bg-card p-5">
        {editingCompany ? (
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="co-name">Company name</Label>
              <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="co-notes">Notes</Label>
              <Textarea id="co-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={pending} onClick={handleSaveCompany}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingCompany(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
              {company.notes && <p className="mt-1 text-sm text-muted-foreground">{company.notes}</p>}
              <p className="mt-2 text-sm text-muted-foreground">
                {company.contacts.length} contact{company.contacts.length === 1 ? "" : "s"} &middot;{" "}
                {company.projects.length} project{company.projects.length === 1 ? "" : "s"}
                {company.leads.length > 0 && ` · ${company.leads.length} lead${company.leads.length === 1 ? "" : "s"}`}
                {" · "}£{totalSpent.toLocaleString()} total spent
                {monthlyRetainer > 0 && ` · £${Math.round(monthlyRetainer).toLocaleString()}/mo retainer`}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingCompany(true)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button size="sm" variant="outline" className="text-rose-400 hover:text-rose-400" onClick={handleDeleteCompany} disabled={pending}>
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="size-4 text-primary" />
                Contacts
                <Button
                  size="xs"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => {
                    resetPersonForm();
                    setShowAddPerson(true);
                  }}
                >
                  <Plus className="size-3.5" />
                  Add Contact
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {company.contacts.length === 0 && !showAddPerson && (
                <p className="py-2 text-center text-sm text-muted-foreground">No contacts yet.</p>
              )}
              {company.contacts.map((p) =>
                editingPersonId === p.id ? (
                  <div key={p.id} className="space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Name" value={personName} onChange={(e) => setPersonName(e.target.value)} />
                      <Input placeholder="Role (optional)" value={personRole} onChange={(e) => setPersonRole(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Email" value={personEmail} onChange={(e) => setPersonEmail(e.target.value)} />
                      <Input placeholder="Phone" value={personPhone} onChange={(e) => setPersonPhone(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="xs" disabled={pending} onClick={handleSavePerson}>
                        Save
                      </Button>
                      <Button size="xs" variant="ghost" onClick={resetPersonForm}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {p.name}
                        {p.role && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{p.role}</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[p.email, p.phone].filter(Boolean).join(" · ") || "No contact details"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => startEditPerson(p)}>
                        <Pencil className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDeletePerson(p.id)}>
                        <Trash2 className="size-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                )
              )}
              {showAddPerson && (
                <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Name" value={personName} onChange={(e) => setPersonName(e.target.value)} autoFocus />
                    <Input placeholder="Role (optional)" value={personRole} onChange={(e) => setPersonRole(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Email" value={personEmail} onChange={(e) => setPersonEmail(e.target.value)} />
                    <Input placeholder="Phone" value={personPhone} onChange={(e) => setPersonPhone(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="xs" disabled={pending} onClick={handleSavePerson}>
                      Add
                    </Button>
                    <Button size="xs" variant="ghost" onClick={resetPersonForm}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Projects</span>
                <span className="text-xs font-normal text-emerald-400">£{totalSpent.toLocaleString()} total</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {company.projects.length === 0 && (
                <p className="py-2 text-center text-sm text-muted-foreground">No projects linked yet.</p>
              )}
              {company.projects.map((p) => {
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
                        {p.retainerActive && p.retainerAmount != null && (
                          <span className="text-xs text-emerald-400">
                            £{p.retainerAmount.toLocaleString()}/{p.retainerInterval === "YEARLY" ? "yr" : "mo"}
                          </span>
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

              {unlinkedProjects.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
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
            </CardContent>
          </Card>

          {company.leads.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Leads in Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {company.leads.map((l) => {
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
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-primary" />
                Email Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Manual record of emails sent to or received from this company outside the portal (e.g.
                Outlook) — no account linking needed.
              </p>

              <div className="space-y-1.5">
                {company.emailLogs.length === 0 && (
                  <p className="py-2 text-center text-sm text-muted-foreground">No emails logged yet.</p>
                )}
                {company.emailLogs.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border/60 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        {e.direction === "SENT" ? (
                          <Send className="size-3 text-primary" />
                        ) : (
                          <MailOpen className="size-3 text-emerald-400" />
                        )}
                        {e.direction === "SENT" ? "Sent" : "Received"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(e.contactedAt).toLocaleDateString()}
                        </span>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteEmailLog(e.id)}>
                          <Trash2 className="size-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm font-medium">{e.subject}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{e.summary}</p>
                    {e.attachments.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {e.attachments.map((a) => (
                          <a
                            key={a.id}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/20 px-1.5 py-0.5 text-[11px] text-primary hover:underline"
                          >
                            <Paperclip className="size-2.5" />
                            <span className="max-w-[140px] truncate">{a.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-lg border border-border/60 p-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={emailDirection === "SENT" ? "default" : "outline"}
                    onClick={() => setEmailDirection("SENT")}
                    className="gap-1.5"
                  >
                    <Send className="size-3.5" />
                    Sent
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={emailDirection === "RECEIVED" ? "default" : "outline"}
                    onClick={() => setEmailDirection("RECEIVED")}
                    className="gap-1.5"
                  >
                    <MailOpen className="size-3.5" />
                    Received
                  </Button>
                </div>
                <Input
                  placeholder="Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
                <Textarea
                  placeholder="Quick summary of what was said..."
                  rows={2}
                  value={emailSummary}
                  onChange={(e) => setEmailSummary(e.target.value)}
                />
                <input
                  ref={emailFileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setEmailFiles(Array.from(e.target.files ?? []))}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => emailFileRef.current?.click()}
                >
                  <Paperclip className="size-3.5" />
                  {emailFiles.length > 0
                    ? `${emailFiles.length} file${emailFiles.length === 1 ? "" : "s"} attached`
                    : "Attach files (optional)"}
                </Button>
                <Button size="sm" className="w-full" disabled={pending} onClick={handleAddEmailLog}>
                  Log {emailDirection === "SENT" ? "Sent" : "Received"} Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
