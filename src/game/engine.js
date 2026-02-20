import { LOCATIONS, MAX_TURNS, STARTING_ETH, STARTING_DEBT, BASE_TRAVEL_COST } from './constants.js';
import { generatePrices, getInventoryValue } from './market.js';
import { rollEvent } from './events.js';

/** Derive agent tier from ETH balance — mirrors useSurviveAgent logic */
function getAgentTierFromEth(eth) {
  if (!eth || eth <= 0)  return 'DEAD';
  if (eth > 0.01)        return 'NORMAL';
  if (eth >= 0.001)      return 'LOW_COMPUTE';
  if (eth >= 0.0001)     return 'CRITICAL';
  return 'DEAD';
}

export function initGame() {
  const prices = generatePrices('TESTNET');
  return {
    turn:           1,
    eth:            STARTING_ETH,
    debt:           STARTING_DEBT,
    location:       'TESTNET',
    inventory:      { COMPUTE: 0, LIQUIDITY: 0, SIGNAL: 0, DATA: 0, REPUTATION: 0, BASE: 0 },
    prices,
    gameStatus:     'playing',  // 'playing' | 'won' | 'lost'
    eventLog:       [{ text: '> Turn 1: Arrived at TESTNET. Markets are quiet.', color: 'green' }],
    currentEvent:   null,
    gasSpike:       false,
    diamondResource: null,
    ruggedResource: null,
    islandSinking:  false,
    sinkTimer:      0,
    agentTier:      'NORMAL',
    finalScore:     null,
    eventMessage:   null,
    eventColor:     null,
  };
}

export function getNetEth(state) {
  const inventoryValue = getInventoryValue(state.inventory, state.prices);
  return state.eth + inventoryValue - state.debt;
}

function addLog(log, text, color = 'green') {
  const next = [...log, { text, color }];
  return next.slice(-50); // keep last 50 entries
}

export function processAction(state, action) {
  if (state.gameStatus !== 'playing') return state;

  const agentTier = action.agentTier || state.agentTier || 'NORMAL';
  let log = state.eventLog;

  switch (action.type) {
    case 'BUY': {
      const { resource, quantity } = action;
      const price = state.prices[resource] ?? 0;
      if (price === 0) {
        log = addLog(log, `> [ERR] Cannot buy ${resource}: price is 0 (rugged or unavailable).`, 'orange');
        return { ...state, eventLog: log };
      }
      const cost = price * quantity;
      if (state.eth < cost) {
        log = addLog(log, `> [ERR] Insufficient ETH. Need ${cost.toFixed(6)}, have ${state.eth.toFixed(6)}.`, 'orange');
        return { ...state, eventLog: log };
      }
      log = addLog(log, `> Turn ${state.turn}: Bought ${quantity} ${resource} for ${cost.toFixed(6)} ETH`, 'green');
      return advanceTurn({
        ...state,
        eth:       state.eth - cost,
        inventory: { ...state.inventory, [resource]: (state.inventory[resource] ?? 0) + quantity },
        eventLog:  log,
      }, agentTier);
    }

    case 'SELL': {
      const { resource, quantity } = action;
      const have = state.inventory[resource] ?? 0;
      if (have < quantity) {
        log = addLog(log, `> [ERR] Insufficient ${resource}. Have ${have}, need ${quantity}.`, 'orange');
        return { ...state, eventLog: log };
      }
      const price  = state.prices[resource] ?? 0;
      const earned = price * quantity;
      log = addLog(log, `> Turn ${state.turn}: Sold ${quantity} ${resource} for ${earned.toFixed(6)} ETH`, 'green');
      return advanceTurn({
        ...state,
        eth:       state.eth + earned,
        inventory: { ...state.inventory, [resource]: have - quantity },
        eventLog:  log,
      }, agentTier);
    }

    case 'TRAVEL': {
      const { destination } = action;
      if (destination === state.location) {
        log = addLog(log, `> Already at ${LOCATIONS[destination]?.display || destination}.`, 'dim');
        return { ...state, eventLog: log };
      }
      // No locked locations currently
      const travelCost = BASE_TRAVEL_COST * (state.gasSpike ? 3 : 1);
      if (state.eth < travelCost) {
        log = addLog(log, `> [ERR] Insufficient ETH for travel (costs ${travelCost.toFixed(4)} ETH).`, 'orange');
        return { ...state, eventLog: log };
      }
      const newPrices = generatePrices(destination, agentTier);
      log = addLog(log, `> Turn ${state.turn}: Traveled to ${LOCATIONS[destination]?.display || destination}. Cost: ${travelCost.toFixed(4)} ETH`, 'green');
      return advanceTurn({
        ...state,
        eth:       state.eth - travelCost,
        location:  destination,
        prices:    newPrices,
        eventLog:  log,
      }, agentTier);
    }

    case 'ESCAPE': {
      const netEth = getNetEth(state);
      if (netEth <= 0) {
        log = addLog(log, `> [DENIED] Cannot escape: NET ETH = ${netEth.toFixed(6)} (must be > 0).`, 'orange');
        return { ...state, eventLog: log };
      }
      log = addLog(log, `> Turn ${state.turn}: *** ESCAPED *** NET: ${netEth.toFixed(6)} ETH. YOU WIN!`, 'cyan');
      return {
        ...state,
        gameStatus: 'won',
        finalScore: netEth,
        eventLog:   log,
      };
    }

    case 'TRANSMIT': {
      // Advance turn (botchan post handled externally)
      log = addLog(log, `> Turn ${state.turn}: TRANSMITTED status to botchan.`, 'cyan');
      return advanceTurn({ ...state, eventLog: log }, agentTier);
    }

    case 'END_TURN': {
      log = addLog(log, `> Turn ${state.turn}: Passed.`, 'dim');
      return advanceTurn({ ...state, eventLog: log }, agentTier);
    }

    default:
      return state;
  }
}

export function advanceTurn(state, agentTier = 'NORMAL') {
  if (state.gameStatus !== 'playing') return state;

  // Clear per-turn flags
  let next = {
    ...state,
    currentEvent:    null,
    gasSpike:        false,
    diamondResource: null,
    ruggedResource:  null,
    eventMessage:    null,
    eventColor:      null,
    agentTier,  // will be overridden below by eth-derived tier
  };

  let log = next.eventLog;
  const nextTurn = state.turn + 1;

  // Island sinking countdown
  if (next.islandSinking) {
    const remaining = next.sinkTimer - 1;
    if (remaining <= 0) {
      log = addLog(log, `> *** THE ISLAND HAS SUNK. GAME OVER. ***`, 'red');
      return { ...next, gameStatus: 'lost', finalScore: getNetEth(next), eventLog: log };
    }
    next = { ...next, sinkTimer: remaining };
    log = addLog(log, `> [WARNING] SURVIVE_ISLAND sinking in ${remaining} turn${remaining === 1 ? '' : 's'}!`, 'red');
  }

  // ETH floor check
  if (next.eth <= 0) {
    log = addLog(log, `> ETH balance hit 0. GAME OVER.`, 'red');
    return { ...next, gameStatus: 'lost', finalScore: 0, eventLog: log };
  }

  // Turn limit check
  if (nextTurn > MAX_TURNS) {
    const netEth = getNetEth(next);
    if (netEth > 0) {
      log = addLog(log, `> TIME UP (${MAX_TURNS} turns). NET: ${netEth.toFixed(6)} ETH — YOU WIN!`, 'cyan');
      return { ...next, gameStatus: 'won', finalScore: netEth, turn: MAX_TURNS, eventLog: log };
    } else {
      log = addLog(log, `> TIME UP (${MAX_TURNS} turns). Failed to escape. GAME OVER.`, 'red');
      return { ...next, gameStatus: 'lost', finalScore: netEth, turn: MAX_TURNS, eventLog: log };
    }
  }

  // Derive agentTier from current ETH — makes buy/sell directly affect agent health
  const derivedAgentTier = getAgentTierFromEth(next.eth);
  next = { ...next, agentTier: derivedAgentTier };

  // Roll random event — location determines fire rate and reward pool
  const event = rollEvent(derivedAgentTier, next.location);
  next = { ...next, turn: nextTurn, eventLog: log };
  if (event) {
    next = event.apply(next);
    if (next.eventMessage) {
      next = {
        ...next,
        currentEvent: event.id,
        eventLog: addLog(next.eventLog, `> [EVENT] ${next.eventMessage}`, next.eventColor || 'orange'),
      };
    }
    log = next.eventLog;
  }

  // Regenerate market prices for current location using eth-derived tier
  const newPrices = generatePrices(
    next.location,
    derivedAgentTier,
    next.ruggedResource,
    next.diamondResource,
  );

  log = addLog(log, `> Turn ${nextTurn}: Markets updated at ${LOCATIONS[next.location]?.display || next.location}.`, 'dim');

  return {
    ...next,
    prices:   newPrices,
    eventLog: log,
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'BUY':
    case 'SELL':
    case 'TRAVEL':
    case 'ESCAPE':
    case 'TRANSMIT':
    case 'END_TURN':
      return processAction(state, action);

    case 'NEW_GAME':
      return initGame();

    case 'SET_AGENT_TIER':
      return { ...state, agentTier: action.tier };

    default:
      return state;
  }
}
