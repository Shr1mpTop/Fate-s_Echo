// ========================================
// 模块统一导出 (Barrel Export)
// ========================================

// 数据层
export {
  UNIT_LIBRARY,
  RARITY_WEIGHTS,
  getUnitById,
  getAllUnitIds,
} from "./data/cardRegistry";
export type { UnitStats } from "./data/cardRegistry";

export {
  generateEnemySquad,
  createPlayerBattleUnit,
} from "./data/levelGenerator";
export type { BattleUnit, EnemyTemplate } from "./data/levelGenerator";

// 引擎层
export { executeBattle } from "./engine/battleEngine";
export type { BattleRoundLog, BattleResult } from "./engine/battleEngine";

export { drawCards } from "./engine/gachaSystem";

export {
  shouldTriggerFate,
  rollFateDice,
  resolveFateEvent,
  applyHeal,
} from "./engine/fateWheel";
export type { FateEventType, FateEventResult } from "./engine/fateWheel";

// 状态管理
export { gameReducer, initialGameState } from "./state/gameState";
export type { GamePhase, GameState, GameAction } from "./state/gameState";
