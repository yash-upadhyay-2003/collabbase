import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Hexagon, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { tokenStore } from "@/lib/api";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    // already authed? bounce to dashboard
  },
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("alex@collabbase.app");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (typeof window !== "undefined" && tokenStore.get()) {
    nav({ to: "/dashboard" });
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      nav({ to: "/dashboard" });
    } catch (e: any) {
      setErr(e?.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background">
            <Hexagon className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <h1 className="mt-4 text-[20px] font-semibold tracking-tight">Sign in to CollabBase</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Welcome back. Continue to your workspace.</p>
        </div>

        <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] outline-none focus:border-foreground/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] outline-none focus:border-foreground/40"
              />
            </div>

            {err && <div className="text-[12.5px] text-destructive">{err}</div>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Continue
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[12.5px] text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-foreground underline-offset-4 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
