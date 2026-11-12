import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { CheckSquare, Target, Trophy, Cloud, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "ChallengeGrid — Track Your Daily Challenges" },
      { name: "description", content: "Set a goal, track your progress in a simple daily grid, and celebrate finishing your challenge." },
      { property: "og:title", content: "ChallengeGrid — Visual Challenge Tracker" },
      { property: "og:description", content: "Set a goal. Fill the grid. Reach your finish line." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function MiniGrid() {
  const filled = new Set([0,1,2,3,4,5,10,11,12,13,20,21,22,30,31,40]);
  return (
    <div className="grid grid-cols-10 gap-1.5 p-4 rounded-2xl bg-card shadow-card border">
      {Array.from({ length: 100 }).map((_, i) => (
        <div key={i} className={`aspect-square rounded-sm border ${filled.has(i) ? "bg-primary border-primary shadow-brand" : "bg-background border-border"}`} />
      ))}
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Turn goals into visible progress
            </div>
            <h1 className="mt-4 text-5xl md:text-6xl font-extrabold leading-tight">
              Every day is a <span className="bg-gradient-hero bg-clip-text text-transparent">checkbox</span>.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg">
              Set your challenge — 30 days, 100 days, 1000 days. A grid appears. Check a box each day. Watch your goal become reality.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild size="lg" className="shadow-brand">
                <Link to="/auth">Start your challenge</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#how">How it works</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Free · Cloud-synced · No app required</p>
          </div>
          <div className="animate-float"><MiniGrid /></div>
        </section>

        {/* Features */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold text-center">Built for people who finish what they start</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Any goal, any length", desc: "1000-day dev challenge? 30-day yoga? 90-day writing? Set start date + days, done." },
              { icon: CheckSquare, title: "One tap per day", desc: "Click a box. That's it. Your grid fills up like satisfying pixel art." },
              { icon: Cloud, title: "Never lose progress", desc: "Everything syncs to the cloud. Close the tab — pick up where you left off." },
              { icon: Trophy, title: "Celebrate the finish", desc: "Complete the last day and get a congratulations moment worth screenshotting." },
              { icon: Sparkles, title: "Run many at once", desc: "Track multiple challenges in parallel. Each one gets its own grid." },
              { icon: Users, title: "Beautifully simple", desc: "No feeds, no distractions. Just you, the grid, and the finish line." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border bg-card p-6 shadow-card hover:shadow-brand transition-shadow">
                <div className="h-11 w-11 rounded-xl bg-gradient-hero grid place-items-center text-primary-foreground shadow-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-3xl bg-gradient-hero p-10 md:p-14 text-center shadow-brand">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary-foreground">Your 1000-day story starts today.</h2>
            <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto">Sign up in 30 seconds. Create your first grid. Come back tomorrow and check a box.</p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/auth">Create free account</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
