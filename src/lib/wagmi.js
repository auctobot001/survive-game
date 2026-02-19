import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, metaMask, injected } from 'wagmi/connectors';

const rpcUrl = import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org';

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({ appName: '$SURVIVE: THE GAME' }),
    metaMask(),
    injected(),
  ],
  transports: {
    [base.id]: http(rpcUrl),
  },
});
