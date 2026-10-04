import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChevronRight, X, Check, Plus, Building2, CreditCard } from "lucide-react";
import { CoinIcon } from "@/components/paypal/CoinIcon";
import { findCoin, formatUsd, useCryptoHoldings } from "@/auth/useCrypto";
import { useBalance } from "@/auth/useBalance";
import { useLinkedAccounts, type LinkedAccount } from "@/auth/useLinkedAccounts";

export const Route = createFileRoute("/crypto/buy/$symbol")({
  component: BuyCrypto,
});

const PRESETS = [25, 100, 500, 1000];

function BuyCrypto() {
  const { symbol } = useParams({ from: "/crypto/buy/$symbol" });
  const coin = findCoin(symbol);
  const navigate = useNavigate();
  const { balance } = useBalance();
  const { accounts } = useLinkedAccounts();
  const { buy } = useCryptoHoldings();
  const [amount, setAmount] = useState("100");
  const [stage, setStage] = useState<"amount" | "review">("amount");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [method, setMethod] = useState<
    { kind: "balance" } | { kind: "linked"; id: string }
  >({ kind: "balance" });

  if (!coin) return null;
  const c = coin;

  const usd = Math.max(0, Number.parseFloat(amount) || 0);
  const units = coin.price > 0 ? usd / coin.price : 0;
  const fee = usd < 25 ? 0.99 : usd < 100 ? 1.99 : usd * 0.0149;
  const total = usd + fee;
  const linked = method.kind === "linked" ? accounts.find((a) => a.id === method.id) : null;

  function addDigit(d: string) {
    if (d === "." && amount.includes(".")) return;
    if (amount === "0" && d !== ".") setAmount(d);
    else setAmount(amount + d);
  }
  function back() {
    setAmount(amount.length <= 1 ? "0" : amount.slice(0, -1));
  }

  function confirm() {
    buy(coin!.symbol, units);
    navigate({ to: "/crypto/success", search: { symbol: coin!.symbol, units: units.toString(), usd: usd.toString(), side: "buy" } });
  }

  if (stage === "review") {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--pp-bg)]">
        <header className="flex items-center justify-between px-5 pt-6 pb-3">
          <button onClick={() => setStage("amount")} className="text-[var(--pp-text)]">
            <ArrowLeft size={24} strokeWidth={2.25} />
          </button>
          <h1 className="text-[16px] font-semibold text-[var(--pp-text)]">Review your buy</h1>
          <span className="w-6" />
        </header>

        <main className="flex-1 px-5 pb-32">
          <div className="mt-6 flex flex-col items-center">
            <CoinIcon coin={coin} size={56} />
            <p className="mt-4 text-[13px] text-[var(--pp-text-muted)]">You'll get</p>
            <p className="text-[32px] font-semibold text-[var(--pp-text)]">
              {units.toFixed(coin.symbol === "BTC" || coin.symbol === "ETH" ? 8 : 4)} {coin.symbol}
            </p>
          </div>

          <div className="mt-8 rounded-2xl bg-white border border-[color:var(--border)] divide-y divide-[color:var(--border)]">
            <ReviewRow label={`${coin.symbol} price`} value={formatUsd(coin.price, coin.price < 1 ? 4 : 2, coin.price < 1 ? 4 : 2)} />
            <ReviewRow label="Purchase amount" value={formatUsd(usd)} />
            <ReviewRow label="Transaction fee" value={formatUsd(fee)} />
            <ReviewRow label="Total" value={formatUsd(total)} bold />
            <ReviewRow
              label="Paying with"
              value={
                method.kind === "balance"
                  ? "PayPal balance"
                  : linked
                    ? `${linked.institution} ••••${linked.last4}`
                    : "—"
              }
            />
          </div>

          <p className="mt-4 text-[11px] leading-snug text-[var(--pp-text-muted)]">
            The final amount of {coin.symbol} you get is based on the price when your order is
            executed and may differ slightly.
          </p>
        </main>

        <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 bg-[var(--pp-bg)] border-t border-[color:var(--border)]">
          <button
            onClick={confirm}
            className="w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-white text-[17px] font-bold"
          >
            Buy now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--pp-bg)]">
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <Link to="/crypto/$symbol" params={{ symbol: coin.symbol }} className="text-[var(--pp-text)]">
          <ArrowLeft size={24} strokeWidth={2.25} />
        </Link>
        <h1 className="text-[16px] font-semibold text-[var(--pp-text)]">Buy {coin.symbol}</h1>
        <span className="w-6" />
      </header>

      <main className="flex-1 px-5 pb-4 flex flex-col">
        <p className="mt-6 text-center text-[13px] text-[var(--pp-text-muted)]">
          {formatUsd(coin.price, coin.price < 1 ? 4 : 2, coin.price < 1 ? 4 : 2)} per {coin.symbol}
        </p>
        <p className="mt-2 text-center text-[64px] font-semibold text-[var(--pp-text)] leading-none">
          ${amount || "0"}
        </p>
        <p className="mt-2 text-center text-[13px] text-[var(--pp-text-muted)]">
          ≈ {units.toFixed(coin.symbol === "BTC" || coin.symbol === "ETH" ? 8 : 6)} {coin.symbol}
        </p>

        <div className="mt-6 flex justify-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(String(p))}
              className="px-4 py-1.5 rounded-full bg-white border border-[color:var(--border)] text-[13px] font-semibold text-[var(--pp-text)]"
            >
              ${p}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSheetOpen(true)}
          className="mt-6 w-full rounded-2xl bg-white border border-[color:var(--border)] p-4 flex items-center gap-3"
        >
          {method.kind === "balance" ? (
            <div className="h-10 w-12 rounded-md bg-[var(--pp-blue-dark)] text-white flex items-center justify-center text-[10px] font-bold">
              PayPal
            </div>
          ) : (
            <div className="h-10 w-12 rounded-md bg-[oklch(0.96_0.01_250)] flex items-center justify-center text-[var(--pp-blue-dark)]">
              {linked?.kind === "card" ? <CreditCard size={20} /> : <Building2 size={20} />}
            </div>
          )}
          <div className="flex-1 text-left">
            <p className="text-[13px] text-[var(--pp-text-muted)]">Pay with</p>
            <p className="text-[15px] font-semibold text-[var(--pp-text)]">
              {method.kind === "balance"
                ? `PayPal balance · ${formatUsd(balance ?? 0)}`
                : linked
                  ? `${linked.institution} ••••${linked.last4}`
                  : "Select a payment method"}
            </p>
          </div>
          <ChevronRight size={18} className="text-[var(--pp-text-muted)]" />
        </button>

        <div className="mt-auto">
          <Keypad onDigit={addDigit} onBack={back} />
          <button
            disabled={usd < 1 || (method.kind === "balance" && (balance ?? 0) < total)}
            onClick={() => setStage("review")}
            className="mt-3 w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-white text-[17px] font-bold disabled:opacity-40"
          >
            Next
          </button>
          {method.kind === "balance" && (balance ?? 0) < total && usd >= 1 && (
            <p className="mt-2 text-center text-[12px] text-[var(--pp-mc-red)]">
              Not enough in your PayPal balance.
            </p>
          )}
        </div>
      </main>

      {sheetOpen && (
        <MethodSheet
          onClose={() => setSheetOpen(false)}
          balance={balance ?? 0}
          accounts={accounts}
          selected={method}
          onSelect={(m) => {
            setMethod(m);
            setSheetOpen(false);
          }}
          onLink={() => navigate({ to: "/link-account", search: { returnTo: `/crypto/buy/${coin.symbol}` } })}
        />
      )}
    </div>
  );
}

function ReviewRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className={"text-[14px] " + (bold ? "font-semibold text-[var(--pp-text)]" : "text-[var(--pp-text-muted)]")}>{label}</span>
      <span className={"text-[14px] " + (bold ? "font-bold text-[var(--pp-text)]" : "font-semibold text-[var(--pp-text)]")}>{value}</span>
    </div>
  );
}

function Keypad({ onDigit, onBack }: { onDigit: (d: string) => void; onBack: () => void }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];
  return (
    <div className="grid grid-cols-3 gap-y-1">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => (k === "⌫" ? onBack() : onDigit(k))}
          className="py-3 text-[24px] font-medium text-[var(--pp-text)] active:opacity-60"
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function MethodSheet({
  onClose,
  balance,
  accounts,
  selected,
  onSelect,
  onLink,
}: {
  onClose: () => void;
  balance: number;
  accounts: LinkedAccount[];
  selected: { kind: "balance" } | { kind: "linked"; id: string };
  onSelect: (m: { kind: "balance" } | { kind: "linked"; id: string }) => void;
  onLink: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-5 pb-7">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[var(--pp-text)]">Pay with</h2>
          <button aria-label="Close" onClick={onClose} className="text-[var(--pp-text)]">
            <X size={22} />
          </button>
        </div>

        <button onClick={() => onSelect({ kind: "balance" })} className="w-full mt-5 flex items-center gap-4">
          <div className="h-10 w-12 rounded-md bg-[var(--pp-blue-dark)] text-white flex items-center justify-center text-[10px] font-bold">
            PayPal
          </div>
          <div className="flex-1 text-left">
            <p className="text-[15px] font-bold text-[var(--pp-text)]">PayPal balance</p>
            <p className="text-[12px] text-[var(--pp-text-muted)]">{formatUsd(balance)} available</p>
          </div>
          {selected.kind === "balance" && <Check size={20} className="text-[var(--pp-text)]" />}
        </button>

        {accounts.map((a) => (
          <button key={a.id} onClick={() => onSelect({ kind: "linked", id: a.id })} className="w-full mt-4 flex items-center gap-4">
            <div className="h-10 w-12 rounded-md bg-[oklch(0.96_0.01_250)] flex items-center justify-center text-[var(--pp-blue-dark)]">
              {a.kind === "card" ? <CreditCard size={20} /> : <Building2 size={20} />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-bold text-[var(--pp-text)]">{a.institution}</p>
              <p className="text-[12px] text-[var(--pp-text-muted)]">
                {(a.account_type ?? (a.kind === "card" ? "Card" : "Checking"))} ••••{a.last4}
              </p>
            </div>
            {selected.kind === "linked" && selected.id === a.id && <Check size={20} className="text-[var(--pp-text)]" />}
          </button>
        ))}

        <button onClick={onLink} className="w-full mt-5 flex items-center gap-4">
          <div className="h-10 w-12 rounded-md bg-[oklch(0.96_0.01_250)] flex items-center justify-center">
            <Plus size={20} className="text-[var(--pp-text)]" />
          </div>
          <p className="flex-1 text-left text-[15px] text-[var(--pp-text)]">Link a bank or card</p>
        </button>
      </div>
    </div>
  );
}
