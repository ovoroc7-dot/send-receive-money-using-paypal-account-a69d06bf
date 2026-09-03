import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, ScanLine, X, Clock, ArrowUp, Menu, ChevronRight, Settings, HelpCircle, Bell, Shield, CreditCard, Gift, Users, FileText, LogOut } from "lucide-react";
import { useState } from "react";
import { BottomNav } from "@/components/paypal/BottomNav";
import { RecentActivity } from "@/components/paypal/RecentActivity";
import { RequireAuth } from "@/auth/RequireAuth";
import { useBalance } from "@/auth/useBalance";
import { useSavings } from "@/auth/useSavings";
import { useMoneyOnHold } from "@/auth/useMoneyOnHold";
import { useCryptoHoldings } from "@/auth/useCrypto";
import { useAvatar } from "@/auth/useAvatar";


import { useAuth } from "@/auth/AuthProvider";
import paypalPLogo from "@/assets/paypal-p-balance.jpeg";

export const Route = createFileRoute("/")({
  component: IndexRoute,
  head: () => ({
    meta: [
      { title: "PayPal" },
      { name: "description", content: "Your PayPal balance, savings and recent activity." },
    ],
  }),
});

function IndexRoute() {
  return (
    <RequireAuth>
      <Index />
    </RequireAuth>
  );
}

function Index() {
  const { balance } = useBalance();
  const { savings } = useSavings();
  const { onHold } = useMoneyOnHold();
  const { totalValue: cryptoValue } = useCryptoHoldings();
  const [menuOpen, setMenuOpen] = useState(false);
  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const totalBalance = (balance ?? 0) + (savings ?? 0);
  const balanceLabel = balance === null ? "—" : fmt(totalBalance);
  const savingsLabel = savings === null ? "$0.00" : fmt(savings);
  const onHoldLabel = onHold === null ? "$0.00" : fmt(onHold);


  return (
    <div className="min-h-screen flex flex-col bg-[var(--pp-bg)]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="text-[var(--pp-blue-dark)] -ml-1"
          >
            <Menu size={26} strokeWidth={2.25} />
          </button>
        </div>
        <HeaderActions />
      </header>

      <PayPalMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-1 px-4 pb-4">
        {/* Account cards row (horizontal scroll) */}
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 snap-x">
          <AccountCard
            to="/add-money"
            icon={<img src={paypalPLogo} alt="PayPal" className="h-7 w-7 rounded-md object-contain" />}
            title="PayPal balance"
            amount={balanceLabel}
            footer={<span className="text-[var(--pp-link)] font-semibold">Add money</span>}
          />
          <AccountCard
            to="/activity"
            icon={
              <div className="h-7 w-7 rounded-md bg-[var(--pp-yellow)] flex items-center justify-center">
                <Clock size={16} strokeWidth={2.5} className="text-[var(--pp-text)]" />
              </div>
            }
            title="Money on hold"
            amount={onHoldLabel}
            footer={
              <span className="text-[var(--pp-link)] font-semibold">
                View details
              </span>
            }
          />

          <AccountCard
            to="/transfer/savings"
            icon={
              <div className="h-7 w-7 rounded-md bg-[var(--pp-blue)] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
                  <rect x="3" y="6" width="18" height="13" rx="2" />
                  <circle cx="16" cy="12.5" r="1.4" fill="var(--pp-blue)" />
                </svg>
              </div>
            }
            title="PayPal Savings"
            amount={savingsLabel}
            footer={
              <span className="flex items-center gap-1 font-bold text-[var(--pp-text)]">
                <ArrowUp size={14} strokeWidth={3} />
                APY: <span className="text-[var(--pp-success)]">4.00%</span>
              </span>
            }
          />
          <Link
            to="/crypto"
            className="snap-start min-w-[46%] max-w-[80%] flex-1 flex rounded-2xl bg-white border border-[color:var(--border)] p-4 flex-col gap-2 overflow-hidden"
          >
            <div className="h-7 w-7 rounded-full bg-[var(--pp-blue-light)] flex items-center justify-center text-white font-bold text-[13px]">
              C
            </div>
            <p className="text-[14px] text-[var(--pp-text-muted)] mt-1 truncate">Crypto</p>
            <p
              className="text-[26px] font-semibold text-[var(--pp-text)] leading-tight truncate"
              title={fmt(cryptoValue)}
            >
              {fmt(cryptoValue)}
            </p>
            <div className="mt-3 text-[14px] truncate text-[var(--pp-link)] font-semibold">
              {cryptoValue > 0 ? "View" : "Buy"}
            </div>
          </Link>
        </div>

        {/* Set up your account */}
        <div className="mt-3 rounded-2xl bg-white border border-[color:var(--border)] p-4 flex items-center gap-4">
          <ProgressRing value={4} max={5} />
          <div>
            <p className="text-[17px] font-semibold text-[var(--pp-text)]">
              Set up your account
            </p>
            <p className="text-[14px] text-[var(--pp-text-muted)]">You're almost done!</p>
          </div>
        </div>

        {/* Crypto promo */}
        <Link to="/crypto" className="mt-3 rounded-2xl bg-white border border-[color:var(--border)] p-4 flex items-start gap-3">
          <CryptoIcon />
          <div className="flex-1">
            <p className="text-[16px] font-semibold text-[var(--pp-text)] leading-snug">
              Move crypto your way—<br />Send. Receive. Enjoy.
            </p>
            <p className="mt-1 text-[13px] text-[var(--pp-text-muted)]">Terms apply.</p>
          </div>
        </Link>

        {/* Recent activity */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-[var(--pp-text)]">Recent activity</h2>
          <Link to="/activity" className="text-[13px] font-bold text-[var(--pp-blue-dark)]">
            See all
          </Link>
        </div>
        <RecentActivity />


      </main>

      {/* Send / Request - sticky above bottom nav */}
      <div className="sticky bottom-[72px] left-0 right-0 z-20 bg-[var(--pp-bg)] px-4 pt-3 pb-2 grid grid-cols-2 gap-3">
        <Link
          to="/send"
          className="text-center rounded-full bg-[var(--pp-yellow)] py-3.5 text-[17px] font-bold text-[var(--pp-text)]"
        >
          Send
        </Link>
        <Link
          to="/request"
          className="text-center rounded-full bg-[var(--pp-yellow)] py-3.5 text-[17px] font-bold text-[var(--pp-text)]"
        >
          Request
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}

function HeaderActions() {
  const { user } = useAuth();
  const { url: avatarUrl } = useAvatar();
  const email = user?.email ?? "";
  const initials =
    (email.split("@")[0] ?? "")
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "PP";

  return (
    <div className="flex items-center gap-3">
      <IconBubble label="Rewards" badge>
        <Trophy size={20} strokeWidth={2.25} className="text-[var(--pp-blue-dark)]" />
      </IconBubble>
      <IconBubble label="Scan code">
        <ScanLine size={20} strokeWidth={2.25} className="text-[var(--pp-blue-dark)]" />
      </IconBubble>
      <Link to="/profile" aria-label="Your profile" className="relative shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Your profile" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pp-blue-dark)] text-[14px] font-bold text-white">
            {initials}
          </span>
        )}
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[var(--pp-notify)] ring-2 ring-[var(--pp-bg)]" />
      </Link>
    </div>
  );
}


function IconBubble({
  children,
  label,
  badge,
}: {
  children: React.ReactNode;
  label: string;
  badge?: boolean;
}) {
  return (
    <button aria-label={label} className="relative shrink-0">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
        {children}
      </span>
      {badge && (
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[var(--pp-notify)] ring-2 ring-[var(--pp-bg)]" />
      )}
    </button>
  );
}

function AccountCard({
  icon,
  title,
  amount,
  footer,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  amount: string;
  footer: React.ReactNode;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="snap-start min-w-[46%] max-w-[80%] flex-1 rounded-2xl bg-white border border-[color:var(--border)] p-4 flex flex-col gap-2 overflow-hidden active:scale-[0.98] transition-transform"
    >
      {icon}
      <p className="text-[14px] text-[var(--pp-text-muted)] mt-1 truncate">{title}</p>
      <p
        className="text-[26px] font-semibold text-[var(--pp-text)] leading-tight truncate"
        title={amount}
      >
        {amount}
      </p>
      <div className="mt-3 text-[14px] truncate">{footer}</div>
    </Link>
  );
}

function ProgressRing({ value, max }: { value: number; max: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = value / max;
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="var(--pp-blue-light)"
          strokeOpacity="0.25"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="var(--pp-blue-dark)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-[var(--pp-blue-dark)]">
        {value}/{max}
      </span>
    </div>
  );
}

function CryptoIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0">
      {/* Blue square (left) */}
      <rect x="4" y="10" width="22" height="28" rx="3" fill="var(--pp-crypto-blue)" />
      <text x="9" y="30" fontFamily="Arial" fontSize="16" fontWeight="700" fill="var(--pp-blue-dark)">
        ¢
      </text>
      {/* Green circle (right) */}
      <circle cx="32" cy="26" r="12" fill="var(--pp-crypto-green)" />
      <text x="27" y="31" fontFamily="Arial" fontSize="14" fontWeight="700" fill="white">
        $
      </text>
    </svg>
  );
}

function PayPalMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signOut } = useAuth();
  const sections: { title?: string; items: { icon: React.ReactNode; label: string; sub?: string }[] }[] = [
    {
      items: [
        { icon: <Bell size={20} />, label: "Notifications" },
        { icon: <Users size={20} />, label: "Invite friends", sub: "Earn rewards" },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: <CreditCard size={20} />, label: "Wallet" },
        { icon: <FileText size={20} />, label: "Activity" },
        { icon: <Gift size={20} />, label: "Rewards" },
      ],
    },
    {
      title: "Settings",
      items: [
        { icon: <Shield size={20} />, label: "Security" },
        { icon: <Settings size={20} />, label: "Account settings" },
        { icon: <HelpCircle size={20} />, label: "Help center" },
      ],
    },
  ];
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[86%] max-w-[340px] bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"} flex flex-col`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <img src={paypalPLogo} alt="PayPal" className="h-10 w-10 rounded-lg object-contain" />
          <button onClick={onClose} aria-label="Close menu" className="text-[var(--pp-text)]">
            <X size={24} />
          </button>
        </div>
        <Link
          to="/profile"
          onClick={onClose}
          className="px-5 pb-4 flex items-center gap-3 border-b border-[color:var(--border)]"
        >
          <div className="min-w-0">
            <p className="text-[17px] font-semibold text-[var(--pp-text)] truncate">Your account</p>
            <p className="text-[13px] text-[var(--pp-text-muted)]">Manage profile</p>
          </div>
          <ChevronRight size={20} className="ml-auto text-[var(--pp-text-muted)]" />
        </Link>
        <nav className="flex-1 overflow-y-auto py-2">
          {sections.map((sec, i) => (
            <div key={i} className="py-1">
              {sec.title && (
                <p className="px-5 pt-3 pb-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--pp-text-muted)]">
                  {sec.title}
                </p>
              )}
              {sec.items.map((it) => (
                <button
                  key={it.label}
                  onClick={onClose}
                  className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-[var(--pp-bg)]"
                >
                  <span className="text-[var(--pp-blue-dark)]">{it.icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium text-[var(--pp-text)]">{it.label}</span>
                    {it.sub && <span className="block text-[12px] text-[var(--pp-text-muted)]">{it.sub}</span>}
                  </span>
                  <ChevronRight size={18} className="text-[var(--pp-text-muted)]" />
                </button>
              ))}
            </div>
          ))}
          <div className="px-5 py-4 mt-2 border-t border-[color:var(--border)]">
            <button
              onClick={() => { onClose(); void signOut(); }}
              className="w-full flex items-center gap-3 text-[15px] font-semibold text-[var(--pp-link)]"
            >
              <LogOut size={20} />
              Sign out
            </button>
          </div>
          <p className="px-5 py-4 text-[12px] text-[var(--pp-text-muted)]">PayPal · v2024.6</p>
        </nav>
      </aside>
    </>
  );
}
