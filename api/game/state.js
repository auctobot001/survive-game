/**
 * GET /api/game/state?s=<sessionToken>
 * Read current game state for a bot session. Free, no payment required.
 */
import { getSession } from '../../lib/kv.js';
import { getNetEth }  from '../../lib/game-adapter.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.query.s;
  if (!token) {
    return res.status(400).json({ error: 'Missing query param: ?s=sessionToken' });
  }

  const state = await getSession(token);
  if (!state) {
    return res.status(404).json({ error: 'Session not found or expired (TTL 1 hour)' });
  }

  return res.status(200).json({
    state,
    netEth:   getNetEth(state),
    gameOver: state.gameStatus !== 'playing',
  });
}
