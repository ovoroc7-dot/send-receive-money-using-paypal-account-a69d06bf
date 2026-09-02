import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import splashArt from "@/assets/paypal-splash.jpg";

const SEEN_KEY = "pp_splash_seen";

type Phase = "yellow" | "loading" | "done";

export function SplashGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  // Initialize to "done" so SSR and the client's first render match (no hydration
  // mismatch). The splash is started in an effect after mount.
  const [phase, setPhase] = useState<Phase>("done");

  useEffect(() => {
    if (phase === "done") {
      // Start the splash once per session, after hydration.
      if (!sessionStorage.getItem(SEEN_KEY)) setPhase("yellow");
      return;
    }
    if (phase === "yellow") {
      const t = setTimeout(() => setPhase("loading"), 1300);
      return () => clearTimeout(t);
    }
    if (phase === "loading") {
      const t = setTimeout(() => {
        sessionStorage.setItem(SEEN_KEY, "1");
        setPhase("done");
      }, 1100);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Avoid splash flash on TanStack route prefetch — but still render children behind.
  void pathname;

  return (
    <>
      {children}
      {phase !== "done" && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
            style={{
              backgroundColor: "var(--pp-yellow)",
              opacity: phase === "yellow" ? 1 : 0,
              pointerEvents: phase === "yellow" ? "auto" : "none",
            }}
          >
            <img
              src={splashArt}
              alt="PayPal"
              className="h-full w-full object-cover transition-transform duration-700 ease-out"
              style={{ transform: phase === "yellow" ? "scale(1)" : "scale(1.06)" }}
            />
          </div>

          <div
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
            style={{
              backgroundColor: "oklch(0.985 0.005 30)",
              opacity: phase === "loading" ? 1 : 0,
              pointerEvents: phase === "loading" ? "auto" : "none",
            }}
          >
            <svg
              viewBox="0 0 50 50"
              className="h-14 w-14 animate-spin"
              style={{ animationDuration: "1.1s" }}
              aria-label="Loading"
            >
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="oklch(0.55 0.13 265)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="95 40"
              />
            </svg>
          </div>
        </div>
      )}
    </>
  );
}
