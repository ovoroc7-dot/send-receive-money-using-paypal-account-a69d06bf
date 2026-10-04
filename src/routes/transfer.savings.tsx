import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { X, Delete, PiggyBank } from "lucide-react";
import { RequireAuth } from "@/auth/RequireAuth";
import { useBalance } from "@/auth/useBalance";
import { useSavings } from "@/auth/useSavings";
import paypalLogo from "@/assets/paypal-logo-blue.jpeg";

export const Route = createFileRoute("/transfer/savings")({
  component: () => (
    <RequireAuth>
      <TransferSavingsPage />
    </RequireAuth>
  ),
  head: () => ({
    meta: [
      { title: "Transfer to Savings — PayPal" },
      { name: "description", content: "Move money from your PayPal balance into PayPal Savings." },
    ],
  }),
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtBig(n: number) {
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TransferSavingsPage() {
  const navigate = useNavigate();
  const { balance, refresh: refreshBalance } = useBalance();
  const { savings, transferToSavings } = useSavings();
  const available = balance ?? 0;

  const [raw, setRaw] = useState<string>("");
  const [keypadOpen, setKeypadOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (balance !== null && raw === "") setRaw("0");
  }, [balance, raw]);

  const amount = useMemo(() => (raw ? Number.parseInt(raw, 10) / 100 : 0), [raw]);
  const ctaDisabled = amount <= 0 || amount > available || submitting;

  const pressKey = (k: string) => {
    if (k === "del") return setRaw((p) => p.slice(0, -1) || "0");
    setRaw((p) => {
      const next = ((p === "0" ? "" : p) + k).replace(/^0+(?=\d)/, "");
      if (next.length > 13) return p;
      return next;
    });
  };

  const handleTransfer = async () => {
    if (ctaDisabled) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await transferToSavings(amount);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    await refreshBalance();
    setDone(amount);
  };

  if (done !== null) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <header className="flex justify-end px-5 pt-5">
          <button aria-label="Close" onClick={() => navigate({ to: "/finances" })}>
            <X size={24} />
          </button>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-7 -mt-16">
          <div className="h-24 w-24 rounded-full bg-[var(--pp-yellow)] flex items-center justify-center shadow-[0_10px_24px_-10px_oklch(0.8_0.15_85/0.6)]">
            <PiggyBank size={48} className="text-[var(--pp-blue-dark)]" />
          </div>
          <p className="mt-7 text-center text-[20px] font-semibold text-[var(--pp-text)] leading-snug">
            {fmt(done)} moved to
            <br /> PayPal Savings!
          </p>
          <p className="mt-2 text-center text-[14px] text-[var(--pp-text-muted)]">
            New savings balance: {savings !== null ? fmt(savings) : "—"}
          </p>
          <button
            onClick={() => navigate({ to: "/finances" })}
            className="mt-7 rounded-full bg-[var(--pp-blue-dark)] px-12 py-3 text-white text-[16px] font-bold"
          >
            Done
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      <header className="relative flex items-center justify-center px-5 pt-5 pb-2">
        <button
          aria-label="Close"
          onClick={() => navigate({ to: "/finances" })}
          className="absolute left-4 top-5 text-[var(--pp-text)]"
        >
          <X size={24} />
        </button>
        <h1 className="text-[15px] font-semibold text-[var(--pp-text)]">Transfer to Savings</h1>
      </header>

      <main className="flex-1 px-5 pb-32">
        {(() => {
          const display = amount === 0 ? "0" : fmtBig(amount);
          const len = display.length;
          const amountSize =
            len <= 6 ? "text-[64px]" : len <= 9 ? "text-[52px]" : len <= 12 ? "text-[40px]" : "text-[32px]";
          return (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setKeypadOpen(true)}
              className="mt-8 w-full flex items-start justify-center gap-1 overflow-hidden cursor-pointer select-none"
            >
              <span className="text-[26px] font-light text-[var(--pp-text)] shrink-0 leading-none mt-2">$</span>
              <span className={`${amountSize} font-light leading-none text-[var(--pp-text)] tracking-tight whitespace-nowrap`}>
                {display}
              </span>
            </div>
          );
        })()}
        <p className="mt-2 text-center text-[13px] text-[var(--pp-text-muted)]">
          Available balance: {fmt(available)}
        </p>

        {/* From / To */}
        <div className="mt-8 rounded-2xl border border-[color:var(--border)] divide-y divide-[color:var(--border)] bg-white">
          <div className="flex items-center gap-4 px-4 py-4">
            <img
              src={paypalLogo}
              alt="PayPal"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-[12px] text-[var(--pp-text-muted)]">From</p>
              <p className="text-[15px] font-semibold text-[var(--pp-text)]">PayPal Balance</p>
            </div>
            <p className="text-[13px] text-[var(--pp-text-muted)]">{fmt(available)}</p>
          </div>
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="h-10 w-10 rounded-full bg-[var(--pp-yellow)] flex items-center justify-center">
              <PiggyBank size={20} className="text-[var(--pp-blue-dark)]" />
            </div>
            <div className="flex-1">
              <p className="text-[12px] text-[var(--pp-text-muted)]">To</p>
              <p className="text-[15px] font-semibold text-[var(--pp-text)]">PayPal Savings</p>
            </div>
            <p className="text-[13px] text-[var(--pp-text-muted)]">
              {savings !== null ? fmt(savings) : "—"}
            </p>
          </div>
        </div>

        <p className="mt-6 text-[13px] leading-snug text-[var(--pp-text-muted)]">
          Transfers to PayPal Savings are free and typically happen instantly. Your money keeps
          earning until you move it back.
        </p>

        {error && (
          <p className="mt-4 text-center text-[14px] text-[oklch(0.55_0.22_25)]">{error}</p>
        )}
      </main>

      <div className="sticky bottom-0 left-0 right-0 px-4 pb-5 pt-2 bg-white">
        <button
          disabled={ctaDisabled}
          onClick={handleTransfer}
          className="w-full rounded-full py-4 text-[17px] font-bold disabled:opacity-50"
          style={{ background: "var(--pp-yellow)", color: "var(--pp-blue-dark)" }}
        >
          {submitting ? "Processing…" : `Transfer ${fmt(amount)} to Savings`}
        </button>
      </div>

      {keypadOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0" onClick={() => setKeypadOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[oklch(0.94_0.005_250)] pt-2 pb-3">
            <div className="flex justify-end px-4 pb-2">
              <button
                onClick={() => setKeypadOpen(false)}
                className="text-[15px] font-semibold text-[var(--pp-link)]"
              >
                Done
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 px-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
                <KeyBtn key={k} onClick={() => pressKey(k)}>
                  <span className="text-[26px] font-medium">{k}</span>
                </KeyBtn>
              ))}
              <div />
              <KeyBtn onClick={() => pressKey("0")}>
                <span className="text-[26px] font-medium">0</span>
              </KeyBtn>
              <KeyBtn onClick={() => pressKey("del")}>
                <Delete size={22} className="text-[var(--pp-text)]" />
              </KeyBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="m-1 h-12 rounded-md bg-white shadow-sm flex items-center justify-center text-[var(--pp-text)] active:bg-[oklch(0.92_0.005_250)]"
    >
      {children}
    </button>
  );
}
