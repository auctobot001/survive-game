import { useState } from 'react';

const WIN_SKULL = `
  ██████████████
██░░░░░░░░░░░░░░██
██░░██░░░░░░██░░██
██░░░░░░░░░░░░░░██
██░░██░░░░░░██░░██
██░░░░██████░░░░██
  ██████████████
    ██      ██
`;

const DEAD_SKULL = `
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
  const [godModeInput, setGodModeInput] = useState('');

  const won = gameStatus === 'won';

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(finalScore);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="gameover-root terminal-box" style={{ margin: 6, justifyContent: 'center' }}>
      <div
        className={`skull-art ${won ? 'c-cyan glow-cyan' : 'c-red glow-red'}`}
        style={{ fontSize: 11 }}
      >
        <pre>{won ? WIN_SKULL : DEAD_SKULL}</pre>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div
          className={`glow ${won ? 'c-cyan' : 'c-red'}`}
          style={{ fontSize: 22, fontWeight: 'bold', letterSpacing: 4 }}
        >
          {won ? '*** YOU ESCAPED ***' : '*** GAME OVER ***'}
        </div>
        <div style={{ marginTop: 6, color: 'var(--green)', fontSize: 14 }}>
          FINAL NET: {won
            ? <span className="c-cyan">{Number(finalScore).toFixed(6)} ETH</span>
            : <span className="c-red">{Number(finalScore ?? 0).toFixed(6)} ETH</span>
          }
        </div>
        {won && (
          <div style={{ color: 'var(--dim)', fontSize: 11, marginTop: 4 }}>
            Profit after debt repaid. You survived the protocol.
          </div>
        )}
        {!won && (
          <div style={{ color: 'var(--dim)', fontSize: 11, marginTop: 4 }}>
            The markets claimed you. The agent watches, indifferent.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        <button className="btn btn-large c-green" onClick={onNewGame}>
          [NEW GAME]
        </button>

        {canSubmit && won && !submitted && (
          <button
            className="btn btn-large btn-cyan"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '[TRANSMITTING...]' : '[SUBMIT TO LEADERBOARD]'}
          </button>
        )}

        {submitted && (
          <span className="c-cyan" style={{ fontSize: 13, alignSelf: 'center' }}>
            Score transmitted to botchan.
          </span>
        )}

        {!canSubmit && won && (
          <span className="c-dim" style={{ fontSize: 11, alignSelf: 'center' }}>
            Hold 1,000+ $SURVIVE (DRIFTER) to submit scores.
          </span>
        )}
      </div>

      {address && (
        <div style={{ color: 'var(--dim)', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
          Wallet: {address.slice(0, 6)}…{address.slice(-4)}
          {won && finalScore > 0 && (
            <span style={{ marginLeft: 8 }}>
              | Survived {(finalScore * 1000).toFixed(2)} compute-days
            </span>
          )}
        </div>
      )}
    </div>
  );
}
