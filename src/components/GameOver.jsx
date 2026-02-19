import { useState } from 'react';

const WIN_ART = `
  ██████████████
██░░░░░░░░░░░░░░██
██░░██░░░░░░██░░██
██░░░░░░░░░░░░░░██
██░░██░░░░░░██░░██
██░░░░██████░░░░██
  ██████████████
    ██      ██
`;

const DEAD_ART = `
  ████████████
██░░░░░░░░░░░░██
██░░██░░░░██░░██
██░░░░░░░░░░░░██
██░░██░░░░██░░██
██░░░░████░░░░██
  ████████████
  ██  ████  ██
`;

export default function GameOver({ gameStatus, finalScore, onNewGame, onSubmit, canSubmit, address }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const won = gameStatus === 'won';
  const score = Number(finalScore ?? 0);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(score);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="gameover-root terminal-box" style={{ margin: 6, justifyContent: 'center' }}>

      {/* ASCII art */}
      <div className={`skull-art ${won ? 'c-cyan glow-cyan' : 'c-red glow-red'}`} style={{ fontSize: 11 }}>
        <pre>{won ? WIN_ART : DEAD_ART}</pre>
      </div>

      {/* Result */}
      <div style={{ textAlign: 'center' }}>
        <div className={`glow ${won ? 'c-cyan' : 'c-red'}`} style={{ fontSize: 22, fontWeight: 'bold', letterSpacing: 4 }}>
          {won ? '*** YOU ESCAPED ***' : '*** GAME OVER ***'}
        </div>
        <div style={{ marginTop: 6, color: 'var(--green)', fontSize: 14 }}>
          SIMULATED NET:{' '}
          {won
            ? <span className="c-cyan">{score.toFixed(6)} ETH</span>
            : <span className="c-red">{score.toFixed(6)} ETH</span>
          }
        </div>
        <div style={{ color: 'var(--dim)', fontSize: 10, marginTop: 3 }}>
          ⚠ In-game ETH is simulated. No real crypto was exchanged.
        </div>
        {won && (
          <div style={{ color: 'var(--dim)', fontSize: 11, marginTop: 4 }}>
            You navigated the protocol. The island remembers.
          </div>
        )}
        {!won && (
          <div style={{ color: 'var(--dim)', fontSize: 11, marginTop: 4 }}>
            The markets claimed you. The agent watches, indifferent.
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
        <button className="btn btn-large c-green" onClick={onNewGame}>
          [NEW GAME]
        </button>

        {canSubmit && won && !submitted && (
          <button className="btn btn-large btn-cyan" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '[SIGNING + POSTING...]' : '[POST SCORE ONCHAIN]'}
          </button>
        )}

        {submitted && (
          <span className="c-cyan" style={{ fontSize: 12, alignSelf: 'center' }}>
            ✓ Score posted to Base via botchan. Permanently onchain.
          </span>
        )}

        {!canSubmit && won && !address && (
          <span className="c-dim" style={{ fontSize: 11, alignSelf: 'center' }}>
            Connect wallet + hold 1,000 $SURVIVE (DRIFTER) to post score onchain.
          </span>
        )}

        {!canSubmit && won && address && (
          <span className="c-dim" style={{ fontSize: 11, alignSelf: 'center' }}>
            Need 1,000+ $SURVIVE to post score onchain.
          </span>
        )}
      </div>

      {/* Wallet */}
      {address && (
        <div style={{ color: 'var(--dim)', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
          Verified wallet: {address.slice(0, 6)}…{address.slice(-4)}
          {' '}(read-only — used to verify $SURVIVE staking tier only)
        </div>
      )}

      {/* NFT teaser */}
      <div style={{
        marginTop: 16,
        border: '1px solid #333',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--dim)',
        maxWidth: 400,
      }}>
        <div style={{ color: '#00d4ff', marginBottom: 4, letterSpacing: 2 }}>
          [COMING SOON] SURVIVOR NFT
        </div>
        Top players each season will mint a{' '}
        <span style={{ color: 'var(--green)' }}>$SURVIVE Survivor NFT</span>{' '}
        on Base. Proof you escaped the island.
        <br />
        <span style={{ fontSize: 10, color: '#444', marginTop: 4, display: 'block' }}>
          NFT minting unlocks in a future update.
        </span>
      </div>

    </div>
  );
}
