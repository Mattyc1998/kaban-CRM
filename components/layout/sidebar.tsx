import Link from "next/link";
import {
  LayoutDashboard,
  KanbanSquare,
  FolderKanban,
  ScanEye,
  Webhook,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Lead Pipeline", icon: KanbanSquare, badge: "8 Stages" },
  { href: "/projects", label: "Project Tracking", icon: FolderKanban },
  { href: "/opencv", label: "OpenCV Gestures", icon: ScanEye, badge: "Vision" },
  { href: "/webhooks", label: "Webhooks & Settings", icon: Webhook },
] as const;

export async function Sidebar({ active }: { active: string }) {
  const session = await auth();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no benefit from next/image optimization */}
        <img src="/clearflow-mark.svg" alt="ClearFlow AI" className="size-8" />
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight">CLEARFLOW</span>
            <Badge className="h-4 bg-primary/20 px-1.5 text-[9px] font-semibold text-primary">
              AI
            </Badge>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/45">
            CRM &middot; Pipeline &amp; Projects
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === active;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("size-4", isActive && "text-primary")} />
              <span className="flex-1 truncate">{item.label}</span>
              {"badge" in item && item.badge && (
                <Badge
                  variant="outline"
                  className="h-4 border-sidebar-foreground/15 px-1.5 text-[9px] font-medium text-sidebar-foreground/55"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-semibold text-sidebar-foreground/80">
            {(session?.user?.name || session?.user?.email)?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="flex-1 truncate text-xs text-sidebar-foreground/60">
            {session?.user?.name || session?.user?.email}
          </span>
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            className="text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-3.5" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
