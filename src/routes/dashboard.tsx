import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Plus, Calendar, Trophy, Trash2, CheckCircle2 } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Your Challenges — ChallengeGrid" },
      { name: "description", content: "Create personal challenges and track daily progress in ChallengeGrid." },
      { property: "og:title", content: "Your Challenges — ChallengeGrid" },
      { property: "og:description", content: "Choose a challenge, fill your grid, and track your progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Challenge = {
  id: string;
  title: string;
  start_date: string;
  total_days: number;
  end_date: string;
  completed_at: string | null;
};

type Progress = { challenge_id: string; day_number: number };

const createSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(80),
  start_date: z.string().min(1, "Start date required"),
});

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string) {
  const d1 = new Date(a + "T00:00:00").getTime();
  const d2 = new Date(b + "T00:00:00").getTime();
  return Math.round((d2 - d1) / 86400000) + 1;
}

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [fetching, setFetching] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // form
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<"days" | "end">("days");
  const [totalDays, setTotalDays] = useState(100);
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const load = async () => {
    if (!user) return;
    setFetching(true);
    const [{ data: chs }, { data: prog }] = await Promise.all([
      supabase.from("challenges").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("challenge_progress").select("challenge_id, day_number").eq("user_id", user.id),
    ]);
    setChallenges((chs as Challenge[]) ?? []);
    setProgress((prog as Progress[]) ?? []);
    setFetching(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = createSchema.safeParse({ title, start_date: startDate });
    if (!parsed.success) { toast.error(parsed.error.issues.at(0)?.message ?? "Please check your details."); return; }
    let days = totalDays;
    let end = "";
    if (mode === "days") {
      if (days < 1 || days > 2000) { toast.error("Days must be 1–2000"); return; }
      end = addDays(startDate, days - 1);
    } else {
      if (!endDate) { toast.error("End date required"); return; }
      days = daysBetween(startDate, endDate);
      if (days < 1) { toast.error("End date must be after start"); return; }
      if (days > 2000) { toast.error("Max 2000 days"); return; }
      end = endDate;
    }
    const { error } = await supabase.from("challenges").insert({
      user_id: user.id, title: parsed.data.title, start_date: parsed.data.start_date,
      total_days: days, end_date: end,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Challenge created!");
    setDialogOpen(false);
    setTitle(""); setTotalDays(100); setEndDate("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this challenge? Progress will be lost.")) return;
    const { error } = await supabase.from("challenges").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-soft">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl px-6 py-10 w-full">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your Challenges</h1>
            <p className="text-muted-foreground mt-1">Pick a grid to fill in a box for today.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-brand"><Plus className="h-4 w-4 mr-1" />New Challenge</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create a new challenge</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-4">
                <div>
                  <Label htmlFor="t">Title</Label>
                  <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 1000 Day Android Development Challenge" />
                </div>
                <div>
                  <Label htmlFor="sd">Start date</Label>
                  <Input id="sd" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>Length</Label>
                  <RadioGroup value={mode} onValueChange={(v) => setMode(v as "days" | "end")} className="mt-2 grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer has-[:checked]:bg-accent has-[:checked]:border-primary">
                      <RadioGroupItem value="days" /> Number of days
                    </label>
                    <label className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer has-[:checked]:bg-accent has-[:checked]:border-primary">
                      <RadioGroupItem value="end" /> End date
                    </label>
                  </RadioGroup>
                </div>
                {mode === "days" ? (
                  <div>
                    <Label htmlFor="d">Total days</Label>
                    <Input id="d" type="number" min={1} max={2000} value={totalDays} onChange={(e) => setTotalDays(Number(e.target.value))} />
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {[30, 60, 90, 100, 365, 1000].map(n => (
                        <button type="button" key={n} onClick={() => setTotalDays(n)}
                          className="text-xs px-2 py-1 rounded-full border hover:bg-accent">{n} days</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="ed">End date</Label>
                    <Input id="ed" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                )}
                <Button type="submit" className="w-full shadow-brand">Create Challenge</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {fetching ? (
          <p className="mt-10 text-center text-muted-foreground">Loading your challenges…</p>
        ) : challenges.length === 0 ? (
          <Card className="mt-10 p-12 text-center border-dashed">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-hero grid place-items-center text-primary-foreground shadow-brand">
              <Trophy className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">No challenges yet</h3>
            <p className="text-muted-foreground mt-1">Create your first challenge — any goal, any duration.</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Create one</Button>
          </Card>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map(c => {
              const done = progress.filter(p => p.challenge_id === c.id).length;
              const pct = Math.round((done / c.total_days) * 100);
              const finished = !!c.completed_at;
              return (
                <Card key={c.id} className="p-5 hover:shadow-brand transition-shadow group relative">
                  {finished && (
                    <div className="absolute top-3 right-3 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                  <Link to="/challenge/$id" params={{ id: c.id }} className="block">
                    <h3 className="font-semibold text-lg line-clamp-2 pr-8">{c.title}</h3>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {c.start_date} → {c.end_date}
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{done} / {c.total_days} days</span>
                        <span className="font-semibold text-primary">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-gradient-hero transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </Link>
                  <button onClick={() => remove(c.id)} aria-label="Delete challenge"
                    className="absolute bottom-3 right-3 p-2 rounded-md border bg-background/80 text-destructive hover:bg-destructive/10 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </button>

                </Card>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
