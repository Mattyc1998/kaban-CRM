"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Prisma } from "@prisma/client";
import {
  Check,
  ImageIcon,
  Upload,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  MessageSquare,
  ListChecks,
  Circle,
  Monitor,
  ExternalLink,
} from "lucide-react";
import { PROJECT_STAGES } from "@/lib/project-stages";
import { PRIORITY_BADGE } from "@/lib/task-priority";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  submitChangeRequest,
  submitPortalComment,
  uploadPortalMedia,
  approvePortalDeliverable,
} from "@/lib/actions/portal";

type PortalProject = Prisma.ProjectGetPayload<{
  include: { tasks: true; files: true; comments: true; milestones: true; changeRequests: true };
}>;

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;

function milestoneStatus(m: { completed: boolean; dueAt: Date | null }) {
  if (m.completed) return { label: "Completed", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 };
  if (m.dueAt && new Date(m.dueAt) < new Date())
    return { label: "Overdue", className: "border-rose-500/25 bg-rose-500/10 text-rose-400", icon: AlertCircle };
  return { label: "Upcoming", className: "border-cyan-500/25 bg-cyan-500/10 text-cyan-400", icon: Clock };
}

function messageSender(author: string) {
  if (author === "System") return { label: "System (Team Lead)", className: "text-emerald-400" };
  if (author === "ClearFlow Copilot") return { label: "ClearFlow Copilot", className: "text-primary" };
  return { label: author, className: "text-foreground" };
}

export function PortalView({ project }: { project: PortalProject }) {
  const stageMeta = PROJECT_STAGES.find((s) => s.key === project.stage)!;
  const stageIndex = PROJECT_STAGES.findIndex((s) => s.key === project.stage);

  const [pending, startTransition] = useTransition();
  const [commentText, setCommentText] = useState("");
  const [changeText, setChangeText] = useState("");
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [uploaderName, setUploaderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const changeRequestsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const clientDisplayName = project.clientName || project.clientCompany || "Client";
  const deliverables = project.files.filter((f) => f.kind === "DELIVERABLE");
  const media = project.files.filter((f) => f.kind === "MEDIA");

  function scrollTo(ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleAddComment() {
    if (!commentText.trim()) return;
    startTransition(async () => {
      await submitPortalComment({ slug: project.portalSlug, author: clientDisplayName, content: commentText });
      setCommentText("");
      router.refresh();
    });
  }

  function handleRequestChange() {
    if (!changeText.trim()) return;
    startTransition(async () => {
      await submitChangeRequest({ slug: project.portalSlug, content: changeText });
      setChangeText("");
      setShowChangeForm(false);
      toast.success("Change request sent");
      router.refresh();
    });
  }

  function handleUploadClick() {
    scrollTo(mediaRef);
    if (!uploaderName.trim()) {
      toast.error("Enter your name first, then choose a file");
      return;
    }
    fileInputRef.current?.click();
  }

  function handleFileSelected(file: File | undefined) {
    if (!file) return;
    if (!uploaderName.trim()) {
      toast.error("Enter your name before uploading");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("slug", project.portalSlug);
      formData.set("uploadedBy", uploaderName);
      formData.set("file", file);
      try {
        await uploadPortalMedia(formData);
        toast.success("Uploaded");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  function handleApprove(fileId: string) {
    startTransition(async () => {
      await approvePortalDeliverable({ slug: project.portalSlug, fileId });
      toast.success("Marked approved");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no benefit from next/image optimization */}
          <img src="/clearflow-mark.svg" alt="ClearFlow AI" className="size-7" />
          <span className="text-sm font-semibold tracking-tight text-muted-foreground">
            ClearFlow AI Client Portal
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-orange-400 text-sm font-bold text-primary-foreground">
            {(project.clientCompany || project.clientName || project.name)[0]?.toUpperCase()}
          </div>
          <div>
            {project.clientCompany && (
              <p className="text-sm font-bold uppercase leading-tight tracking-wide text-primary">
                {project.clientCompany}
              </p>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{project.name}</h1>
              <Badge variant="outline" className="border-primary/25 bg-primary/10 text-[10px] text-primary">
                Client Portal
              </Badge>
            </div>
            {project.clientName && (
              <p className="text-xs text-muted-foreground">Welcome, {project.clientName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleUploadClick}>
            <Upload className="size-3.5" />
            Upload Media
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              scrollTo(changeRequestsRef);
              setShowChangeForm(true);
            }}
          >
            <AlertTriangle className="size-3.5" />
            Request Changes
          </Button>
        </div>
      </div>

      {project.previewUrl && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
              <Monitor className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Live Preview Available</p>
              <p className="text-xs text-muted-foreground">Watch your project&apos;s progress in real time</p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-cyan-500 text-white hover:bg-cyan-500/90"
            onClick={() => window.open(project.previewUrl!, "_blank")}
          >
            Open Live Preview
            <ExternalLink className="size-3.5" />
          </Button>
        </div>
      )}

      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                Live Delivery Pipeline
              </p>
              <p className="text-base font-semibold">Current Phase: {stageMeta.label.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-400">{project.progress}%</p>
              <p className="text-[10px] text-muted-foreground">Overall Progress</p>
            </div>
          </div>
          <Progress
            value={project.progress}
            className="mb-4 h-2 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-primary [&_[data-slot=progress-indicator]]:to-teal-400"
          />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {PROJECT_STAGES.map((s, i) => {
              const isDone = i < stageIndex;
              const isCurrent = i === stageIndex;
              return (
                <div
                  key={s.key}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-center",
                    isCurrent
                      ? "border-primary/50 bg-primary/10"
                      : isDone
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-border/60 bg-muted/20"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold",
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isDone
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isDone ? <Check className="size-3.5" /> : i + 1}
                  </div>
                  <span className="text-[10px] font-medium text-foreground/80">{s.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {project.tasks.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ListChecks className="size-4 text-primary" />
              Project Tasks
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {project.tasks.filter((t) => t.done).length}/{project.tasks.length} complete
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col divide-y divide-border/60">
              {project.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2.5 py-2">
                  {task.done ? (
                    <Check className="size-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      task.done && "text-muted-foreground line-through"
                    )}
                  >
                    {task.title}
                  </span>
                  <Badge variant="outline" className={cn("text-[10px]", PRIORITY_BADGE[task.priority])}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Project Deliverables &amp; Digital Sign-Off
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Review and approve completed assets
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {deliverables.length === 0 && (
            <p className="text-sm text-muted-foreground">No deliverables pending review at this stage.</p>
          )}
          {deliverables.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
            >
              <a href={f.url} target="_blank" rel="noreferrer" className="truncate text-sm text-primary hover:underline">
                {f.name}
              </a>
              {f.status === "APPROVED" ? (
                <Badge variant="outline" className="border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                  <Check className="size-3" /> Approved
                </Badge>
              ) : (
                <Button size="xs" disabled={pending} onClick={() => handleApprove(f.id)}>
                  Approve
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-4" ref={mediaRef}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" />
              Project Media &amp; Attached Screenshots / Videos
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {media.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No custom screenshots or video clips uploaded yet. Use the Upload Media button above to add assets.
            </p>
          )}
          {media.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {media.map((f) =>
                IMAGE_EXT.test(f.url) ? (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={f.name} className="aspect-video w-full object-cover" />
                  </a>
                ) : (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex aspect-video flex-col items-center justify-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-2 text-center text-xs text-primary hover:bg-muted/50"
                  >
                    <FileText className="size-4" />
                    <span className="line-clamp-2">{f.name}</span>
                  </a>
                )
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row">
            <Input
              placeholder="Your name"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              className="sm:max-w-[180px]"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files?.[0])}
            />
            <Button size="sm" variant="outline" disabled={pending} onClick={handleUploadClick}>
              <Upload className="size-3.5" />
              Upload File
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-primary" />
            Project Milestones &amp; Key Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {project.milestones.length === 0 && (
            <p className="text-sm text-muted-foreground">No milestones set yet.</p>
          )}
          {project.milestones.map((m) => {
            const status = milestoneStatus(m);
            const StatusIcon = status.icon;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{m.title}</p>
                  {m.dueAt && (
                    <p className="text-[11px] text-muted-foreground">
                      Due {new Date(m.dueAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={cn("shrink-0", status.className)}>
                  <StatusIcon className="size-3" />
                  {status.label}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card ref={changeRequestsRef}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <AlertCircle className="size-4 text-rose-400" />
                Your Change Requests
              </span>
              <button
                type="button"
                onClick={() => setShowChangeForm((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:underline"
              >
                <Plus className="size-3" />
                New Request
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {showChangeForm && (
              <div className="space-y-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5">
                <Textarea
                  placeholder="Describe what you'd like changed..."
                  rows={2}
                  value={changeText}
                  onChange={(e) => setChangeText(e.target.value)}
                  autoFocus
                />
                <Button size="xs" disabled={pending} onClick={handleRequestChange}>
                  Submit request
                </Button>
              </div>
            )}
            {project.changeRequests.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">No change requests active.</p>
            ) : (
              project.changeRequests.map((cr) => (
                <div key={cr.id} className="rounded-lg border border-border/60 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={
                        cr.status === "PENDING"
                          ? "border-rose-500/20 bg-rose-500/15 text-rose-400"
                          : "border-emerald-500/20 bg-emerald-500/15 text-emerald-400"
                      }
                    >
                      {cr.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(cr.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm">{cr.content}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="size-4 text-amber-400" />
              Direct Project Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question or leave feedback..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <Button size="icon" disabled={pending} onClick={handleAddComment}>
                <Send className="size-4" />
              </Button>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {project.comments.length === 0 && (
                <p className="py-2 text-center text-sm text-muted-foreground">No messages yet.</p>
              )}
              {project.comments.map((c) => {
                const sender = messageSender(c.author);
                return (
                  <div key={c.id} className="rounded-lg border border-border/60 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-medium", sender.className)}>{sender.label}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{c.content}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
