import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Share2, HelpCircle, Check, Clock } from "lucide-react";
import { RequireAuth } from "@/auth/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { kindMeta } from "./activity.index";

export const Route = createFileRoute("/activity/$id")({
  component: () => (
    <RequireAuth>
      <ReceiptPage />
    </RequireAuth>
  ),
  head: () => ({
    meta: [{ title: "Receipt — PayPal" }],
  }),
});

type Txn = {
  id: string;
  amount: number;
  kind: string;
  counterparty: string | null;
  note: string | null;
  status: string;
  created_at: string;
};

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(n));
}

function computeFee(amount: number) {
  const a = Math.abs(amount);
  if (a >= 500 && a <= 1000) return 65;
  if (a >= 1001 && a <= 3000) return 200;
  if (a >= 3001 && a <= 5000) return 300;
  if (a >= 5001 && a <= 10000) return 400;
  if (a >= 10001 && a <= 20000) return 1500;
  if (a >= 20091 && a <= 200000) return 2800;
  return 0;
}

function ReceiptPage() {
  const { id } = useParams({ from: "/activity/$id" });
  const navigate = useNavigate();
  const [t, setT] = useState<Txn | null | undefined>(undefined);

  useEffect(() => {
    supabase
      .from("transactions")
      .select("id,amount,kind,counterparty,note,status,created_at")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setT((data as Txn) ?? null));
  }, [id]);

  if (t === undefined) {
    return <div className="min-h-screen bg-white p-6 text-[13px] text-[var(--pp-text-muted)]">Loading…</div>;
  }
  if (t === null) {
    return (
      <div className="min-h-screen bg-white p-6">
        <p className="text-[16px] font-semibold text-[var(--pp-text)]">Receipt not found</p>
        <Link to="/activity" className="mt-3 inline-block text-[14px] font-semibold text-[var(--pp-blue)]">
          Back to Activity
        </Link>
      </div>
    );
  }

  const m = kindMeta(t);
  const created = new Date(t.created_at);
  const dateStr = created.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = created.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const isPending = t.status === "pending";
  const isOut = m.sign === -1;
  const isRequest = t.kind === "request_money";

  const fee = isOut ? computeFee(t.amount) : 0;
  const total = Math.abs(t.amount) + fee;

  const heroLabel = isRequest
    ? `Requested from ${t.counterparty ?? "recipient"}`
    : isOut
    ? `Sent to ${t.counterparty ?? "recipient"}`
    : `Added to PayPal balance`;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="px-4 pt-6 pb-3 flex items-center justify-between">
        <button aria-label="Back" onClick={() => navigate({ to: "/activity" })}>
          <ArrowLeft className="h-6 w-6 text-[var(--pp-text)]" />
        </button>
        <div className="flex items-center gap-4">
          <button aria-label="Help"><HelpCircle className="h-5 w-5 text-[var(--pp-text)]" /></button>
          <button aria-label="Share"><Share2 className="h-5 w-5 text-[var(--pp-text)]" /></button>
        </div>
      </header>

      {/* Hero */}
      <div className="px-6 pt-4 pb-8 text-center">
        <div
          className="mx-auto h-16 w-16 rounded-full flex items-center justify-center text-[24px] font-bold"
          style={{ background: m.bg, color: "var(--pp-blue-dark)" }}
        >
          {m.glyph}
        </div>
        <p className="mt-4 text-[13px] font-semibold text-[var(--pp-text-muted)] uppercase tracking-wide">
          {heroLabel}
        </p>
        <p className="mt-1 text-[40px] font-bold text-[var(--pp-text)] tracking-tight">
          {fmtUSD(t.amount)}
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-[12px] font-semibold"
          style={{
            background: isPending ? "var(--pp-yellow)" : "oklch(0.95 0.05 145)",
            color: isPending ? "var(--pp-blue-dark)" : "var(--pp-success)",
          }}
        >
          {isPending ? <Clock className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          {isPending ? "Pending" : "Completed"}
        </div>
      </div>

      {/* Details */}
      <section className="px-4">
        <div className="rounded-2xl border border-[color:var(--border)] divide-y divide-[color:var(--border)] overflow-hidden">
          <Row label={isRequest ? "Requested from" : isOut ? "Sent to" : "Source"}
               value={t.counterparty ?? (t.kind === "add_money" ? "Linked bank" : "—")} />
          <Row label="Date" value={`${dateStr} at ${timeStr}`} />
          <Row label="Amount" value={fmtUSD(t.amount)} />
          {isOut && fee > 0 && (
            <Row label="Fees" value={fmtUSD(fee)} />
          )}
          <Row label="Total" value={fmtUSD(total)} bold />
          {!isRequest && (
            <Row
              label={isOut ? "Payment method" : "Deposit to"}
              value={t.kind === "transfer_to_savings" ? "PayPal Savings" : "PayPal balance"}
            />
          )}
          <Row label="Transaction ID" value={t.id.slice(0, 17).toUpperCase()} mono />
        </div>

        {t.note && (
          <div className="mt-4 rounded-2xl border border-[color:var(--border)] p-4">
            <p className="text-[12px] font-semibold text-[var(--pp-text-muted)] uppercase tracking-wide">Note</p>
            <p className="mt-1 text-[14px] text-[var(--pp-text)] whitespace-pre-wrap">{t.note}</p>
          </div>
        )}
      </section>

      <div className="flex-1" />

      <div className="px-4 pb-8 pt-6 space-y-3">
        {isRequest && isPending && (
          <button className="w-full rounded-full py-3.5 text-[15px] font-bold"
                  style={{ background: "var(--pp-yellow)", color: "var(--pp-blue-dark)" }}>
            Send a reminder
          </button>
        )}
        <button className="w-full rounded-full py-3.5 text-[15px] font-bold border-2"
                style={{ borderColor: "var(--pp-blue-dark)", color: "var(--pp-blue-dark)" }}>
          Report a problem
        </button>
      </div>

    </div>
  );
}

function Row({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3.5">
      <span className="text-[13px] text-[var(--pp-text-muted)]">{label}</span>
      <span
        className={`text-[14px] text-right ${bold ? "font-bold" : "font-semibold"} ${mono ? "font-mono text-[12px]" : ""} text-[var(--pp-text)]`}
      >
        {value}
      </span>
    </div>
  );
}
