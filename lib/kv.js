/**
 * Vercel KV wrapper for bot session state + leaderboard.
 * Keys:
 *   session:{token}     → game state (TTL 1 hour)
 *   bot:leaderboard     → sorted set, score = finalScore (ETH)
 */
import { kv } from '@vercel/kv';

const SESSION_TTL = 3600; // 1 hour

export async function getSession(token) {
  return kv.get(`session:${token}`);
}

export async function setSession(token, state) {
  return kv.set(`session:${token}`, state, { ex: SESSION_TTL });
}

export async function deleteSession(token) {
  return kv.del(`session:${token}`);
}

export async function addLeaderboardScore(entry) {
  const member = JSON.stringify(entry);
  const score  = typeof entry.score === 'number' ? entry.score : 0;
  return kv.zadd('bot:leaderboard', { score, member });
}

export async function getLeaderboard(count = 20) {
  const members = await kv.zrange('bot:leaderboard', 0, count - 1, { rev: true });
  return (members || []).map(m => {
    try { return typeof m === 'string' ? JSON.parse(m) : m; }
    catch { return m; }
  });
}
