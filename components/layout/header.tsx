import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function Header() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="font-semibold">Kaban CRM</span>
        <span className="text-sm text-muted-foreground">Lead Pipeline</span>
      </div>
      <div className="flex items-center gap-3">
        {session?.user?.email && (
          <span className="text-sm text-muted-foreground">{session.user.email}</span>
        )}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
