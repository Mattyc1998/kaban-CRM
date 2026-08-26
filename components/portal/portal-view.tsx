"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Prisma } from "@prisma/client";
import { PROJECT_STAGES } from "@/lib/project-stages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitChangeRequest, submitPortalComment } from "@/lib/actions/portal";

type PortalProject = Prisma.ProjectGetPayload<{
  include: { files: true; comments: true };
}>;

export function PortalView({ project }: { project: PortalProject }) {
  const stageMeta = PROJECT_STAGES.find((s) => s.key === project.stage)!;
  const stageIndex = PROJECT_STAGES.findIndex((s) => s.key === project.stage);

  const [pending, startTransition] = useTransition();
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const [changeText, setChangeText] = useState("");
  const router = useRouter();

  function handleAddComment() {
    if (!commentAuthor.trim() || !commentText.trim()) {
      toast.error("Add your name and a message");
      return;
    }
    startTransition(async () => {
      await submitPortalComment({ slug: project.portalSlug, author: commentAuthor, content: commentText });
      setCommentText("");
      toast.success("Comment posted");
      router.refresh();
    });
  }

  function handleRequestChange() {
    if (!changeText.trim()) return;
    startTransition(async () => {
      await submitChangeRequest({ slug: project.portalSlug, content: changeText });
      setChangeText("");
      toast.success("Change request sent");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-500 text-sm font-bold text-primary-foreground">
          K
        </div>
        <span className="text-sm font-semibold tracking-tight text-muted-foreground">
          Kaban CRM Client Portal
        </span>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{project.name}</CardTitle>
            <Badge variant="outline" className={stageMeta.badgeClassName}>
              {stageMeta.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Progress value={project.progress} className="h-2 flex-1" />
            <span className="text-sm font-semibold tabular-nums">{project.progress}%</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROJECT_STAGES.map((s, i) => (
              <Badge
                key={s.key}
                variant="outline"
                className={i <= stageIndex ? s.badgeClassName : "text-muted-foreground/50"}
              >
                {s.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Deliverables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {project.files.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing shared yet.</p>
          )}
          {project.files.map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-border/60 px-3 py-2 text-sm text-primary hover:bg-muted/40"
            >
              {f.name}
            </a>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Updates &amp; Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {project.comments.length === 0 && (
              <p className="text-sm text-muted-foreground">No updates yet.</p>
            )}
            {project.comments.map((c) => (
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
          <div className="space-y-2 border-t border-border/60 pt-3">
            <Input
              placeholder="Your name"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
            />
            <Textarea
              placeholder="Leave a comment or question..."
              rows={2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button size="sm" disabled={pending} onClick={handleAddComment}>
              Post comment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Request a change</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            placeholder="Describe what you'd like changed..."
            rows={3}
            value={changeText}
            onChange={(e) => setChangeText(e.target.value)}
          />
          <Button size="sm" disabled={pending} onClick={handleRequestChange}>
            Submit request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
