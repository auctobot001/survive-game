export default function Leaderboard({ feed, loading, online }) {
  const scores = (feed || [])
    .filter(p => p.data?.score !== undefined || p.data?.net !== undefined)
    .map(p => ({
      address: p.author || p.address || '0x???',
      score: Number(p.data?.score ?? p.data?.net ?? 0),
      ts: p.timestamp || p.ts || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const medals = ['①', '②', '③'];

  return (
    <div>
      <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>ONCHAIN LEADERBOARD</span>
        <span style={{ fontSize: 9, color: online ? 'var(--green)' : '#444', letterSpacing: 1 }}>
          {online ? '● LIVE' : '○ OFFLINE'}
        </span>
      </div>

      {loading && (
        <div className="c-dim" style={{ fontSize: 10 }}>Reading Base chain...</div>
      )}

      {!loading && scores.length === 0 && (
        <div>
          <div className="c-dim" style={{ fontSize: 10, marginBottom: 4 }}>
            No scores yet. Escape + hold 1K $SURVIVE to post yours.
          </div>
          {/* Show recent feed activity as fallback */}
          {(feed || []).slice(0, 3).map((p, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 1 }}>
              {(p.author || '0x???').slice(0, 10)}… {(p.message || '').slice(0, 35)}
            </div>
          ))}
        </div>
      )}

      {scores.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11, marginBottom: 2, alignItems: 'center' }}>
          <span style={{ color: i < 3 ? 'var(--yellow)' : 'var(--dim)', width: 14, fontSize: 10 }}>
            {medals[i] || `${i + 1}.`}
          </span>
          <span style={{ color: 'var(--cyan)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>
            {s.address.slice(0, 6)}…{s.address.slice(-4)}
          </span>
          <span style={{ color: 'var(--green)', fontSize: 11 }}>
            {s.score.toFixed(4)}
          </span>
        </div>
      ))}

      <div style={{ marginTop: 4, fontSize: 9, color: '#333' }}>
        Scores posted permanently via botchan on Base.
        Wallet used only to verify $SURVIVE tier.
      </div>
    </div>
  );
}
