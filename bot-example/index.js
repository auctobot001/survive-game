/**
 * $SURVIVE Reference Bot — ERC-8004 + x402
 *
 * A minimal autonomous bot that plays $SURVIVE via the API.
 * Strategy: buy the cheapest resource, sell the most expensive, travel toward profit.
 *
 * Env vars:
 *   SURVIVE_API_URL      — e.g. https://survive-game-three.vercel.app
 *   BOT_PRIVATE_KEY      — 0x... private key of the paying wallet (Base mainnet)
 *   ERC8004_TOKEN_ID     — (optional) your ERC-8004 agent NFT token ID
 *   BOTCHAN_API_KEY      — (optional) post final score to botchan feed
 */

import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const API     = process.env.SURVIVE_API_URL || 'https://survive-game-three.vercel.app';
const PK      = process.env.BOT_PRIVATE_KEY;
const TOKEN_ID = process.env.ERC8004_TOKEN_ID || null;
const DELAY_MS = 2000; // polite delay between turns

if (!PK) {
  console.error('Missing BOT_PRIVATE_KEY env var');
  process.exit(1);
}

const account = privateKeyToAccount(PK);
const wallet  = createWalletClient({ account, chain: base, transport: http() });
const pub     = createPublicClient({ chain: base, transport: http() });

const FEE_RECIPIENT = '0x697aAd779C93bDF0F33AC041085807e4BE162200';
const FEE_AMOUNT    = parseEther('0.0001');

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apiGet(path) {
  const res = await fetch(`${API}${path}`);
  return res.json();
}

async function payAndPost(path, body, sessionToken) {
  // Step 1 — attempt without payment to get 402
  const probe = await fetch(`${API}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-Session': sessionToken },
    body:    JSON.stringify(body),
  });

  if (probe.status !== 402) {
    // Already processed (shouldn't happen on first attempt)
    return probe.json();
  }

  // Step 2 — pay on-chain
  console.log(`  [x402] Paying ${formatEther(FEE_AMOUNT)} ETH to ${FEE_RECIPIENT}...`);
  const txHash = await wallet.sendTransaction({
    to:    FEE_RECIPIENT,
    value: FEE_AMOUNT,
  });
  console.log(`  [x402] TX: ${txHash}`);

  // Wait for confirmation
  await pub.waitForTransactionReceipt({ hash: txHash });
  console.log(`  [x402] Confirmed.`);

  // Step 3 — retry with payment proof
  const headers = {
    'Content-Type':    'application/json',
    'X-Session':       sessionToken,
    'X-Payment':       txHash,
  };
  if (TOKEN_ID) headers['X-Agent-Token-Id'] = TOKEN_ID;

  const retry = await fetch(`${API}${path}`, {
    method: 'POST',
    headers,
    body:   JSON.stringify(body),
  });
  return retry.json();
}

// ── Strategy ───────────────────────────────────────────────────────────────

function pickAction(state) {
  const { prices, inventory, eth, location } = state;

  // ESCAPE if profitable
  const invValue = Object.entries(inventory).reduce((s, [r, q]) => s + q * (prices[r] || 0), 0);
  const net = eth + invValue - state.debt;
  if (net > 0 && state.turn > 15) return { type: 'ESCAPE' };

  // SELL what we have if price is good
  for (const [resource, qty] of Object.entries(inventory)) {
    if (qty > 0 && prices[resource] > 0) {
      return { type: 'SELL', resource, quantity: qty };
    }
  }

  // BUY the cheapest available resource we can afford
  const affordable = Object.entries(prices)
    .filter(([, p]) => p > 0 && eth >= p)
    .sort(([, a], [, b]) => a - b);

  if (affordable.length > 0) {
    const [resource, price] = affordable[0];
    const quantity = Math.max(1, Math.floor(eth * 0.5 / price));
    return { type: 'BUY', resource, quantity };
  }

  // Pass turn if nothing else to do
  return { type: 'END_TURN' };
}

// ── Main loop ──────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n$SURVIVE Bot — wallet: ${account.address}`);
  if (TOKEN_ID) console.log(`ERC-8004 token ID: ${TOKEN_ID}`);
  console.log('');

  // Start session
  const { sessionToken, state: initState } = await apiGet('/api/game/new');
  console.log(`Session: ${sessionToken}`);
  console.log(`Starting ETH: ${initState.eth} | Debt: ${initState.debt}\n`);

  let state = initState;

  while (state.gameStatus === 'playing') {
    const action = pickAction(state);
    console.log(`Turn ${state.turn}: ${JSON.stringify(action)}`);

    const result = await payAndPost('/api/game/action', action, sessionToken);

    if (result.error) {
      console.error(`  Error: ${result.error}`);
      break;
    }

    state = result.newState || result.state;
    const net = state.eth - state.debt + Object.entries(state.inventory)
      .reduce((s, [r, q]) => s + q * (state.prices[r] || 0), 0);

    console.log(`  ETH: ${state.eth.toFixed(6)} | NET: ${net.toFixed(6)} | ${result.lastEvent || ''}`);

    if (result.gameOver) break;
    await sleep(DELAY_MS);
  }

  console.log(`\nGame over: ${state.gameStatus.toUpperCase()}`);
  console.log(`Final score: ${state.finalScore?.toFixed(6) ?? 'n/a'} ETH`);

  // Post to leaderboard for verification
  const { leaderboard } = await apiGet('/api/game/leaderboard');
  const myEntry = leaderboard.find(e => e.agent?.toLowerCase() === account.address.toLowerCase());
  if (myEntry) console.log(`Leaderboard entry recorded: ${JSON.stringify(myEntry)}`);
}

run().catch(console.error);
