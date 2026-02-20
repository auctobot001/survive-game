/**
 * Fetches $SURVIVE market cap from DexScreener.
 * Returns a formatted string like "$1.2M" or "$450K".
 */
import { useState, useEffect } from 'react';

const TOKEN = '0xf79e1b46f9e62182b7594d719d146c19a7d09619';
const URL   = `https://api.dexscreener.com/latest/dex/tokens/${TOKEN}`;

function fmt(n) {
  if (!n || isNaN(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function useMarketCap(intervalMs = 60_000) {
  const [mcap, setMcap] = useState(null);

  useEffect(() => {
    async function fetch_() {
      try {
        const res  = await fetch(URL);
        const data = await res.json();
        const pair = data?.pairs?.[0];
        const val  = pair?.marketCap ?? pair?.fdv ?? null;
        setMcap(fmt(val));
      } catch {
        // silently ignore — show nothing if unavailable
      }
    }
    fetch_();
    const id = setInterval(fetch_, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return mcap;
}
