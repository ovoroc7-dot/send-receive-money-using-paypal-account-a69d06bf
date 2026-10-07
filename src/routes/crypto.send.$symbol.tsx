import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { CoinIcon } from "@/components/paypal/CoinIcon";
import { findCoin, formatCrypto, formatUsd, useCryptoHoldings } from "@/auth/useCrypto";

export const Route = createFileRoute("/crypto/send/$symbol")({
  component: SendCrypto,
  head: () => ({ meta: [{ title: "Send crypto — PayPal" }, { name: "description", content: "Send crypto to a wallet address or PayPal contact." }] }),
});

function SendCrypto() {
  const { symbol } = useParams({ from: "/crypto/send/$symbol" });
  const coin = findCoin(symbol);
  const { holdings, sell } = useCryptoHoldings();
  const navigate = useNavigate();
  const [step, setStep] = useState<"to" | "amount" | "review" | "done">("to");
  const [to, setTo] = useState("");
  const [usd, setUsd] = useState("");
  if (!coin) return <p className="p-6">Coin not found.</p>;
  const owned = holdings[coin.symbol] ?? 0;
  const amt = Number.parseFloat(usd) || 0;
  const units = amt / coin.price;
  const fee = Math.min(2.5, amt * 0.01);
  const tooMuch = units > owned + 1e-12;

  const back = () => (step === "to" ? navigate({ to: "/crypto/$symbol", params: { symbol: coin.symbol } }) : setStep(step === "review" ? "amount" : "to"));

  if (step === "done") {
    return (
      <div className="min-h-screen flex flex-col bg-white px-6 pt-16 pb-10">
        <div className="mx-auto h-16 w-16 rounded-full bg-[var(--pp-yellow)] flex items-center justify-center">
          <Check size={32} strokeWidth={3} className="text-[var(--pp-blue-dark)]" />
        </div>
        <h1 className="mt-6 text-[24px] font-bold text-center text-[var(--pp-text)] break-words">
          You sent {formatCrypto(units, coin.symbol)}
        </h1>
        <p className="mt-2 text-center text-[14px] text-[var(--pp-text-muted)] break-all">to {to}</p>
        <p className="mt-4 text-center text-[14px] text-[var(--pp-text-muted)]">It can take a few minutes for the transfer to be confirmed on the network.</p>
        <div className="flex-1" />
        <Link to="/crypto" className="w-full text-center rounded-full bg-[var(--pp-blue-dark)] py-4 text-[17px] font-bold text-white">Done</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--pp-bg)]">
      <header className="flex items-center gap-3 px-5 pt-6 pb-3">
        <button onClick={back} aria-label="Back" className="text-[var(--pp-text)]"><ArrowLeft size={24} /></button>
        <CoinIcon coin={coin} size={26} />
        <h1 className="text-[16px] font-semibold text-[var(--pp-text)]">Send {coin.name}</h1>
      </header>
      <main className="flex-1 px-5 pb-32">
        {step === "to" && (
          <>
            <p className="mt-4 text-[15px] text-[var(--pp-text)]">Who are you sending to?</p>
            <input
              autoFocus
              value={to}
              onChange={(e) => setTo(e.target.value.slice(0, 120))}
              placeholder="Wallet address, name, email or phone"
              className="mt-3 w-full h-12 rounded-xl bg-white border border-[color:var(--border)] px-4 text-[15px] text-[var(--pp-text)] outline-none"
            />
            <p className="mt-3 text-[12px] text-[var(--pp-text-muted)]">Only send {coin.symbol} to a {coin.symbol} address. Crypto sent to the wrong address can't be recovered.</p>
          </>
        )}
        {step === "amount" && (
          <div className="mt-10 text-center">
            <div className="flex items-center justify-center text-[64px] font-normal text-[var(--pp-text)] leading-none">
              <span>$</span>
              <input
                autoFocus
                inputMode="decimal"
                value={usd}
                onChange={(e) => setUsd(e.target.value.replace(/[^0-9.]/g, "").slice(0, 10))}
                placeholder="0"
                className="bg-transparent outline-none text-center"
                style={{ width: `${Math.max(1, usd.length || 1)}ch` }}
              />
            </div>
            <p className="mt-3 text-[14px] text-[var(--pp-text-muted)]">{formatCrypto(units, coin.symbol)}</p>
            <p className="mt-6 text-[13px] text-[var(--pp-text-muted)]">Available: {formatCrypto(owned, coin.symbol)} ({formatUsd(owned * coin.price)})</p>
            {tooMuch && <p className="mt-2 text-[13px] text-[var(--pp-mc-red)]">That's more than you have.</p>}
          </div>
        )}
        {step === "review" && (
          <div className="mt-4 rounded-2xl bg-white border border-[color:var(--border)] p-4 space-y-3 text-[14px]">
            <Row k="To" v={to} />
            <Row k="Amount" v={formatCrypto(units, coin.symbol)} />
            <Row k="Value" v={formatUsd(amt)} />
            <Row k="Network fee" v={formatUsd(fee)} />
            <Row k="Total" v={formatUsd(amt + fee)} bold />
          </div>
        )}
      </main>
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-[var(--pp-bg)]">
        <button
          disabled={(step === "to" && to.trim().length < 3) || (step === "amount" && (amt <= 0 || tooMuch))}
          onClick={() => {
            if (step === "to") setStep("amount");
            else if (step === "amount") setStep("review");
            else { sell(coin.symbol, units); setStep("done"); }
          }}
          className="w-full rounded-full bg-[var(--pp-blue-dark)] py-4 text-[17px] font-bold text-white disabled:opacity-40"
        >
          {step === "review" ? "Send now" : "Next"}
        </button>
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--pp-text-muted)]">{k}</span>
      <span className={`text-right break-all text-[var(--pp-text)] ${bold ? "font-bold" : "font-semibold"}`}>{v}</span>
    </div>
  );
}
