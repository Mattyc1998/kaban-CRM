import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  sublabel,
}: {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string | number;
  sublabel: string;
}) {
  return (
    <Card className="gap-0 py-6">
      <CardContent className="flex items-start justify-between px-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
          <p className="mt-1.5 truncate text-sm text-muted-foreground">{sublabel}</p>
        </div>
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            iconClassName
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
