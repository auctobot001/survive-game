import { BASE_PRICES, LOCATION_MULTIPLIERS, RESOURCES } from './constants.js';

export function generatePrices(location, agentTier = 'NORMAL', ruggedResource = null, diamondResource = null) {
  const prices = {};
  const mults = LOCATION_MULTIPLIERS[location] || LOCATION_MULTIPLIERS.TESTNET;
  // Higher variance for high-risk locations
  const highRisk = ['ART_BASEL_MIAMI', 'ONCHAIN_SF', 'UNISWAP'].includes(location);
  const variance = highRisk ? 0.35 : 0.20;

  // Agent health globally influences prices when LOW_COMPUTE or CRITICAL
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
    let price        = base * locMult * agentHealthMult * randFactor;
    if (diamondResource === resource) price *= 2;
    prices[resource] = Math.max(0, parseFloat(price.toFixed(6)));
  }

  return prices;
}

export function getInventoryValue(inventory, prices) {
  return RESOURCES.reduce((sum, r) => sum + (inventory[r] ?? 0) * (prices[r] ?? 0), 0);
}
