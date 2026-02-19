import { LOCATIONS } from '../game/constants.js';

// ── Risk colours ──────────────────────────────────────────────────────────────
const RISK_COLORS = {
  LOW:       '#00ff41',
  MEDIUM:    '#ffff00',
  HIGH:      '#ff6b00',
  VERY_HIGH: '#ff0000',
};

// ── Short display labels ──────────────────────────────────────────────────────
const SHORT_LABELS = {
  TESTNET:         'TEST',
  UNISWAP:         'UNI',
  ONCHAIN_SF:      'SF',
  SEPOLIA:         'SEP',
  NFT_PARIS:       'PARIS',
  ETH_DENVER:      'DENVR',
  STOWE:           'STOWE',
  ART_BASEL_MIAMI: 'MIAMI',
};

// ── Hex geometry (flat-top) ───────────────────────────────────────────────────
const HEX_R       = 21;
const SQRT3       = Math.sqrt(3);
const COL_SPACING = SQRT3 * HEX_R;       // ≈ 36.37
const ROW_SPACING = HEX_R * 1.5;         // 31.5
const ODD_OFFSET  = COL_SPACING / 2;     // ≈ 18.19
const PAD         = 3;                   // edge padding

/**
 * Grid positions [locId, col, row].
 * Row 1 is offset (odd → shift right by half a column width).
 *
 *   Row 0: TEST  UNI   SF
 *   Row 1:   SEP  PARIS  DENVR
 *   Row 2: STOWE MIAMI
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

function hexCenter(col, row) {
  const x = col * COL_SPACING + (row % 2 === 1 ? ODD_OFFSET : 0) + HEX_R + PAD;
  const y = row * ROW_SPACING + HEX_R + PAD;
  return { x, y };
}

/** Returns the SVG polygon `points` string for a flat-top hexagon centred at (cx, cy). */
function hexPoints(cx, cy, r = HEX_R) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i;          // 0°, 60°, 120°, 180°, 240°, 300°
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HexMap({ currentLocation, onTravel, gasSpike }) {
  // Compute SVG canvas size from the furthest hex centre
  const svgW = GRID.reduce((m, [, col, row]) => Math.max(m, hexCenter(col, row).x + HEX_R + PAD), 0);
  const svgH = GRID.reduce((m, [, col, row]) => Math.max(m, hexCenter(col, row).y + HEX_R + PAD), 0);

  return (
    <div>
      <div className="section-label">
        MAP{gasSpike ? <span className="c-orange" style={{ marginLeft: 4 }}>[GAS 3×]</span> : null}
      </div>

      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        style={{ display: 'block' }}
        aria-label="Location map"
      >
        {GRID.map(([locId, col, row]) => {
          const loc      = LOCATIONS[locId];
          const { x, y } = hexCenter(col, row);
          const pts       = hexPoints(x, y);
          const isHere    = locId === currentLocation;
          const riskColor = RISK_COLORS[loc?.risk] || '#00ff41';
          const label     = SHORT_LABELS[locId] || locId;

          // Active tile: filled + white border + inner dashed ring
          // Inactive tile: transparent + risk-coloured border
          const stroke      = isHere ? '#ffffff' : riskColor;
          const fill        = isHere ? `${riskColor}33` : '#050505';
          const strokeW     = isHere ? 1.5 : 0.8;
          const textColor   = isHere ? '#ffffff' : riskColor;
          const fontSize    = label.length > 4 ? 5.5 : 6.5;

          return (
            <g
              key={locId}
              style={{ cursor: isHere ? 'default' : 'pointer' }}
              onClick={() => !isHere && onTravel?.(locId)}
            >
              {/* Hex body */}
              <polygon
                points={pts}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeW}
              />

              {/* Inner dashed ring for current location */}
              {isHere && (
                <polygon
                  points={hexPoints(x, y, HEX_R - 5)}
                  fill="none"
                  stroke={riskColor}
                  strokeWidth={0.8}
                  strokeDasharray="3,2"
                  opacity={0.7}
                />
              )}

              {/* Location label */}
              <text
                x={x}
                y={isHere ? y - 3 : y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isHere ? fontSize + 0.5 : fontSize}
                fontFamily="monospace"
                fontWeight={isHere ? 'bold' : 'normal'}
                fill={textColor}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {label}
              </text>

              {/* "HERE" sub-label for active tile */}
              {isHere && (
                <text
                  x={x}
                  y={y + 7}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={4.5}
                  fontFamily="monospace"
                  fill="#aaaaaa"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  HERE
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 8, marginTop: 3 }}>
        {[['LOW', '#00ff41'], ['MED', '#ffff00'], ['HIGH', '#ff6b00'], ['EXTREME', '#ff0000']].map(([label, color]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#555' }}>
            <span style={{ color, fontSize: 9 }}>■</span>
            {label}
          </span>
        ))}
        <span style={{ color: '#444', marginLeft: 'auto' }}>click to travel</span>
      </div>
    </div>
  );
}
