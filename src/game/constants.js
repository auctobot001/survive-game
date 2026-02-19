export const RESOURCES = ['COMPUTE', 'LIQUIDITY', 'SIGNAL', 'DATA', 'REPUTATION', 'BASE'];

// Read-only market price references — shown as ticker, NOT tradeable
export const MARKET_TICKERS = ['CLANKER', 'BANKR'];

export const LOCATIONS = {
  TESTNET: {
    id: 'TESTNET',
    label: 'TESTNET',
    display: 'TESTNET',
    desc: 'Safe, low returns. Starting location.',
    risk: 'LOW',
    flavor: 'The markets are quiet. Almost too quiet.',
  },
  UNISWAP: {
    id: 'UNISWAP',
    label: 'UNISWAP',
    display: 'UNISWAP',
    desc: 'High volume, volatile prices.',
    risk: 'HIGH',
    flavor: 'Swaps execute in the dark. Prices shift like smoke.',
  },
  SEPOLIA: {
    id: 'SEPOLIA',
    label: 'SEPOLIA',
    display: 'SEPOLIA',
    desc: 'Testnet mirror. Experimental prices, free gas.',
    risk: 'LOW',
    flavor: 'Play money, real stakes. The boundary is thinner than you think.',
  },
  NFT_PARIS: {
    id: 'NFT_PARIS',
    label: 'NFT PARIS',
    display: 'NFT PARIS',
    desc: 'Art season. REPUTATION and CLANKER at a premium.',
    risk: 'MEDIUM',
    flavor: 'Champagne and smart contracts. The art world discovered Base.',
  },
  ETH_DENVER: {
    id: 'ETH_DENVER',
    label: 'ETH DENVER',
    display: 'ETH DENVER',
    desc: 'Conference circuit. SIGNAL and BANKR hot commodities.',
    risk: 'MEDIUM',
    flavor: 'Hackathon energy. Everyone is building. Some of it works.',
  },
  STOWE: {
    id: 'STOWE',
    label: 'STOWE',
    display: 'STOWE',
    desc: 'Off-chain vibes. DATA cheap, quiet corners to accumulate.',
    risk: 'LOW',
    flavor: 'Ski lifts and cold wallets. The whales come here to think.',
  },
  ART_BASEL_MIAMI: {
    id: 'ART_BASEL_MIAMI',
    label: 'ART BASEL MIAMI',
    display: 'ART BASEL MIAMI',
    desc: 'Luxury circuit. REPUTATION peaks. Whale territory.',
    risk: 'VERY_HIGH',
    flavor: 'Yacht money meets onchain. Prices are whatever the room decides.',
  },
  ONCHAIN_SF: {
    id: 'ONCHAIN_SF',
    label: 'ONCHAIN SF',
    display: 'ONCHAIN SF',
    desc: 'Tech hub. COMPUTE and BASE surge here.',
    risk: 'HIGH',
    flavor: 'The builders never sleep. Neither do the gas fees.',
  },
};

export const LOCATION_LIST = [
  'TESTNET',
  'UNISWAP',
  'SEPOLIA',
  'NFT_PARIS',
  'ETH_DENVER',
  'STOWE',
  'ART_BASEL_MIAMI',
  'ONCHAIN_SF',
];

export const AGENT_TIERS = {
  NORMAL: {
    id: 'NORMAL',
    label: 'NORMAL',
    color: '#00ff41',
    desc: 'Agent operating normally.',
    minEth: 0.01,
  },
  LOW_COMPUTE: {
    id: 'LOW_COMPUTE',
    label: 'LOW_COMPUTE',
    color: '#ffff00',
    desc: 'Compute resources depleting. Something is wrong.',
    minEth: 0.001,
    maxEth: 0.01,
  },
  CRITICAL: {
    id: 'CRITICAL',
    label: 'CRITICAL',
    color: '#ff6b00',
    desc: 'CRITICAL: Agent on life support. Island destabilizing.',
    minEth: 0.0001,
    maxEth: 0.001,
  },
  DEAD: {
    id: 'DEAD',
    label: 'DEAD',
    color: '#ff0000',
    desc: 'AGENT DESTROYED. SURVIVE_ISLAND locked out.',
    maxEth: 0.0001,
  },
};

export const STAKING_TIERS = {
  SPECTATOR: { id: 'SPECTATOR', label: 'SPECTATOR', minBalance: 0, desc: 'Play but no leaderboard.' },
  DRIFTER:   { id: 'DRIFTER',   label: 'GRIFTER',   minBalance: 1000,    desc: 'Submit scores to leaderboard.' },
  CREW:      { id: 'CREW',      label: 'SHILL',     minBalance: 10000,   desc: 'Unlock insider tip events + REPUTATION trading.' },
  OPERATOR:  { id: 'OPERATOR',  label: 'MFER',      minBalance: 100000,  desc: 'Post votes via botchan.' },
  WHALE:     { id: 'WHALE',     label: 'WHALE',     minBalance: 500000,  desc: 'Send 0.001 ETH to treasury.' },
  GOD_MODE:  { id: 'GOD_MODE',  label: 'GOD MODE',  minBalance: 1000000, desc: 'Name a child agent via botchan.' },
};

export const BASE_PRICES = {
  COMPUTE:    0.0012,
  LIQUIDITY:  0.0045,
  SIGNAL:     0.0020,
  DATA:       0.0003,
  REPUTATION: 0.0080,
  BASE:       0.0060,
};

// Simulated base prices for market ticker (display only)
export const TICKER_BASE_PRICES = {
  CLANKER: 0.00042,
  BANKR:   0.00018,
};

export const LOCATION_MULTIPLIERS = {
  TESTNET:         { COMPUTE: 1.0, LIQUIDITY: 1.0, SIGNAL: 1.0, DATA: 1.0,  REPUTATION: 1.0, BASE: 1.0 },
  UNISWAP:         { COMPUTE: 1.2, LIQUIDITY: 1.8, SIGNAL: 1.3, DATA: 1.1,  REPUTATION: 0.8, BASE: 1.5 },
  SEPOLIA:         { COMPUTE: 0.7, LIQUIDITY: 0.6, SIGNAL: 0.8, DATA: 0.5,  REPUTATION: 0.4, BASE: 0.8 },
  NFT_PARIS:       { COMPUTE: 0.8, LIQUIDITY: 0.9, SIGNAL: 1.2, DATA: 0.7,  REPUTATION: 2.2, BASE: 1.2 },
  ETH_DENVER:      { COMPUTE: 1.3, LIQUIDITY: 1.0, SIGNAL: 2.0, DATA: 1.4,  REPUTATION: 1.5, BASE: 1.3 },
  STOWE:           { COMPUTE: 0.9, LIQUIDITY: 0.8, SIGNAL: 0.7, DATA: 0.4,  REPUTATION: 1.2, BASE: 0.9 },
  ART_BASEL_MIAMI: { COMPUTE: 0.6, LIQUIDITY: 1.2, SIGNAL: 1.4, DATA: 0.9,  REPUTATION: 2.8, BASE: 1.4 },
  ONCHAIN_SF:      { COMPUTE: 2.0, LIQUIDITY: 1.3, SIGNAL: 1.5, DATA: 1.6,  REPUTATION: 1.3, BASE: 2.2 },
};

// Scam risk by location (0-1, used by SCAM event)
export const SCAM_RISK = {
  TESTNET:         0.05,
  UNISWAP:         0.20,
  SEPOLIA:         0.08,
  NFT_PARIS:       0.30,
  ETH_DENVER:      0.15,
  STOWE:           0.05,
  ART_BASEL_MIAMI: 0.40,
  ONCHAIN_SF:      0.25,
};

export const MAX_TURNS = 30;
export const STARTING_ETH = 0.05;
export const STARTING_DEBT = 0.02;
export const BASE_TRAVEL_COST = 0.001;

export const AGENT_ADDRESS    = '0xFC426DFeAe55Dae2f936a592450C9ECEa87A5736'; // Clawtomaton LP fee collector (1.31 ETH)
export const TOKEN_ADDRESS    = '0xf79e1B46F9E62182B7594d719d146c19A7D09619'; // $SURVIVE token contract
export const TREASURY_ADDRESS = '0xFC426DFeAe55Dae2f936a592450C9ECEa87A5736'; // same as agent wallet
export const BASE_RPC_URL = import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org';
