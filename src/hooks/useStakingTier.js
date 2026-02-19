import { useReadContract, useAccount } from 'wagmi';
import { erc20Abi } from 'viem';
import { TOKEN_ADDRESS } from '../game/constants.js';

export function getStakingTier(rawBalance) {
  if (!rawBalance && rawBalance !== 0n) return 'SPECTATOR';
  const bal = Number(rawBalance) / 1e18;
  if (bal >= 1_000_000) return 'GOD_MODE';
  if (bal >= 500_000)   return 'WHALE';
  if (bal >= 100_000)   return 'OPERATOR';
  if (bal >= 10_000)    return 'CREW';
  if (bal >= 1_000)     return 'DRIFTER';
  return 'SPECTATOR';
}

export function useStakingTier() {
  const { address, isConnected } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: isConnected && !!address },
  });

  const stakingTier       = getStakingTier(balance);
  const balanceRaw        = balance ?? 0n;
  const balanceFormatted  = (Number(balanceRaw) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const balanceNum        = Number(balanceRaw) / 1e18;

  return { stakingTier, balance: balanceRaw, balanceFormatted, balanceNum, isLoading, address, isConnected };
}
