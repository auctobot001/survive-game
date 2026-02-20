/**
 * Game adapter — re-exports pure engine functions for use in serverless API routes.
 * The src/game/ files are side-effect-free ES modules; import them directly.
 * No modification to game logic — engine is the single source of truth.
 */
export { initGame, processAction, getNetEth, advanceTurn, gameReducer } from '../src/game/engine.js';
export { generatePrices, getInventoryValue }                            from '../src/game/market.js';
export { rollEvent }                                                    from '../src/game/events.js';
export {
  LOCATIONS,
  LOCATION_LIST,
  RESOURCES,
  MAX_TURNS,
  STARTING_ETH,
  STARTING_DEBT,
  BASE_TRAVEL_COST,
} from '../src/game/constants.js';
