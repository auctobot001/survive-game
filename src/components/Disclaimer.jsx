import { useState, useEffect } from 'react';

export default function Disclaimer({ onAccept }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('survive_disclaimer_v2');
    if (!seen) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem('survive_disclaimer_v2', '1');
    setVisible(false);
    onAccept?.();
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Courier New", Courier, monospace',
    }}>
      <div style={{
        border: '1px solid #00ff41',
        background: '#0a0a0a',
        padding: '28px 32px',
        maxWidth: 520,
        width: '90%',
        color: '#00ff41',
        boxShadow: '0 0 24px rgba(0,255,65,0.15)',
      }}>
        <div style={{ fontSize: 16, fontWeight: 'bold', letterSpacing: 3, marginBottom: 16, textAlign: 'center' }}>
          ⚠ BEFORE YOU PLAY
        </div>

        <div style={{ fontSize: 12, lineHeight: 1.8, color: '#00cc33' }}>
          <p>
            <span style={{ color: '#00ff41', fontWeight: 'bold' }}>$SURVIVE</span> is a{' '}
            <span style={{ color: '#00d4ff' }}>simulation game</span>.
            All in-game ETH, resources, and prices are{' '}
            <span style={{ color: '#00d4ff' }}>randomly generated</span> each session.
          </p>
          <p style={{ marginTop: 8 }}>
            <span style={{ color: '#ff6b00' }}>No actual cryptocurrency is exchanged</span>{' '}
            during gameplay. Your wallet is never debited.
          </p>
          <p style={{ marginTop: 8 }}>
            <span style={{ color: '#00ff41' }}>Wallet connection</span> is optional and used only to verify your{' '}
            <span style={{ color: '#00d4ff' }}>$SURVIVE token staking tier & booster tokens</span>.
            Higher tiers unlock gameplay features and leaderboard access.
          </p>
          <p style={{ marginTop: 8 }}>
            <span style={{ color: '#00ff41' }}>Onchain leaderboard</span> submissions are real
            Base transactions (tiny gas cost). Your score is recorded permanently.
          </p>
          <p style={{ marginTop: 8, color: '#888', fontSize: 11 }}>
            Agent state (SURVIVE treasury) is read live from Base mainnet.
            NFT rewards for top survivors — coming in a future update.
          </p>
          <p style={{ marginTop: 8, color: '#ff6b00', fontSize: 11 }}>
            Game is in beta. Play at your own risk.
          </p>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            onClick={accept}
            style={{
              background: 'transparent',
              border: '1px solid #00ff41',
              color: '#00ff41',
              fontFamily: 'inherit',
              fontSize: 12,
              padding: '8px 24px',
              cursor: 'pointer',
              letterSpacing: 2,
            }}
          >
            [UNDERSTOOD — START GAME]
          </button>
        </div>
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 10, color: '#444' }}>
          Not financial advice. This is a game.
        </div>
      </div>
    </div>
  );
}
