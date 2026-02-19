import { useState, useEffect, useCallback } from 'react';
import { publicClient } from '../lib/rpc.js';
import { AGENT_ADDRESS } from '../game/constants.js';

export function getAgentTier(balanceEth) {
  if (balanceEth === null || balanceEth === undefined) return 'NORMAL';
  if (balanceEth > 0.01)    return 'NORMAL';
  if (balanceEth >= 0.001)  return 'LOW_COMPUTE';
  if (balanceEth >= 0.0001) return 'CRITICAL';
  return 'DEAD';
}

export function useSurviveAgent() {
  const [agentEth, setAgentEth]   = useState(null);
  const [agentTier, setAgentTier] = useState('NORMAL');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchBalance = useCallback(async () => {
    try {
      const raw = await publicClient.getBalance({ address: AGENT_ADDRESS });
      const eth = Number(raw) / 1e18;
      setAgentEth(eth);
      setAgentTier(getAgentTier(eth));
      setError(null);
    } catch (err) {
      console.error('[useSurviveAgent]', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    const id = setInterval(fetchBalance, 60_000);
    return () => clearInterval(id);
  }, [fetchBalance]);

  return { agentEth, agentTier, loading, error, refetch: fetchBalance };
}
