import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import paypalWelcomeLogo from "@/assets/paypal-p-welcome-new.png";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — PayPal" },
      { name: "description", content: "Sign in to your PayPal account." },
    ],
  }),
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/finances" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fn = mode === "signin" ? signIn : signUp;
    const { error: err } = await fn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    if (mode === "signup") {
      setError("Check your email to confirm, then sign in.");
      setMode("signin");
      return;
    }
    navigate({ to: "/finances" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex flex-col px-7 pt-16">
        <div className="flex justify-center">
          <img src={paypalWelcomeLogo} alt="PayPal" className="h-16 w-16 object-contain" />
        </div>
        <h1 className="mt-6 text-center text-[28px] font-semibold text-[var(--pp-text)]">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-center text-[15px] text-[var(--pp-text-muted)]">
          {mode === "signin"
            ? "Sign in to access your balance."
            : "Sign up to start using PayPal."}
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="h-12 rounded-md border border-[color:var(--border)] bg-white px-4 text-[15px] text-[var(--pp-text)] outline-none focus:border-[var(--pp-blue)] focus:ring-1 focus:ring-[var(--pp-blue)]"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="h-12 rounded-md border border-[color:var(--border)] bg-white px-4 text-[15px] text-[var(--pp-text)] outline-none focus:border-[var(--pp-blue)] focus:ring-1 focus:ring-[var(--pp-blue)]"
          />

          {error && (
            <p className="text-[14px] text-[oklch(0.55_0.22_25)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-[17px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          onClick={() => {
            setError(null);
            setMode(mode === "signin" ? "signup" : "signin");
          }}
          className="mt-6 mx-auto text-[15px] font-semibold text-[var(--pp-link)]"
        >
          {mode === "signin" ? "Create an account" : "I already have an account"}
        </button>
      </main>
    </div>
  );
}
