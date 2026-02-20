import { useEffect, useState } from 'react';
import { LOCATIONS, LOCATION_LIST, AGENT_TIERS, STAKING_TIERS } from '../game/constants.js';
import { getNetEth } from '../game/engine.js';

// Mirrors the RISK_PREMIUM table in market.js — display only
const RISK_PREMIUM_LABEL = {
  LOW:       null,
  MEDIUM:    { label: '+20%',  color: '#d4ff00' },
  HIGH:      { label: '+55%',  color: '#ff6b00' },
  VERY_HIGH: { label: '+100%', color: '#ff2222' },
};
import MarketPanel from './MarketPanel.jsx';
import Sidebar from './Sidebar.jsx';
import EventLog from './EventLog.jsx';
import NewsTicker from './NewsTicker.jsx';

export default function Terminal({
  game,
  dispatch,
  agentTier,
  agentEth,
  stakingTier,
  balanceFormatted,
  botchanFeed,
  botchanLoading,
  botchanOnline,
  address,
  isConnected,
  onConnect,
  onDisconnect,
  onPost,
  onWhaleAction,
  onGodMode,
  tickerPrices = {},
  tickerTrend  = {},
}) {
  const [showInfo, setShowInfo] = useState(false);
  const netEth    = getNetEth(game);
  const canEscape = netEth > 0;
  const tierInfo  = AGENT_TIERS[agentTier] || AGENT_TIERS.NORMAL;

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const k = e.key.toLowerCase();

      if (k >= '1' && k <= '8') {
        const idx = parseInt(k, 10) - 1;
        const dest = LOCATION_LIST[idx];
        if (dest) dispatch({ type: 'TRAVEL', destination: dest, agentTier });
      }
      if (k === 'e') {
        dispatch({ type: 'ESCAPE', agentTier });
      }
      if (k === 'p') {
        dispatch({ type: 'END_TURN', agentTier });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dispatch, agentTier]);

  const sinkingClass = game.islandSinking && game.location === 'SURVIVE_ISLAND' ? 'island-sinking' : '';

  return (
    <div className={`terminal-root ${sinkingClass}`}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="terminal-box terminal-header">
        <span className="glow" style={{ fontWeight: 'bold', fontSize: 14, letterSpacing: 2 }}>
          $survive:{' '}
          <span className="c-cyan">
            #{balanceFormatted || '0'}
          </span>
        </span>
        <span>
          TURN{' '}
          <span className="c-cyan">{String(game.turn).padStart(2, '0')}</span>
          /30
        </span>
        <span>
          AGENT:{' '}
          <span style={{ color: tierInfo.color }} className={agentTier === 'DEAD' ? 'blink' : ''}>
            {tierInfo.label}
          </span>{' '}
          <span style={{ color: tierInfo.color }} className="blink">●</span>
        </span>
        {game.islandSinking && (
          <span className="c-red glow-red">
            [ISLAND SINKS IN {game.sinkTimer}T]
          </span>
        )}
        {game.currentEvent && (
          <span className="c-orange">
            [{game.currentEvent.replace(/_/g, ' ')}]
          </span>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="terminal-box terminal-body" style={{ flex: 1 }}>
        {/* Left panel */}
        <div className="terminal-left">
          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <span className="c-dim">LOC: </span>
              <span className="c-cyan">{LOCATIONS[game.location]?.display || game.location}</span>
            </div>
            <div>
              <span className="c-dim">ETH: </span>
              <span className="c-green">{game.eth.toFixed(4)}</span>
            </div>
            <div>
              <span className="c-dim">DEBT: </span>
              <span className="c-orange">{game.debt.toFixed(4)}</span>
            </div>
            <div>
              <span className="c-dim">NET: </span>
              <span className={netEth > 0 ? 'c-cyan' : 'c-red'}>
                {netEth.toFixed(4)}
              </span>
            </div>
            {/* Risk premium badge */}
            {(() => {
              const p = RISK_PREMIUM_LABEL[LOCATIONS[game.location]?.risk];
              return p ? (
                <span style={{ color: p.color, fontSize: 11 }} title="All sell prices boosted at this location">
                  [PREMIUM {p.label}]
                </span>
              ) : null;
            })()}
            {game.gasSpike && (
              <span className="c-orange" style={{ fontSize: 11 }}>[GAS SPIKE 3x]</span>
            )}
          </div>

          {/* Location flavor */}
          <div className="c-dim" style={{ fontSize: 11 }}>
            {LOCATIONS[game.location]?.flavor}
          </div>

          <div className="section-divider" />

          {/* Market */}
          <MarketPanel
            prices={game.prices}
            inventory={game.inventory}
            eth={game.eth}
            dispatch={dispatch}
            agentTier={agentTier}
            stakingTier={stakingTier}
            ruggedResource={game.ruggedResource}
            diamondResource={game.diamondResource}
          />

          {/* Market Ticker — read-only price feed */}
          <div style={{ marginTop: 6 }}>
            <div className="section-label" style={{ fontSize: 10, marginBottom: 2 }}>
              MARKET PRICES — LIVE FEED
            </div>
            {['CLANKER', 'BANKR'].map(ticker => {
              const price = tickerPrices[ticker];
              const t = tickerTrend[ticker];
              const arrow = t > 0 ? '▲' : t < 0 ? '▼' : '─';
              const arrowColor = t > 0 ? 'var(--green)' : t < 0 ? 'var(--red)' : 'var(--dim)';
              return (
                <div key={ticker} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1, fontSize: 12 }}>
                  <span className="c-dim" style={{ width: 90 }}>{ticker}</span>
                  <span className="c-cyan">
                    {price != null ? price.toFixed(6) : '—'}
                  </span>
                  <span style={{ color: arrowColor, fontSize: 10 }}>{arrow}</span>
                  <span className="c-dim" style={{ fontSize: 10 }}>[READ ONLY]</span>
                </div>
              );
            })}
          </div>

          <div className="section-divider" />

          {/* Travel */}
          <div>
            <div className="section-label">
              TRAVEL TO: {game.gasSpike ? <span className="c-orange">[GAS 3x]</span> : null}
            </div>
            {LOCATION_LIST.map((locId, idx) => {
              const loc      = LOCATIONS[locId];
              const here      = locId === game.location;
              const locked    = false;
              const isSinking = game.islandSinking && here;

              return (
                <div key={locId} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                  <button
                    className={`btn ${here ? 'btn-cyan' : ''} ${locked ? '' : ''}`}
                    style={{ minWidth: 22, fontSize: 11 }}
                    onClick={() => !here && !locked && dispatch({ type: 'TRAVEL', destination: locId, agentTier })}
                    disabled={here || locked}
                  >
                    {idx + 1}
                  </button>
                  <span style={{
                    color: locked ? 'var(--red)'
                      : here ? 'var(--cyan)'
                      : isSinking ? 'var(--orange)'
                      : 'var(--green)',
                    fontSize: 12,
                  }}>
                    {loc.display}
                    {here && ' ◀ (here)'}
                    {locked && ' [LOCKED — AGENT DEAD]'}
                    {isSinking && ` [SINKING: ${game.sinkTimer}T]`}
                  </span>
                  <span className="c-dim" style={{ fontSize: 10 }}>
                    {loc.risk}
                  </span>
                  {(() => {
                    const p = RISK_PREMIUM_LABEL[loc.risk];
                    return p ? (
                      <span style={{ fontSize: 10, color: p.color }}>{p.label}</span>
                    ) : null;
                  })()}
                </div>
              );
            })}
          </div>

          <div className="section-divider" />

          {/* Escape + Pass */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className={`btn btn-large ${canEscape ? 'btn-cyan' : ''}`}
              onClick={() => dispatch({ type: 'ESCAPE', agentTier })}
              disabled={!canEscape}
              title={canEscape ? 'Escape with profit' : `Need NET > 0 (currently ${netEth.toFixed(4)})`}
            >
              [ESCAPE]
            </button>
            <span className="c-dim" style={{ fontSize: 10 }}>
              {canEscape
                ? `NET: ${netEth.toFixed(4)} ETH — ready to escape`
                : `NET: ${netEth.toFixed(4)} — must be > 0`}
            </span>
            <button
              className="btn"
              style={{ fontSize: 10 }}
              onClick={() => dispatch({ type: 'END_TURN', agentTier })}
              title="Pass this turn (P)"
            >
              [PASS]
            </button>
          </div>

          {/* Keyboard hint */}
          <div className="c-dim" style={{ fontSize: 10, marginTop: 2 }}>
            Keys: 1-8 travel · B buy · S sell · E escape · P pass
          </div>
        </div>

        {/* Right panel */}
        <div className="terminal-right">
          <Sidebar
            agentEth={agentEth}
            agentTier={agentTier}
            stakingTier={stakingTier}
            balanceFormatted={balanceFormatted}
            inventory={game.inventory}
            botchanFeed={botchanFeed}
            botchanLoading={botchanLoading}
            botchanOnline={botchanOnline}
            address={address}
            isConnected={isConnected}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            onPost={onPost}
            onWhaleAction={onWhaleAction}
            onGodMode={onGodMode}
            game={game}
            dispatch={dispatch}
          />
        </div>
      </div>

      {/* ── Footer / Event log ─────────────────────────────────── */}
      <div className="terminal-box terminal-footer">
        <EventLog log={game.eventLog} />
      </div>

      {/* ── News ticker ────────────────────────────────────────── */}
      <NewsTicker feed={botchanFeed} online={botchanOnline} />

      {/* ── INFO button ────────────────────────────────────────── */}
      <button
        className="btn"
        onClick={() => setShowInfo(true)}
        style={{ position: 'fixed', bottom: 36, right: 12, fontSize: 10, zIndex: 100 }}
      >
        [INFO]
      </button>

      {/* ── INFO modal ─────────────────────────────────────────── */}
      {showInfo && (
        <div
          onClick={() => setShowInfo(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#050f05', border: '1px solid #00ff41', padding: '20px 24px',
              fontFamily: "'Courier New', monospace", color: '#00ff41', fontSize: 12,
              maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: 15, letterSpacing: 3 }}>SURVIVE - CRYPTO</div>
            <div style={{ fontWeight: 'bold', fontSize: 12, letterSpacing: 2, marginBottom: 12, color: '#aaa' }}>HOW TO PLAY</div>

            <div style={{ marginBottom: 14, color: '#aaa', lineHeight: 1.7 }}>
              Survive on Base. Trade 6 resources across 8 locations over 30 turns.
              Escape with NET ETH &gt; 0 to win. The agent treasury must stay alive.
            </div>

            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>STAKING TIERS</div>
            {[
              ['GRIFTER',  '0+',          'Play but no leaderboard.'],
              ['SHILL',    '1,000+',       'Submit scores to leaderboard.'],
              ['FARMER',   '10,000+',      'Unlock insider tip events + REPUTATION trading.'],
              ['MFER',     '100,000+',     'Post votes via botchan.'],
              ['WHALE',    '500,000+',     'Send 0.001 ETH to treasury.'],
              ['GOD MODE', '1,000,000+',   'Name a child agent via botchan.'],
            ].map(([label, bal, desc]) => (
              <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ width: 82, color: '#00d4ff' }}>{label}</span>
                <span style={{ color: '#555', width: 78 }}>{bal}</span>
                <span style={{ color: '#aaa' }}>{desc}</span>
              </div>
            ))}

            <div style={{ fontWeight: 'bold', margin: '14px 0 8px' }}>IN-GAME TOKEN BOOSTS</div>
            <div style={{ color: '#aaa', marginBottom: 4 }}>
              Hold any amount in your connected wallet:
            </div>
            {[
              ['$CLANKER',     'https://www.clanker.world/clanker/0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb'],
              ['$BNKR',        'https://www.clanker.world/clanker/0x22aF33FE49fD1Fa80c7149773dDe5890D3c76F3b'],
              ['$DRB',         'https://dexscreener.com/base/0x3ec2156d4c0a9cbdab4a016633b7bcf6a8d68ea2'],
              ['$DIMES',       'https://dexscreener.com/base/0x17d70172C7C4205bd39ce80F7f0ee660B7Dc5A23'],
              ['$auctobot001', 'https://www.clanker.world/clanker/0x30e187bB79D539db798c66F4d37183491405Cb07'],
              ['$clawnch',     'https://dexscreener.com/base/0xa1f72459dfa10bad200ac160ecd78c6b77a747be'],
            ].map(([name, url]) => (
              <div key={name} style={{ marginBottom: 3 }}>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#00d4ff', textDecoration: 'none' }}
                  onMouseOver={e => e.target.style.textDecoration = 'underline'}
                  onMouseOut={e => e.target.style.textDecoration = 'none'}
                >{name}</a>
              </div>
            ))}

            <div style={{ fontWeight: 'bold', margin: '14px 0 8px' }}>KEYBOARD SHORTCUTS</div>
            <div style={{ color: '#aaa', lineHeight: 1.9 }}>
              1–8 &nbsp; Travel to location<br />
              B &nbsp;&nbsp;&nbsp; Buy selected resource<br />
              S &nbsp;&nbsp;&nbsp; Sell selected resource<br />
              E &nbsp;&nbsp;&nbsp; Escape (if NET &gt; 0)<br />
              P &nbsp;&nbsp;&nbsp; Pass turn
            </div>

            <button
              className="btn btn-cyan"
              onClick={() => setShowInfo(false)}
              style={{ marginTop: 16, fontSize: 11 }}
            >
              [CLOSE]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
