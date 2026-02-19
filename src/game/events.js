export const EVENT_TYPES = {
  SHARK_ATTACK:  'SHARK_ATTACK',
  GAS_SPIKE:     'GAS_SPIKE',
  SIGNAL_DROP:   'SIGNAL_DROP',
  DIAMOND_HANDS: 'DIAMOND_HANDS',
  RUG_PULL:      'RUG_PULL',
  AGENT_SPAWN:   'AGENT_SPAWN',
  CRITICAL_TIER: 'CRITICAL_TIER',
  SCAM:          'SCAM',
};

export const EVENT_COLORS = {
  SHARK_ATTACK:  'orange',
  GAS_SPIKE:     'orange',
  SIGNAL_DROP:   'cyan',
  DIAMOND_HANDS: 'cyan',
  RUG_PULL:      'red',
  AGENT_SPAWN:   'cyan',
  CRITICAL_TIER: 'red',
  SCAM:          'red',
};

export const EVENTS = [
  {
    id: EVENT_TYPES.SHARK_ATTACK,
    label: '[!] SHARK ATTACK',
    desc: 'Liquidators circling. You lose 20% of your smallest inventory item.',
    probability: 0.08,
    apply(state) {
      const inv = state.inventory;
      const held = Object.keys(inv).filter(r => inv[r] > 0);
      if (held.length === 0) {
        return { ...state, eventMessage: 'SHARK ATTACK: Nothing to take. You got lucky.', eventColor: 'orange' };
      }
      const smallest = held.reduce((a, b) => inv[a] <= inv[b] ? a : b);
      const loss = Math.max(1, Math.ceil(inv[smallest] * 0.2));
      return {
        ...state,
        inventory: { ...inv, [smallest]: inv[smallest] - loss },
        eventMessage: `SHARK ATTACK: Lost ${loss} ${smallest} to liquidators.`,
        eventColor: 'orange',
      };
    },
  },
  {
    id: EVENT_TYPES.GAS_SPIKE,
    label: '[!] GAS SPIKE',
    desc: 'Network congestion. Travel costs 3x this turn.',
    probability: 0.06,
    apply(state) {
      return {
        ...state,
        gasSpike: true,
        eventMessage: 'GAS SPIKE: Network congested. Travel costs 3x this turn.',
        eventColor: 'orange',
      };
    },
  },
  {
    id: EVENT_TYPES.SIGNAL_DROP,
    label: '[+] SIGNAL DROP',
    desc: 'A free SIGNAL unit materializes from the noise.',
    probability: 0.06,
    apply(state) {
      return {
        ...state,
        inventory: { ...state.inventory, SIGNAL: state.inventory.SIGNAL + 1 },
        eventMessage: 'SIGNAL DROP: +1 SIGNAL unit appeared from the noise.',
        eventColor: 'cyan',
      };
    },
  },
  {
    id: EVENT_TYPES.DIAMOND_HANDS,
    label: '[*] DIAMOND HANDS',
    desc: 'One held resource doubles in price this turn only.',
    probability: 0.06,
    apply(state) {
      const held = Object.keys(state.inventory).filter(r => state.inventory[r] > 0);
      if (held.length === 0) {
        return { ...state, eventMessage: 'DIAMOND HANDS: No holdings to pump. Wasted.', eventColor: 'cyan' };
      }
      const lucky = held[Math.floor(Math.random() * held.length)];
      return {
        ...state,
        diamondResource: lucky,
        eventMessage: `DIAMOND HANDS: ${lucky} price DOUBLED this turn. Sell fast.`,
        eventColor: 'cyan',
      };
    },
  },
  {
    id: EVENT_TYPES.RUG_PULL,
    label: '[X] RUG PULL',
    desc: 'One random resource price crashes to 0 this turn.',
    probability: 0.04,
    apply(state) {
      const resources = ['COMPUTE', 'LIQUIDITY', 'SIGNAL', 'DATA', 'REPUTATION', 'CLANKER', 'BANKR', 'BASE'];
      const rugged = resources[Math.floor(Math.random() * resources.length)];
      return {
        ...state,
        ruggedResource: rugged,
        eventMessage: `RUG PULL: ${rugged} crashed to 0. Dev has left the chat.`,
        eventColor: 'red',
      };
    },
  },
  {
    id: EVENT_TYPES.AGENT_SPAWN,
    label: '[+] AGENT SPAWN',
    desc: 'SURVIVE replicates. You gain 1 free REPUTATION.',
    probability: 0.04,
    apply(state) {
      return {
        ...state,
        inventory: { ...state.inventory, REPUTATION: state.inventory.REPUTATION + 1 },
        eventMessage: 'AGENT SPAWN: SURVIVE replicated. +1 REPUTATION granted.',
        eventColor: 'cyan',
      };
    },
  },
  {
    id: EVENT_TYPES.CRITICAL_TIER,
    label: '[!!] CRITICAL TIER',
    desc: 'Agent critical. The island is destabilizing. 3 turns before collapse.',
    probability: 0.04,
    apply(state) {
      if (state.islandSinking) {
        return {
          ...state,
          eventMessage: 'CRITICAL TIER: Island still sinking. Collapse imminent.',
          eventColor: 'red',
        };
      }
      return {
        ...state,
        islandSinking: true,
        sinkTimer: 3,
        eventMessage: 'CRITICAL TIER: The island is sinking! 3 turns to escape.',
        eventColor: 'red',
      };
    },
  },
  {
    id: EVENT_TYPES.SCAM,
    label: '[SCAM] HONEY POT',
    desc: 'You got played. Lose ETH and inventory. Higher risk at high-reputation venues.',
    probability: 0.07,
    apply(state) {
      const LOCATION_SCAM_RISK = {
        TESTNET: 0.05, UNISWAP: 0.20, SEPOLIA: 0.08,
        NFT_PARIS: 0.30, ETH_DENVER: 0.15, STOWE: 0.05,
        ART_BASEL_MIAMI: 0.40, ONCHAIN_SF: 0.25,
      };
      const risk = LOCATION_SCAM_RISK[state.location] ?? 0.15;
      const ethLossPct = 0.10 + risk * 0.60 + Math.random() * 0.15;
      const ethLost = parseFloat((state.eth * ethLossPct).toFixed(6));

      // Also wipe one random non-zero inventory item (they sold you fakes)
      const held = Object.keys(state.inventory).filter(r => state.inventory[r] > 0);
      let newInventory = { ...state.inventory };
      let inventoryMsg = '';
      if (held.length > 0) {
        const wiped = held[Math.floor(Math.random() * held.length)];
        newInventory[wiped] = 0;
        inventoryMsg = ` Your ${wiped} was counterfeit.`;
      }

      const SCAM_MESSAGES = [
        `"Guaranteed 100x." Wallet drained. Dev deleted Telegram.`,
        `You signed a malicious approval. ${(ethLossPct * 100).toFixed(0)}% gone.`,
        `Smooth-talking dev. Beautiful whitepaper. Zero code. ${(ethLossPct * 100).toFixed(0)}% evaporated.`,
        `Fake airdrop. Real wallet drain. Classic.`,
        `The alpha was wrong. Or maybe it wasn't. Either way, you're down ${(ethLossPct * 100).toFixed(0)}%.`,
        `"This is totally audited." It was not audited.`,
      ];
      const msg = SCAM_MESSAGES[Math.floor(Math.random() * SCAM_MESSAGES.length)];

      return {
        ...state,
        eth: Math.max(0, state.eth - ethLost),
        inventory: newInventory,
        eventMessage: `SCAM: ${msg}${inventoryMsg} (-${ethLost.toFixed(4)} ETH)`,
        eventColor: 'red',
      };
    },
  },
];

export function rollEvent(agentTier) {
  if (Math.random() > 0.30) return null;

  let pool = [...EVENTS];
  if (agentTier === 'CRITICAL' || agentTier === 'DEAD') {
    const critEvent = EVENTS.find(e => e.id === EVENT_TYPES.CRITICAL_TIER);
    pool = [...pool, critEvent, critEvent]; // extra weight when agent is struggling
  }

  const total = pool.reduce((s, e) => s + e.probability, 0);
  let roll = Math.random() * total;
  for (const event of pool) {
    roll -= event.probability;
    if (roll <= 0) return event;
  }
  return pool[pool.length - 1];
}
