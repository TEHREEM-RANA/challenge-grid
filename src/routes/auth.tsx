import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — ChallengeGrid" },
      { name: "description", content: "Sign in or create a ChallengeGrid account to track your daily challenge progress." },
      { property: "og:title", content: "Sign in — ChallengeGrid" },
      { property: "og:description", content: "Sign in to continue tracking your daily challenge progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(1, "Name required").max(80),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse({ email, password, fullName });
        if (!parsed.success) { toast.error(parsed.error.issues.at(0)?.message ?? "Please check your details."); setBusy(false); return; }
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: { full_name: parsed.data.fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: parsed.data.email,
            password: parsed.data.password,
          });
          if (signInError) throw new Error("Account created, but automatic sign-in failed. Please sign in.");
          toast.success("Account created! Welcome to ChallengeGrid.");
          navigate({ to: "/dashboard" });
          return;
        }
        toast.success("Account created! Welcome to ChallengeGrid.");
        navigate({ to: "/dashboard" });
      } else {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) { toast.error(parsed.error.issues.at(0)?.message ?? "Please check your details."); setBusy(false); return; }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-soft">
      <SiteHeader />
      <div className="flex-1 grid md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-hero text-primary-foreground">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary-foreground/20 grid place-items-center font-bold">CG</div>
            <span className="font-display text-lg font-bold">ChallengeGrid</span>
          </Link>
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">Your goals deserve a beautiful grid.</h2>
            <p className="mt-3 text-primary-foreground/85 max-w-sm">
              Set a goal, fill your grid daily, and celebrate every finish line.
            </p>
          </div>
          <p className="text-xs text-primary-foreground/70">© ChallengeGrid — by Tehreem Rana</p>
        </div>

        <div className="flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-8 shadow-card">
            <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin" ? "Enter your email and password." : "Just an email and password — done in seconds."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
              </div>
              <Button type="submit" className="w-full shadow-brand" disabled={busy}>
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <p className="mt-5 text-sm text-center text-muted-foreground">
              {mode === "signin" ? (
                <>New here?{" "}
                  <button className="text-primary font-medium hover:underline" onClick={() => setMode("signup")}>Create an account</button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button className="text-primary font-medium hover:underline" onClick={() => setMode("signin")}>Sign in</button>
                </>
              )}
            </p>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
