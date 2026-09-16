import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RequireAuth } from "@/auth/RequireAuth";
import { useBalance } from "@/auth/useBalance";
import { showPaymentNotification } from "@/lib/ppNotifications";

type Search = { amount?: string };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export const Route = createFileRoute("/add-money/success")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    amount: typeof s.amount === "string" ? s.amount : "10",
  }),
  component: SuccessRoute,
  head: () => ({
    meta: [
      { title: "Money added — PayPal" },
      { name: "description", content: "Money successfully added to your balance." },
    ],
  }),
});

function SuccessRoute() {
  return (
    <RequireAuth>
      <SuccessPage />
    </RequireAuth>
  );
}

function SuccessPage() {
  const { amount = "10" } = Route.useSearch();
  const navigate = useNavigate();
  const { addMoney } = useBalance();
  const ranRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [credited, setCredited] = useState(false);

  const numericAmount = (() => {
    const parsed = Number.parseFloat(amount);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  })();

  useEffect(() => {
    if (ranRef.current) return;
    if (numericAmount <= 0) return;
    ranRef.current = true;
    addMoney(numericAmount).then(({ error: err }) => {
      if (err) setError(err);
      else {
        setCredited(true);
        void showPaymentNotification({
          title: "PayPal",
          body: `You received ${formatCurrency(numericAmount)}`,
          tag: `pp-received-${Date.now()}`,
          url: "/activity",
        });
      }
    });
  }, [numericAmount, addMoney]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 flex flex-col items-center justify-center px-7">
        <div className="h-28 w-28 rounded-full bg-[oklch(0.55_0.12_155)] flex items-center justify-center shadow-[0_10px_24px_-10px_oklch(0.55_0.12_155/0.55)]">
          <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <p className="mt-8 text-center text-[22px] font-semibold text-[var(--pp-text)] leading-snug">
          You added {formatCurrency(numericAmount)} to
          <br />
          your balance
        </p>
        {error && (
          <p className="mt-4 text-center text-[14px] text-[oklch(0.55_0.22_25)]">
            {error}
          </p>
        )}
        {!error && !credited && (
          <p className="mt-4 text-center text-[13px] text-[var(--pp-text-muted)]">
            Saving...
          </p>
        )}
      </main>

      <div className="px-4 pb-6 pt-2">
        <button
          onClick={() => navigate({ to: "/finances" })}
          className="w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-white text-[17px] font-bold"
        >
          Done
        </button>
      </div>
    </div>
  );
}
