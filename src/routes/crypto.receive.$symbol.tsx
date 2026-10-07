import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { CoinIcon } from "@/components/paypal/CoinIcon";
import { findCoin, walletAddress, formatCrypto, useCryptoHoldings } from "@/auth/useCrypto";
import { logCryptoActivity } from "@/lib/cryptoActivity";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/crypto/receive/$symbol")({
  component: ReceiveCrypto,
  head: () => ({ meta: [{ title: "Receive crypto — PayPal" }, { name: "description", content: "Your crypto address for receiving transfers." }] }),
});

function ReceiveCrypto() {
  const { symbol } = useParams({ from: "/crypto/receive/$symbol" });
  const coin = findCoin(symbol);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { receive } = useCryptoHoldings();
  const [from, setFrom] = useState("");
  const [usd, setUsd] = useState("");
  const [got, setGot] = useState("");
  if (!coin) return <p className="p-6">Coin not found.</p>;
  const addr = walletAddress(coin.symbol, user?.id ?? "guest");

  // Deterministic QR-style pattern from the address
  const cells: boolean[] = [];
  let h = 7;
  for (let i = 0; i < 625; i++) { h = (h * 31 + addr.charCodeAt(i % addr.length)) >>> 0; cells.push(h % 3 === 0); }
  const finder = (r: number, c: number) =>
    [[0, 0], [0, 18], [18, 0]].some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7);
  const finderOn = (r: number, c: number) => {
    for (const [fr, fc] of [[0, 0], [0, 18], [18, 0]]) {
      if (r >= fr && r < fr + 7 && c >= fc && c < fc + 7) {
        const y = r - fr, x = c - fc;
        return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4);
      }
    }
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--pp-bg)]">
      <header className="flex items-center gap-3 px-5 pt-6 pb-3">
        <button onClick={() => navigate({ to: "/crypto/$symbol", params: { symbol: coin.symbol } })} aria-label="Back" className="text-[var(--pp-text)]"><ArrowLeft size={24} /></button>
        <CoinIcon coin={coin} size={26} />
        <h1 className="text-[16px] font-semibold text-[var(--pp-text)]">Receive {coin.name}</h1>
      </header>
      <main className="flex-1 px-5 pb-10 flex flex-col items-center">
        <div className="mt-6 rounded-2xl bg-white border border-[color:var(--border)] p-5">
          <svg viewBox="0 0 25 25" className="h-56 w-56" shapeRendering="crispEdges">
            {cells.map((on, i) => {
              const r = Math.floor(i / 25), c = i % 25;
              const fill = finder(r, c) ? finderOn(r, c) : on;
              return fill ? <rect key={i} x={c} y={r} width="1" height="1" fill="var(--pp-text)" /> : null;
            })}
          </svg>
        </div>
        <p className="mt-6 text-[13px] text-[var(--pp-text-muted)]">Your {coin.symbol} address</p>
        <p className="mt-1 px-2 text-center text-[15px] font-semibold break-all text-[var(--pp-text)]">{addr}</p>
        <button
          onClick={async () => { try { await navigator.clipboard.writeText(addr); } catch { /* ignore */ } setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="mt-5 flex items-center gap-2 rounded-full bg-[var(--pp-blue-dark)] px-6 py-3 text-[15px] font-bold text-white"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Copied" : "Copy address"}
        </button>
        <div className="mt-8 w-full rounded-2xl bg-white border border-[color:var(--border)] p-4 space-y-3">
          <p className="text-[15px] font-semibold text-[var(--pp-text)]">Record incoming {coin.symbol}</p>
          <input value={from} onChange={(e) => setFrom(e.target.value.slice(0, 120))} placeholder="From (name or address)" className="w-full h-11 rounded-xl border border-[color:var(--border)] px-3 text-[14px] outline-none bg-transparent text-[var(--pp-text)]" />
          <input value={usd} inputMode="decimal" onChange={(e) => setUsd(e.target.value.replace(/[^0-9.]/g, "").slice(0, 10))} placeholder="Amount in USD" className="w-full h-11 rounded-xl border border-[color:var(--border)] px-3 text-[14px] outline-none bg-transparent text-[var(--pp-text)]" />
          <button
            disabled={!from.trim() || !(Number(usd) > 0)}
            onClick={() => {
              const amt = Number(usd); const units = amt / coin.price;
              receive(coin.symbol, units);
              void logCryptoActivity("crypto_receive", amt, formatCrypto(units, coin.symbol), from.trim());
              setGot(`You received ${formatCrypto(units, coin.symbol)}`); setFrom(""); setUsd("");
            }}
            className="w-full rounded-full bg-[var(--pp-blue-dark)] py-3 text-[15px] font-bold text-white disabled:opacity-40"
          >Receive</button>
          {got && <p className="text-[13px] text-[var(--pp-success)] text-center">{got}</p>}
        </div>
        <p className="mt-6 text-center text-[12px] text-[var(--pp-text-muted)]">Only send {coin.symbol} to this address. Sending other coins may result in permanent loss.</p>
      </main>
    </div>
  );
}
