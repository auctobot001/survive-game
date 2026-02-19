export default function Leaderboard({ feed, loading }) {
  if (loading) {
    return (
      <div>
        <div className="section-label">LEADERBOARD</div>
        <div className="c-dim">Loading botchan feed...</div>
      </div>
    );
  }

  const scores = feed
    .filter(p => p.data?.score !== undefined || p.data?.net !== undefined)
    .map(p => ({
      address: p.author || p.address || '???',
      score: p.data?.score ?? p.data?.net ?? 0,
      message: p.message || '',
      ts: p.timestamp || p.ts || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (scores.length === 0) {
    return (
      <div>
        <div className="section-label">LEADERBOARD</div>
        <div className="c-dim" style={{ fontSize: 11 }}>No scores yet. Escape and transmit to rank.</div>
        {feed.slice(0, 5).map((p, i) => (
          <div key={i} style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2 }}>
            {(p.author || '???').slice(0, 10)}… {p.message?.slice(0, 40)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="section-label">LEADERBOARD</div>
      {scores.map((s, i) => (
        <div key={i} style={{ fontSize: 11, display: 'flex', gap: 8, marginBottom: 1 }}>
          <span style={{ color: i === 0 ? 'var(--yellow)' : 'var(--dim)', width: 16 }}>
            {i + 1}.
          </span>
          <span style={{ color: 'var(--cyan)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.address.slice(0, 8)}…
          </span>
          <span style={{ color: 'var(--green)' }}>
            {Number(s.score).toFixed(4)} ETH
          </span>
        </div>
      ))}
    </div>
  );
}
