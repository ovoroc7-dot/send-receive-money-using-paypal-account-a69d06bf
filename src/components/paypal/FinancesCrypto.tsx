import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Minus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { COINS, formatUsd, useCryptoHoldings } from "@/auth/useCrypto";
import { CoinIcon, Sparkline } from "@/components/paypal/CoinIcon";
import { supabase } from "@/integrations/supabase/client";

type Txn = { id: string; amount: number; kind: string; counterparty: string | null; note: string | null; created_at: string };

export function FinancesCrypto() {
  const { holdings, totalValue } = useCryptoHoldings();
  const navigate = useNavigate();
  const owned = COINS.filter((c) => (holdings[c.symbol] ?? 0) > 0);
  const first = owned[0]?.symbol ?? "BTC";
  const [txns, setTxns] = useState<Txn[]>([]);

  useEffect(() => {
    void supabase
      .from("transactions")
      .select("id,amount,kind,counterparty,note,created_at")
      .in("kind", ["crypto_send", "crypto_receive"])
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setTxns((data ?? []) as Txn[]));
  }, []);

  const actions = [
    { label: "Buy", icon: <Plus size={22} strokeWidth={2.5} />, go: () => navigate({ to: "/crypto/buy/$symbol", params: { symbol: "BTC" } }) },
    { label: "Sell", icon: <Minus size={22} strokeWidth={2.5} />, go: () => owned.length && navigate({ to: "/crypto/sell/$symbol", params: { symbol: first } }), disabled: !owned.length },
    { label: "Send", icon: <ArrowUpRight size={22} strokeWidth={2.5} />, go: () => owned.length && navigate({ to: "/crypto/send/$symbol", params: { symbol: first } }), disabled: !owned.length },
    { label: "Receive", icon: <ArrowDownLeft size={22} strokeWidth={2.5} />, go: () => navigate({ to: "/crypto/receive/$symbol", params: { symbol: first } }) },
  ];

  return (
    <div>
      <div className="mt-7">
        <p className="text-[15px] text-[var(--pp-text)]">Crypto balance</p>
        <p className="mt-2 text-[40px] font-semibold leading-none tracking-tight text-[var(--pp-text)]">{formatUsd(totalValue)}</p>
      </div>

      <div className="mt-7 grid grid-cols-4 gap-2">
        {actions.map((a) => (
          <button key={a.label} onClick={a.go} disabled={a.disabled} className="flex flex-col items-center gap-2 disabled:opacity-40">
            <span className="h-14 w-14 rounded-full bg-[var(--pp-blue-dark)] text-white flex items-center justify-center">{a.icon}</span>
            <span className="text-[13px] font-semibold text-[var(--pp-text)]">{a.label}</span>
          </button>
        ))}
      </div>

      {owned.length > 0 && (
        <>
          <h2 className="mt-8 text-[17px] font-semibold text-[var(--pp-text)]">Your crypto</h2>
          <div className="mt-3 rounded-2xl bg-white border border-[color:var(--border)] divide-y divide-[color:var(--border)]">
            {owned.map((c) => {
              const u = holdings[c.symbol] ?? 0;
              return (
                <Link key={c.symbol} to="/crypto/$symbol" params={{ symbol: c.symbol }} className="flex items-center gap-3 px-4 py-3.5">
                  <CoinIcon coin={c} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[var(--pp-text)]">{c.name}</p>
                    <p className="text-[12px] text-[var(--pp-text-muted)]">{u.toFixed(c.symbol === "BTC" || c.symbol === "ETH" ? 8 : 4)} {c.symbol}</p>
                  </div>
                  <p className="text-[15px] font-semibold text-[var(--pp-text)]">{formatUsd(u * c.price)}</p>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <h2 className="mt-8 text-[17px] font-semibold text-[var(--pp-text)]">Explore crypto</h2>
      <div className="mt-3 rounded-2xl bg-white border border-[color:var(--border)] divide-y divide-[color:var(--border)]">
        {COINS.map((c) => {
          const up = c.change24h >= 0;
          const col = up ? "var(--pp-success)" : "var(--pp-mc-red)";
          return (
            <Link key={c.symbol} to="/crypto/$symbol" params={{ symbol: c.symbol }} className="flex items-center gap-3 px-4 py-3.5">
              <CoinIcon coin={c} size={38} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[var(--pp-text)]">{c.name}</p>
                <p className="text-[12px] text-[var(--pp-text-muted)]">{c.symbol}</p>
              </div>
              <Sparkline color={col} up={up} />
              <div className="text-right w-24">
                <p className="text-[14px] font-semibold text-[var(--pp-text)]">{formatUsd(c.price, c.price < 1 ? 4 : 2, c.price < 1 ? 4 : 2)}</p>
                <p className="text-[12px] font-medium" style={{ color: col }}>{up ? "+" : ""}{c.change24h.toFixed(2)}%</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[var(--pp-text)]">Crypto activity</h2>
        <Link to="/activity" className="text-[13px] font-bold text-[var(--pp-blue-dark)]">See all</Link>
      </div>
      {txns.length === 0 ? (
        <p className="mt-3 text-[14px] text-[var(--pp-text-muted)]">No crypto activity yet.</p>
      ) : (
        <div className="mt-3 rounded-2xl bg-white border border-[color:var(--border)] divide-y divide-[color:var(--border)]">
          {txns.map((t) => {
            const inbound = t.kind === "crypto_receive";
            return (
              <Link key={t.id} to="/activity/$id" params={{ id: t.id }} className="flex items-center gap-3 px-4 py-3.5">
                <span className="h-10 w-10 rounded-full flex items-center justify-center text-[18px] font-bold text-white" style={{ background: "#F7931A" }}>₿</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-[var(--pp-text)] truncate">{inbound ? "From" : "To"} {t.counterparty ?? "wallet"}</p>
                  <p className="text-[12px] text-[var(--pp-text-muted)] truncate">
                    {new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {inbound ? "Received" : "Sent"} {t.note}
                  </p>
                </div>
                <p className="text-[15px] font-semibold" style={{ color: inbound ? "var(--pp-success)" : "var(--pp-text)" }}>
                  {inbound ? "+" : "−"}{formatUsd(Math.abs(Number(t.amount)))}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
