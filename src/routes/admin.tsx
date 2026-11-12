import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Users, Target, CheckCircle2, Trophy } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — ChallengeGrid" },
      { name: "description", content: "Review ChallengeGrid users, challenges, and completed days." },
      { property: "og:title", content: "Admin Dashboard — ChallengeGrid" },
      { property: "og:description", content: "Manage the ChallengeGrid account overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!isAdmin) { navigate({ to: "/dashboard" }); return; }
    (async () => {
      const [p, c, pr] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("challenges").select("*"),
        supabase.from("challenge_progress").select("id"),
      ]);
      setProfiles(p.data ?? []);
      setChallenges(c.data ?? []);
      setProgress(pr.data ?? []);
      setFetching(false);
    })();
  }, [user, isAdmin, loading, navigate]);

  if (loading || fetching) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  const completed = challenges.filter(c => c.completed_at).length;
  const stats = [
    { icon: Users, label: "Total Users", value: profiles.length },
    { icon: Target, label: "Challenges Created", value: challenges.length },
    { icon: CheckCircle2, label: "Days Checked", value: progress.length },
    { icon: Trophy, label: "Challenges Finished", value: completed },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-soft">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl px-6 py-10 w-full">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of every user on ChallengeGrid.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-hero grid place-items-center text-primary-foreground shadow-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-8 shadow-card overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="font-semibold">All Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Challenges</th>
                  <th className="p-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => {
                  const userChallenges = challenges.filter(c => c.user_id === p.id).length;
                  return (
                    <tr key={p.id} className="border-t hover:bg-accent/30">
                      <td className="p-3 font-medium">{p.full_name ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{p.email}</td>
                      <td className="p-3">{userChallenges}</td>
                      <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
                {profiles.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No users yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
