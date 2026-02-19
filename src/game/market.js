import { BASE_PRICES, LOCATION_MULTIPLIERS, LOCATIONS, RESOURCES } from './constants.js';

/**
 * Universal risk premium applied to ALL resource prices at a location,
 * on top of the per-resource location multipliers.
 * This is the core "high risk = high reward" lever — dangerous areas
 * always sell for more, regardless of which specific resource you're trading.
 */
const RISK_PREMIUM = {
  LOW:       1.00,
  MEDIUM:    1.20,
  HIGH:      1.55,
  VERY_HIGH: 2.00,
};

/** Price variance by risk level (random swing ± this fraction of the base). */
const RISK_VARIANCE = {
  LOW:       0.12,
  MEDIUM:    0.22,
  HIGH:      0.40,
  VERY_HIGH: 0.55,
};

export function generatePrices(location, agentTier = 'NORMAL', ruggedResource = null, diamondResource = null) {
  const prices  = {};
  const mults   = LOCATION_MULTIPLIERS[location] || LOCATION_MULTIPLIERS.TESTNET;
  const risk    = LOCATIONS[location]?.risk || 'LOW';
  const premium = RISK_PREMIUM[risk]  ?? 1.0;
  const variance = RISK_VARIANCE[risk] ?? 0.20;

  // Agent health globally suppresses prices when struggling
  let agentHealthMult = 1;
  if (agentTier === 'LOW_COMPUTE') agentHealthMult = 0.90;
  else if (agentTier === 'CRITICAL') agentHealthMult = 0.75;
  else if (agentTier === 'DEAD')     agentHealthMult = 0.50;

  for (const resource of RESOURCES) {
    if (ruggedResource === resource) {
      prices[resource] = 0;
      continue;
    }
    const base       = BASE_PRICES[resource];
    const locMult    = mults[resource] ?? 1;
    const randFactor = 1 + (Math.random() * 2 - 1) * variance;
    let price        = base * locMult * premium * agentHealthMult * randFactor;
    if (diamondResource === resource) price *= 2;
    prices[resource] = Math.max(0, parseFloat(price.toFixed(6)));
  }

  return prices;
}

export function getInventoryValue(inventory, prices) {
  return RESOURCES.reduce((sum, r) => sum + (inventory[r] ?? 0) * (prices[r] ?? 0), 0);
}
