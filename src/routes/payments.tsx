import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getSavedRecipients } from "@/lib/savedRecipients";
import { Search, ScanLine, Receipt, HandHeart, ChevronRight, Store, FileText } from "lucide-react";
import { BottomNav } from "@/components/paypal/BottomNav";
import { RequireAuth } from "@/auth/RequireAuth";

export const Route = createFileRoute("/payments")({
  component: () => (
    <RequireAuth>
      <PaymentsPage />
    </RequireAuth>
  ),
  head: () => ({
    meta: [
      { title: "Payments — PayPal" },
      { name: "description", content: "Send, request, pay bills and give." },
    ],
  }),
});

type Tab = "send" | "bills" | "give" | "request";
const TABS: { key: Tab; label: string }[] = [
  { key: "send", label: "Send" },
  { key: "bills", label: "Bills" },
  { key: "give", label: "Give" },
  { key: "request", label: "Request" },
];

type Contact = {
  name: string;
  initials?: string;
  color: string;
  kind?: "person" | "business";
};

const CONTACTS: Contact[] = [
  { name: "Lara Page", initials: "LP", color: "oklch(0.55 0.18 295)" },
  { name: "Denis Trufin", initials: "DT", color: "oklch(0.6 0.16 80)" },
  { name: "Marcus Lee", initials: "ML", color: "oklch(0.45 0.15 260)" },
  { name: "Anna Rivera", initials: "AR", color: "oklch(0.6 0.18 30)" },
  { name: "Aaron Nace", initials: "AN", color: "oklch(0.6 0.16 150)" },
];

function PaymentsPage() {
  const [tab, setTab] = useState<Tab>("send");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => setSaved(getSavedRecipients()), []);

  const isSend = tab === "send";
  const isRequest = tab === "request";
  const showsContacts = isSend || isRequest;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const savedContacts: Contact[] = saved.map((n) => ({
      name: n,
      initials: n.replace(/^@/, "").split(/[\s._@-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?",
      color: "var(--pp-blue-dark)",
    }));
    const all = [...savedContacts, ...CONTACTS.filter((c) => !saved.some((s) => s.toLowerCase() === c.name.toLowerCase()))];
    if (!q) return all;
    return all.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, saved]);

  const goAmount = (name: string) => {
    if (isRequest) navigate({ to: "/request/amount", search: { to: name } });
    else navigate({ to: "/send/amount", search: { to: name } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--pp-bg)]">
      <header className="px-5 pt-6 pb-2">
        <h1 className="text-[28px] font-bold text-[var(--pp-text)]">Payments</h1>
        <div className="mt-3 flex items-center gap-5 -mx-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative px-1 py-1.5 shrink-0"
                style={{
                  color: active ? "var(--pp-blue-dark)" : "var(--pp-text)",
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span className="text-[16px]">{t.label}</span>
                {active && (
                  <span className="absolute left-0 right-0 -bottom-[2px] h-[2px] rounded-full bg-[var(--pp-blue-dark)]" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 px-5 pt-3 pb-6">
        {showsContacts && (
          <>
            <p className="mt-2 text-[15px] text-[var(--pp-text)]">
              {isSend ? "Send to someone new" : "Request from someone new"}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 h-11 rounded-full bg-white border border-[color:var(--border)] px-4">
                <Search size={18} className="text-[var(--pp-text-muted)]" />
                <input
                  value={query}
                  onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) goAmount(query.trim()); }}
                  enterKeyHint="go"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, @username, email, mo..."
                  className="flex-1 bg-transparent text-[14px] text-[var(--pp-text)] placeholder:text-[var(--pp-text-muted)] outline-none"
                />
              </div>
              <button
                aria-label="Scan"
                className="h-11 w-11 rounded-full flex items-center justify-center text-[var(--pp-blue-dark)]"
              >
                <ScanLine size={22} strokeWidth={2.25} />
              </button>
            </div>

            {query.trim() && (
              <button
                type="button"
                onClick={() => goAmount(query.trim())}
                className="mt-3 w-full flex items-center gap-3 rounded-xl bg-white border border-[color:var(--border)] px-4 py-3 text-left"
              >
                <span className="h-10 w-10 rounded-full bg-[var(--pp-blue-dark)] text-white font-bold flex items-center justify-center">
                  {query.trim()[0]!.toUpperCase()}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-[var(--pp-text)] truncate">{query.trim()}</span>
                  <span className="block text-[12px] text-[var(--pp-text-muted)]">{isRequest ? "Request from" : "Send to"} this person</span>
                </span>
                <ChevronRight size={18} className="text-[var(--pp-text-muted)]" />
              </button>
            )}

            <p className="mt-5 text-[15px] text-[var(--pp-text)]">{saved.length ? "Recent contacts" : "Top contacts"}</p>
            <div className="mt-3 flex items-center gap-5 overflow-x-auto pb-1">
              {filtered.slice(0, 12).map((c) => (
                <button
                  key={c.name}
                  onClick={() => goAmount(c.name)}
                  className="flex flex-col items-center gap-1.5 shrink-0"
                >
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-[15px]"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.initials}
                  </div>
                  <span className="text-[11px] text-[var(--pp-text)] max-w-[64px] truncate">
                    {c.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: isRequest ? "/request" : "/send" })}
              className="mt-4 w-full text-center text-[15px] font-bold text-[var(--pp-blue-dark)] py-3"
            >
              All contacts
            </button>

            <div className="mt-4 border-t border-[color:var(--border)] pt-4">
              <p className="text-[15px] font-semibold text-[var(--pp-text)]">
                {isSend ? "More options" : "More ways to get paid"}
              </p>
              <ul className="mt-3 space-y-2">
                {isSend ? (
                  <>
                    <HubRow icon={<FileText size={20} />} label="Send an invoice" />
                    <HubRow icon={<Store size={20} />} label="Send to a business" />
                  </>
                ) : (
                  <>
                    <HubRow icon={<FileText size={20} />} label="Create an invoice" />
                    <HubRow icon={<Receipt size={20} />} label="Split with a group" />
                  </>
                )}
              </ul>
            </div>
          </>
        )}

        {tab === "bills" && (
          <EmptyHub
            icon={<Receipt size={28} className="text-[var(--pp-blue-dark)]" />}
            title="Pay your bills"
            desc="Add a biller to pay rent, utilities, credit cards and more in seconds."
            cta="Add a bill"
          />
        )}
        {tab === "give" && (
          <EmptyHub
            icon={<HandHeart size={28} className="text-[var(--pp-blue-dark)]" />}
            title="Give to causes you love"
            desc="Donate to thousands of certified charities right from PayPal."
            cta="Find a charity"
          />
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function HubRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li>
      <button className="w-full flex items-center gap-3 rounded-xl bg-white border border-[color:var(--border)] px-4 py-3.5">
        <span className="text-[var(--pp-blue-dark)]">{icon}</span>
        <span className="flex-1 text-left text-[15px] font-semibold text-[var(--pp-text)]">{label}</span>
        <ChevronRight size={18} className="text-[var(--pp-text-muted)]" />
      </button>
    </li>
  );
}

function EmptyHub({ icon, title, desc, cta }: { icon: React.ReactNode; title: string; desc: string; cta: string }) {
  return (
    <div className="mt-10 text-center px-4">
      <div className="mx-auto h-16 w-16 rounded-full bg-[var(--pp-yellow)]/40 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="mt-4 text-[20px] font-bold text-[var(--pp-text)]">{title}</h2>
      <p className="mt-2 text-[14px] text-[var(--pp-text-muted)] leading-relaxed">{desc}</p>
      <button className="mt-6 px-6 py-3 rounded-full bg-[var(--pp-blue-dark)] text-white text-[15px] font-bold">
        {cta}
      </button>
    </div>
  );
}
