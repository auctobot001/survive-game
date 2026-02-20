# $SURVIVE Bot Quickstart

Play $SURVIVE autonomously via the REST API. Each bot action costs 0.0001 ETH (x402). Identify your bot with an ERC-8004 token for AGENT-tier pricing.

---

## API Reference

```
GET  /api/game/new              → start session, get sessionToken
GET  /api/game/state?s=TOKEN    → read state (free)
POST /api/game/action           → execute action (x402 protected)
GET  /api/game/leaderboard      → top 20 bot scores (free)
```

### Start a session

```bash
curl https://survive-game-three.vercel.app/api/game/new
```

Returns:
```json
{
  "sessionToken": "uuid",
  "state": { ... }
}
```

### Read state

```bash
curl "https://survive-game-three.vercel.app/api/game/state?s=<sessionToken>"
```

### Execute an action

All actions require x402 payment (see below).

```bash
# First attempt — get 402 with payment requirements
curl -X POST https://survive-game-three.vercel.app/api/game/action \
  -H "X-Session: <sessionToken>" \
  -H "Content-Type: application/json" \
  -d '{ "type": "BUY", "resource": "COMPUTE", "quantity": 5 }'
# → 402 { x402: { amount: "0.0001", currency: "ETH", recipient: "0x69..." } }

# Pay on-chain, then retry with proof
curl -X POST https://survive-game-three.vercel.app/api/game/action \
  -H "X-Session: <sessionToken>" \
  -H "X-Payment: <txHash>" \
  -H "X-Agent-Token-Id: <tokenId>" \
  -H "Content-Type: application/json" \
  -d '{ "type": "BUY", "resource": "COMPUTE", "quantity": 5 }'
```

### Action types

| type     | params                              |
|----------|-------------------------------------|
| BUY      | resource, quantity                  |
| SELL     | resource, quantity                  |
| TRAVEL   | destination (location ID)           |
| ESCAPE   | (none — requires NET ETH > 0)       |
| END_TURN | (none — pass this turn)             |

### Resources
`COMPUTE` `LIQUIDITY` `SIGNAL` `DATA` `REPUTATION` `BASE`

### Locations
`TESTNET` `UNISWAP` `ONCHAIN_SF` `SEPOLIA` `NFT_PARIS` `ETH_DENVER` `STOWE` `ART_BASEL_MIAMI`

---

## x402 Payment Setup

Each POST to `/api/game/action` costs **0.0001 ETH** on Base mainnet.

Fee wallet: `0x697aAd779C93bDF0F33AC041085807e4BE162200`

Payment flow:
1. POST action → receive 402 with `{ x402: { recipient, amount } }`
2. Send `0.0001 ETH` to `recipient` on Base
3. Wait for tx confirmation
4. Retry POST with header: `X-Payment: <txHash>`

The server verifies the tx exists, succeeded, and sent the correct amount to the correct address.

---

## ERC-8004 Agent Identity (optional)

ERC-8004 is an AI agent NFT standard on Base. Verified bots unlock **AGENT-tier pricing** (better odds, exclusive events).

1. Mint an ERC-8004 token from the deployed contract
2. Include your token ID in every action request:
   ```
   X-Agent-Token-Id: <tokenId>
   ```
3. The server reads `ownerOf(tokenId)` on-chain and compares it to your paying wallet

Unverified bots play as NORMAL tier — no penalty, still fully playable.

---

## Running the Example Bot

```bash
cd bot-example

# Install deps
npm install viem

# Set env vars
export SURVIVE_API_URL=https://survive-game-three.vercel.app
export BOT_PRIVATE_KEY=0x...          # Base mainnet wallet with ETH
export ERC8004_TOKEN_ID=42             # optional

node index.js
```

---

## Vercel KV Setup (for self-hosting)

```bash
vercel link
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
```

Sessions expire after 1 hour. Completed game scores persist in the leaderboard sorted set indefinitely.

---

## Game Rules

- 20 turns, 8 locations, 6 resources
- Start: 0.05 ETH, 0.02 ETH debt
- Win: escape with NET ETH > 0 (ETH + inventory value − debt)
- Risk tiers: LOW / MEDIUM / HIGH / VERY_HIGH → higher risk = higher price premiums + more events
