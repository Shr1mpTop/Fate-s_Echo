// ========================================
// 游戏状态管理器 (Game State Manager)
// 使用 React useReducer 模式
// 模拟链上 Session 的完整生命周期
// ========================================

import type { BattleUnit } from "../data/levelGenerator";
import type { BattleRoundLog } from "../engine/battleEngine";
import type { FateEventResult } from "../engine/fateWheel";

// ===== 游戏阶段枚举 =====
export type GamePhase =
  | "IDLE" // 未开始，显示首页
  | "RECRUITING" // 正在抽卡 (动画)
  | "PREPARING" // 排兵布阵
  | "BATTLING" // 战斗回放中
  | "BATTLE_RESULT" // 显示战斗结果
  | "FATE_ROLL" // 进入命运转盘（骰子动画）
  | "FATE_RESULT" // 展示命运事件结果
  | "CASH_OUT" // 结算画面
  | "GAME_OVER"; // 战败，Game Over

// ===== 游戏全局状态 =====
export interface GameState {
  phase: GamePhase;

  // --- 经济 ---
  betAmount: number; // 入场本金（模拟 USDT）
  jackpot: number; // 当前积累的奖金池
  houseFeeRate: number; // 庄家抽水率 (0.05 = 5%)

  // --- 关卡 ---
  currentLevel: number; // 当前层数
  maxLevelReached: number; // 本局最高层数

  // --- 玩家阵容 ---
  playerSquad: BattleUnit[]; // 当前己方队伍（含血量状态）

  // --- 敌方阵容 ---
  enemySquad: BattleUnit[];

  // --- 战斗日志 ---
  battleLog: BattleRoundLog[];
  lastBattleWon: boolean;
  lastBattleDraw: boolean;

  // --- 命运事件 ---
  lastFateResult: FateEventResult | null;

  // --- 历史（用于展示） ---
  totalGamesPlayed: number;
  totalWinnings: number;
}

// ===== Action 类型 =====
export type GameAction =
  | { type: "START_GAME"; betAmount: number }
  | { type: "SET_RECRUITED_CARDS"; squad: BattleUnit[] }
  | { type: "REORDER_SQUAD"; newOrder: number[] } // 传入新的索引顺序
  | { type: "SET_ENEMY_SQUAD"; squad: BattleUnit[] }
  | { type: "START_BATTLE" }
  | {
      type: "SET_BATTLE_RESULT";
      won: boolean;
      isDraw: boolean;
      log: BattleRoundLog[];
      survivingUnits: BattleUnit[];
    }
  | { type: "ADVANCE_LEVEL" }
  | { type: "ENTER_FATE" }
  | {
      type: "SET_FATE_RESULT";
      result: FateEventResult;
      updatedSquad: BattleUnit[];
    }
  | { type: "ADD_BONUS_CARD"; unit: BattleUnit }
  | { type: "CASH_OUT" }
  | { type: "GAME_OVER" }
  | { type: "RESET" };

// ===== 初始状态 =====
export const initialGameState: GameState = {
  phase: "IDLE",
  betAmount: 0,
  jackpot: 0,
  houseFeeRate: 0.05,
  currentLevel: 0,
  maxLevelReached: 0,
  playerSquad: [],
  enemySquad: [],
  battleLog: [],
  lastBattleWon: false,
  lastBattleDraw: false,
  lastFateResult: null,
  totalGamesPlayed: 0,
  totalWinnings: 0,
};

// ===== Reducer =====
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const fee = action.betAmount * state.houseFeeRate;
      const jackpot = action.betAmount - fee;
      return {
        ...state,
        phase: "RECRUITING",
        betAmount: action.betAmount,
        jackpot,
        currentLevel: 0,
        maxLevelReached: 0,
        playerSquad: [],
        enemySquad: [],
        battleLog: [],
        lastFateResult: null,
        totalGamesPlayed: state.totalGamesPlayed + 1,
      };
    }

    case "SET_RECRUITED_CARDS":
      return {
        ...state,
        phase: "PREPARING",
        playerSquad: action.squad,
        currentLevel: 1,
      };

    case "REORDER_SQUAD": {
      const reordered = action.newOrder.map((idx) => state.playerSquad[idx]);
      return {
        ...state,
        playerSquad: reordered,
      };
    }

    case "SET_ENEMY_SQUAD":
      return {
        ...state,
        enemySquad: action.squad,
      };

    case "START_BATTLE":
      return {
        ...state,
        phase: "BATTLING",
      };

    case "SET_BATTLE_RESULT": {
      if (action.won) {
        // 奖金池增加：基础奖励 = 本金 * 0.3 * level系数，存活人数加成
        const levelBonus =
          state.betAmount * 0.3 * (1 + state.currentLevel * 0.1);
        const survivalBonus =
          action.survivingUnits.length * state.betAmount * 0.05;
        const newJackpot = state.jackpot + levelBonus + survivalBonus;

        return {
          ...state,
          phase: "BATTLE_RESULT",
          lastBattleWon: true,
          lastBattleDraw: action.isDraw,
          battleLog: action.log,
          playerSquad: action.survivingUnits,
          enemySquad: [],
          jackpot: Math.round(newJackpot * 100) / 100,
          maxLevelReached: Math.max(state.maxLevelReached, state.currentLevel),
        };
      } else {
        return {
          ...state,
          phase: "BATTLE_RESULT",
          lastBattleWon: false,
          lastBattleDraw: false,
          battleLog: action.log,
          playerSquad: action.survivingUnits,
        };
      }
    }

    case "ADVANCE_LEVEL":
      return {
        ...state,
        phase: "PREPARING",
        currentLevel: state.currentLevel + 1,
      };

    case "ENTER_FATE":
      return {
        ...state,
        phase: "FATE_ROLL",
      };

    case "SET_FATE_RESULT": {
      const r = action.result;
      let newJackpot = state.jackpot;
      if (r.jackpotDelta !== 0) {
        newJackpot = state.jackpot * (1 + r.jackpotDelta);
        newJackpot = Math.max(0, Math.round(newJackpot * 100) / 100);
      }
      return {
        ...state,
        phase: "FATE_RESULT",
        lastFateResult: r,
        jackpot: newJackpot,
        playerSquad: action.updatedSquad,
      };
    }

    case "ADD_BONUS_CARD":
      return {
        ...state,
        playerSquad: [...state.playerSquad, action.unit],
      };

    case "CASH_OUT":
      return {
        ...state,
        phase: "CASH_OUT",
        totalWinnings: state.totalWinnings + state.jackpot,
      };

    case "GAME_OVER":
      return {
        ...state,
        phase: "GAME_OVER",
        jackpot: 0,
      };

    case "RESET":
      return {
        ...initialGameState,
        totalGamesPlayed: state.totalGamesPlayed,
        totalWinnings: state.totalWinnings,
      };

    default:
      return state;
  }
}
