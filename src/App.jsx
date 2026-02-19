import { useReducer, useEffect, useCallback } from 'react';
import { useConnect, useDisconnect, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { gameReducer, initGame } from './game/engine.js';
import { useSurviveAgent } from './hooks/useSurviveAgent.js';
import { useStakingTier } from './hooks/useStakingTier.js';
import { useBotchan } from './hooks/useBotchan.js';
import { useMarketTicker } from './hooks/useMarketTicker.js';
import { TREASURY_ADDRESS } from './game/constants.js';
import Terminal from './components/Terminal.jsx';
import GameOver from './components/GameOver.jsx';

export default function App() {
  const [game, dispatch] = useReducer(gameReducer, null, initGame);

  // Onchain hooks
  const { agentEth, agentTier }                           = useSurviveAgent();
  const { stakingTier, balanceFormatted, address, isConnected } = useStakingTier();
  const { feed, loading: botchanLoading, online: botchanOnline, post } = useBotchan('survive-game');
  const { prices: tickerPrices, trend: tickerTrend }      = useMarketTicker(12000);

  // Wagmi connectors
  const { connect, connectors }   = useConnect();
  const { disconnect }            = useDisconnect();
  const { sendTransaction }       = useSendTransaction();

  // Keep game engine aware of live agent tier
  useEffect(() => {
    if (agentTier !== game.agentTier) {
      dispatch({ type: 'SET_AGENT_TIER', tier: agentTier });
    }
  }, [agentTier, game.agentTier]);

  const handleConnect = useCallback(() => {
    const preferred = connectors.find(c => c.id === 'coinbaseWallet') || connectors[0];
    if (preferred) connect({ connector: preferred });
  }, [connect, connectors]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handlePost = useCallback(async (feedName, message, data) => {
    return await post(feedName, message, data);
  }, [post]);

  const handleWhaleAction = useCallback(() => {
    sendTransaction({
      to: TREASURY_ADDRESS,
      value: parseEther('0.001'),
    });
  }, [sendTransaction]);

  const handleGodMode = useCallback(async (name) => {
    await post('survive-game', `GOD MODE: naming agent "${name}"`, { type: 'name_agent', name });
  }, [post]);

  const handleNewGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' });
  }, []);

  const handleSubmitScore = useCallback(async (score) => {
    await post('survive-game', `ESCAPED: NET ${Number(score).toFixed(6)} ETH`, {
      type: 'score',
      score: Number(score),
      net: Number(score),
      address,
    });
  }, [post, address]);

  const canSubmit = ['DRIFTER', 'CREW', 'OPERATOR', 'WHALE', 'GOD_MODE'].includes(stakingTier);

  const sharedProps = {
    agentTier,
    agentEth,
    stakingTier,
    balanceFormatted,
    botchanFeed: feed,
    botchanLoading,
    botchanOnline,
    address,
    isConnected,
    onConnect:   handleConnect,
    onDisconnect: handleDisconnect,
    onPost:      handlePost,
    onWhaleAction: handleWhaleAction,
    onGodMode:   handleGodMode,
    tickerPrices,
    tickerTrend,
  };

  if (game.gameStatus === 'won' || game.gameStatus === 'lost') {
    return (
      <GameOver
        gameStatus={game.gameStatus}
        finalScore={game.finalScore}
        onNewGame={handleNewGame}
        onSubmit={handleSubmitScore}
        canSubmit={canSubmit}
        address={address}
      />
    );
  }

  return (
    <Terminal
      game={game}
      dispatch={dispatch}
      {...sharedProps}
    />
  );
}
