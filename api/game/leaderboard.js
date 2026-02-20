/**
 * GET /api/game/leaderboard?limit=20
 * Top bot scores by final net ETH. Free, public.
 */
import { getLeaderboard } from '../../lib/kv.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit  = Math.min(parseInt(req.query.limit || '20', 10), 100);
  const scores = await getLeaderboard(limit);

  return res.status(200).json({
    leaderboard: scores,
    count:       scores.length,
  });
}
