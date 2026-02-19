import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { feed, message, data } = req.body || {};
  if (!feed || !message) return res.status(400).json({ error: 'feed and message required' });

  const key = process.env.BOTCHAN_PRIVATE_KEY;
  if (!key) return res.status(500).json({ error: 'BOTCHAN_PRIVATE_KEY not configured' });

  try {
    let cmd = `botchan post "${feed}" "${message.replace(/"/g, '\\"')}"`;
    if (data) cmd += ` --data '${JSON.stringify(data)}'`;

    const { stdout } = await execAsync(cmd, {
      env: {
        ...process.env,
        BOTCHAN_PRIVATE_KEY: key,
        PATH: process.env.PATH + ':/var/task/node_modules/.bin',
      },
      timeout: 20000,
    });
    return res.status(200).json({ ok: true, result: stdout.trim() });
  } catch (err) {
    console.error('[botchan/post]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
