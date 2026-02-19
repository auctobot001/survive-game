import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const feed  = req.query.feed  || 'survive-game';
  const limit = parseInt(req.query.limit || '20', 10);

  try {
    const { stdout } = await execAsync(
      `botchan read "${feed}" --limit ${limit} --json`,
      { env: { ...process.env, PATH: process.env.PATH + ':/var/task/node_modules/.bin' }, timeout: 15000 }
    );
    const data = JSON.parse(stdout.trim() || '[]');
    return res.status(200).json(data);
  } catch (err) {
    console.error('[botchan/feed]', err.message);
    // Return empty feed gracefully — game still works
    return res.status(200).json([]);
  }
}
