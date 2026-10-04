import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeftRight, X, Database, Globe2 } from "lucide-react";
import { BottomNav } from "@/components/paypal/BottomNav";
import { RecentActivity } from "@/components/paypal/RecentActivity";
import { RequireAuth } from "@/auth/RequireAuth";
import { useBalance } from "@/auth/useBalance";
import { useSavings } from "@/auth/useSavings";
import debitCardImg from "@/assets/debit-card.jpg";

export const Route = createFileRoute("/finances")({
  component: FinancesRoute,
  head: () => ({
    meta: [
      { title: "Finances — PayPal" },
      { name: "description", content: "Manage your PayPal balance, savings and crypto in one place." },
    ],
  }),
});

const tabs = ["Balance", "Savings", "Crypto"] as const;
type Tab = (typeof tabs)[number];

function FinancesRoute() {
  return (
    <RequireAuth>
      <FinancesPage />
    </RequireAuth>
  );
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function FinancesPage() {
  const [tab, setTab] = useState<Tab>("Balance");
  const [transferOpen, setTransferOpen] = useState(false);
  const { balance } = useBalance();
  const { savings } = useSavings();
  const combined = (balance ?? 0) + (savings ?? 0);
  const displayValue =
    tab === "Savings" ? savings : balance === null && savings === null ? null : combined;
  const displayLabel = tab === "Savings" ? "PayPal Savings Balance" : "Total PayPal Balance";
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--pp-bg)]">
      <main className="flex-1 px-5 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[34px] font-bold leading-tight text-[var(--pp-text)]">
            Finances
          </h1>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-2">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "px-5 py-2 rounded-full text-[15px] font-semibold transition-colors " +
                  (active
                    ? "bg-white text-[var(--pp-blue)] shadow-sm border border-[color:var(--border)]"
                    : "bg-transparent text-[var(--pp-text)]")
                }
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Total balance */}
        <div className="mt-7 w-full overflow-hidden">
          <p className="text-[15px] text-[var(--pp-text)]">{displayLabel}</p>
          <p
            className={
              "mt-2 font-semibold leading-none text-[var(--pp-text)] tracking-tight whitespace-nowrap " +
              (() => {
                const s = displayValue === null ? "—" : formatUsd(displayValue);
                const len = s.length;
                if (len <= 9) return "text-[58px]";
                if (len <= 12) return "text-[36px]";
                if (len <= 15) return "text-[28px]";
                if (len <= 18) return "text-[22px]";
                return "text-[18px]";
              })()
            }
            title={displayValue === null ? undefined : formatUsd(displayValue)}
          >
            {displayValue === null ? "—" : formatUsd(displayValue)}
          </p>
        </div>

        {tab === "Savings" && (
          <button
            onClick={() => navigate({ to: "/transfer/savings" })}
            className="mt-7 block w-full rounded-full py-4 text-center text-[17px] font-bold"
            style={{ background: "var(--pp-yellow)", color: "var(--pp-blue-dark)" }}
          >
            Transfer to Savings
          </button>
        )}

        {/* Add Money button */}
        <Link
          to="/add-money"
          className="mt-7 block w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-center text-white text-[17px] font-bold"
        >
          Add Money
        </Link>

        {/* Debit card visual */}
        <img
          src={debitCardImg}
          alt="PayPal Debit Card"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="mt-5 w-full rounded-2xl block"
        />

        {/* Get a PayPal Debit Card */}
        <button className="mt-5 w-full rounded-full bg-[var(--pp-yellow)] py-4 text-[var(--pp-text)] text-[16px] font-semibold">
          Get a PayPal Debit Card
        </button>

        {/* Refund banner */}
        <div className="mt-5 rounded-2xl bg-white border border-[color:var(--border)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[16px] font-semibold text-[var(--pp-text)] leading-snug">
                Get your federal tax<br />refund up to 5 days early*
              </p>
              <p className="mt-2 text-[13px] text-[var(--pp-text-muted)]">
                Use PayPal Direct Deposit for<br />your tax refund.
              </p>
            </div>
            <DepositGraphic />
          </div>
          <button className="mt-4 text-[14px] font-bold text-[var(--pp-link)]">
            Set up Direct Deposit
          </button>
        </div>

        {/* More options */}
        <h2 className="mt-8 text-[15px] text-[var(--pp-text)]">More options</h2>
        <div className="mt-3 space-y-3">
          <OptionRow
            icon={<DepositCardIcon />}
            title="Set up Direct Deposit"
            subtitle="Up to 2 days early. Learn more"
          />
          <OptionRow
            icon={<CheckIcon />}
            title="Cash a check"
            subtitle="Money in minutes for a fee."
          />
          <OptionRow
            icon={<StoreIcon />}
            title="Add cash at stores"
            subtitle="90,000+ participating stores"
          />
          <OptionRow
            icon={
              <ArrowLeftRight
                size={22}
                strokeWidth={2.25}
                className="text-[var(--pp-blue-dark)]"
              />
            }
            title="Transfer"
            subtitle="From your balance"
            onClick={() => setTransferOpen(true)}
          />
        </div>

        {/* Recent activity */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[var(--pp-text)]">Recent activity</h2>
          <Link to="/activity" className="text-[13px] font-bold text-[var(--pp-blue-dark)]">
            See all
          </Link>
        </div>
        <RecentActivity />

      </main>

      {/* Transfer Money bottom sheet */}
      {transferOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setTransferOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white pt-4 pb-7">
            <div className="flex items-center justify-between px-5">
              <span className="w-6" />
              <h3 className="text-[16px] font-semibold text-[var(--pp-text)]">
                Transfer Money
              </h3>
              <button
                aria-label="Close"
                onClick={() => setTransferOpen(false)}
                className="text-[var(--pp-text)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-5 space-y-1">
              <SheetRow
                icon={
                  <ArrowLeftRight
                    size={22}
                    className="text-[var(--pp-blue-dark)]"
                    strokeWidth={2.25}
                  />
                }
                title="Transfer to bank"
                onClick={() => {
                  setTransferOpen(false);
                  navigate({ to: "/transfer/bank" });
                }}
              />
              <SheetRow
                icon={<Database size={22} className="text-[var(--pp-blue-dark)]" />}
                title="Transfer to PayPal Savings"
                onClick={() => {
                  setTransferOpen(false);
                  navigate({ to: "/transfer/savings" });
                }}
              />
              <SheetRow
                icon={<Globe2 size={22} className="text-[var(--pp-blue-dark)]" />}
                title="Transfer internationally"
              />
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function OptionRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl bg-white border border-[color:var(--border)] px-4 py-4 flex items-center gap-4 text-left"
    >
      <div className="h-9 w-9 flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-[16px] font-semibold text-[var(--pp-text)] leading-tight">
          {title}
        </p>
        <p className="text-[13px] text-[var(--pp-text-muted)] mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}

function SheetRow({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-5 py-3.5 flex items-center gap-4 text-left active:bg-[oklch(0.96_0.005_250)]"
    >
      <div className="h-8 w-8 flex items-center justify-center shrink-0">{icon}</div>
      <p className="flex-1 text-[16px] text-[var(--pp-text)]">{title}</p>
    </button>
  );
}

function ActivityRow({
  icon,
  title,
  date,
  note,
  amount,
  positive,
}: {
  icon: React.ReactNode;
  title: string;
  date: string;
  note: string;
  amount: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white border border-[color:var(--border)] px-4 py-3.5 flex items-center gap-3">
      <div className="h-10 w-10 flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[var(--pp-text)] truncate">{title}</p>
        <p className="text-[12px] text-[var(--pp-text-muted)]">{date}</p>
        <p className="text-[12px] text-[var(--pp-text-muted)]">{note}</p>
      </div>
      <p
        className={
          "text-[15px] font-semibold " +
          (positive ? "text-[oklch(0.55_0.15_155)]" : "text-[var(--pp-text)]")
        }
      >
        {amount}
      </p>
    </div>
  );
}

function DepositGraphic() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0">
      <rect x="22" y="6" width="20" height="20" rx="3" fill="oklch(0.78 0.13 230)" />
      <rect x="14" y="22" width="32" height="26" rx="4" fill="oklch(0.7 0.16 305)" />
      <circle cx="30" cy="32" r="6" fill="oklch(0.32 0.18 285)" />
      <path d="M30 30 V40 M26 36 L30 40 L34 36" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DepositCardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--pp-blue-dark)]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="6" width="20" height="13" rx="2" />
      <path d="M2 11 H22" />
      <path d="M6 15 H10" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--pp-blue-dark)]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="7" width="20" height="11" rx="2" />
      <path d="M2 11 H22" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--pp-blue-dark)]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9 L5 4 H19 L21 9 V10 A3 3 0 0 1 15 10 A3 3 0 0 1 9 10 A3 3 0 0 1 3 10 Z" />
      <path d="M5 12 V20 H19 V12" />
    </svg>
  );
}

function MasterCardActivity() {
  return (
    <div className="h-10 w-10 rounded-md bg-[oklch(0.85_0.07_300)] flex items-center justify-center">
      <div className="relative h-5 w-8">
        <span className="absolute left-0 top-0 h-5 w-5 rounded-full" style={{ background: "var(--pp-mc-red)" }} />
        <span className="absolute right-0 top-0 h-5 w-5 rounded-full mix-blend-multiply" style={{ background: "var(--pp-mc-yellow)" }} />
      </div>
    </div>
  );
}

function SuttonBankActivity() {
  return (
    <div className="h-10 w-10 rounded-md bg-white border border-[color:var(--border)] flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--pp-blue-dark)]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10 L12 4 L21 10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10 V18 M9 10 V18 M15 10 V18 M19 10 V18" />
        <path d="M3 19 H21" strokeLinecap="round" />
      </svg>
    </div>
  );
}
