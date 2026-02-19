import { useState, useEffect, useRef } from 'react';
import { TICKER_BASE_PRICES } from '../game/constants.js';

// Simulated market ticker for CLANKER and BANKR
// Prices drift with realistic volatility each interval
function simulatePrice(base, prev, volatility = 0.08) {
  const change = 1 + (Math.random() * 2 - 1) * volatility;
  const next = prev * change;
  // Mean-revert toward base ± 50%
  const floor = base * 0.3;
  const ceil  = base * 3.0;
  return Math.max(floor, Math.min(ceil, next));
}

export function useMarketTicker(intervalMs = 15000) {
  const [prices, setPrices] = useState({
    CLANKER: TICKER_BASE_PRICES.CLANKER,
    BANKR:   TICKER_BASE_PRICES.BANKR,
  });
  const [trend, setTrend] = useState({ CLANKER: 0, BANKR: 0 }); // +1 up, -1 down, 0 flat
  const prevRef = useRef({ ...TICKER_BASE_PRICES });

  useEffect(() => {
    const id = setInterval(() => {
      setPrices(prev => {
        const next = {
          CLANKER: simulatePrice(TICKER_BASE_PRICES.CLANKER, prev.CLANKER),
          BANKR:   simulatePrice(TICKER_BASE_PRICES.BANKR,   prev.BANKR),
        };
        setTrend({
          CLANKER: next.CLANKER > prev.CLANKER ? 1 : next.CLANKER < prev.CLANKER ? -1 : 0,
          BANKR:   next.BANKR   > prev.BANKR   ? 1 : next.BANKR   < prev.BANKR   ? -1 : 0,
        });
        prevRef.current = next;
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return { prices, trend };
}
