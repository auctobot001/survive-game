/**
 * POST /api/game/action
 *
 * Headers:
 *   X-Session:        <sessionToken>     (required)
 *   X-Payment:        <baseTxHash>       (required — x402 proof)
 *   X-Agent-Token-Id: <erc8004TokenId>   (optional — unlocks AGENT tier pricing)
 *
 * Body (JSON):
 *   { type: 'BUY' | 'SELL' | 'TRAVEL' | 'ESCAPE' | 'END_TURN', ...params }
 *
 * Flow:
 *   1. Verify x402 payment (returns 402 if missing/invalid)
 *   2. Load session from KV
 *   3. Optionally verify ERC-8004 token → set agentTier
 *   4. processAction(state, action)
 *   5. Persist new state to KV
 *   6. On game over → write final score to leaderboard sorted set
 */
import { getSession, setSession, addLeaderboardScore } from '../../lib/kv.js';
import { verifyX402, paymentRequirements }             from '../../lib/x402.js';
import { verifyAgentToken }                            from '../../lib/erc8004.js';
import { processAction, getNetEth }                   from '../../lib/game-adapter.js';

const VALID_ACTIONS = new Set(['BUY', 'SELL', 'TRAVEL', 'ESCAPE', 'END_TURN']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Step 1: x402 payment verification ────────────────────────────────────
  const payment = await verifyX402(req);
  if (!payment.ok) {
    return res.status(402).json({
      error:     'Payment Required',
      x402:      paymentRequirements(),
    });
  }

  // ── Step 2: load session ──────────────────────────────────────────────────
  const token = req.headers['x-session'];
  if (!token) {
    return res.status(400).json({ error: 'Missing X-Session header' });
  }

  const state = await getSession(token);
  if (!state) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  if (state.gameStatus !== 'playing') {
    return res.status(400).json({
      error:    `Game already over: ${state.gameStatus}`,
      state,
      finalScore: state.finalScore,
    });
  }

  // ── Step 3: ERC-8004 agent identity (optional) ────────────────────────────
  let agentTier = state.agentTier || 'NORMAL';
  const tokenId = req.headers['x-agent-token-id'];
  if (tokenId && payment.payer) {
    const result = await verifyAgentToken(tokenId, payment.payer);
    agentTier = result.agentTier;
  }

  // ── Step 4: validate and process action ───────────────────────────────────
  const body = req.body;
  if (!body || !VALID_ACTIONS.has(body.type)) {
    return res.status(400).json({
      error:   `Invalid action type. Valid: ${[...VALID_ACTIONS].join(', ')}`,
    });
  }

  const newState = processAction(state, { ...body, agentTier });

  // ── Step 5: persist ────────────────────────────────────────────────────────
  await setSession(token, newState);

  // ── Step 6: record score on game over ─────────────────────────────────────
  const justFinished = newState.gameStatus !== 'playing' && state.gameStatus === 'playing';
  if (justFinished) {
    await addLeaderboardScore({
      agent:        payment.payer || 'anonymous',
      agentTokenId: tokenId || null,
      agentTier,
      score:        newState.finalScore ?? getNetEth(newState),
      turns:        newState.turn,
      status:       newState.gameStatus,
      ts:           Date.now(),
    });
  }

  const lastLog = newState.eventLog[newState.eventLog.length - 1];
  return res.status(200).json({
    state,
    newState,
    lastEvent:  lastLog?.text,
    agentTier,
    gameOver:   newState.gameStatus !== 'playing',
    finalScore: justFinished ? newState.finalScore : undefined,
  });
}
