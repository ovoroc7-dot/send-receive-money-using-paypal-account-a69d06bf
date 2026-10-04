import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowUpDown } from "lucide-react";
import { CoinIcon } from "@/components/paypal/CoinIcon";
import { findCoin, formatUsd, useCryptoHoldings } from "@/auth/useCrypto";

export const Route = createFileRoute("/crypto/sell/$symbol")({
  component: SellCrypto,
});

function SellCrypto() {
  const { symbol } = useParams({ from: "/crypto/sell/$symbol" });
  const coin = findCoin(symbol);
  const navigate = useNavigate();
  const { holdings, sell } = useCryptoHoldings();
  const [amount, setAmount] = useState("0");
  const [inputMode, setInputMode] = useState<"usd" | "coin">("usd");
  const [stage, setStage] = useState<"amount" | "review">("amount");

  if (!coin) return null;
  const c = coin;

  const owned = holdings[coin.symbol] ?? 0;
  const ownedValue = owned * coin.price;
  const parsed = Math.max(0, Number.parseFloat(amount) || 0);
  const usd = inputMode === "usd" ? parsed : parsed * coin.price;
  const units = inputMode === "coin" ? parsed : coin.price > 0 ? parsed / coin.price : 0;
  const canSell = units > 0 && units <= owned + 1e-10;

  function addDigit(d: string) {
    if (d === "." && amount.includes(".")) return;
    if (amount === "0" && d !== ".") setAmount(d);
    else setAmount(amount + d);
  }
  function back() {
    setAmount(amount.length <= 1 ? "0" : amount.slice(0, -1));
  }

  function confirm() {
    sell(c.symbol, units);
    navigate({ to: "/crypto/success", search: { symbol: c.symbol, units: units.toString(), usd: usd.toString(), side: "sell" } });
  }

  if (stage === "review") {
    const fee = usd * 0.0149;
    const proceeds = usd - fee;
    return (
      <div className="min-h-screen flex flex-col bg-[var(--pp-bg)]">
        <header className="flex items-center justify-between px-5 pt-6 pb-3">
          <button onClick={() => setStage("amount")} className="text-[var(--pp-text)]">
            <ArrowLeft size={24} strokeWidth={2.25} />
          </button>
          <h1 className="text-[16px] font-semibold text-[var(--pp-text)]">Review your sell</h1>
          <span className="w-6" />
        </header>
        <main className="flex-1 px-5 pb-32">
          <div className="mt-6 flex flex-col items-center">
            <CoinIcon coin={coin} size={56} />
            <p className="mt-4 text-[13px] text-[var(--pp-text-muted)]">You'll receive</p>
            <p className="text-[32px] font-semibold text-[var(--pp-text)]">{formatUsd(proceeds)}</p>
          </div>
          <div className="mt-8 rounded-2xl bg-white border border-[color:var(--border)] divide-y divide-[color:var(--border)]">
            <Row label={`${coin.symbol} price`} value={formatUsd(coin.price, coin.price < 1 ? 4 : 2, coin.price < 1 ? 4 : 2)} />
            <Row label="Selling" value={`${units.toFixed(coin.symbol === "BTC" || coin.symbol === "ETH" ? 8 : 4)} ${coin.symbol}`} />
            <Row label="Amount" value={formatUsd(usd)} />
            <Row label="Transaction fee" value={formatUsd(fee)} />
            <Row label="Proceeds to PayPal balance" value={formatUsd(proceeds)} bold />
          </div>
        </main>
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 bg-[var(--pp-bg)] border-t border-[color:var(--border)]">
          <button onClick={confirm} className="w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-white text-[17px] font-bold">
            Sell now
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
        <h1 className="text-[16px] font-semibold text-[var(--pp-text)]">Sell {coin.symbol}</h1>
        <span className="w-6" />
      </header>

      <main className="flex-1 px-5 pb-4 flex flex-col">
        <p className="mt-4 text-center text-[13px] text-[var(--pp-text-muted)]">
          Available: {owned.toFixed(coin.symbol === "BTC" || coin.symbol === "ETH" ? 6 : 4)} {coin.symbol} · {formatUsd(ownedValue)}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <p className="text-[56px] font-semibold text-[var(--pp-text)] leading-none">
            {inputMode === "usd" ? `$${amount || "0"}` : `${amount || "0"}`}
          </p>
          {inputMode === "coin" && (
            <span className="text-[20px] text-[var(--pp-text-muted)]">{coin.symbol}</span>
          )}
        </div>
        <button
          onClick={() => {
            setInputMode(inputMode === "usd" ? "coin" : "usd");
            setAmount("0");
          }}
          className="mt-2 mx-auto flex items-center gap-1 text-[13px] font-semibold text-[var(--pp-link)]"
        >
          <ArrowUpDown size={14} /> {inputMode === "usd" ? `Switch to ${coin.symbol}` : "Switch to USD"}
        </button>

        <div className="mt-5 flex justify-center gap-2">
          {[25, 50, 75, 100].map((p) => (
            <button
              key={p}
              onClick={() => {
                const target = inputMode === "usd" ? (ownedValue * p) / 100 : (owned * p) / 100;
                setAmount(target.toFixed(inputMode === "usd" ? 2 : 6));
              }}
              className="px-4 py-1.5 rounded-full bg-white border border-[color:var(--border)] text-[13px] font-semibold text-[var(--pp-text)]"
            >
              {p}%
            </button>
          ))}
        </div>

        <div className="mt-auto">
          <Keypad onDigit={addDigit} onBack={back} />
          <button
            disabled={!canSell}
            onClick={() => setStage("review")}
            className="mt-3 w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-white text-[17px] font-bold disabled:opacity-40"
          >
            Next
          </button>
          {!canSell && parsed > 0 && (
            <p className="mt-2 text-center text-[12px] text-[var(--pp-mc-red)]">
              You don't have enough {coin.symbol}.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
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
        <button key={k} onClick={() => (k === "⌫" ? onBack() : onDigit(k))} className="py-3 text-[24px] font-medium text-[var(--pp-text)] active:opacity-60">
          {k}
        </button>
      ))}
    </div>
  );
}
