import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trophy, Sparkles } from "lucide-react";

export const Route = createFileRoute("/challenge/$id")({
  component: ChallengePage,
  head: () => ({
    meta: [
      { title: "Challenge Grid — ChallengeGrid" },
      { name: "description", content: "Track each day of your personal challenge and see your progress fill the grid." },
      { property: "og:title", content: "Challenge Grid — ChallengeGrid" },
      { property: "og:description", content: "Track every day and follow your challenge to the finish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Challenge = {
  id: string; title: string; start_date: string; total_days: number;
  end_date: string; completed_at: string | null; user_id: string;
};

function ChallengePage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [fetching, setFetching] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("challenges").select("*").eq("id", id).maybeSingle(),
        supabase.from("challenge_progress").select("day_number").eq("challenge_id", id),
      ]);
      setChallenge(c as Challenge | null);
      setDone(new Set((p ?? []).map((r: any) => r.day_number)));
      setFetching(false);
    })();
  }, [id, user]);

  const toggle = async (day: number) => {
    if (!user || !challenge) return;
    if (done.has(day)) {
      const newSet = new Set(done); newSet.delete(day); setDone(newSet);
      const { error } = await supabase.from("challenge_progress")
        .delete().eq("challenge_id", id).eq("day_number", day);
      if (error) { toast.error(error.message); setDone(done); return; }
      setShowCongrats(false);
      if (challenge.completed_at) {
        await supabase.from("challenges").update({ completed_at: null }).eq("id", id);
        setChallenge({ ...challenge, completed_at: null });
      }
    } else {

      const newSet = new Set(done); newSet.add(day); setDone(newSet);
      const { error } = await supabase.from("challenge_progress")
        .insert({ challenge_id: id, user_id: user.id, day_number: day });
      if (error) { toast.error(error.message); setDone(done); return; }
      if (newSet.size === challenge.total_days) {
        await supabase.from("challenges").update({ completed_at: new Date().toISOString() }).eq("id", id);
        setChallenge({ ...challenge, completed_at: new Date().toISOString() });
        setShowCongrats(true);
      }
    }
  };

  const cols = useMemo(() => {
    if (!challenge) return 10;
    const n = challenge.total_days;
    if (n <= 30) return 6;
    if (n <= 100) return 10;
    if (n <= 365) return 20;
    return 30;
  }, [challenge]);

  if (loading || fetching) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (!challenge) return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <p>Challenge not found.</p>
        <Button asChild className="mt-4"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    </div>
  );

  const pct = Math.round((done.size / challenge.total_days) * 100);
  const today = new Date().toISOString().slice(0, 10);
  const daysSince = Math.max(0, Math.floor((new Date(today + "T00:00:00").getTime() - new Date(challenge.start_date + "T00:00:00").getTime()) / 86400000));
  const currentDay = Math.min(daysSince + 1, challenge.total_days);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-soft">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl px-6 py-10 w-full">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>

        <Card className="p-6 md:p-8 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">{challenge.title}</h1>
              <p className="text-muted-foreground mt-1">
                {challenge.start_date} → {challenge.end_date} · {challenge.total_days} days
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{done.size} / {challenge.total_days}</div>
              <div className="text-sm text-muted-foreground">{pct}% complete</div>
            </div>
          </div>

          <div className="mt-4 h-3 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-gradient-hero transition-all" style={{ width: `${pct}%` }} />
          </div>

          {challenge.completed_at ? (
            <div className="mt-6 rounded-2xl bg-gradient-hero p-6 text-center text-primary-foreground shadow-brand">
              <Trophy className="h-10 w-10 mx-auto" />
              <h2 className="mt-2 text-2xl font-extrabold">🎉 Congratulations!</h2>
              <p className="mt-1">You completed your goal. That's {challenge.total_days} days of consistency.</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              <Sparkles className="inline h-4 w-4 text-primary" /> Tip: today is around day <strong>{currentDay}</strong>. Click any box to mark it done.
            </p>
          )}
        </Card>

        <Card className="mt-6 p-4 md:p-6 shadow-card overflow-x-auto">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(1.5rem, 1fr))` }}
          >
            {Array.from({ length: challenge.total_days }).map((_, i) => {
              const day = i + 1;
              const isDone = done.has(day);
              const isToday = day === currentDay;
              return (
                <button
                  key={day}
                  onClick={() => toggle(day)}
                  title={`Day ${day}`}
                  className={`aspect-square rounded border-2 transition-all hover:scale-110 relative ${
                    isDone
                      ? "bg-primary border-primary shadow-brand animate-pop-in"
                      : "bg-background border-border hover:border-primary"
                  } ${isToday && !isDone ? "ring-2 ring-primary ring-offset-1" : ""}`}
                >
                  {cols <= 10 && (
                    <span className={`absolute inset-0 grid place-items-center text-[0.6rem] font-semibold ${isDone ? "text-primary-foreground" : "text-muted-foreground"}`}>{day}</span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </main>
      <SiteFooter />

      {showCongrats && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-6" onClick={() => setShowCongrats(false)}>
          <Card className="p-10 max-w-md text-center shadow-brand animate-pop-in">
            <Trophy className="h-16 w-16 mx-auto text-primary" />
            <h2 className="mt-4 text-3xl font-extrabold">Congratulations! 🎉</h2>
            <p className="mt-2 text-muted-foreground">You completed your <strong>{challenge.total_days}-day</strong> challenge. That's a serious achievement.</p>
            <Button className="mt-6 shadow-brand" onClick={() => setShowCongrats(false)}>Celebrate</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
