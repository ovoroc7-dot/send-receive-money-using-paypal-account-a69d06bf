import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, X, Delete } from "lucide-react";
import { RequireAuth } from "@/auth/RequireAuth";

type Search = { to: string };

export const Route = createFileRoute("/request/amount")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    to: typeof s.to === "string" ? s.to : "",
  }),
  component: RequestAmountRoute,
  head: () => ({
    meta: [
      { title: "Request money — PayPal" },
      { name: "description", content: "Choose an amount to request." },
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

function RequestAmountRoute() {
  return (
    <RequireAuth>
      <RequestAmountPage />
    </RequireAuth>
  );
}

function RequestAmountPage() {
  const navigate = useNavigate();
  const { to } = useSearch({ from: "/request/amount" });
  const [raw, setRaw] = useState("0");
  const [showReview, setShowReview] = useState(false);
  const [message, setMessage] = useState("");

  const numeric = useMemo(() => Number.parseFloat(raw || "0") || 0, [raw]);
  const canNext = numeric > 0;

  const press = (k: string) => {
    setRaw((cur) => {
      if (k === "back") {
        if (cur.length <= 1) return "0";
        const nxt = cur.slice(0, -1);
        return nxt === "" ? "0" : nxt;
      }
      if (k === ".") return cur.includes(".") ? cur : cur + ".";
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
    display.length <= 7 ? "text-[58px]" : display.length <= 10 ? "text-[52px]" : "text-[40px]";

  const submit = () => {
    navigate({ to: "/request/success", search: { to, amount: numeric.toFixed(2) } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="relative flex items-center justify-center px-4 pt-4 pb-3">
        <Link to="/payments" className="absolute left-3 top-4 p-1 text-[var(--pp-text)]" aria-label="Back">
          <ArrowLeft size={24} strokeWidth={2.25} />
        </Link>
        <h1 className="text-[16px] font-medium text-[var(--pp-text)] truncate max-w-[80%]">
          Request from {to || "recipient"}
        </h1>
      </header>

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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message"
          className="flex-1 h-12 rounded-full bg-[#f4ecdc] px-5 text-[15px] text-[var(--pp-text)] placeholder:text-[var(--pp-text-muted)] outline-none"
        />
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setShowReview(true)}
          className="h-12 px-7 rounded-full bg-[var(--pp-blue-dark)] text-white text-[15px] font-bold disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <div className="bg-[#d8dde6] pt-1.5 pb-2 px-1 grid grid-cols-3 gap-1.5">
        {[
          ["1", ""], ["2", "ABC"], ["3", "DEF"],
          ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
          ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
        ].map(([n, sub]) => (
          <NumKey key={n} onPress={() => press(n)}>
            <span className="text-[26px] font-medium text-[var(--pp-text)] leading-none">{n}</span>
            {sub && <span className="text-[10px] tracking-widest text-[var(--pp-text-muted)] mt-0.5">{sub}</span>}
          </NumKey>
        ))}
        <button type="button" onClick={() => press(".")} className="h-14 flex items-center justify-center text-[28px] text-[var(--pp-text)]" aria-label="decimal">.</button>
        <NumKey onPress={() => press("0")}>
          <span className="text-[26px] font-medium text-[var(--pp-text)] leading-none">0</span>
        </NumKey>
        <button type="button" onClick={() => press("back")} className="h-14 flex items-center justify-center text-[var(--pp-text)]" aria-label="backspace">
          <Delete size={24} strokeWidth={2} />
        </button>
      </div>

      {showReview && (
        <ReviewSheet amount={numeric} to={to} onClose={() => setShowReview(false)} onConfirm={submit} />
      )}
    </div>
  );
}

function NumKey({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <button type="button" onClick={onPress} className="h-14 rounded-md bg-white shadow-[0_1px_0_rgba(0,0,0,0.18)] flex flex-col items-center justify-center active:bg-[#f0f0f0]">
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
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      {/* Purple hero with peace hand */}
      <div className="relative flex-1 flex items-center justify-center" style={{ background: "oklch(0.32 0.18 295)" }}>
        <div className="text-[180px] leading-none">✌️</div>
      </div>
      <div className="relative w-full bg-white rounded-t-2xl pt-3 pb-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="relative flex items-center justify-center px-5 pb-3">
          <h3 className="text-[16px] font-medium text-[var(--pp-text)]">Review</h3>
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-0 text-[var(--pp-text)]">
            <X size={22} />
          </button>
        </div>

        <div className="px-5 mt-1 flex items-center justify-between">
          <p className="text-[17px] font-bold text-[var(--pp-text)]">Your request</p>
          <p className="text-[17px] font-bold text-[var(--pp-text)]">{fmtUSD(amount)}</p>
        </div>

        <p className="px-5 mt-3 text-[13px] text-[var(--pp-text-muted)] leading-relaxed">
          If you're requesting money for a purchase, you'll pay a seller fee when {to || "they"} pays you.
          You could be covered by{" "}
          <a className="text-[var(--pp-link)] font-semibold" href="#">PayPal Seller Protection</a>.
        </p>

        <div className="px-5 mt-5">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-[17px] font-bold text-white"
          >
            Request Now
          </button>
        </div>
      </div>
    </div>
  );
}
