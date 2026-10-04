import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, X, Check, Plus, Building2, CreditCard } from "lucide-react";
import { useLinkedAccounts, type LinkedAccount } from "@/auth/useLinkedAccounts";

type Search = { amount?: string };

function getParsedAmount(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

function formatAmountDisplay(value: string) {
  const parsed = getParsedAmount(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(parsed) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}

function formatAmountCta(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(getParsedAmount(value));
}

export const Route = createFileRoute("/add-money/method")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    amount: typeof s.amount === "string" ? s.amount : "10",
  }),
  component: MethodPage,
  head: () => ({
    meta: [
      { title: "Add money — PayPal" },
      { name: "description", content: "Choose how to add money to your PayPal balance." },
    ],
  }),
});

type Speed = "debit" | "bank";

function MethodPage() {
  const { amount = "10" } = Route.useSearch();
  const navigate = useNavigate();
  const { accounts } = useLinkedAccounts();
  const [speed, setSpeed] = useState<Speed>("bank");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedLinkedId, setSelectedLinkedId] = useState<string | null>(null);
  const displayAmount = formatAmountDisplay(amount);
  const ctaAmount = formatAmountCta(amount);

  const selectedLinked = accounts.find((a) => a.id === selectedLinkedId) ?? null;
  const isDebit = speed === "debit";


  return (
    <div className="min-h-screen flex flex-col bg-[var(--pp-bg)] relative">
      {/* Header */}
      <header className="relative flex items-center justify-center px-4 pt-5 pb-4">
        <Link to="/add-money" className="absolute left-4 top-5 text-[var(--pp-text)]">
          <ArrowLeft size={24} strokeWidth={2.25} />
        </Link>
        <h1 className="text-[15px] font-semibold text-[var(--pp-text)]">
          Add money to PayPal balance
        </h1>
      </header>

      <main className="flex-1 px-5 pb-32">
        {/* Amount */}
        <p className="mt-8 text-center text-[44px] font-semibold text-[var(--pp-text)] leading-none">
          {displayAmount}
        </p>

        {/* Speed selector */}
        <div className="mt-10 grid grid-cols-2 gap-3">
          <SpeedCard
            selected={speed === "debit"}
            onClick={() => setSpeed("debit")}
            icon={<RocketIcon />}
            title="in seconds"
            subtitle="with debit"
          />
          <SpeedCard
            selected={speed === "bank"}
            onClick={() => setSpeed("bank")}
            icon={<BalloonIcon />}
            title="in 3-5 days"
            subtitle="with your bank"
          />
        </div>

        {/* Source row */}
        <div className="mt-10 flex items-center gap-4">
          {selectedLinked ? (
            <LinkedIcon kind={selectedLinked.kind} />
          ) : isDebit ? <MastercardLogo /> : <CapitalOneLogo />}
          <div className="flex-1">
            <p className="text-[17px] font-bold text-[var(--pp-text)] leading-tight">
              {selectedLinked ? selectedLinked.institution : isDebit ? "Mastercard" : "CAPITAL ONE N.A."}
            </p>
            <p className="text-[14px] text-[var(--pp-text-muted)]">
              {selectedLinked
                ? `${selectedLinked.account_type ?? (selectedLinked.kind === "card" ? "Card" : "Checking")} ••••${selectedLinked.last4}`
                : isDebit ? "Debit ••••7109" : "Checking ••••1260"}
            </p>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="text-[16px] font-semibold text-[var(--pp-link)]"
          >
            Change
          </button>
        </div>


        {/* Fee */}
        <div className="mt-7 flex items-center justify-between">
          <p className="text-[15px] text-[var(--pp-text)]">Fee:</p>
          <p className="text-[15px] text-[var(--pp-text)]">No fees</p>
        </div>

        {/* Disclaimer */}
        <p className="mt-10 text-[13px] leading-snug text-[var(--pp-text-muted)]">
          {isDebit
            ? "Applies only to Visa or Mastercard debit cards. Transactions are subject to review. We may delay or decline a transaction if we identify an issue."
            : "Transfers made after 7:00 PM ET or on weekends or holidays can take a little longer. All transactions are subject to review."}
        </p>
      </main>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 left-0 right-0 px-4 pb-5 pt-2 bg-[var(--pp-bg)]">
        <button
          onClick={() => navigate({ to: "/security-check", search: { amount, speed } })}
          className="w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-white text-[17px] font-bold"
        >
          Add {ctaAmount} Now
        </button>
      </div>

      {/* Bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-5 pb-7">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-[var(--pp-text)]">
                Choose a way to add funds
              </h2>
              <button
                aria-label="Close"
                onClick={() => setSheetOpen(false)}
                className="text-[var(--pp-text)]"
              >
                <X size={22} />
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedLinkedId(null);
                setSpeed("bank");
                setSheetOpen(false);
              }}
              className="w-full mt-5 flex items-center gap-4"
            >
              <CapitalOneLogo />
              <div className="flex-1 text-left">
                <p className="text-[16px] font-bold text-[var(--pp-text)]">
                  CAPITAL ONE N.A.
                </p>
                <p className="text-[13px] text-[var(--pp-text-muted)]">
                  Checking ••••1260
                </p>
              </div>
              {!selectedLinked && <Check size={22} className="text-[var(--pp-text)]" />}
            </button>

            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setSelectedLinkedId(a.id);
                  setSpeed(a.kind === "card" ? "debit" : "bank");
                  setSheetOpen(false);
                }}
                className="w-full mt-5 flex items-center gap-4"
              >
                <LinkedIcon kind={a.kind} />
                <div className="flex-1 text-left">
                  <p className="text-[16px] font-bold text-[var(--pp-text)]">{a.institution}</p>
                  <p className="text-[13px] text-[var(--pp-text-muted)]">
                    {(a.account_type ?? (a.kind === "card" ? "Card" : "Checking"))} ••••{a.last4}
                  </p>
                </div>
                {selectedLinked?.id === a.id && <Check size={22} className="text-[var(--pp-text)]" />}
              </button>
            ))}

            <button
              onClick={() => navigate({ to: "/link-account", search: { returnTo: "/add-money/method" } })}
              className="w-full mt-6 flex items-center gap-4"
            >
              <div className="h-10 w-12 rounded-md bg-[oklch(0.96_0.01_250)] flex items-center justify-center">
                <Plus size={22} className="text-[var(--pp-text)]" />
              </div>
              <p className="flex-1 text-left text-[16px] text-[var(--pp-text)]">
                Link a bank or card
              </p>
            </button>

            <button className="mt-7 text-[15px] font-semibold text-[var(--pp-link)]">
              Don't see all of your payment methods?
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkedIcon({ kind }: { kind: LinkedAccount["kind"] }) {
  return (
    <div className="h-10 w-12 rounded-md bg-[oklch(0.96_0.01_250)] flex items-center justify-center text-[var(--pp-blue-dark)]">
      {kind === "card" ? <CreditCard size={20} /> : <Building2 size={20} />}
    </div>
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
      <div className="h-16 w-16 flex items-center justify-center">{icon}</div>
      <p
        className={
          "text-[15px] " +
          (selected ? "font-bold text-[var(--pp-text)]" : "text-[var(--pp-text)]")
        }
      >
        {title}
      </p>
      <p className="text-[13px] text-[var(--pp-text-muted)]">{subtitle}</p>
    </button>
  );
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14">
      {/* body */}
      <path
        d="M32 6c8 6 12 14 12 24v10l-6 4h-12l-6-4V30C20 20 24 12 32 6z"
        fill="oklch(0.45 0.22 265)"
      />
      <path
        d="M32 6c-8 6-12 14-12 24v10l6 4h6V6z"
        fill="oklch(0.32 0.18 265)"
      />
      {/* window */}
      <circle cx="32" cy="26" r="5" fill="white" />
      <circle cx="32" cy="26" r="3" fill="oklch(0.55 0.2 260)" />
      {/* fins */}
      <path d="M20 36 L12 48 L20 46 Z" fill="oklch(0.32 0.18 265)" />
      <path d="M44 36 L52 48 L44 46 Z" fill="oklch(0.32 0.18 265)" />
      {/* flame */}
      <path d="M28 50 L32 60 L36 50 Z" fill="oklch(0.79 0.17 80)" />
    </svg>
  );
}

function BalloonIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14">
      <ellipse cx="32" cy="26" rx="18" ry="22" fill="oklch(0.85 0.07 230)" />
      <path d="M22 6c-4 6-6 14-6 22 0 6 1 12 4 18h2c-3-6-4-12-4-18 0-8 2-16 6-22h-2z" fill="oklch(0.55 0.2 260)" />
      <path d="M42 6c4 6 6 14 6 22 0 6-1 12-4 18h-2c3-6 4-12 4-18 0-8-2-16-6-22h2z" fill="oklch(0.55 0.2 260)" />
      <path d="M30 6c0 14 0 28 0 40h4c0-12 0-26 0-40h-4z" fill="oklch(0.55 0.2 260)" />
      {/* basket */}
      <path d="M26 50 L38 50 L36 58 L28 58 Z" fill="oklch(0.79 0.17 80)" />
      <line x1="26" y1="50" x2="22" y2="46" stroke="oklch(0.5 0.02 260)" strokeWidth="1" />
      <line x1="38" y1="50" x2="42" y2="46" stroke="oklch(0.5 0.02 260)" strokeWidth="1" />
    </svg>
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
