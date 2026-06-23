// Live market prices for the Investments page.
// Crypto → CoinGecko (keyless). Stocks/ETFs → Yahoo Finance chart endpoint (keyless).
// Everything is best-effort: any failure just leaves the last known price untouched.

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", ADA: "cardano",
  DOGE: "dogecoin", XRP: "ripple", AVAX: "avalanche-2", LINK: "chainlink",
  MATIC: "matic-network", DOT: "polkadot", LTC: "litecoin", BCH: "bitcoin-cash",
  SHIB: "shiba-inu", UNI: "uniswap", ATOM: "cosmos", BNB: "binancecoin",
  USDC: "usd-coin", USDT: "tether", TRX: "tron", NEAR: "near", APT: "aptos",
};

export function isCrypto(ticker: string): boolean {
  return !!COINGECKO_IDS[ticker.toUpperCase()];
}

// Returns a map of UPPERCASE ticker → current USD price for whatever it could fetch.
export async function fetchLivePrices(tickers: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const up = Array.from(new Set(tickers.map((t) => t.toUpperCase())));
  const cryptos = up.filter((t) => COINGECKO_IDS[t]);
  const stocks = up.filter((t) => !COINGECKO_IDS[t]);

  // Crypto — one batched call.
  if (cryptos.length) {
    try {
      const ids = cryptos.map((t) => COINGECKO_IDS[t]).join(",");
      const r = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
        { cache: "no-store", headers: { accept: "application/json" } },
      );
      if (r.ok) {
        const j = (await r.json()) as Record<string, { usd?: number }>;
        for (const t of cryptos) {
          const v = j[COINGECKO_IDS[t]]?.usd;
          if (typeof v === "number" && v > 0) out[t] = v;
        }
      }
    } catch { /* keep last known */ }
  }

  // Stocks/ETFs — one call each, in parallel.
  await Promise.all(
    stocks.map(async (t) => {
      try {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1d&range=1d`,
          { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (compatible; Cadence/1.0)" } },
        );
        if (r.ok) {
          const j = (await r.json()) as {
            chart?: { result?: { meta?: { regularMarketPrice?: number } }[] };
          };
          const p = j?.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (typeof p === "number" && p > 0) out[t] = p;
        }
      } catch { /* keep last known */ }
    }),
  );

  return out;
}
