import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Shield, Bell, CreditCard, User, SlidersHorizontal } from "lucide-react";
import { RequireAuth } from "@/auth/RequireAuth";
import { useAuth } from "@/auth/AuthProvider";
import { usePaymentStatusSetting } from "@/lib/paymentStatusSetting";

export const Route = createFileRoute("/settings")({
  component: SettingsRoute,
  head: () => ({
    meta: [
      { title: "Account settings — PayPal" },
      { name: "description", content: "Manage your PayPal account settings, payment status control, security and notifications." },
      { property: "og:title", content: "Account settings — PayPal" },
      { property: "og:description", content: "Manage your PayPal account settings, payment status control, security and notifications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SettingsRoute() {
  return (
    <RequireAuth>
      <Settings />
    </RequireAuth>
  );
}

function Settings() {
  const { user } = useAuth();
  const { enabled, setEnabled, status, setStatus } = usePaymentStatusSetting();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--pp-bg)]">
      <header className="flex items-center gap-3 px-4 pt-6 pb-3">
        <Link to="/profile" aria-label="Back" className="text-[var(--pp-blue-dark)] -ml-1">
          <ChevronLeft size={26} strokeWidth={2.25} />
        </Link>
        <h1 className="text-[20px] font-semibold text-[var(--pp-text)]">Account settings</h1>
      </header>

      <main className="flex-1 px-4 pb-10">
        <section className="rounded-2xl bg-white border border-[color:var(--border)] px-4 py-3.5 flex items-center gap-4">
          <span className="text-[var(--pp-blue-dark)]"><User size={20} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] text-[var(--pp-text-muted)]">Signed in as</span>
            <span className="block text-[15px] text-[var(--pp-text)] break-all">{user?.email ?? "—"}</span>
          </span>
        </section>

        <h2 className="mt-6 mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-[var(--pp-text-muted)]">
          Payments
        </h2>
        <section className="rounded-2xl bg-white border border-[color:var(--border)] p-4">
          <div className="flex items-start gap-4">
            <span className="text-[var(--pp-blue-dark)] mt-0.5"><SlidersHorizontal size={20} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-semibold text-[var(--pp-text)]">Payment status control</p>
              <p className="mt-1 text-[13px] text-[var(--pp-text-muted)] leading-relaxed">
                Turn this on to set whether the money you send shows as Pending or Completed.
                Turn it off and every payment is sent as pending, like normal.
              </p>
            </div>
            <Switch
              checked={enabled}
              onChange={setEnabled}
              label="Payment status control"
            />
          </div>
          {enabled && (
            <div className="mt-4">
              <p className="text-[13px] font-semibold text-[var(--pp-text-muted)] mb-2">
                Send payments as
              </p>
              <div className="flex gap-2">
                {(["pending", "completed"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 h-11 rounded-full text-[15px] font-bold border transition-colors ${
                      status === s
                        ? "bg-[var(--pp-blue-dark)] text-white border-transparent"
                        : "bg-white text-[var(--pp-text)] border-[color:var(--border)]"
                    }`}
                  >
                    {s === "pending" ? "Pending" : "Completed"}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="mt-3 text-[13px] font-semibold" style={{ color: enabled ? "var(--pp-success)" : "var(--pp-text-muted)" }}>
            {enabled
              ? `On — payments you send will be ${status === "completed" ? "completed" : "pending"}`
              : "Off — payments send as pending"}
          </p>
        </section>

        <h2 className="mt-6 mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-[var(--pp-text-muted)]">
          Account
        </h2>
        <section className="rounded-2xl bg-white border border-[color:var(--border)] divide-y divide-[color:var(--border)] overflow-hidden">
          <LinkRow icon={<User size={20} />} label="Profile" to="/profile" />
          <LinkRow icon={<CreditCard size={20} />} label="Wallet" to="/wallet" />
          <LinkRow icon={<Shield size={20} />} label="Security check" to="/security-check" />
          <LinkRow icon={<Bell size={20} />} label="Notifications" to="/deals" />
        </section>
      </main>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
      style={{ backgroundColor: checked ? "var(--pp-blue-dark)" : "var(--border)" }}
    >
      <span
        className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
        style={{ left: 2, transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

function LinkRow({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  return (
    <Link to={to} className="flex items-center gap-4 px-4 py-3.5">
      <span className="text-[var(--pp-blue-dark)]">{icon}</span>
      <span className="flex-1 text-[15px] font-medium text-[var(--pp-text)]">{label}</span>
      <ChevronRight size={18} className="text-[var(--pp-text-muted)]" />
    </Link>
  );
}
