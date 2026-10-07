import { useCallback, useEffect, useState } from "react";

export type Coin = {
  symbol: string;
  name: string;
  price: number;
  change24h: number; // %
  color: string;
  glyph: string;
};

export const COINS: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", price: 67432.18, change24h: 1.24, color: "#F7931A", glyph: "₿" },
  { symbol: "ETH", name: "Ethereum", price: 3521.44, change24h: -0.82, color: "#627EEA", glyph: "Ξ" },
  { symbol: "SOL", name: "Solana", price: 152.06, change24h: 3.41, color: "#14F195", glyph: "◎" },
  { symbol: "DOGE", name: "Dogecoin", price: 0.1623, change24h: 0.55, color: "#C2A633", glyph: "Ð" },
  { symbol: "LTC", name: "Litecoin", price: 82.14, change24h: -1.12, color: "#345D9D", glyph: "Ł" },
  { symbol: "BCH", name: "Bitcoin Cash", price: 431.9, change24h: 0.31, color: "#0AC18E", glyph: "₿" },
  { symbol: "PYUSD", name: "PayPal USD", price: 1.0, change24h: 0.0, color: "#003087", glyph: "$" },
];

export function findCoin(symbol: string): Coin | undefined {
  return COINS.find((c) => c.symbol.toLowerCase() === symbol.toLowerCase());
}

export function formatUsd(v: number, min = 2, max = 2) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: min, maximumFractionDigits: max }).format(v);
}

export function formatCrypto(v: number, symbol: string) {
  const decimals = symbol === "BTC" || symbol === "ETH" ? 8 : 4;
  return `${v.toFixed(decimals)} ${symbol}`;
}

type Holdings = Record<string, number>;
const KEY = "pp_crypto_holdings_v1";

function read(): Holdings {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function useCryptoHoldings() {
  const [holdings, setHoldings] = useState<Holdings>({});

  useEffect(() => {
    setHoldings(read());
    const onStorage = () => setHoldings(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const buy = useCallback((symbol: string, units: number) => {
    const next = { ...read() };
    next[symbol] = (next[symbol] ?? 0) + units;
    localStorage.setItem(KEY, JSON.stringify(next));
    setHoldings(next);
  }, []);

  const sell = useCallback((symbol: string, units: number) => {
    const next = { ...read() };
    next[symbol] = Math.max(0, (next[symbol] ?? 0) - units);
    if (next[symbol] < 1e-10) delete next[symbol];
    localStorage.setItem(KEY, JSON.stringify(next));
    setHoldings(next);
  }, []);

  const totalValue = COINS.reduce((sum, c) => sum + (holdings[c.symbol] ?? 0) * c.price, 0);

  return { holdings, buy, sell, receive: buy, totalValue };
}

export function walletAddress(symbol: string, seed: string) {
  let h = 0;
  for (const ch of seed + symbol) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const abc = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  let out = "";
  for (let i = 0; i < 38; i++) { h = (h * 1103515245 + 12345) >>> 0; out += abc[h % 32]; }
  return (symbol === "BTC" ? "bc1q" : "0x") + out;
}
