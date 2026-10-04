import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { X, ArrowLeftRight, Plus, Delete } from "lucide-react";
import { RequireAuth } from "@/auth/RequireAuth";
import { useBalance } from "@/auth/useBalance";

export const Route = createFileRoute("/transfer/bank")({
  component: TransferBankRoute,
  head: () => ({
    meta: [
      { title: "Transfer to bank — PayPal" },
      { name: "description", content: "Transfer money from your PayPal balance to your bank." },
    ],
  }),
});

type Speed = "instant" | "standard";
type Source = "sutton" | "capital";

const FEE_RATE = 0.0175;
const FEE_MIN = 0.25;
const FEE_MAX = 25;

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtBig(n: number) {
  // Display amount: integer no decimals, otherwise up to 2 decimals as typed
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TransferBankRoute() {
  return (
    <RequireAuth>
      <TransferBankPage />
    </RequireAuth>
  );
}

function TransferBankPage() {
  const navigate = useNavigate();
  const { balance, transferMoney } = useBalance();
  const available = balance ?? 0;

  // Amount as string of digits ("4071" => 40.71). Default to full balance.
  const [raw, setRaw] = useState<string>("");
  const [speed, setSpeed] = useState<Speed>("standard");
  const [source, setSource] = useState<Source>("sutton");
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize amount to available balance once known
  useEffect(() => {
    if (balance !== null && raw === "") {
      const cents = Math.round(balance * 100).toString();
      setRaw(cents);
    }
  }, [balance, raw]);

  const amount = useMemo(() => {
    if (!raw) return 0;
    return Number.parseInt(raw, 10) / 100;
  }, [raw]);

  const fee = useMemo(() => {
    if (speed !== "instant" || amount <= 0) return 0;
    return Math.min(FEE_MAX, Math.max(FEE_MIN, +(amount * FEE_RATE).toFixed(2)));
  }, [amount, speed]);

  const receive = Math.max(0, +(amount - fee).toFixed(2));

  const sourceLabel =
    source === "sutton"
      ? { name: "SUTTON BANK", sub: "Checking ••••7402" }
      : { name: "CAPITAL ONE N.A.", sub: "Checking ••••1260" };

  const ctaDisabled = amount <= 0 || amount > available || submitting;

  const handleTransfer = async () => {
    if (ctaDisabled) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await transferMoney(amount);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(amount);
  };

  const pressKey = (k: string) => {
    if (k === "del") {
      setRaw((p) => p.slice(0, -1));
      return;
    }
    if (k === ".") return; // amount handled in cents
    setRaw((p) => {
      const next = (p + k).replace(/^0+(?=\d)/, "");
      // Cap at 9 digits (=$9,999,999.99)
      if (next.length > 13) return p;
      return next;
    });
  };

  if (done !== null) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <header className="flex justify-end px-5 pt-5">
          <button
            aria-label="Close"
            onClick={() => navigate({ to: "/finances" })}
            className="text-[var(--pp-text)]"
          >
            <X size={24} />
          </button>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-7 -mt-16">
          <div className="h-24 w-24 rounded-full bg-[oklch(0.6_0.15_155)] flex items-center justify-center shadow-[0_10px_24px_-10px_oklch(0.55_0.12_155/0.55)]">
            <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>
          <p className="mt-7 text-center text-[20px] font-semibold text-[var(--pp-text)] leading-snug">
            Your {fmt(done)} USD is on
            <br /> its way!
          </p>
          <button
            onClick={() => navigate({ to: "/finances" })}
            className="mt-7 rounded-full bg-[var(--pp-blue)] px-12 py-3 text-white text-[16px] font-bold"
          >
            Done
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      {/* Header */}
      <header className="relative flex items-center justify-center px-5 pt-5 pb-2">
        <button
          aria-label="Close"
          onClick={() => navigate({ to: "/finances" })}
          className="absolute left-4 top-5 text-[var(--pp-text)]"
        >
          <X size={24} />
        </button>
        <h1 className="text-[15px] font-semibold text-[var(--pp-text)]">Transfer amount</h1>
      </header>

      <main className="flex-1 px-5 pb-32">
        {/* Amount */}
        {(() => {
          const display = amount === 0 ? "0" : fmtBig(amount);
          const len = display.length;
          // Scale: full-size for short, progressively shrink as digits grow
          const amountSize =
            len <= 6 ? "text-[64px]"
            : len <= 9 ? "text-[52px]"
            : len <= 12 ? "text-[40px]"
            : len <= 15 ? "text-[32px]"
            : len <= 18 ? "text-[26px]"
            : "text-[22px]";
          const dollarSize =
            len <= 6 ? "text-[26px]"
            : len <= 9 ? "text-[22px]"
            : len <= 12 ? "text-[18px]"
            : "text-[15px]";
          return (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setKeypadOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setKeypadOpen(true);
              }}
              className="mt-8 w-full flex items-start justify-center gap-1 overflow-hidden cursor-pointer select-none"
            >
              <span className={`${dollarSize} font-light text-[var(--pp-text)] shrink-0 leading-none mt-2`}>$</span>
              <span
                className={`${amountSize} font-light leading-none text-[var(--pp-text)] tracking-tight whitespace-nowrap`}
              >
                {display}
              </span>
              {amount > 0 && (
                <span
                  role="button"
                  aria-label="Clear amount"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRaw("0");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      setRaw("0");
                    }
                  }}
                  className="ml-2 mt-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.78_0_0)] text-white shrink-0"
                >
                  <X size={12} strokeWidth={3} />
                </span>
              )}
            </div>
          );
        })()}
        <p className="mt-2 text-center text-[13px] text-[var(--pp-text-muted)]">
          Available balance: {fmt(available)}
        </p>

        {/* Speed selector */}
        <div className="mt-7 grid grid-cols-2 gap-3">
          <SpeedCard
            selected={speed === "instant"}
            onClick={() => setSpeed("instant")}
            icon={<RocketIcon />}
            title="in minutes"
            subtitle={amount > 0 ? `${fmt(fee)} USD fee` : "fee applies"}
          />
          <SpeedCard
            selected={speed === "standard"}
            onClick={() => setSpeed("standard")}
            icon={<BalloonIcon />}
            title="in 1-3 days"
            subtitle="No fee"
          />
        </div>

        {/* Source */}
        <div className="mt-7 flex items-center gap-4">
          {source === "sutton" ? <SuttonLogo /> : <CapitalOneLogo />}
          <div className="flex-1">
            <p className="text-[16px] font-bold text-[var(--pp-text)] leading-tight tracking-wide">
              {sourceLabel.name}
            </p>
            <p className="text-[13px] text-[var(--pp-text-muted)]">{sourceLabel.sub}</p>
          </div>
          <button
            onClick={() => setSourceOpen(true)}
            className="text-[15px] font-semibold text-[var(--pp-link)]"
          >
            Change
          </button>
        </div>

        {/* Fee */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <p className="text-[15px] text-[var(--pp-text)]">Fee:</p>
            <p className="text-[15px] text-[var(--pp-text)]">
              {speed === "instant" && amount > 0 ? `${fmt(fee)} USD` : "Free"}
            </p>
          </div>
          {speed === "instant" && (
            <p className="mt-1 text-[13px] text-[var(--pp-text-muted)]">
              1.75% fee ($0.25 USD minimum, $25.00 USD maximum)
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <p className="mt-7 text-[13px] leading-snug text-[var(--pp-text-muted)]">
          {speed === "instant"
            ? "Transfers may take a few minutes and vary by bank. All transfers are subject to review and could be delayed or stopped if we identify an issue."
            : "Transfers made after 7:00 PM ET or on weekends or holidays can take a little longer. All transfers are subject to review and might be delayed or stopped if there's an issue."}
        </p>

        {error && (
          <p className="mt-4 text-center text-[14px] text-[oklch(0.55_0.22_25)]">{error}</p>
        )}
      </main>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 left-0 right-0 px-4 pb-5 pt-2 bg-white">
        <button
          disabled={ctaDisabled}
          onClick={handleTransfer}
          className="w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-white text-[17px] font-bold disabled:opacity-50"
        >
          {submitting
            ? "Processing…"
            : `Transfer ${fmt(speed === "instant" ? receive : amount)} USD Now`}
        </button>
      </div>

      {/* Source bottom sheet */}
      {sourceOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSourceOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white pt-3 pb-7">
            <div className="mx-auto h-1 w-10 rounded-full bg-[oklch(0.85_0_0)]" />
            <h2 className="mt-3 text-center text-[16px] font-semibold text-[var(--pp-text)]">
              Transfer to
            </h2>
            <button
              onClick={() => {
                setSource("capital");
                setSourceOpen(false);
              }}
              className="w-full mt-4 px-5 flex items-center gap-4"
            >
              <MastercardLogo />
              <div className="flex-1 text-left">
                <p className="text-[16px] font-bold text-[var(--pp-text)]">Mastercard</p>
                <p className="text-[13px] text-[var(--pp-text-muted)]">Debit ••••7109</p>
              </div>
            </button>
            <button
              onClick={() => {
                setSource("capital");
                setSourceOpen(false);
              }}
              className="w-full mt-4 px-5 flex items-center gap-4"
            >
              <CapitalOneLogo />
              <div className="flex-1 text-left">
                <p className="text-[16px] font-bold text-[var(--pp-text)] tracking-wide">
                  CAPITAL ONE N.A.
                </p>
                <p className="text-[13px] text-[var(--pp-text-muted)]">Checking ••••1260</p>
              </div>
            </button>
            <button
              onClick={() => {
                setSource("sutton");
                setSourceOpen(false);
              }}
              className="w-full mt-4 px-5 flex items-center gap-4"
            >
              <SuttonLogo />
              <div className="flex-1 text-left">
                <p className="text-[16px] font-bold text-[var(--pp-text)] tracking-wide">
                  SUTTON BANK
                </p>
                <p className="text-[13px] text-[var(--pp-text-muted)]">Checking ••••7402</p>
              </div>
            </button>
            <button className="w-full mt-5 px-5 flex items-center gap-4">
              <div className="h-10 w-12 rounded-md bg-[oklch(0.96_0.01_250)] flex items-center justify-center">
                <Plus size={20} className="text-[var(--pp-text)]" />
              </div>
              <p className="flex-1 text-left text-[15px] text-[var(--pp-text)]">
                Link a new debit card
              </p>
            </button>
            <button className="w-full mt-4 px-5 flex items-center gap-4">
              <div className="h-10 w-12 rounded-md bg-[oklch(0.96_0.01_250)] flex items-center justify-center">
                <Plus size={20} className="text-[var(--pp-text)]" />
              </div>
              <p className="flex-1 text-left text-[15px] text-[var(--pp-text)]">
                Link a new bank account
              </p>
            </button>
            <button className="mt-5 w-full px-5 text-left text-[14px] font-semibold text-[var(--pp-link)]">
              Don't see all of your banks and cards?
            </button>
          </div>
        </div>
      )}

      {/* Keypad */}
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

function SpeedCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-xl bg-white p-4 flex flex-col items-center gap-2 transition-all " +
        (selected
          ? "border-2 border-[var(--pp-blue)]"
          : "border border-[color:var(--border)]")
      }
    >
      <div className="h-14 w-14 flex items-center justify-center">{icon}</div>
      <p className={"text-[15px] text-[var(--pp-text)] " + (selected ? "font-bold" : "")}>{title}</p>
      <p className="text-[13px] text-[var(--pp-text-muted)]">{subtitle}</p>
    </button>
  );
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12">
      <path d="M32 6c8 6 12 14 12 24v10l-6 4h-12l-6-4V30C20 20 24 12 32 6z" fill="oklch(0.45 0.22 265)" />
      <path d="M32 6c-8 6-12 14-12 24v10l6 4h6V6z" fill="oklch(0.32 0.18 265)" />
      <circle cx="32" cy="26" r="5" fill="white" />
      <circle cx="32" cy="26" r="3" fill="oklch(0.55 0.2 260)" />
      <path d="M20 36 L12 48 L20 46 Z" fill="oklch(0.32 0.18 265)" />
      <path d="M44 36 L52 48 L44 46 Z" fill="oklch(0.32 0.18 265)" />
      <path d="M28 50 L32 60 L36 50 Z" fill="oklch(0.79 0.17 80)" />
    </svg>
  );
}

function BalloonIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12">
      <ellipse cx="32" cy="26" rx="18" ry="22" fill="oklch(0.85 0.07 230)" />
      <path d="M22 6c-4 6-6 14-6 22 0 6 1 12 4 18h2c-3-6-4-12-4-18 0-8 2-16 6-22h-2z" fill="oklch(0.55 0.2 260)" />
      <path d="M42 6c4 6 6 14 6 22 0 6-1 12-4 18h-2c3-6 4-12 4-18 0-8-2-16-6-22h2z" fill="oklch(0.55 0.2 260)" />
      <path d="M30 6c0 14 0 28 0 40h4c0-12 0-26 0-40h-4z" fill="oklch(0.55 0.2 260)" />
      <path d="M26 50 L38 50 L36 58 L28 58 Z" fill="oklch(0.79 0.17 80)" />
    </svg>
  );
}

function SuttonLogo() {
  return (
    <div className="h-10 w-12 rounded-md bg-[oklch(0.94_0.04_240)] flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--pp-blue)]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10 L12 4 L21 10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10 V18 M9 10 V18 M15 10 V18 M19 10 V18" />
        <path d="M3 19 H21" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function CapitalOneLogo() {
  return (
    <div className="h-10 w-12 rounded-md bg-[oklch(0.22_0.08_265)] flex items-center justify-center">
      <span className="text-white text-[8px] font-bold tracking-tight">
        Capital<span className="text-[var(--pp-mc-red)]">One</span>
      </span>
    </div>
  );
}

function MastercardLogo() {
  return (
    <div className="h-10 w-12 rounded-md bg-white border border-[color:var(--border)] flex items-center justify-center">
      <div className="relative h-6 w-10">
        <span
          className="absolute left-0 top-0 h-6 w-6 rounded-full"
          style={{ background: "var(--pp-mc-red)" }}
        />
        <span
          className="absolute right-0 top-0 h-6 w-6 rounded-full mix-blend-multiply"
          style={{ background: "var(--pp-mc-yellow)" }}
        />
      </div>
    </div>
  );
}

// Suppress unused import warning for ArrowLeftRight (used elsewhere if needed)
void ArrowLeftRight;
