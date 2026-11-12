import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, StickyNote, ListChecks } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
  head: () => ({
    meta: [
      { title: "Daily Tasks — ChallengeGrid" },
      { name: "description", content: "Plan, organize, and complete your daily tasks in ChallengeGrid." },
      { property: "og:title", content: "Daily Tasks — ChallengeGrid" },
      { property: "og:description", content: "Plan the day and check tasks off as you go." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Task = {
  id: string;
  title: string;
  notes: string | null;
  task_date: string;
  is_done: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);

function TasksPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [date, setDate] = useState(today());
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const load = async () => {
    if (!user) return;
    setFetching(true);
    const { data } = await supabase.from("daily_tasks")
      .select("*").eq("user_id", user.id).eq("task_date", date)
      .order("created_at", { ascending: true });
    setTasks((data as Task[]) ?? []);
    setFetching(false);
  };

  useEffect(() => { if (user) load(); }, [user, date]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("daily_tasks").insert({
      user_id: user.id,
      title: title.trim().slice(0, 200),
      notes: notes.trim() ? notes.trim().slice(0, 2000) : null,
      task_date: date,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setTitle(""); setNotes("");
    toast.success("Task added");
    load();
  };

  const toggle = async (t: Task) => {
    const { error } = await supabase.from("daily_tasks")
      .update({ is_done: !t.is_done }).eq("id", t.id);
    if (error) toast.error(error.message);
    else setTasks(tasks.map(x => x.id === t.id ? { ...x, is_done: !x.is_done } : x));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("daily_tasks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else setTasks(tasks.filter(x => x.id !== id));
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  const done = tasks.filter(t => t.is_done).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-soft">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl px-6 py-10 w-full">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-hero grid place-items-center text-primary-foreground shadow-brand">
            <ListChecks className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Daily Tasks</h1>
            <p className="text-muted-foreground">Plan your day like a notes app — tick off as you go.</p>
          </div>
        </div>

        <Card className="mt-6 p-5">
          <form onSubmit={add} className="space-y-3">
            <div className="grid md:grid-cols-[1fr_auto] gap-3">
              <Input placeholder="What do you want to do today?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:w-44" />
            </div>
            <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={2} />
            <Button type="submit" className="shadow-brand" disabled={busy || !title.trim()}>
              <Plus className="h-4 w-4 mr-1" />Add task
            </Button>
          </form>
        </Card>

        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{date} · {done} of {tasks.length} done</span>
        </div>

        <div className="mt-3 space-y-2">
          {fetching ? (
            <p className="text-center text-muted-foreground py-8">Loading…</p>
          ) : tasks.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <StickyNote className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No tasks for this day yet. Add your first one above.</p>
            </Card>
          ) : tasks.map(t => (
            <Card key={t.id} className="p-4 flex items-start gap-3 group">
              <Checkbox checked={t.is_done} onCheckedChange={() => toggle(t)} className="mt-1" />
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${t.is_done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                {t.notes && <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{t.notes}</div>}
              </div>
              <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
