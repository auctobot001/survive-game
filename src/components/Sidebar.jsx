import { useState } from 'react';
import { AGENT_TIERS, STAKING_TIERS, RESOURCES } from '../game/constants.js';
import Leaderboard from './Leaderboard.jsx';

export default function Sidebar({
  agentEth,
  agentTier,
  stakingTier,
  balanceFormatted,
  inventory,
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
  game,
}) {
  const [transmitMsg, setTransmitMsg] = useState('');
  const [godInput, setGodInput]       = useState('');
  const [tab, setTab]                 = useState('status'); // 'status' | 'leaderboard'

  const tierInfo    = AGENT_TIERS[agentTier] || AGENT_TIERS.NORMAL;
  const stakingInfo = STAKING_TIERS[stakingTier] || STAKING_TIERS.SPECTATOR;

  const netEth = game
    ? (game.eth + Object.entries(game.inventory).reduce((s, [r, q]) => s + q * (game.prices[r] || 0), 0) - game.debt)
    : 0;

  async function handleTransmit() {
    if (!transmitMsg.trim()) return;
    await onPost('survive-game', transmitMsg, { score: netEth, turn: game?.turn });
    setTransmitMsg('');
  }

  async function handleGodMode() {
    if (!godInput.trim()) return;
    await onPost('survive-game', `AGENT NAME: ${godInput}`, { type: 'name_agent', name: godInput });
    setGodInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button className={`btn ${tab === 'status' ? 'btn-cyan' : ''}`} onClick={() => setTab('status')} style={{ fontSize: 11 }}>
          STATUS
        </button>
        <button className={`btn ${tab === 'leaderboard' ? 'btn-cyan' : ''}`} onClick={() => setTab('leaderboard')} style={{ fontSize: 11 }}>
          BOARD
        </button>
      </div>

      {tab === 'status' && (
        <>
          {/* Agent status */}
          <div>
            <div className="section-label">AGENT STATUS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="c-dim">Tier:</span>
              <span style={{ color: tierInfo.color }} className={agentTier === 'DEAD' ? 'blink' : ''}>
                {tierInfo.label}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="c-dim">Treasury:</span>
              <span style={{ color: tierInfo.color }}>
                {agentEth !== null ? agentEth.toFixed(6) : '...'} ETH
              </span>
            </div>
            {agentTier === 'LOW_COMPUTE' && (
              <div className="c-yellow" style={{ fontSize: 10, marginTop: 2 }}>
                Something is consuming the agent's compute...
              </div>
            )}
            {agentTier === 'CRITICAL' && (
              <div className="c-orange glow-orange" style={{ fontSize: 10, marginTop: 2 }}>
                CRITICAL: Island destabilizing. Evacuate.
              </div>
            )}
            {agentTier === 'DEAD' && (
              <div className="c-red glow-red blink" style={{ fontSize: 10, marginTop: 2 }}>
                AGENT DEAD. SURVIVE_ISLAND LOCKED.
              </div>
            )}
          </div>

          <div className="section-divider" />

          {/* Wallet / staking tier */}
          <div>
            <div className="section-label">YOUR TIER</div>
            {isConnected ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="c-dim">Wallet:</span>
                  <span className="c-cyan" style={{ fontSize: 11 }}>
                    {address?.slice(0, 6)}…{address?.slice(-4)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="c-dim">$SURVIVE:</span>
                  <span className="c-green">{balanceFormatted}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="c-dim">Tier:</span>
                  <span className="c-cyan">{stakingInfo.label}</span>
                </div>
                <div className="c-dim" style={{ fontSize: 10, marginTop: 2 }}>
                  {stakingInfo.desc}
                </div>
                <button className="btn" style={{ fontSize: 10, marginTop: 4 }} onClick={onDisconnect}>
                  [disconnect]
                </button>
              </>
            ) : (
              <>
                <div className="c-dim" style={{ fontSize: 11 }}>Not connected</div>
                <div className="c-dim" style={{ fontSize: 10 }}>Connect wallet for tier perks.</div>
                <button className="btn btn-cyan" style={{ marginTop: 4 }} onClick={onConnect}>
                  [CONNECT WALLET]
                </button>
              </>
            )}
          </div>

          <div className="section-divider" />

          {/* Inventory */}
          <div>
            <div className="section-label">INVENTORY</div>
            {RESOURCES.map(r => (
              <div key={r} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span className="c-dim">{r}:</span>
                <span className={inventory[r] > 0 ? 'c-green' : 'c-dim'}>
                  {inventory[r] ?? 0}
                </span>
              </div>
            ))}
          </div>

          {/* Botchan OPERATOR+ transmit */}
          {isConnected && ['OPERATOR', 'WHALE', 'GOD_MODE'].includes(stakingTier) && (
            <>
              <div className="section-divider" />
              <div>
                <div className="section-label">TRANSMIT</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <input
                    className="term-input"
                    style={{ width: 120, fontSize: 11 }}
                    placeholder="message..."
                    value={transmitMsg}
                    onChange={e => setTransmitMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTransmit()}
                  />
                  <button className="btn btn-cyan" style={{ fontSize: 10 }} onClick={handleTransmit}>
                    POST
                  </button>
                </div>
                <div className="c-dim" style={{ fontSize: 10, marginTop: 2 }}>
                  {botchanOnline ? 'botchan online' : 'botchan offline'}
                </div>
              </div>
            </>
          )}

          {/* WHALE: send ETH to treasury */}
          {isConnected && ['WHALE', 'GOD_MODE'].includes(stakingTier) && (
            <>
              <div className="section-divider" />
              <div>
                <div className="section-label">WHALE OPS</div>
                <button className="btn btn-yellow" style={{ fontSize: 11 }} onClick={onWhaleAction}>
                  [SEND 0.001 ETH → TREASURY]
                </button>
              </div>
            </>
          )}

          {/* GOD MODE: name child agent */}
          {isConnected && stakingTier === 'GOD_MODE' && (
            <>
              <div className="section-divider" />
              <div>
                <div className="section-label">GOD MODE</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    className="term-input"
                    style={{ width: 100, fontSize: 11 }}
                    placeholder="agent name..."
                    value={godInput}
                    onChange={e => setGodInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGodMode()}
                  />
                  <button className="btn btn-yellow" style={{ fontSize: 10 }} onClick={handleGodMode}>
                    NAME
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'leaderboard' && (
        <Leaderboard feed={botchanFeed} loading={botchanLoading} online={botchanOnline} />
      )}

      {/* Persistent disclaimer */}
      <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #1a1a1a', fontSize: 9, color: '#333', lineHeight: 1.5 }}>
        All in-game ETH is simulated.<br />
        No real crypto exchanged.<br />
        Wallet verifies $SURVIVE tier only.
      </div>
    </div>
  );
}
