/**
 * GET /api/game/new
 * Start a new bot game session.
 * Returns { sessionToken, state, instructions }
 */
import { randomUUID } from 'crypto';
import { initGame }   from '../../lib/game-adapter.js';
import { setSession } from '../../lib/kv.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionToken = randomUUID();
  const state        = initGame();

  await setSession(sessionToken, state);

  return res.status(200).json({
    sessionToken,
    state,
    instructions: {
      read:    'GET  /api/game/state?s=<sessionToken>',
      act:     'POST /api/game/action  (headers: X-Session, X-Payment, X-Agent-Token-Id)',
      board:   'GET  /api/game/leaderboard',
      actions: ['BUY', 'SELL', 'TRAVEL', 'ESCAPE', 'END_TURN'],
      body: {
        BUY:      { type: 'BUY',    resource: '<RESOURCE>', quantity: 1 },
        SELL:     { type: 'SELL',   resource: '<RESOURCE>', quantity: 1 },
        TRAVEL:   { type: 'TRAVEL', destination: '<LOCATION_ID>' },
        ESCAPE:   { type: 'ESCAPE' },
        END_TURN: { type: 'END_TURN' },
      },
    },
  });
}
