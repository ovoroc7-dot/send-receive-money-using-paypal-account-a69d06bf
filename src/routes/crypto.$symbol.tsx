import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Star, Info } from "lucide-react";
import { CoinIcon } from "@/components/paypal/CoinIcon";
import { findCoin, formatUsd, useCryptoHoldings } from "@/auth/useCrypto";

export const Route = createFileRoute("/crypto/$symbol")({
  component: CoinDetail,
});

const RANGES = ["1H", "1D", "1W", "1M", "1Y", "ALL"] as const;

function CoinDetail() {
  const { symbol } = useParams({ from: "/crypto/$symbol" });
  const coin = findCoin(symbol);
  const { holdings } = useCryptoHoldings();
  const navigate = useNavigate();
  const [range, setRange] = useState<(typeof RANGES)[number]>("1D");

  if (!coin) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--pp-bg)] p-6">
        <Link to="/crypto" className="text-[var(--pp-text)] mb-6">
          <ArrowLeft size={24} />
        </Link>
        <p className="text-[var(--pp-text)]">Coin not found.</p>
      </div>
    );
  }

  const units = holdings[coin.symbol] ?? 0;
  const value = units * coin.price;
  const changeColor = coin.change24h >= 0 ? "var(--pp-success)" : "var(--pp-mc-red)";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--pp-bg)] relative">
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <Link to="/crypto" className="text-[var(--pp-text)]">
          <ArrowLeft size={24} strokeWidth={2.25} />
        </Link>
        <div className="flex items-center gap-2">
          <CoinIcon coin={coin} size={26} />
          <h1 className="text-[16px] font-semibold text-[var(--pp-text)]">{coin.name}</h1>
        </div>
        <button aria-label="Favorite" className="text-[var(--pp-text)]">
          <Star size={22} />
        </button>
      </header>

      <main className="flex-1 px-5 pb-52">
        {/* Price */}
        <div className="mt-4">
          <p className="text-[13px] text-[var(--pp-text-muted)]">{coin.symbol} price</p>
          <p className="mt-1 text-[36px] font-semibold leading-none text-[var(--pp-text)]">
            {formatUsd(coin.price, coin.price < 1 ? 4 : 2, coin.price < 1 ? 4 : 2)}
          </p>
          <p className="mt-2 text-[13px] font-medium" style={{ color: changeColor }}>
            {coin.change24h >= 0 ? "▲" : "▼"} {Math.abs(coin.change24h).toFixed(2)}% today
          </p>
        </div>

        {/* Chart */}
        <div className="mt-5 rounded-2xl bg-white border border-[color:var(--border)] p-4">
          <PriceChart color={coin.color} up={coin.change24h >= 0} />
          <div className="mt-4 flex justify-between">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={
                  "px-3 py-1 rounded-full text-[12px] font-semibold " +
                  (range === r
                    ? "bg-[var(--pp-blue-dark)] text-white"
                    : "text-[var(--pp-text-muted)]")
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Holdings */}
        <h2 className="mt-8 text-[15px] font-semibold text-[var(--pp-text)]">Your position</h2>
        <div className="mt-3 rounded-2xl bg-white border border-[color:var(--border)] p-4 space-y-3">
          <Row label="Balance" value={formatUsd(value)} />
          <Row
            label={`${coin.symbol} owned`}
            value={units.toFixed(coin.symbol === "BTC" || coin.symbol === "ETH" ? 8 : 4)}
          />
          <Row label="Avg. cost" value={units > 0 ? formatUsd(coin.price * 0.98) : "—"} />
        </div>

        {/* About */}
        <h2 className="mt-8 text-[15px] font-semibold text-[var(--pp-text)]">About {coin.name}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--pp-text-muted)]">
          {coin.name} ({coin.symbol}) is a digital asset traded on the PayPal crypto service. Prices
          shown are indicative and may differ from the execution price at the time of your order.
        </p>

        <div className="mt-4 rounded-2xl bg-white border border-[color:var(--border)] p-4 flex items-start gap-3">
          <Info size={18} className="text-[var(--pp-text-muted)] mt-0.5" />
          <p className="text-[12px] text-[var(--pp-text-muted)]">
            Crypto held in your PayPal account is subject to the PayPal Cryptocurrency Terms and
            Conditions. Not FDIC insured.
          </p>
        </div>
      </main>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 bg-[var(--pp-bg)] border-t border-[color:var(--border)]">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            disabled={units <= 0}
            onClick={() => navigate({ to: "/crypto/send/$symbol", params: { symbol: coin.symbol } })}
            className="rounded-full bg-white border border-[var(--pp-blue-dark)] py-3 text-[var(--pp-blue-dark)] text-[15px] font-bold disabled:opacity-40"
          >
            Send
          </button>
          <button
            onClick={() => navigate({ to: "/crypto/receive/$symbol", params: { symbol: coin.symbol } })}
            className="rounded-full bg-white border border-[var(--pp-blue-dark)] py-3 text-[var(--pp-blue-dark)] text-[15px] font-bold"
          >
            Receive
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            disabled={units <= 0}
            onClick={() => navigate({ to: "/crypto/sell/$symbol", params: { symbol: coin.symbol } })}
            className="rounded-full bg-white border border-[var(--pp-blue-dark)] py-3.5 text-[var(--pp-blue-dark)] text-[16px] font-bold disabled:opacity-40"
          >
            Sell
          </button>
          <button
            onClick={() => navigate({ to: "/crypto/buy/$symbol", params: { symbol: coin.symbol } })}
            className="rounded-full bg-[var(--pp-blue-dark)] py-3.5 text-white text-[16px] font-bold"
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-[var(--pp-text-muted)]">{label}</span>
      <span className="text-[14px] font-semibold text-[var(--pp-text)]">{value}</span>
    </div>
  );
}

function PriceChart({ color, up }: { color: string; up: boolean }) {
  const d = up
    ? "M0 90 C 30 80, 60 70, 90 72 S 150 40, 180 45 S 240 20, 300 15"
    : "M0 20 C 30 30, 60 45, 90 40 S 150 70, 180 65 S 240 85, 300 90";
  return (
    <svg viewBox="0 0 300 100" className="w-full h-32" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L 300 100 L 0 100 Z`} fill="url(#g)" />
      <path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
