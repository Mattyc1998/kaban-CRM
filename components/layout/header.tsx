import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function Header() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between bg-sidebar px-6 py-3 text-sidebar-foreground shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          K
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold tracking-tight">Kaban CRM</span>
          <span className="text-sm text-sidebar-foreground/60">Lead Pipeline</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {session?.user?.email && (
          <span className="text-sm text-sidebar-foreground/70">{session.user.email}</span>
        )}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="border-sidebar-foreground/20 bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
