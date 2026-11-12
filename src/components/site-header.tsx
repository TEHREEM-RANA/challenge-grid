import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, LayoutGrid, User, ListChecks, Timer } from "lucide-react";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-hero grid place-items-center text-primary-foreground font-bold shadow-brand">CG</div>
          <span className="font-display text-lg font-bold">ChallengeGrid</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard"><LayoutGrid className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Dashboard</span></Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/tasks"><ListChecks className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Tasks</span></Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/timer"><Timer className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Timer</span></Link>
              </Button>

              <Button asChild variant="ghost" size="sm">
                <Link to="/profile"><User className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Profile</span></Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin"><Shield className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Admin</span></Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="shadow-brand">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
