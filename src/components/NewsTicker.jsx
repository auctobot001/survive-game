export default function NewsTicker({ feed, online }) {
  const items = feed.length > 0
    ? feed.map(p => p.message || p.text || JSON.stringify(p)).join('  ///  ')
    : online
      ? 'Fetching botchan feed...'
      : '[botchan offline — start server with: npm run server]';

  return (
    <div className="terminal-ticker">
      <span style={{ color: 'var(--dim)', marginRight: 8 }}>[NEWS]</span>
      <span className="ticker-inner" style={{ color: 'var(--cyan)' }}>
        {items}
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        {items}
      </span>
    </div>
  );
}
