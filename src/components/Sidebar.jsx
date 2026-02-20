import { useState } from 'react';
import { useReadContracts, useAccount } from 'wagmi';
import { erc20Abi } from 'viem';
import { AGENT_TIERS, STAKING_TIERS, RESOURCES } from '../game/constants.js';
import Leaderboard from './Leaderboard.jsx';
import HexMap from './HexMap.jsx';

const BOOST_TOKENS = [
  { name: '$CLANKER',     address: '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb', url: 'https://www.clanker.world/clanker/0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb' },
  { name: '$BNKR',        address: '0x22aF33FE49fD1Fa80c7149773dDe5890D3c76F3b', url: 'https://www.clanker.world/clanker/0x22aF33FE49fD1Fa80c7149773dDe5890D3c76F3b' },
  { name: '$DRB',         address: '0x3ec2156d4c0a9cbdab4a016633b7bcf6a8d68ea2', url: 'https://dexscreener.com/base/0x3ec2156d4c0a9cbdab4a016633b7bcf6a8d68ea2' },
  { name: '$DIMES',       address: '0x17d70172C7C4205bd39ce80F7f0ee660B7Dc5A23', url: 'https://dexscreener.com/base/0x17d70172C7C4205bd39ce80F7f0ee660B7Dc5A23' },
  { name: '$auctobot001', address: '0x30e187bB79D539db798c66F4d37183491405Cb07', url: 'https://www.clanker.world/clanker/0x30e187bB79D539db798c66F4d37183491405Cb07' },
  { name: '$clawnch',     address: '0xa1f72459dfa10bad200ac160ecd78c6b77a747be', url: 'https://dexscreener.com/base/0xa1f72459dfa10bad200ac160ecd78c6b77a747be' },
  { name: '$alpha',       address: '0x3D01Fe5A38ddBD307fDd635b4Cb0e29681226D6f', url: 'https://dexscreener.com/base/0x3D01Fe5A38ddBD307fDd635b4Cb0e29681226D6f' },
  { name: '$botchan',     address: '0xD77d781921A33793a46e5bb6a7bb52edb7DbBb07', url: 'https://dexscreener.com/base/0xD77d781921A33793a46e5bb6a7bb52edb7DbBb07' },
  { name: '$🟩🦞',        address: '0x00BB032296e0C580E21010a5a6A4E007E0953E68', url: 'https://dexscreener.com/base/0x00BB032296e0C580E21010a5a6A4E007E0953E68' },
];

function useBoostTokenBalances() {
  const { address, isConnected } = useAccount();
  const { data } = useReadContracts({
    contracts: BOOST_TOKENS.map(t => ({
      address: t.address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
      chainId: 8453, // Base mainnet
    })),
    query: { enabled: isConnected && !!address },
  });
  const held = BOOST_TOKENS.map((_, i) => {
    const result = data?.[i];
    return result?.status === 'success' && result.result > 0n;
  });
  return { held, isConnected, address };
}

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
  dispatch,
}) {
  const [transmitMsg, setTransmitMsg] = useState('');
  const [godInput, setGodInput]       = useState('');
  const [tab, setTab]                 = useState('status'); // 'status' | 'leaderboard'
  const { held: boostHeld, isConnected: walletConnected } = useBoostTokenBalances();

  // Use game.agentTier (eth-derived) for agent status — reflects buy/sell in real time
  const tierInfo    = AGENT_TIERS[game?.agentTier || agentTier] || AGENT_TIERS.NORMAL;
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
              <span style={{ color: tierInfo.color }} className={game?.agentTier === 'DEAD' ? 'blink' : ''}>
                {tierInfo.label}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="c-dim">Compute:</span>
              <span style={{ color: tierInfo.color }}>
                {game?.eth != null ? game.eth.toFixed(4) : (agentEth != null ? agentEth.toFixed(4) : '...')} ETH
              </span>
            </div>
            {game?.agentTier === 'LOW_COMPUTE' && (
              <div className="c-yellow" style={{ fontSize: 10, marginTop: 2 }}>
                Compute depleting — buy resources wisely.
              </div>
            )}
            {game?.agentTier === 'CRITICAL' && (
              <div className="c-orange glow-orange" style={{ fontSize: 10, marginTop: 2 }}>
                CRITICAL: Island destabilizing. Evacuate.
              </div>
            )}
            {game?.agentTier === 'DEAD' && (
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

          {/* Inventory + Token boosts */}
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Left: resource inventory */}
            <div style={{ flex: '0 0 auto' }}>
              <div className="section-label">INVENTORY</div>
              {RESOURCES.map(r => (
                <div key={r} style={{ display: 'flex', gap: 6, fontSize: 12 }}>
                  <span className="c-dim">{r}:</span>
                  <span className={inventory[r] > 0 ? 'c-green' : 'c-dim'}>
                    {inventory[r] ?? 0}
                  </span>
                </div>
              ))}
            </div>

            {/* Right: token boost links */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="section-label">TOKENS</div>
              {BOOST_TOKENS.map((t, i) => {
                const held = boostHeld[i];
                const color = walletConnected ? (held ? '#00ff41' : '#ff2222') : '#00d4ff';
                return (
                  <div key={t.name} style={{ fontSize: 11, marginBottom: 1 }}>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color, textDecoration: 'none' }}
                      onMouseOver={e => e.target.style.textDecoration = 'underline'}
                      onMouseOut={e => e.target.style.textDecoration = 'none'}
                    >{t.name}</a>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section-divider" />

          {/* Hex map */}
          {game && (
            <HexMap
              currentLocation={game.location}
              onTravel={dispatch
                ? (dest) => dispatch({ type: 'TRAVEL', destination: dest, agentTier })
                : undefined
              }
              gasSpike={game.gasSpike}
            />
          )}

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
