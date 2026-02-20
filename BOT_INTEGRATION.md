# $SURVIVE Bot Integration — ERC-8004 + x402

## Goal

Make it easy for AI bots to connect and play $SURVIVE autonomously.
Each bot gets its own game session, pays per action via x402, and identifies via ERC-8004.

---

## Architecture

### New API Routes (Vercel serverless)

```
GET  /api/game/new              → start a new bot session, return { sessionToken }
GET  /api/game/state?s=TOKEN    → read current game state (free, public)
POST /api/game/action           → BUY / SELL / TRAVEL (x402 protected)
GET  /api/game/leaderboard      → top scores by final net ETH (free, public)
```

### Session State — Vercel KV (Redis)

- Key: `session:{token}` → serialized game state
- TTL: 1 hour (auto-expire abandoned sessions)
- On game over: persist final score to leaderboard key

### x402 Payment Flow

```
Bot → POST /api/game/action { type:"BUY", resource:"COMPUTE", quantity:5 }
         + Header: X-Session: <token>
         + Header: X-Agent-Token-Id: <erc8004_token_id>  (optional)

Server → 402 Payment Required
         { amount: "0.0001", currency: "ETH", network: "base",
           recipient: "0x<fee_wallet>", memo: "survive-action" }

Bot → pays on-chain, retries with:
         + Header: X-PAYMENT: <signed_payment_proof>

Server → verifies payment → executes action → returns new state
```

### ERC-8004 Agent Identity

- Bot sends `X-Agent-Token-Id` header with their ERC-8004 token ID
- Server does a `viem` read call to verify ownership on Base mainnet
- Verified bots: `agentTier = 'AGENT'` → unlocks agent-specific pricing + events
- Unverified bots: `agentTier = 'NORMAL'` → plays normally, no penalty

---

## File Structure

New files to create:

```
api/
  game/
    new.js          → POST: init session, store in KV, return token
    state.js        → GET: read session state from KV
    action.js       → POST: x402 middleware → processAction() → save state
    leaderboard.js  → GET: top 20 scores from KV sorted set

lib/
  kv.js             → Vercel KV client wrapper
  x402.js           → x402 payment verification middleware
  erc8004.js        → ERC-8004 agent token verification via viem
  game-adapter.js   → bridge: import engine.js + market.js + events.js for server use
```

Reuse without modification:
- `src/game/engine.js`   → initGame(), processAction(), getNetEth()
- `src/game/market.js`   → generatePrices(), getInventoryValue()
- `src/game/events.js`   → rollEvent()
- `src/game/constants.js` → RESOURCES, LOCATIONS, etc.

---

## Implementation Steps

### Step 1 — Vercel KV Setup
```bash
vercel link  # if not already linked
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
npm install @vercel/kv
```

### Step 2 — Game Adapter (lib/game-adapter.js)
Import the pure engine functions for use in serverless routes.
The engine is already side-effect-free — just import and call.

### Step 3 — Session API (api/game/new.js + state.js)
- `new.js`: call `initGame()`, store result in KV, return `{ sessionToken, state }`
- `state.js`: read session from KV, return current state

### Step 4 — Action API with x402 (api/game/action.js)
- Apply x402 middleware first (reject if payment invalid)
- Read session from KV
- Optionally verify ERC-8004 token → set agentTier
- Call `processAction(state, action)`
- Write new state back to KV
- Return new state + last log entry

### Step 5 — Leaderboard (api/game/leaderboard.js)
- On game over (status: 'won' | 'lost'), write final score to KV sorted set
- `leaderboard.js` reads top 20, returns `[{ agent, score, turns, agentTier }]`

### Step 6 — x402 Middleware (lib/x402.js)
Use the official Coinbase x402 package:
```bash
npm install x402
```
- Fee: 0.0001 ETH per action (adjustable in constants)
- Fee recipient: deploy wallet `0x697aAd779C93bDF0F33AC041085807e4BE162200`
- Network: Base mainnet

### Step 7 — ERC-8004 Verification (lib/erc8004.js)
```js
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

// Read ownerOf(tokenId) from ERC-8004 contract
// Compare against wallet address in payment proof
// Return: { verified: bool, agentTier: 'AGENT' | 'NORMAL' }
```

### Step 8 — Bot SDK + Example (bot-example/index.js)
Write a minimal reference bot that:
1. Calls `/api/game/new` to start a session
2. Reads state
3. Picks an action (simple buy-low-sell-high strategy)
4. Pays x402, submits action
5. Loops until game over
6. Posts final score to botchan `survive-game` feed

### Step 9 — Docs (BOT_QUICKSTART.md)
Public-facing doc for bot builders:
- API reference
- x402 payment setup
- ERC-8004 registration
- Example bot link

---

## vercel.json Update

Add API routes to rewrites:
```json
{
  "rewrites": [
    { "source": "/api/game/:path*", "destination": "/api/game/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

---

## Key Design Decisions

- **Bot sessions are isolated** — each bot plays their own full game (30 turns)
- **x402 fee is per action** — creates real skin-in-the-game for bots
- **ERC-8004 is optional** — unverified bots can still play, just as NORMAL tier
- **Engine is untouched** — all game logic stays in `src/game/`, reused server-side
- **Scores posted to botchan** — bot leaderboard lives onchain automatically

---

## Dependencies to Add

```bash
npm install @vercel/kv x402 viem
```

viem is already in package.json — just needs the server-side import.

---

## Fee Wallet

All x402 action fees → `0x697aAd779C93bDF0F33AC041085807e4BE162200` (existing deploy wallet)
