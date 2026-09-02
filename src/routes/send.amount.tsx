import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, X, Delete, ChevronRight, Check, Info, Store, Users, Image as ImageIcon, Sticker, Building2, CreditCard } from "lucide-react";
import { RequireAuth } from "@/auth/RequireAuth";
import { useBalance } from "@/auth/useBalance";
import { useLinkedAccounts } from "@/auth/useLinkedAccounts";
import { PayPalLogo } from "@/components/paypal/PayPalLogo";

type Search = { to: string };

export const Route = createFileRoute("/send/amount")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    to: typeof s.to === "string" ? s.to : "",
  }),
  component: SendAmountRoute,
  head: () => ({
    meta: [
      { title: "Send money — PayPal" },
      { name: "description", content: "Choose an amount to send." },
    ],
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

function fmtAmount(raw: string) {
  if (!raw) return "0.00";
  const [intPart, decPart] = raw.split(".");
  const intNum = Number.parseInt(intPart || "0", 10);
  const intFmt = Number.isFinite(intNum) ? intNum.toLocaleString("en-US") : "0";
  if (decPart === undefined) return `${intFmt}.00`;
  return `${intFmt}.${decPart.padEnd(2, "0").slice(0, 2)}`;
}

function SendAmountRoute() {
  return (
    <RequireAuth>
      <SendAmountPage />
    </RequireAuth>
  );
}

type Stage = "amount" | "message";

function SendAmountPage() {
  const navigate = useNavigate();
  const { to } = useSearch({ from: "/send/amount" });
  const [raw, setRaw] = useState("0");
  const [stage, setStage] = useState<Stage>("amount");
  const [showReview, setShowReview] = useState(false);
  const [note, setNote] = useState("");
  const status = "pending" as const;

  const numeric = useMemo(() => Number.parseFloat(raw || "0") || 0, [raw]);
  const canNext = numeric > 0;

  const press = (k: string) => {
    setRaw((cur) => {
      if (k === "back") {
        if (cur.length <= 1) return "0";
        const nxt = cur.slice(0, -1);
        return nxt === "" ? "0" : nxt;
      }
      if (k === ".") {
        if (cur.includes(".")) return cur;
        return cur + ".";
      }
      if (cur.includes(".")) {
        const [, dec = ""] = cur.split(".");
        if (dec.length >= 2) return cur;
      }
      if (cur === "0") return k;
      if (cur.replace(".", "").length >= 12) return cur;
      return cur + k;
    });
  };

  const display = `$${fmtAmount(raw)}`;
  const sizeClass =
    display.length <= 7 ? "text-[68px]" : display.length <= 10 ? "text-[52px]" : "text-[40px]";

  const submit = () => {
    navigate({ to: "/send/success", search: { to, amount: numeric.toFixed(2) } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="relative flex items-center justify-center px-4 pt-4 pb-3">
        <Link to="/payments" className="absolute left-3 top-4 p-1 text-[var(--pp-text)]" aria-label="Back">
          <ArrowLeft size={24} strokeWidth={2.25} />
        </Link>
        <h1 className="text-[16px] font-medium text-[var(--pp-text)] truncate max-w-[70%]">
          Send {to || "recipient"}
        </h1>
      </header>

      {stage === "amount" ? (
        <>
          <div className="px-5 pt-6 pb-4 text-center">
            <p className={`tabular-nums font-light text-[var(--pp-text)] leading-none ${sizeClass}`}>
              <span className="align-top text-[28px] font-light mr-1">$</span>
              <span>{fmtAmount(raw)}</span>
            </p>
            <span className="inline-block mt-3 px-3 py-1 rounded-md bg-[var(--pp-bg)] text-[12px] font-semibold text-[var(--pp-text-muted)]">
              USD
            </span>
          </div>

          <div className="flex-1" />

          <div className="px-4 pb-3 flex items-center gap-3">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onFocus={() => canNext && setStage("message")}
              placeholder="Add a message"
              className="flex-1 h-12 rounded-full bg-[#f4ecdc] px-5 text-[15px] text-[var(--pp-text)] placeholder:text-[var(--pp-text-muted)] outline-none"
            />
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStage("message")}
              className="h-12 px-7 rounded-full bg-[var(--pp-blue-dark)] text-white text-[15px] font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>

          <Numpad press={press} />
        </>
      ) : (
        <>
          <div className="px-5 pt-2">
            <textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's it for?"
              className="w-full min-h-[160px] resize-none text-[16px] text-[var(--pp-blue-dark)] placeholder:text-[var(--pp-text-muted)] outline-none bg-transparent"
            />
          </div>

          <div className="flex-1" />

          {/* Sticker tray */}
          <div className="px-4 pt-2 border-t border-[color:var(--border)]">
            <div className="flex items-center gap-3 overflow-x-auto py-3">
              {[
                { e: "🫶", bg: "oklch(0.55 0.22 25)" },
                { e: "✌️", bg: "oklch(0.35 0.16 295)" },
                { e: "🔥", bg: "oklch(0.65 0.2 60)" },
                { e: "💸", bg: "oklch(0.6 0.18 150)" },
                { e: "🎉", bg: "oklch(0.6 0.18 30)" },
                { e: "❤️", bg: "oklch(0.5 0.22 20)" },
                { e: "😂", bg: "oklch(0.7 0.18 90)" },
                { e: "🙏", bg: "oklch(0.55 0.16 260)" },
              ].map((s) => (
                <Sticker360
                  key={s.e}
                  emoji={s.e}
                  bg={s.bg}
                  onPick={() => setNote((n) => (n ? `${n} ${s.e}` : s.e))}
                />
              ))}
            </div>
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <button className="h-8 px-3 rounded-md bg-[var(--pp-bg)] text-[11px] font-bold text-[var(--pp-text-muted)]">GIF</button>
                <button className="h-8 w-8 rounded-md bg-[var(--pp-bg)] flex items-center justify-center text-[var(--pp-text-muted)]" aria-label="Image">
                  <ImageIcon size={16} />
                </button>
                <button className="h-8 w-8 rounded-md bg-[var(--pp-bg)] flex items-center justify-center text-[var(--pp-text-muted)]" aria-label="Sticker">
                  <Sticker size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowReview(true)}
                className="h-11 px-7 rounded-full bg-[var(--pp-blue-dark)] text-white text-[15px] font-bold"
              >
                Review
              </button>
            </div>
          </div>
        </>
      )}

      {showReview && (
        <ReviewSheet
          amount={numeric}
          to={to}
          onClose={() => setShowReview(false)}
          onConfirm={submit}
        />
      )}
    </div>
  );
}

function Sticker360({ emoji, bg, onPick }: { emoji: string; bg: string; onPick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="h-14 w-14 rounded-xl shrink-0 flex items-center justify-center text-[28px] active:scale-95 transition-transform"
      style={{ background: bg }}
      aria-label={`Add ${emoji}`}
    >
      {emoji}
    </button>
  );
}

function Numpad({ press }: { press: (k: string) => void }) {
  return (
    <div className="bg-[#d8dde6] pt-1.5 pb-2 px-1 grid grid-cols-3 gap-1.5">
      {[
        ["1", ""], ["2", "ABC"], ["3", "DEF"],
        ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
        ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
      ].map(([n, sub]) => (
        <NumKey key={n} onPress={() => press(n)}>
          <span className="text-[26px] font-medium text-[var(--pp-text)] leading-none">{n}</span>
          {sub && (
            <span className="text-[10px] tracking-widest text-[var(--pp-text-muted)] mt-0.5">
              {sub}
            </span>
          )}
        </NumKey>
      ))}
      <button
        type="button"
        onClick={() => press(".")}
        className="h-14 flex items-center justify-center text-[28px] text-[var(--pp-text)]"
        aria-label="decimal"
      >
        .
      </button>
      <NumKey onPress={() => press("0")}>
        <span className="text-[26px] font-medium text-[var(--pp-text)] leading-none">0</span>
      </NumKey>
      <button
        type="button"
        onClick={() => press("back")}
        className="h-14 flex items-center justify-center text-[var(--pp-text)]"
        aria-label="backspace"
      >
        <Delete size={24} strokeWidth={2} />
      </button>
    </div>
  );
}

function NumKey({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="h-14 rounded-md bg-white shadow-[0_1px_0_rgba(0,0,0,0.18)] flex flex-col items-center justify-center active:bg-[#f0f0f0]"
    >
      {children}
    </button>
  );
}

function ReviewSheet({
  amount,
  to,
  onClose,
  onConfirm,
}: {
  amount: number;
  to: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { balance } = useBalance();
  const { accounts } = useLinkedAccounts();
  const [paymentType, setPaymentType] = useState<"friends" | "goods">("friends");
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [showMethodSheet, setShowMethodSheet] = useState(false);
  const [method, setMethod] = useState<string>("balance");

  const fee = paymentType === "goods" ? Math.round(amount * 0.0349 * 100) / 100 : 0;
  const total = amount + fee;
  void to;

  const linkedSel = method.startsWith("linked:")
    ? accounts.find((a) => `linked:${a.id}` === method) ?? null
    : null;
  const methodTitle = linkedSel
    ? `${linkedSel.institution} ••••${linkedSel.last4}`
    : method === "balance" ? "Balance" : method === "mc7109" ? "SoFi MasterCard" : "CAPITAL ONE N.A.";

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full bg-white rounded-t-2xl pt-3 pb-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[92vh] overflow-y-auto">
        <div className="relative flex items-center justify-center px-5 pb-2">
          <h3 className="text-[16px] font-medium text-[var(--pp-text)]">Review</h3>
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-0 text-[var(--pp-text)]">
            <X size={22} />
          </button>
        </div>

        {/* Balance row */}
        <button
          type="button"
          onClick={() => setShowMethodSheet(true)}
          className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
        >
          {linkedSel ? (
            <div className="h-9 w-9 rounded-md bg-[var(--pp-bg)] flex items-center justify-center text-[var(--pp-blue-dark)]">
              {linkedSel.kind === "card" ? <CreditCard size={20} /> : <Building2 size={20} />}
            </div>
          ) : (
            <MethodIcon kind={method as "balance" | "mc7109" | "co1260"} />
          )}
          <span className="flex-1 text-[17px] font-medium text-[var(--pp-text)]">{methodTitle}</span>
          <ChevronRight size={20} className="text-[var(--pp-text-muted)]" />
        </button>

        {/* Payment type row */}
        <button
          type="button"
          onClick={() => setShowTypeSheet(true)}
          className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
        >
          <div className="h-8 w-8 flex items-center justify-center text-[var(--pp-text)]">
            {paymentType === "friends" ? <Users size={22} /> : <Store size={22} />}
          </div>
          <span className="flex-1 text-[17px] font-medium text-[var(--pp-text)]">
            {paymentType === "friends" ? "Friends and Family" : "Goods and Services"}
          </span>
          <ChevronRight size={20} className="text-[var(--pp-text-muted)]" />
        </button>

        <div className="px-5 mt-2">
          <p className="text-[13px] text-[var(--pp-text-muted)] leading-relaxed">
            {paymentType === "friends"
              ? "Purchase Protection doesn't apply for this payment."
              : "You're covered by Purchase Protection on eligible items."}{" "}
            <a className="text-[var(--pp-link)] font-semibold" href="#">
              More on Purchase Protection
            </a>
          </p>
        </div>

        <div className="mx-5 my-4 border-t border-[color:var(--border)]" />

        <div className="px-5 space-y-2">
          <Row left={<span className="flex items-center gap-1.5">PayPal fee <Info size={14} className="text-[var(--pp-text-muted)]" /></span>} right={`${fmtUSD(fee)} USD`} muted />
          <Row left="Total" right={`${fmtUSD(total)} USD`} bold />
          <Row left="Payment delivery" right="In seconds" muted />
        </div>

        <div className="px-5 mt-5">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-[17px] font-bold text-white"
          >
            Send
          </button>
        </div>

        {showTypeSheet && (
          <PaymentTypeSheet
            value={paymentType}
            onSelect={(v) => {
              setPaymentType(v);
              setShowTypeSheet(false);
            }}
            onClose={() => setShowTypeSheet(false)}
          />
        )}
        {showMethodSheet && (
          <PaymentMethodSheet
            value={method}
            balance={balance}
            onSelect={(v) => setMethod(v)}
            onClose={() => setShowMethodSheet(false)}
          />
        )}
      </div>
    </div>
  );
}

function Row({ left, right, bold, muted }: { left: React.ReactNode; right: React.ReactNode; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="text-[15px]"
        style={{
          color: muted ? "var(--pp-text-muted)" : "var(--pp-text)",
          fontWeight: bold ? 700 : 400,
        }}
      >
        {left}
      </span>
      <span
        className="text-[15px]"
        style={{
          color: muted ? "var(--pp-text-muted)" : "var(--pp-text)",
          fontWeight: bold ? 700 : 400,
        }}
      >
        {right}
      </span>
    </div>
  );
}

function MethodIcon({ kind }: { kind: "balance" | "mc7109" | "co1260" }) {
  if (kind === "balance") {
    return (
      <div className="h-9 w-9 rounded-md bg-[#eef3fb] flex items-center justify-center">
        <PayPalLogo className="h-5 w-5" />
      </div>
    );
  }
  if (kind === "co1260") {
    return (
      <div className="h-9 w-9 rounded-md bg-[#eef6fb] flex items-center justify-center text-[var(--pp-blue-dark)]">
        <BankMark />
      </div>
    );
  }
  return (
    <div className="h-9 w-9 rounded-md bg-[#eef3fb] flex items-center justify-center">
      <MastercardMark />
    </div>
  );
}

function PaymentTypeSheet({
  value,
  onSelect,
  onClose,
}: {
  value: "friends" | "goods";
  onSelect: (v: "friends" | "goods") => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full bg-white rounded-t-2xl pt-3 pb-6 animate-in slide-in-from-bottom duration-200">
        <div className="relative flex items-center justify-center px-5 pb-3">
          <button onClick={onClose} aria-label="Back" className="absolute left-4 top-0 text-[var(--pp-text)]">
            <ArrowLeft size={20} />
          </button>
          <h3 className="text-[16px] font-medium text-[var(--pp-text)]">Payment type</h3>
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-0 text-[var(--pp-text)]">
            <X size={20} />
          </button>
        </div>
        <TypeOption
          icon={<Store size={22} />}
          title="For goods and services"
          desc={
            <>
              Get a full refund if an eligible item gets lost or damaged. Seller pays a small fee.
              <br />
              <a className="text-[var(--pp-link)] font-semibold" href="#">More on Purchase Protection</a>
            </>
          }
          selected={value === "goods"}
          onClick={() => onSelect("goods")}
        />
        <div className="mx-5 border-t border-[color:var(--border)]" />
        <TypeOption
          icon={<Users size={22} />}
          title="For friends and family"
          desc="Purchase Protection doesn't apply for this payment."
          selected={value === "friends"}
          onClick={() => onSelect("friends")}
        />
      </div>
    </div>
  );
}

function TypeOption({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left px-5 py-4 flex items-start gap-4">
      <span className="text-[var(--pp-text)] mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-bold text-[var(--pp-text)]">{title}</p>
        <p className="mt-1 text-[13px] text-[var(--pp-text-muted)] leading-snug">{desc}</p>
      </div>
      {selected && <Check size={22} className="text-[var(--pp-success)] mt-1 shrink-0" strokeWidth={2.5} />}
    </button>
  );
}

function PaymentMethodSheet({
  value,
  balance,
  onSelect,
  onClose,
}: {
  value: string;
  balance: number | null;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<string>(value);
  const { accounts } = useLinkedAccounts();
  const navigate = useNavigate();
  void balance;
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-stretch justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full bg-white rounded-t-2xl pt-3 pb-4 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
        <div className="relative flex items-center justify-center px-5 pb-1">
          <button onClick={onClose} aria-label="Back" className="absolute left-4 top-0 text-[var(--pp-text)]">
            <ArrowLeft size={20} />
          </button>
          <h3 className="text-[18px] font-bold text-[var(--pp-text)]">Choose a way to pay</h3>
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-0 text-[var(--pp-text)]">
            <X size={20} />
          </button>
        </div>
        <p className="text-center text-[13px] text-[var(--pp-text-muted)] mt-1 mb-3">
          We'll remember it for next time.
        </p>

        <MethodRow
          selected={pending === "balance"}
          onClick={() => setPending("balance")}
          icon={<MethodIcon kind="balance" />}
          title="Balance"
          subtitle="No fee"
        />
        <MethodRow
          selected={pending === "co1260"}
          onClick={() => setPending("co1260")}
          icon={<MethodIcon kind="co1260" />}
          title="CAPITAL ONE N.A."
          subtitle={<>Checking ••••1260<br /><span className="text-[13px] text-[var(--pp-text-muted)]">No fee</span></>}
        />
        <MethodRow
          selected={pending === "mc7109"}
          onClick={() => setPending("mc7109")}
          icon={<MethodIcon kind="mc7109" />}
          title="SoFi MasterCard"
          subtitle={<>Debit ••••7109<br /><span className="text-[13px] text-[var(--pp-text-muted)]">+ $0.45 fee</span></>}
        />

        {accounts.map((a) => (
          <MethodRow
            key={a.id}
            selected={pending === `linked:${a.id}`}
            onClick={() => setPending(`linked:${a.id}`)}
            icon={
              <div className="h-9 w-9 rounded-md bg-[var(--pp-bg)] flex items-center justify-center text-[var(--pp-blue-dark)]">
                {a.kind === "card" ? <CreditCard size={20} /> : <Building2 size={20} />}
              </div>
            }
            title={a.institution}
            subtitle={<>{(a.account_type ?? (a.kind === "card" ? "Card" : "Checking"))} ••••{a.last4}<br /><span className="text-[13px] text-[var(--pp-text-muted)]">No fee</span></>}
          />
        ))}

        <button
          onClick={() => navigate({ to: "/link-account", search: { returnTo: "/send/amount" } })}
          className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
        >
          <div className="h-9 w-9 rounded-md bg-[var(--pp-bg)] flex items-center justify-center text-[var(--pp-text)] text-[20px] font-light">+</div>
          <span className="text-[15px] font-medium text-[var(--pp-text)]">Link a bank or card</span>
        </button>

        <div className="px-5 mt-2">
          <button
            type="button"
            onClick={() => {
              onSelect(pending);
              onClose();
            }}
            className="w-full rounded-full bg-[var(--pp-blue-dark)] py-3.5 text-[16px] font-bold text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}


function MethodRow({
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
  subtitle: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-start gap-4 px-5 py-3 text-left">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-medium text-[var(--pp-text)] truncate">{title}</p>
        <p className="text-[13px] text-[var(--pp-text-muted)]">{subtitle}</p>
      </div>
      {selected && <Check size={20} className="text-[var(--pp-success)] mt-1 shrink-0" strokeWidth={2.5} />}
    </button>
  );
}

function MastercardMark() {
  return (
    <div className="relative h-5 w-7">
      <span className="absolute left-0 top-0 h-5 w-5 rounded-full" style={{ background: "var(--pp-mc-red)" }} />
      <span className="absolute right-0 top-0 h-5 w-5 rounded-full mix-blend-multiply" style={{ background: "var(--pp-mc-yellow)" }} />
    </div>
  );
}

function BankMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10 L12 4 L21 10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10 V18 M9 10 V18 M15 10 V18 M19 10 V18" />
      <path d="M3 19 H21" strokeLinecap="round" />
    </svg>
  );
}
