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
    <Card className="gap-0 py-4">
      <CardContent className="flex items-start justify-between px-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{sublabel}</p>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            iconClassName
          )}
        >
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}
