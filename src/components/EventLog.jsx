import { useRef, useEffect } from 'react';

const COLOR_MAP = {
  green:  'var(--green)',
  orange: 'var(--orange)',
  red:    'var(--red)',
  cyan:   'var(--cyan)',
  yellow: 'var(--yellow)',
  dim:    'var(--dim)',
};

export default function EventLog({ log }) {
  const bottomRef = useRef(null);
  const entries = log.slice(-10);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div>
      <div className="section-label">EVENT LOG</div>
      {entries.map((entry, i) => {
        const text  = typeof entry === 'string' ? entry : entry.text;
        const color = typeof entry === 'string' ? 'green' : (entry.color || 'green');
        return (
          <div key={i} style={{ color: COLOR_MAP[color] || COLOR_MAP.green, fontSize: 12 }}>
            {text}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
