"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Prisma, TaskPriority } from "@prisma/client";
import { toast } from "sonner";
import { Copy, ExternalLink, Trash2, Upload, Check, Link2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_STAGES } from "@/lib/project-stages";
import { taskPriorities } from "@/lib/validation/project";
import { PRIORITY_BADGE } from "@/lib/task-priority";
import type { ProjectCardData } from "@/components/projects/project-card";
import {
  getProjectDetail,
  setProjectStage,
  updateProgress,
  addTask,
  toggleTask,
  deleteTask,
  addComment,
  resolveChangeRequest,
  addDeliverable,
  uploadProjectFileAction,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
  updatePreviewUrl,
  updateRetainer,
} from "@/lib/actions/projects";

type ProjectDetail = Prisma.ProjectGetPayload<{
  include: { tasks: true; files: true; comments: true; changeRequests: true; milestones: true };
}>;

function portalPath(slug: string) {
  return `/portal/${slug}`;
}

export function ProjectDetailDialog({
  project,
  onOpenChange,
}: {
  project: ProjectCardData | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [newComment, setNewComment] = useState("");
  const [newMilestone, setNewMilestone] = useState("");
  const [newMilestoneDue, setNewMilestoneDue] = useState("");
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [previewUrlInput, setPreviewUrlInput] = useState("");
  const [retainerAmountInput, setRetainerAmountInput] = useState("");
  const [retainerActiveInput, setRetainerActiveInput] = useState(false);
  const [pending, startTransition] = useTransition();
  const deliverableFileRef = useRef<HTMLInputElement>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Reset stale detail during render (React's recommended pattern) when the
  // selected project changes; the actual fetch still runs in an effect.
  const [prevProjectId, setPrevProjectId] = useState<string | null>(null);
  if ((project?.id ?? null) !== prevProjectId) {
    setPrevProjectId(project?.id ?? null);
    setDetail(null);
    setPreviewUrlInput(project?.previewUrl ?? "");
    setRetainerAmountInput(project?.retainerAmount?.toString() ?? "");
    setRetainerActiveInput(project?.retainerActive ?? false);
  }

  useEffect(() => {
    if (!project) return;
    getProjectDetail(project.id).then(setDetail);
  }, [project]);

  if (!project) return null;

  function refresh() {
    if (!project) return;
    getProjectDetail(project.id).then(setDetail);
    router.refresh();
  }

  function handleStageChange(stage: string | null) {
    if (!stage) return;
    startTransition(async () => {
      await setProjectStage(project!.id, stage as (typeof PROJECT_STAGES)[number]["key"]);
      refresh();
    });
  }

  function handleSavePreviewUrl() {
    startTransition(async () => {
      try {
        await updatePreviewUrl({ id: project!.id, previewUrl: previewUrlInput });
        toast.success(previewUrlInput ? "Preview link saved" : "Preview link removed");
        refresh();
      } catch {
        toast.error("Enter a valid URL");
      }
    });
  }

  function handleSaveRetainer() {
    startTransition(async () => {
      await updateRetainer({
        id: project!.id,
        retainerAmount: retainerAmountInput || undefined,
        retainerActive: retainerActiveInput,
      });
      toast.success("Retainer saved");
      refresh();
    });
  }

  function handleProgressChange(value: number) {
    startTransition(async () => {
      await updateProgress({ id: project!.id, progress: value });
      refresh();
    });
  }

  function handleAddTask() {
    if (!newTask.trim()) return;
    startTransition(async () => {
      await addTask({ projectId: project!.id, title: newTask, priority: newTaskPriority });
      setNewTask("");
      refresh();
    });
  }

  function handleToggleTask(taskId: string, done: boolean) {
    startTransition(async () => {
      await toggleTask({ taskId, done });
      refresh();
    });
  }

  function handleDeleteTask(taskId: string) {
    startTransition(async () => {
      await deleteTask({ taskId });
      refresh();
    });
  }

  function handleAddComment() {
    if (!newComment.trim()) return;
    startTransition(async () => {
      await addComment({ projectId: project!.id, content: newComment });
      setNewComment("");
      refresh();
    });
  }

  function handleResolveChangeRequest(changeRequestId: string) {
    startTransition(async () => {
      await resolveChangeRequest({ changeRequestId });
      refresh();
    });
  }

  function handleUploadFile(file: File | undefined, kind: "DELIVERABLE" | "MEDIA") {
    if (!file) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("projectId", project!.id);
      formData.set("kind", kind);
      formData.set("file", file);
      try {
        await uploadProjectFileAction(formData);
        toast.success("Uploaded");
        refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  function handleAddLink() {
    if (!linkName.trim() || !linkUrl.trim()) return;
    startTransition(async () => {
      try {
        await addDeliverable({ projectId: project!.id, name: linkName, url: linkUrl });
        setLinkName("");
        setLinkUrl("");
        refresh();
      } catch {
        toast.error("Enter a valid URL");
      }
    });
  }

  function handleAddMilestone() {
    if (!newMilestone.trim()) return;
    startTransition(async () => {
      await addMilestone({
        projectId: project!.id,
        title: newMilestone,
        dueAt: newMilestoneDue || undefined,
      });
      setNewMilestone("");
      setNewMilestoneDue("");
      refresh();
    });
  }

  function handleToggleMilestone(milestoneId: string, completed: boolean) {
    startTransition(async () => {
      await toggleMilestone({ milestoneId, completed });
      refresh();
    });
  }

  function handleDeleteMilestone(milestoneId: string) {
    startTransition(async () => {
      await deleteMilestone({ milestoneId });
      refresh();
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}${portalPath(project!.portalSlug)}`);
    toast.success("Portal link copied");
  }

  const deliverables = detail?.files.filter((f) => f.kind === "DELIVERABLE") ?? [];
  const media = detail?.files.filter((f) => f.kind === "MEDIA") ?? [];

  return (
    <Dialog open={!!project} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>
            {project.clientCompany || project.clientName
              ? `Client: ${[project.clientCompany, project.clientName].filter(Boolean).join(" — ")}`
              : "No client set"}
            {project.clientEmail && ` (${project.clientEmail})`}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Private customer portal link
          </p>
          <div className="flex items-center justify-between gap-2">
            <code className="truncate text-xs text-muted-foreground">
              {portalPath(project.portalSlug)}
            </code>
            <div className="flex shrink-0 gap-1.5">
              <Button variant="secondary" size="sm" onClick={copyLink}>
                <Copy className="size-3.5" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(portalPath(project.portalSlug), "_blank")}
              >
                View Portal
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Link2 className="size-3" />
            Live preview link (shown to the client on their portal)
          </p>
          <div className="flex items-center gap-2">
            <Input
              placeholder="https://your-staging-url.vercel.app"
              value={previewUrlInput}
              onChange={(e) => setPreviewUrlInput(e.target.value)}
              className="h-8 flex-1"
            />
            <Button size="sm" variant="secondary" disabled={pending} onClick={handleSavePreviewUrl}>
              Save
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <RefreshCw className="size-3" />
            Ongoing retainer (hosting / maintenance — separate from the one-off budget above)
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Checkbox checked={retainerActiveInput} onCheckedChange={(v) => setRetainerActiveInput(!!v)} />
              Active
            </label>
            <Input
              placeholder="Amount per month (£)"
              type="number"
              min={0}
              step={1}
              value={retainerAmountInput}
              onChange={(e) => setRetainerAmountInput(e.target.value)}
              className="h-8 flex-1"
            />
            <Button size="sm" variant="secondary" disabled={pending} onClick={handleSaveRetainer}>
              Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Project Stage</p>
            <Select defaultValue={project.stage} onValueChange={handleStageChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STAGES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Dynamic Progress</p>
              <span className="text-xs font-semibold tabular-nums">{detail?.progress ?? project.progress}%</span>
            </div>
            <Progress value={detail?.progress ?? project.progress} className="h-2" />
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              defaultValue={project.progress}
              disabled={pending}
              onMouseUp={(e) => handleProgressChange(Number(e.currentTarget.value))}
              onTouchEnd={(e) => handleProgressChange(Number(e.currentTarget.value))}
              className="mt-1.5 w-full accent-primary"
            />
          </div>
        </div>

        {detail ? (
          <Tabs defaultValue="tasks">
            <TabsList className="w-full flex-wrap">
              <TabsTrigger value="tasks">Tasks ({detail.tasks.length})</TabsTrigger>
              <TabsTrigger value="deliverables">Deliverables ({deliverables.length})</TabsTrigger>
              <TabsTrigger value="media">Media ({media.length})</TabsTrigger>
              <TabsTrigger value="milestones">Milestones ({detail.milestones.length})</TabsTrigger>
              <TabsTrigger value="changes">Change Requests ({detail.changeRequests.length})</TabsTrigger>
              <TabsTrigger value="comments">Comments ({detail.comments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new deliverable task or milestone action..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                />
                <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as TaskPriority)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskPriorities.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddTask} disabled={pending}>
                  Add
                </Button>
              </div>
              <div className="space-y-1.5">
                {detail.tasks.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No tasks yet.</p>
                )}
                {detail.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <Checkbox
                      checked={task.done}
                      onCheckedChange={(v) => handleToggleTask(task.id, !!v)}
                    />
                    <span
                      className={`flex-1 text-sm ${task.done ? "text-muted-foreground line-through" : ""}`}
                    >
                      {task.title}
                    </span>
                    <Badge variant="outline" className={PRIORITY_BADGE[task.priority]}>
                      {task.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="deliverables" className="mt-3 space-y-2">
              <input
                ref={deliverableFileRef}
                type="file"
                className="hidden"
                onChange={(e) => handleUploadFile(e.target.files?.[0], "DELIVERABLE")}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => deliverableFileRef.current?.click()}
                >
                  <Upload className="size-3.5" />
                  Upload deliverable
                </Button>
                <span className="text-xs text-muted-foreground">or paste a link:</span>
                <Input
                  placeholder="Name"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  className="h-8 w-32"
                />
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-8 flex-1"
                />
                <Button size="sm" variant="secondary" disabled={pending} onClick={handleAddLink}>
                  Add
                </Button>
              </div>
              <div className="space-y-1.5">
                {deliverables.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No deliverables uploaded yet.
                  </p>
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
                      <Badge variant="outline" className="shrink-0 border-emerald-500/20 bg-emerald-500/15 text-emerald-400">
                        <Check className="size-3" /> Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 border-amber-500/20 bg-amber-500/15 text-amber-400">
                        Pending sign-off
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-3 space-y-2">
              <input
                ref={mediaFileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => handleUploadFile(e.target.files?.[0], "MEDIA")}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => mediaFileRef.current?.click()}
              >
                <Upload className="size-3.5" />
                Upload screenshot / video
              </Button>
              {media.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No media uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {media.map((f) => (
                    <a
                      key={f.id}
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/30 text-xs text-primary"
                    >
                      {/\.(png|jpe?g|gif|webp|svg)$/i.test(f.url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.url} alt={f.name} className="size-full object-cover" />
                      ) : (
                        <span className="line-clamp-2 px-2 text-center">{f.name}</span>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="milestones" className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Milestone title..."
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMilestone()}
                />
                <Input
                  type="date"
                  value={newMilestoneDue}
                  onChange={(e) => setNewMilestoneDue(e.target.value)}
                  className="w-40"
                />
                <Button onClick={handleAddMilestone} disabled={pending}>
                  Add
                </Button>
              </div>
              <div className="space-y-1.5">
                {detail.milestones.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No milestones yet.</p>
                )}
                {detail.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <Checkbox
                      checked={m.completed}
                      onCheckedChange={(v) => handleToggleMilestone(m.id, !!v)}
                    />
                    <div className="flex-1">
                      <span className={`text-sm ${m.completed ? "text-muted-foreground line-through" : ""}`}>
                        {m.title}
                      </span>
                      {m.dueAt && (
                        <p className="text-[11px] text-muted-foreground">
                          Due {new Date(m.dueAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteMilestone(m.id)}
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="changes" className="mt-3 space-y-1.5">
              {detail.changeRequests.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No change requests. Clients can submit these from the portal.
                </p>
              )}
              {detail.changeRequests.map((cr) => (
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
                    {cr.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleResolveChangeRequest(cr.id)}
                      >
                        Mark resolved
                      </Button>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm">{cr.content}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(cr.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="comments" className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button onClick={handleAddComment} disabled={pending} className="self-end">
                  Post
                </Button>
              </div>
              <div className="space-y-2">
                {detail.comments.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No comments yet.</p>
                )}
                {detail.comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border/60 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{c.author}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{c.content}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
