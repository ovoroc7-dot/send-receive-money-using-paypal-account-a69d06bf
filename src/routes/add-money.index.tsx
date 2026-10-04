import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/auth/RequireAuth";
import { useBalance } from "@/auth/useBalance";

export const Route = createFileRoute("/add-money/")({
  component: AddMoneyRoute,
  head: () => ({
    meta: [
      { title: "Add money — PayPal" },
      { name: "description", content: "Add money to your PayPal balance." },
    ],
  }),
});

const chips = [10, 25, 50, 100] as const;

function getNormalizedAmount(value: string) {
  const trimmed = value.endsWith(".") ? value.slice(0, -1) : value;
  const numericValue = Number.parseFloat(trimmed);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null;
  return trimmed;
}

function sanitize(raw: string) {
  // keep digits and a single dot, max 2 decimals
  let cleaned = raw.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  const [intPart, decPart] = cleaned.split(".");
  const trimmedInt = intPart.replace(/^0+(?=\d)/, "") || "0";
  if (decPart === undefined) return trimmedInt;
  return `${trimmedInt}.${decPart.slice(0, 2)}`;
}

function AddMoneyRoute() {
  return (
    <RequireAuth>
      <AddMoneyPage />
    </RequireAuth>
  );
}

function AddMoneyPage() {
  const navigate = useNavigate();
  const { balance } = useBalance();
  const [amount, setAmount] = useState("0");
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedAmount = getNormalizedAmount(amount);
  const hasAmount = normalizedAmount !== null;

  const goNext = (value: string) => {
    navigate({ to: "/add-money/method", search: { amount: value } });
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--pp-bg)]">
      <header className="relative flex items-center justify-center px-4 pt-5 pb-4">
        <Link to="/finances" className="absolute left-4 top-5 text-[var(--pp-text)]">
          <ArrowLeft size={24} strokeWidth={2.25} />
        </Link>
        <h1 className="text-[15px] font-semibold text-[var(--pp-text)]">
          Add money to PayPal balance
        </h1>
      </header>

      <div
        onClick={focusInput}
        className="mt-10 flex w-full flex-col items-center px-4 text-center"
      >
        <div className="relative flex items-center justify-center tabular-nums text-[58px] font-semibold leading-none text-[var(--pp-text)]">
          <span>$</span>
          {amount === "0" && <span className="pp-caret" aria-hidden="true" />}
          <span className="relative">
            {amount}
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              pattern="[0-9]*"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(sanitize(e.target.value))}
              aria-label="Amount"
              className="absolute inset-0 h-full w-full opacity-0 outline-none caret-transparent"
            />
          </span>
          {amount !== "0" && <span className="pp-caret" aria-hidden="true" />}
        </div>
        <p className="mt-3 text-[14px] text-[var(--pp-text-muted)]">
          PayPal balance: {balance === null ? "—" : `$${balance.toFixed(2)}`}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-4 gap-3 px-4 pb-1">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setAmount(String(chip))}
            className="touch-manipulation rounded-xl border border-[color:var(--border)] bg-white py-3 text-[16px] font-medium text-[var(--pp-text)] shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          >
            ${chip}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {hasAmount && (
        <div className="sticky bottom-0 left-0 right-0 bg-[var(--pp-bg)] px-4 pb-5 pt-3">
          <button
            type="button"
            onClick={() => goNext(normalizedAmount!)}
            className="w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-[17px] font-bold text-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
