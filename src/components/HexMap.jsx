import { LOCATIONS } from '../game/constants.js';

// ── Risk colours ──────────────────────────────────────────────────────────────
const RISK_COLORS = {
  LOW:       '#00ff41',
  MEDIUM:    '#d4ff00',
  HIGH:      '#ff6b00',
  VERY_HIGH: '#ff2222',
};

// Split a display label into 1 or 2 lines for the hex tile.
// e.g. "ART BASEL MIAMI" → ["ART BASEL", "MIAMI"]
//      "NFT PARIS"       → ["NFT", "PARIS"]
//      "TESTNET"         → ["TESTNET"]
function splitLabel(label) {
  const words = label.split(' ');
  if (words.length <= 1) return [label];
  if (words.length === 2) return words;
  return [words.slice(0, -1).join(' '), words[words.length - 1]];
}

// ── Geometry ──────────────────────────────────────────────────────────────────
// GRID_R drives layout spacing; DRAW_R drives actual hex size.
// Gap between adjacent hexes ≈ √3 × (GRID_R − DRAW_R) ≈ 7 px.
const GRID_R    = 13.6;   // 16 × 0.85
const DRAW_R    = 10.2;   // 12 × 0.85
const SQRT3     = Math.sqrt(3);
const COL_SPACE = SQRT3 * GRID_R;   // ≈ 27.7
const ROW_SPACE = GRID_R * 1.5;     // 24
const ODD_OFF   = COL_SPACE / 2;    // ≈ 13.9
const PAD       = DRAW_R + 4;       // breathing room at edges

/**
 * Grid layout  [locId, col, row]
 *
 *   row 0 (no offset):  TEST   UNI    SF
 *   row 1 (offset ½):     SEP  PARIS  DENVR
 *   row 2 (no offset):  STOWE  MIAMI
 */
const GRID = [
  ['TESTNET',         0, 0],
  ['UNISWAP',         1, 0],
  ['ONCHAIN_SF',      2, 0],
  ['SEPOLIA',         0, 1],
  ['NFT_PARIS',       1, 1],
  ['ETH_DENVER',      2, 1],
  ['STOWE',           0, 2],
  ['ART_BASEL_MIAMI', 1, 2],
];

/**
 * Adjacency edges — geometrically correct for this flat-top offset grid.
 * Every pair is at exactly √3 × GRID_R distance from each other.
 */
const EDGES = [
  ['TESTNET',    'UNISWAP'],
  ['UNISWAP',    'ONCHAIN_SF'],
  ['TESTNET',    'SEPOLIA'],
  ['UNISWAP',    'SEPOLIA'],
  ['UNISWAP',    'NFT_PARIS'],
  ['ONCHAIN_SF', 'NFT_PARIS'],
  ['ONCHAIN_SF', 'ETH_DENVER'],
  ['SEPOLIA',    'NFT_PARIS'],
  ['NFT_PARIS',  'ETH_DENVER'],
  ['SEPOLIA',    'STOWE'],
  ['SEPOLIA',    'ART_BASEL_MIAMI'],
  ['NFT_PARIS',  'ART_BASEL_MIAMI'],
  ['STOWE',      'ART_BASEL_MIAMI'],
];

function hexCenter(col, row) {
  return {
    x: col * COL_SPACE + (row % 2 === 1 ? ODD_OFF : 0) + PAD,
    y: row * ROW_SPACE + PAD,
  };
}

/** Flat-top hex polygon points string centred at (cx, cy) with radius r. */
function hexPts(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

// Pre-compute centres at module level (constants never change)
const CENTERS = Object.fromEntries(
  GRID.map(([id, col, row]) => [id, hexCenter(col, row)])
);

// ── Component ─────────────────────────────────────────────────────────────────
export default function HexMap({ currentLocation, onTravel, gasSpike }) {
  const svgW = Math.max(...GRID.map(([, c, r]) => CENTERS[GRID.find(g => g[1] === c && g[2] === r)?.[0]]?.x ?? 0)) + PAD + 1;
  // simpler: just derive from furthest centre
  const allX = GRID.map(([id]) => CENTERS[id].x);
  const allY = GRID.map(([id]) => CENTERS[id].y);
  const W = Math.max(...allX) + PAD;
  const H = Math.max(...allY) + PAD;

  return (
    <div>
      <div className="section-label" style={{ marginBottom: 4 }}>
        MAP{gasSpike ? <span className="c-orange" style={{ marginLeft: 5, fontSize: 9 }}>[GAS 3×]</span> : null}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Location map"
      >
        <defs>
          {/* Soft neon glow — for hex outlines */}
          <filter id="hm-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />   {/* double up for brighter glow */}
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Tighter glow — for connection lines */}
          <filter id="hm-line-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Strong glow — active tile */}
          <filter id="hm-glow-strong" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Layer 1: connection lines (behind everything) ─────────────── */}
        <g>
          {EDGES.map(([a, b]) => {
            const ca = CENTERS[a];
            const cb = CENTERS[b];
            if (!ca || !cb) return null;
            const aHere = a === currentLocation;
            const bHere = b === currentLocation;
            const active = aHere || bHere;
            const lineColor = active ? '#1a3a2a' : '#0d1a0f';
            return (
              <g key={`${a}-${b}`}>
                {/* Glow layer */}
                <line
                  x1={ca.x} y1={ca.y}
                  x2={cb.x} y2={cb.y}
                  stroke={active ? '#00ff41' : '#0a2a10'}
                  strokeWidth={active ? 0.8 : 0.5}
                  strokeDasharray="1.5,3"
                  opacity={active ? 0.35 : 0.2}
                  filter="url(#hm-line-glow)"
                />
                {/* Crisp layer */}
                <line
                  x1={ca.x} y1={ca.y}
                  x2={cb.x} y2={cb.y}
                  stroke={lineColor}
                  strokeWidth={0.4}
                  strokeDasharray="1.5,3"
                />
              </g>
            );
          })}
        </g>

        {/* ── Layer 2: hex tiles ────────────────────────────────────────── */}
        {GRID.map(([locId]) => {
          const loc       = LOCATIONS[locId];
          const { x, y }  = CENTERS[locId];
          const isHere    = locId === currentLocation;
          const rc        = RISK_COLORS[loc?.risk] || '#00ff41';
          const lines     = splitLabel(loc?.label || locId);
          const drawR     = isHere ? DRAW_R + 1 : DRAW_R;   // active tile is 1px larger

          return (
            <g
              key={locId}
              style={{ cursor: isHere ? 'default' : 'pointer' }}
              onClick={() => !isHere && onTravel?.(locId)}
            >
              {/* ── Glow halo (blurred, behind the fill) */}
              <polygon
                points={hexPts(x, y, drawR + (isHere ? 2 : 0))}
                fill={isHere ? rc + '18' : 'none'}
                stroke={rc}
                strokeWidth={isHere ? 2.5 : 1.4}
                opacity={isHere ? 0.9 : 0.5}
                filter={isHere ? 'url(#hm-glow-strong)' : 'url(#hm-glow)'}
              />

              {/* ── Dark fill (covers the connection lines inside the hex) */}
              <polygon
                points={hexPts(x, y, drawR - 0.5)}
                fill="#040804"
                stroke="none"
              />

              {/* ── Crisp border on top */}
              <polygon
                points={hexPts(x, y, drawR)}
                fill={isHere ? rc + '22' : 'none'}
                stroke={isHere ? '#ffffff' : rc}
                strokeWidth={isHere ? 0.8 : 0.5}
              />

              {/* ── Active tile: inner dashed ring */}
              {isHere && (
                <polygon
                  points={hexPts(x, y, drawR - 4)}
                  fill="none"
                  stroke={rc}
                  strokeWidth={0.4}
                  strokeDasharray="2,1.5"
                  opacity={0.6}
                />
              )}

              {/* ── Label (1 or 2 lines, precisely centred) */}
              {(() => {
                const multi   = lines.length > 1;
                const lineH   = 2.1;                    // line-height in SVG units
                const fSize   = isHere ? 1.9 : 1.7;    // 35% smaller
                // Vertical centre of the text block:
                // active tile shifts up to leave room for ◆ below
                const blockCY = isHere ? y - (multi ? 2.2 : 1.5) : y;
                const line1Y  = multi ? blockCY - lineH / 2 : blockCY;
                const line2Y  = blockCY + lineH / 2;
                return (
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fSize}
                    fontFamily="'Courier New', Courier, monospace"
                    fontWeight={isHere ? '700' : '400'}
                    fill={isHere ? '#ffffff' : rc}
                    opacity={isHere ? 1 : 0.75}
                    style={{ pointerEvents: 'none', userSelect: 'none', letterSpacing: '0.2px' }}
                  >
                    <tspan x={x} y={line1Y}>{lines[0]}</tspan>
                    {multi && <tspan x={x} y={line2Y}>{lines[1]}</tspan>}
                  </text>
                );
              })()}

              {/* ── "HERE" sub-label for active tile */}
              {isHere && (
                <text
                  x={x}
                  y={y + 4.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={1.7}
                  fontFamily="'Courier New', Courier, monospace"
                  fill={rc}
                  opacity={0.7}
                  style={{ pointerEvents: 'none', userSelect: 'none', letterSpacing: '0.5px' }}
                >
                  ◆
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── Legend */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 8, color: '#3a3a3a' }}>
        {[['LOW', '#00ff41'], ['MED', '#d4ff00'], ['HIGH', '#ff6b00'], ['MAX', '#ff2222']].map(([l, c]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ color: c, fontSize: 7 }}>⬡</span>
            <span style={{ color: '#444' }}>{l}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
