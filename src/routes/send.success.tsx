import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RequireAuth } from "@/auth/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import paypalLogo from "@/assets/paypal-logo-blue.jpeg";
import { registerPPServiceWorker, showPaymentNotification } from "@/lib/ppNotifications";

type Search = { to: string; amount: string; status: "pending" | "completed" };

export const Route = createFileRoute("/send/success")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    to: typeof s.to === "string" ? s.to : "",
    amount: typeof s.amount === "string" ? s.amount : "0",
    status: s.status === "completed" ? "completed" : "pending",
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
  const { to, amount, status } = useSearch({ from: "/send/success" });
  const n = Number.parseFloat(amount) || 0;
  const recorded = useRef(false);
  const [notifyVisible, setNotifyVisible] = useState(false);
  const [systemNotified, setSystemNotified] = useState(true);

  useEffect(() => {
    const show = setTimeout(() => setNotifyVisible(true), 250);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    if (!systemNotified) return;
    const hide = setTimeout(() => setNotifyVisible(false), 7000);
    return () => clearTimeout(hide);
  }, [systemNotified]);

  useEffect(() => {
    if (recorded.current || !to || n <= 0) return;
    recorded.current = true;
    const key = `send:${to}:${amount}:${Math.floor(Date.now() / 60000)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.rpc("send_money", { p_amount: n, p_to: to, p_status: status }).then(() => {});

    void (async () => {
      await registerPPServiceWorker();
      await showPaymentNotification({
        title: "PayPal",
        body: `You paid ${fmtUSD(n)} to ${to}`,
        tag: key,
        url: "/activity",
      });
    })();
  }, [to, amount, n, status]);


  return (
    <div className="relative min-h-screen flex flex-col bg-white px-6 pt-16 pb-10">
      <div
        className={`pointer-events-none fixed left-3 right-3 top-3 z-50 transition-all duration-300 ${
          notifyVisible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--pp-text)]/90 px-3.5 py-3 shadow-lg backdrop-blur">
          <img
            src={paypalLogo}
            alt="PayPal"
            className="h-9 w-9 shrink-0 rounded-[10px] object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-white">PayPal</span>
              <span className="text-[12px] text-white/70">now</span>
            </div>
            <p className="mt-0.5 truncate text-[13px] text-white/90">
              You paid {fmtUSD(n)} to {to}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto h-16 w-16 rounded-full bg-[var(--pp-yellow)] flex items-center justify-center">
        <Check size={32} strokeWidth={3} className="text-[var(--pp-blue-dark)]" />
      </div>
      <h1 className="mt-6 text-[26px] font-bold text-center leading-tight text-[var(--pp-text)] break-words">
        You sent {fmtUSD(n)} to {to}
      </h1>
      <p className="mt-4 text-center text-[14px] text-[var(--pp-text-muted)] leading-relaxed">
        {status === "completed"
          ? "Your payment is complete. We’ve let the recipient know and you can see the details in your Activity."
          : "Your payment is being reviewed and is currently pending. We’re waiting for the recipient to pay the required fee to accept the payment. If the payment is not accepted within 5 days the funds will be returned to your account."}
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
