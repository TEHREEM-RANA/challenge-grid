import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, User as UserIcon, Mail } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Your Profile — ChallengeGrid" },
      { name: "description", content: "Manage your ChallengeGrid profile and account details." },
      { property: "og:title", content: "Your Profile — ChallengeGrid" },
      { property: "og:description", content: "Manage your ChallengeGrid profile and account details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? ""));
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  const initial = (fullName || user.email || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-soft">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-2xl px-6 py-10 w-full">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account details.</p>

        <Card className="mt-6 p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-hero grid place-items-center text-primary-foreground text-2xl font-bold shadow-brand">
              {initial}
            </div>
            <div>
              <div className="font-semibold text-lg">{fullName || "Unnamed user"}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user.email}</div>
            </div>
          </div>

          <form onSubmit={save} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name"><UserIcon className="inline h-3.5 w-3.5 mr-1" />Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user.email ?? ""} disabled />
            </div>
            <Button type="submit" className="shadow-brand" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Card>

        <Card className="mt-6 p-6">
          <h2 className="font-semibold">Sign out</h2>
          <p className="text-sm text-muted-foreground mt-1">You'll need your email and password to sign back in.</p>
          <Button variant="outline" className="mt-4" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" />Sign out
          </Button>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
