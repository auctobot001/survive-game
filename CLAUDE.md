# $SURVIVE — Claude Code Handoff
Last updated: 2026-02-19 by Auctobot (OpenClaw session)

## What This Is
Dope Wars–style onchain survival game. Player trades 6 resources across 8 locations over 30 turns, trying to escape with positive NET ETH. The "agent" (Clawtomaton) has a live ETH treasury — if it depletes, the game locks. Token holders get tier perks.

**Live:** https://survive-game-three.vercel.app  
**Deploy:** `npx vite build && vercel --prod` from this directory

---

## Architecture

```
src/
  App.jsx                  ← wagmi/OnchainKit setup, top-level state
  components/
    Terminal.jsx           ← Main game layout (left panel + right sidebar)
    MarketPanel.jsx        ← Buy/sell UI per resource
    Sidebar.jsx            ← Status, wallet tier, inventory, hex map, botchan
    HexMap.jsx             ← SVG hex tile map (NEW today)
    EventLog.jsx           ← Scrolling game event log
    GameOver.jsx           ← Win/loss screen + leaderboard submit
    NewsTicker.jsx         ← Scrolling botchan feed at bottom
    Leaderboard.jsx        ← Top scores from botchan
    Disclaimer.jsx         ← One-time modal on first load
  game/
    constants.js           ← LOCATIONS, RESOURCES, STAKING_TIERS, multipliers
    engine.js              ← gameReducer, initGame, processAction, advanceTurn
    events.js              ← Event pool, rollEvent (location-aware)
    market.js              ← generatePrices (risk premium system)
  hooks/
    useSurviveAgent.js     ← Reads Clawtomaton ETH balance → agentTier
    useStakingTier.js      ← Reads $SURVIVE balance → stakingTier
    useBotchan.js          ← Botchan feed + post
    useMarketTicker.js     ← Live CLANKER/BANKR prices (read-only display)
```

---

## What Was Done Today (2026-02-19)

### 1. HexMap Component (`src/components/HexMap.jsx`)
New SVG hex tile map in the right sidebar, below the INVENTORY section.

**Layout (flat-top hexes):**
```
Row 0:   TEST   UNI    SF
Row 1:     SEP  PARIS  DENVR
Row 2:   STOWE  MIAMI
```

**Features:**
- GRID_R=16 for spacing, DRAW_R=12 for drawn hex → ~7px natural gaps between tiles
- 13 adjacency edges drawn as thin dashed lines behind hexes
- SVG filters: `hm-glow` (standard), `hm-glow-strong` (active tile), `hm-line-glow` (edges)
- Each hex: blurred glow halo polygon + dark fill + crisp border on top = neon cyberpunk look
- Current location: white border, risk-color fill, inner dashed ring, ◆ indicator, strong glow
- Color coded by risk: green=LOW, yellow=MED, orange=HIGH, red=EXTREME
- Clickable tiles dispatch `{ type: 'TRAVEL', destination: locId, agentTier }` via `onTravel` prop

**Props:** `{ currentLocation, onTravel, gasSpike }`

**Wired in:**
- `Sidebar.jsx` imports HexMap, renders it after INVENTORY section
- `Sidebar.jsx` now accepts a `dispatch` prop (passed from Terminal.jsx)
- `Terminal.jsx` passes `dispatch` to Sidebar

### 2. Risk/Reward System (`src/game/market.js` + `src/game/events.js`)

**Price premium (market.js):**
All resource prices at a location are multiplied by a universal risk premium ON TOP of the existing per-resource location multipliers:
- LOW → 1.00×  (TESTNET, SEPOLIA, STOWE)
- MEDIUM → 1.20×  (NFT_PARIS, ETH_DENVER)
- HIGH → 1.55×  (UNISWAP, ONCHAIN_SF)
- VERY_HIGH → 2.00×  (ART_BASEL_MIAMI)

Price variance also scales: LOW=±12%, MEDIUM=±22%, HIGH=±40%, VERY_HIGH=±55%

**Event system (events.js):**
`rollEvent` now takes `location` as second parameter (was just `agentTier`).
- Event fire rate: LOW=20%/turn, MEDIUM=30%, HIGH=40%, VERY_HIGH=50%
- Positive events boosted at risky locations: ×1.5 at HIGH, ×2.0 at VERY_HIGH
- New events:
  - **FLASH_PUMP** (HIGH/VERY_HIGH only): anon whale drops 0.008–0.035 ETH
  - **INSIDER_TIP** (MEDIUM/HIGH/VERY_HIGH): biggest holding doubles this turn

**UI indicators (Terminal.jsx):**
- Stats bar shows `[PREMIUM +55%]` badge (color-coded) when at a risky location
- Travel list shows premium % next to each location's risk label

---

## Key Constants

```js
// src/game/constants.js
RESOURCES = ['COMPUTE', 'LIQUIDITY', 'SIGNAL', 'DATA', 'REPUTATION', 'BASE']
MAX_TURNS = 30
STARTING_ETH = 0.05
STARTING_DEBT = 0.02
BASE_TRAVEL_COST = 0.001

AGENT_ADDRESS = '0xFC426DFeAe55Dae2f936a592450C9ECEa87A5736'  // Clawtomaton
TOKEN_ADDRESS = '0xf79e1B46F9E62182B7594d719d146c19A7D09619'  // $SURVIVE
TREASURY_ADDRESS = '0xFC426DFeAe55Dae2f936a592450C9ECEa87A5736'
```

## Staking Tiers
| Tier | $SURVIVE | Perks |
|------|----------|-------|
| SPECTATOR | 0 | Play only |
| DRIFTER | 1,000 | Submit to leaderboard |
| CREW | 10,000 | REPUTATION trading + insider tip events |
| OPERATOR | 100,000 | Post to botchan feed |
| WHALE | 500,000 | Send ETH to treasury |
| GOD_MODE | 1,000,000 | Name a child agent |

## Agent Tiers (Clawtomaton ETH balance)
| Tier | ETH | Effect |
|------|-----|--------|
| NORMAL | >0.01 | Normal play |
| LOW_COMPUTE | 0.001–0.01 | Prices ×0.9 |
| CRITICAL | 0.0001–0.001 | Prices ×0.75, warning shown |
| DEAD | <0.0001 | Prices ×0.5, game locked |

---

## Known Issues / Next Steps
- [ ] HexMap tiles could be polished further (Pattern may have feedback)
- [ ] Chainlink VRF for provably fair winner randomness (long-term)
- [ ] Mobile layout needs work
- [ ] Consider adding a "buy at current location" shortcut on hover of hex tile
- [ ] The `receive() external payable {}` on escrow contract can trap ETH (separate project)

## CSS Classes (from index.css)
Key ones you'll use:
- `.terminal-root`, `.terminal-box`, `.terminal-header`, `.terminal-body`, `.terminal-footer`
- `.terminal-left`, `.terminal-right`
- `.btn`, `.btn-cyan`, `.btn-orange`, `.btn-yellow`, `.btn-large`
- `.c-dim`, `.c-green`, `.c-cyan`, `.c-orange`, `.c-red`, `.c-yellow`
- `.section-label`, `.section-divider`
- `.glow`, `.glow-red`, `.glow-orange`
- `.blink`

## Deployment
```bash
npx vite build          # verify clean build first
vercel --prod           # deploy to survive-game-three.vercel.app
```
