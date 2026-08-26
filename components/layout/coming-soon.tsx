import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  note,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  note: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-6" />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-center gap-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
            Coming soon
          </Badge>
        </div>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      <p className="max-w-sm text-xs text-muted-foreground/70">{note}</p>
    </div>
  );
}
