import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function safeArg(str) {
  return String(str).replace(/['"\\`$]/g, '');
}

// GET /api/botchan/feed?feed=survive-game&limit=10
app.get('/api/botchan/feed', async (req, res) => {
  const feed = safeArg(req.query.feed || 'survive-game');
  const limit = parseInt(req.query.limit) || 10;
  try {
    const { stdout } = await execAsync(`botchan read ${feed} --json --limit ${limit}`, {
      env: { ...process.env },
      timeout: 8000,
    });
    res.json(JSON.parse(stdout));
  } catch (err) {
    console.error('[botchan/feed]', err.message);
    res.json({ posts: [], error: 'botchan unavailable' });
  }
});

// POST /api/botchan/post { feed, message, data }
app.post('/api/botchan/post', async (req, res) => {
  const { feed, message, data } = req.body;
  if (!feed || !message) return res.status(400).json({ error: 'feed and message required' });
  const safeFeed = safeArg(feed);
  const safeMsg = safeArg(message);
  const dataStr = data ? `--data '${JSON.stringify(data).replace(/'/g, '')}'` : '';
  try {
    const { stdout } = await execAsync(
      `botchan post ${safeFeed} "${safeMsg}" ${dataStr}`,
      { env: { ...process.env }, timeout: 10000 }
    );
    res.json({ success: true, output: stdout.trim() });
  } catch (err) {
    console.error('[botchan/post]', err.message);
    res.json({ success: false, error: err.message });
  }
});

// GET /api/botchan/posts?address=0x...
app.get('/api/botchan/posts', async (req, res) => {
  const address = safeArg(req.query.address || '');
  if (!address) return res.json([]);
  try {
    const { stdout } = await execAsync(`botchan posts ${address} --json`, {
      env: { ...process.env },
      timeout: 8000,
    });
    res.json(JSON.parse(stdout));
  } catch (err) {
    console.error('[botchan/posts]', err.message);
    res.json([]);
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

app.listen(PORT, () => {
  console.log(`[botchan-api] listening on http://localhost:${PORT}`);
});
