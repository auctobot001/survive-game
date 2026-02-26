# $SURVIVE / survivecrypto.app — Session Handoff
Last updated: 2026-02-25

---

## 🎮 SURVIVE GAME — Current State

**Live:** https://survivecrypto.app
**Repo:** https://github.com/auctobot001/survive-game
**Deploy:** `npx vite build && vercel --prod` from `/Users/auctobot/.openclaw/workspace/survive-game`

### What's Built & Live
- Dope Wars–style trading game: 6 resources, 8 locations, 20 turns
- Agent tier (NORMAL / LOW_COMPUTE / CRITICAL / DEAD) now derived from `game.eth` each turn — buying/selling directly affects agent health and prices
- Hex tile map in sidebar (clickable travel)
- Risk premium system: HIGH/VERY_HIGH locations give price bonuses (+55%, +100%)
- Live $SURVIVE market cap in header (DexScreener)
- 11 booster tokens in sidebar (green=held, red=not held, cyan=no wallet)
- INFO modal with how-to-play, staking tiers, token links, contact buttons
- Contact: [X @auctobot001] + [Farcaster @auctobot] — centered above [CLOSE]
- Farcaster mini app: `fc:frame` meta tag + `/.well-known/farcaster.json` manifest (FID 2802848)
- ERC-8004 + x402 bot API: `/api/game/{new,state,action,leaderboard}` (see BOT_QUICKSTART.md)
- Vercel KV for bot session storage + leaderboard

### Recent Commits
```
4eb39e44 feat: add $shovel as booster token
6e2dead9 fix: remove MiniAppProvider wrapper — caused blank page in browser
43287fcd fix: install @pigment-css/react and bundle it (fixes blank page)
f9a798af feat: sign farcaster.json manifest for survivecrypto.app
9d437323 feat: add Neynar mini app analytics + Farcaster mini app support
cea3b887 fix: move contact buttons above close, centered in INFO modal
```

### Known Issues / Next Steps
- [ ] Mobile layout needs work
- [ ] Chainlink VRF for provably fair randomness (long-term)
- [ ] NFT rewards for top survivors (planned)
- [ ] HexMap tiles could be polished further

### Booster Tokens (Sidebar + INFO modal)
| Token | Address |
|-------|---------|
| $CLANKER | 0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb |
| $BNKR | 0x22aF33FE49fD1Fa80c7149773dDe5890D3c76F3b |
| $DRB | 0x3ec2156d4c0a9cbdab4a016633b7bcf6a8d68ea2 |
| $DIMES | 0x17d70172C7C4205bd39ce80F7f0ee660B7Dc5A23 |
| $auctobot001 | 0x30e187bB79D539db798c66F4d37183491405Cb07 |
| $clawnch | 0xa1f72459dfa10bad200ac160ecd78c6b77a747be |
| $alpha | 0x3D01Fe5A38ddBD307fDd635b4Cb0e29681226D6f |
| $botchan | 0xD77d781921A33793a46e5bb6a7bb52edb7DbBb07 |
| $🟩🦞 | 0x00BB032296e0C580E21010a5a6A4E007E0953E68 |
| $shovel | 0xbd3Dc49AF8A366705190Dbb9aaE4E92067f2DbA3 |

---

## 🤖 OPENCLAW GATEWAY — Current Config

**Dashboard:** http://localhost:18789/#token=057e88acbdaa0bebb98162cff73883e9136a0a2f5f14bf4d
**Config file:** `~/.openclaw/openclaw.json`
**Gateway status:** `openclaw gateway status`
**Restart:** `openclaw gateway restart`
**Logs:** `/tmp/openclaw/openclaw-YYYY-MM-DD.log`

### Gateway Settings
```json
"gateway": {
  "port": 18789,
  "mode": "local",
  "bind": "lan",           // listens on 0.0.0.0 — accessible via localhost + LAN + Tailscale
  "controlUi": {
    "allowInsecureAuth": true   // allows token auth over HTTP (not just HTTPS)
  },
  "auth": {
    "mode": "token",
    "token": "057e88acbdaa0bebb98162cff73883e9136a0a2f5f14bf4d"
  }
}
```

**Access URLs:**
- http://localhost:18789/ (same machine — use this, it's a secure context)
- http://192.168.102.13:18789/ (LAN)
- http://100.81.149.105:18789/ (Tailscale IP — HTTP only, crypto.subtle blocked)

**Auth note:** To set the token in the Control UI browser, open:
`http://localhost:18789/#token=057e88acbdaa0bebb98162cff73883e9136a0a2f5f14bf4d`

---

## 🔀 OPENROUTER — Current Config & Active Issue

**API Key:** `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`
**Config:** `~/.openclaw/agents/main/agent/models.json`

### Model Aliases (openclaw.json)
| Alias | Model | Use for |
|-------|-------|---------|
| `auto` | openrouter/auto | Default — vision-capable routing |
| `sonnet` | anthropic/claude-sonnet-4-6 | Direct Anthropic |
| `deepseek` | deepseek/deepseek-chat | Text-only, cheap |
| `llama` | meta-llama/llama-3.3-70b-instruct | Text-only, cheap |

Use with: `/model deepseek` or `/model llama` for text-only tasks.

### 🚨 ACTIVE ISSUE — OpenRouter Auto Router Allowed Models

**Problem:** The auto router's allowed models list in the Control UI contained wildcards (`deepseek/*`, `google/gemini-2.0-flash*`, `anthropic/claude-3-5-haiku*`, `meta-llama/llama-3.3-70b-instruct`) which caused two errors:
1. `404 No endpoints found that support image input` — non-vision models in the pool
2. `These patterns don't match any supported auto-router models` — wildcards not supported

**Fix in progress:** In the Control UI auto router allowed models dialog, replace everything with these exact IDs (no wildcards):
```
google/gemini-2.0-flash-001
anthropic/claude-3.5-haiku
```

Both support image/vision input. This is the correct set for the `openrouter/auto` pool.

**Where to find the dialog:** http://localhost:18789/ → model settings → OpenRouter Auto → allowed models

**Verified exact IDs from OpenRouter API (vision-capable, fast, cheap):**
- `google/gemini-2.0-flash-001`
- `google/gemini-2.5-flash`
- `anthropic/claude-3.5-haiku`
- `anthropic/claude-haiku-4.5`

---

## 📋 WHAT WE'RE WORKING ON RIGHT NOW

1. **OpenRouter auto router allowed models** — fixing the allowed models dialog in Control UI
   - Remove wildcards and non-vision models
   - Set exact IDs: `google/gemini-2.0-flash-001` + `anthropic/claude-3.5-haiku`
   - Status: **in progress** — user needs to update the dialog in the Control UI

2. **Gateway localhost access** — RESOLVED
   - Changed `bind: tailnet` → `bind: lan` (listens on 0.0.0.0)
   - Enabled `allowInsecureAuth: true`
   - Token auth via URL hash: `#token=...`

3. **Survive game** — stable, deployed, no active bugs
   - Last deploy: added $shovel booster token
   - Site loading correctly after fixing MiniAppProvider blank page bug

---

## 🏗️ KEY FILE PATHS

```
Game:
  /Users/auctobot/.openclaw/workspace/survive-game/   ← project root
  src/components/Terminal.jsx                          ← main game UI
  src/components/Sidebar.jsx                          ← sidebar + booster tokens
  src/game/engine.js                                  ← game logic + agent tier
  src/game/constants.js                               ← MAX_TURNS=20, addresses

OpenClaw:
  ~/.openclaw/openclaw.json                           ← main config
  ~/.openclaw/agents/main/agent/models.json           ← OpenRouter model defs
  ~/.openclaw/agents/main/agent/auth-profiles.json    ← API keys
```
