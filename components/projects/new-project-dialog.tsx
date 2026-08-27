"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProject } from "@/lib/actions/projects";

export function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createProject({
          name: formData.get("name"),
          clientName: formData.get("clientName"),
          clientCompany: formData.get("clientCompany"),
          clientEmail: formData.get("clientEmail"),
          budget: formData.get("budget") || undefined,
        });
        toast.success("Project created");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to create project");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            New Project
          </Button>
        }
      />
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Starts in Onboarding with a private customer portal link.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="p-name">Project name</Label>
              <Input id="p-name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-client">Client name</Label>
              <Input id="p-client" name="clientName" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-company">Client business name</Label>
              <Input id="p-company" name="clientCompany" placeholder="Shown prominently on their portal" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-email">Client email</Label>
              <Input id="p-email" name="clientEmail" type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-budget">Budget (£)</Label>
              <Input id="p-budget" name="budget" type="number" min={0} step={1} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
