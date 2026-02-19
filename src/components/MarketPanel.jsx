import { useState } from 'react';
import { RESOURCES } from '../game/constants.js';

const RESOURCE_LABELS = {
  COMPUTE:    'COMPUTE',
  LIQUIDITY:  'LIQUIDITY',
  SIGNAL:     'SIGNAL',
  DATA:       'DATA',
  REPUTATION: 'REPUTATION',
  CLANKER:    'CLANKER',
  BANKR:      'BANKR',
  BASE:       'BASE',
};

export default function MarketPanel({ prices, inventory, eth, dispatch, agentTier, stakingTier, ruggedResource, diamondResource }) {
  const [active, setActive] = useState(null); // { type: 'BUY'|'SELL', resource, qty }

  const canTradeReputation = ['CREW', 'OPERATOR', 'WHALE', 'GOD_MODE'].includes(stakingTier);

  function openAction(type, resource) {
    if (active?.type === type && active?.resource === resource) {
      setActive(null);
      return;
    }
    setActive({ type, resource, qty: 1 });
  }

  function confirm() {
    if (!active) return;
    const qty = parseInt(active.qty, 10);
    if (!qty || qty < 1) return;
    dispatch({ type: active.type, resource: active.resource, quantity: qty, agentTier });
    setActive(null);
  }

  function handleKey(e) {
    if (e.key === 'Enter') confirm();
    if (e.key === 'Escape') setActive(null);
  }

  return (
    <div>
      <div className="section-label">MARKET PRICES — {active ? `${active.type} MODE` : 'LIVE'}</div>

      {RESOURCES.map(resource => {
        const price    = prices[resource] ?? 0;
        const rugged   = ruggedResource === resource;
        const diamond  = diamondResource === resource;
        const locked   = resource === 'REPUTATION' && !canTradeReputation;
        const isActive = active?.resource === resource;

        let priceColor = 'var(--green)';
        if (rugged)  priceColor = 'var(--red)';
        if (diamond) priceColor = 'var(--yellow)';

        return (
          <div key={resource} style={{ marginBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Resource name */}
              <span style={{ width: 90, color: locked ? 'var(--dim)' : 'var(--green)' }}>
                {RESOURCE_LABELS[resource]}
              </span>

              {/* Price */}
              <span style={{ width: 80, color: priceColor, textAlign: 'right' }}>
                {locked
                  ? '░░░░░░░░'
                  : rugged
                    ? '0.000000'
                    : price.toFixed(6)}
              </span>

              {/* Flags */}
              {diamond && <span className="c-yellow" style={{ fontSize: 10 }}>[2X]</span>}
              {rugged  && <span className="c-red"    style={{ fontSize: 10 }}>[RUG]</span>}

              {/* Buy/Sell buttons */}
              {locked ? (
                <span className="c-dim" style={{ fontSize: 10, marginLeft: 4 }}>CREW REQUIRED</span>
              ) : (
                <>
                  <button
                    className={`btn ${isActive && active.type === 'BUY' ? 'btn-cyan' : ''}`}
                    style={{ marginLeft: 4 }}
                    onClick={() => openAction('BUY', resource)}
                    disabled={rugged || price === 0}
                  >B</button>
                  <button
                    className={`btn ${isActive && active.type === 'SELL' ? 'btn-orange' : ''}`}
                    onClick={() => openAction('SELL', resource)}
                    disabled={inventory[resource] === 0}
                  >S</button>
                  <span className="c-dim" style={{ fontSize: 10, marginLeft: 4 }}>
                    [{inventory[resource] ?? 0}]
                  </span>
                </>
              )}
            </div>

            {/* Inline quantity input */}
            {isActive && (
              <div style={{ paddingLeft: 90, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: active.type === 'BUY' ? 'var(--cyan)' : 'var(--orange)', fontSize: 11 }}>
                  {active.type} qty:
                </span>
                <input
                  className="term-input"
                  type="number"
                  min="1"
                  max={active.type === 'SELL' ? inventory[resource] : 9999}
                  value={active.qty}
                  onChange={e => setActive(a => ({ ...a, qty: e.target.value }))}
                  onKeyDown={handleKey}
                  autoFocus
                />
                {active.type === 'BUY' && (
                  <span className="c-dim" style={{ fontSize: 10 }}>
                    cost: {(price * (parseInt(active.qty) || 0)).toFixed(6)} ETH
                  </span>
                )}
                {active.type === 'SELL' && (
                  <span className="c-dim" style={{ fontSize: 10 }}>
                    earn: {(price * (parseInt(active.qty) || 0)).toFixed(6)} ETH
                  </span>
                )}
                <button
                  className={`btn ${active.type === 'BUY' ? 'btn-cyan' : 'btn-orange'}`}
                  onClick={confirm}
                >OK</button>
                <button className="btn" onClick={() => setActive(null)}>X</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
