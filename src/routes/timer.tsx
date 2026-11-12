import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Brain, Coffee, Play, Pause, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/timer")({
  component: TimerPage,
  head: () => ({
    meta: [
      { title: "Focus Timer — ChallengeGrid" },
      { name: "description", content: "A Pomodoro focus timer to keep your daily challenge streak going, with focus and break modes plus a completion beep." },
      { property: "og:title", content: "Focus Timer — ChallengeGrid" },
      { property: "og:description", content: "A Pomodoro focus and break timer built into your challenge tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const DURATIONS = { focus: 25 * 60, break: 5 * 60 };

function beep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const play = (start: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + 0.4);
    };
    [0, 0.5, 1].forEach(play);
    setTimeout(() => ctx.close(), 2200);
  } catch {
    /* audio unavailable */
  }
}

function TimerPage() {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [durations, setDurations] = useState({ ...DURATIONS });
  const [left, setLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [customMin, setCustomMin] = useState("25");
  const deadlineRef = useRef<number | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (!running) {
      deadlineRef.current = null;
      return;
    }
    // anchor to wall clock so the countdown can never drift or go backwards
    deadlineRef.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil(((deadlineRef.current ?? 0) - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        deadlineRef.current = null;
        setRunning(false);
        beep();
        if (modeRef.current === "focus") setRounds((r) => r + 1);
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const switchMode = (m: "focus" | "break") => {
    setRunning(false);
    setMode(m);
    setLeft(durations[m]);
    setCustomMin(String(Math.round(durations[m] / 60)));
  };

  const applyMinutes = (mins: number) => {
    const clamped = Math.min(180, Math.max(1, Math.round(mins)));
    setRunning(false);
    setDurations((d) => ({ ...d, [mode]: clamped * 60 }));
    setLeft(clamped * 60);
    setCustomMin(String(clamped));
  };


  const total = durations[mode];
  const pct = ((total - left) / total) * 100;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  const R = 46;
  const C = 2 * Math.PI * R;


  return (
    <div className="min-h-screen flex flex-col bg-gradient-soft">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold">Focus Timer</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Work in focused sprints, then take a short break. A beep plays when time is up.
        </p>

        <Card className="mt-6 p-6 sm:p-10 shadow-card">
          <div className="flex justify-center gap-2 sm:gap-3">
            <Button
              variant={mode === "focus" ? "default" : "secondary"}
              className={mode === "focus" ? "shadow-brand rounded-full" : "rounded-full"}
              onClick={() => switchMode("focus")}
            >
              <Brain className="h-4 w-4 mr-1" /> Focus
            </Button>
            <Button
              variant={mode === "break" ? "default" : "secondary"}
              className={mode === "break" ? "shadow-brand rounded-full" : "rounded-full"}
              onClick={() => switchMode("break")}
            >
              <Coffee className="h-4 w-4 mr-1" /> Break
            </Button>
          </div>

          <div className="mt-8 mx-auto relative w-56 h-56 sm:w-72 sm:h-72">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={R} fill="none" stroke="var(--secondary)" strokeWidth="5" />
              <circle
                cx="50" cy="50" r={R} fill="none"
                stroke="var(--primary)" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C - (pct / 100) * C}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-display text-5xl sm:text-6xl font-extrabold tabular-nums">{mm}:{ss}</div>
                <div className="mt-1 text-xs sm:text-sm tracking-widest uppercase text-muted-foreground">
                  {left === 0 ? "Done" : running ? "Running" : "Paused"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Button
              size="lg"
              className="shadow-brand min-w-32"
              onClick={() => (left === 0 ? (setLeft(total), setRunning(true)) : setRunning((r) => !r))}
            >
              {running ? <><Pause className="h-5 w-5 mr-1" />Pause</> : <><Play className="h-5 w-5 mr-1" />Start</>}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => { setRunning(false); setLeft(total); }}>
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-8 border-t pt-6">
            <p className="text-center text-sm font-semibold">
              Set your own {mode === "focus" ? "focus" : "break"} time
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {(mode === "focus" ? [15, 25, 45, 60, 90] : [5, 10, 15, 20]).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => applyMinutes(n)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    Math.round(total / 60) === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  {n} min
                </button>
              ))}
            </div>
            <form
              className="mt-4 flex items-center justify-center gap-2"
              onSubmit={(e) => { e.preventDefault(); applyMinutes(Number(customMin) || 1); }}
            >
              <Input
                type="number"
                min={1}
                max={180}
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                aria-label="Custom minutes"
                className="w-24 text-center"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
              <Button type="submit" variant="secondary">Set</Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Focus sessions completed today: <strong className="text-primary">{rounds}</strong>
          </p>

        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
