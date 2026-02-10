"use client";

import { useReducer, useCallback, useState } from "react";
import {
  gameReducer,
  initialGameState,
  createPlayerBattleUnit,
  generateEnemySquad,
  executeBattle,
  shouldTriggerFate,
  rollFateDice,
  applyHeal,
} from "@/game";
import { drawCards as drawCardsFromGacha } from "@/game/engine/gachaSystem";
import UnitCard from "@/components/UnitCard";
import Battlefield from "@/components/Battlefield";
import BattleLogViewer from "@/components/BattleLogViewer";
import FateWheelDisplay from "@/components/FateWheelDisplay";
import GameHUD from "@/components/GameHUD";

export default function Home() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [betInput, setBetInput] = useState("10");
  const [isFateRolling, setIsFateRolling] = useState(false);

  // ===== 开始新游戏 =====
  const handleStartGame = useCallback(() => {
    const amount = parseFloat(betInput);
    if (isNaN(amount) || amount <= 0) return;

    dispatch({ type: "START_GAME", betAmount: amount });

    // 模拟抽卡（延迟 800ms 模拟 VRF 请求）
    setTimeout(() => {
      const cards = drawCardsFromGacha(3);
      const squad = cards.map((c) => createPlayerBattleUnit(c));
      dispatch({ type: "SET_RECRUITED_CARDS", squad });
    }, 800);
  }, [betInput]);

  // ===== 调整站位 =====
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const newOrder = state.playerSquad.map((_: unknown, i: number) => i);
      [newOrder[index], newOrder[index - 1]] = [
        newOrder[index - 1],
        newOrder[index],
      ];
      dispatch({ type: "REORDER_SQUAD", newOrder });
    },
    [state.playerSquad],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= state.playerSquad.length - 1) return;
      const newOrder = state.playerSquad.map((_: unknown, i: number) => i);
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
      dispatch({ type: "REORDER_SQUAD", newOrder });
    },
    [state.playerSquad],
  );

  // ===== 开始战斗 =====
  const handleBattle = useCallback(() => {
    const enemies = generateEnemySquad(state.currentLevel);
    dispatch({ type: "SET_ENEMY_SQUAD", squad: enemies });
    dispatch({ type: "START_BATTLE" });

    setTimeout(() => {
      const result = executeBattle(state.playerSquad, enemies);
      dispatch({
        type: "SET_BATTLE_RESULT",
        won: result.won,
        isDraw: result.isDraw,
        log: result.rounds,
        survivingUnits: result.survivingPlayerUnits,
      });
    }, 300);
  }, [state.currentLevel, state.playerSquad]);

  // ===== 下一关 or 命运转盘 =====
  const handleNextLevel = useCallback(() => {
    if (shouldTriggerFate(state.currentLevel)) {
      dispatch({ type: "ENTER_FATE" });
    } else {
      dispatch({ type: "ADVANCE_LEVEL" });
    }
  }, [state.currentLevel]);

  // ===== 骰子投掷 =====
  const handleRollFate = useCallback(() => {
    setIsFateRolling(true);
    const result = rollFateDice();

    setTimeout(() => {
      const updatedSquad =
        result.healPercent > 0
          ? applyHeal(state.playerSquad, result.healPercent)
          : [...state.playerSquad];

      if (result.bonusCard) {
        const bonusCards = drawCardsFromGacha(1);
        if (bonusCards.length > 0) {
          const newUnit = createPlayerBattleUnit(bonusCards[0]);
          updatedSquad.push(newUnit);
        }
      }

      dispatch({ type: "SET_FATE_RESULT", result, updatedSquad });
      setIsFateRolling(false);
    }, 2800);
  }, [state.playerSquad]);

  // ===== 命运事件结束后继续 =====
  const handleFateContinue = useCallback(() => {
    dispatch({ type: "ADVANCE_LEVEL" });
  }, []);

  // ===== 结算/撤退 =====
  const handleCashOut = useCallback(() => {
    dispatch({ type: "CASH_OUT" });
  }, []);

  // ===== 重新开始 =====
  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
    setBetInput("10");
  }, []);

  // ===== 战败处理 =====
  const handleGameOver = useCallback(() => {
    dispatch({ type: "GAME_OVER" });
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center p-4 gap-6">
      {/* 标题 */}
      <header className="text-center mt-4">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          ⚔️ Ether Dungeon
        </h1>
        <p className="text-gray-500 text-sm mt-1">Endless Siege — 无尽地牢</p>
      </header>

      {/* HUD */}
      {state.phase !== "IDLE" && (
        <GameHUD
          currentLevel={state.currentLevel}
          jackpot={state.jackpot}
          betAmount={state.betAmount}
          squadSize={
            state.playerSquad.filter(
              (u: { currentHp: number }) => u.currentHp > 0,
            ).length
          }
        />
      )}

      {/* ====== 各阶段 UI ====== */}

      {/* 首页 */}
      {state.phase === "IDLE" && (
        <div className="flex flex-col items-center gap-6 mt-12">
          <div className="text-6xl">🏰</div>
          <p className="text-gray-400 max-w-md text-center">
            支付门票入场，召唤英灵军团，挑战无尽深渊。
            <br />
            你能坚持多少层？还是在贪婪中归零？
          </p>
          <div className="flex items-center gap-3 mt-4">
            <label className="text-sm text-gray-400">门票 (USDT):</label>
            <input
              type="number"
              value={betInput}
              onChange={(e) => setBetInput(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-center focus:outline-none focus:border-cyan-500"
              min="1"
            />
          </div>
          <button
            onClick={handleStartGame}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold text-lg hover:scale-105 transition-transform"
          >
            ⚔️ 进入深渊
          </button>

          {state.totalGamesPlayed > 0 && (
            <div className="text-xs text-gray-600 mt-4">
              历史战绩：{state.totalGamesPlayed} 局 | 总收益：
              {state.totalWinnings.toFixed(2)} USDT
            </div>
          )}
        </div>
      )}

      {/* 抽卡动画 */}
      {state.phase === "RECRUITING" && (
        <div className="flex flex-col items-center gap-4 mt-16">
          <div className="text-6xl animate-bounce">🎴</div>
          <p className="text-cyan-400 animate-pulse text-lg">正在召唤英灵...</p>
          <p className="text-gray-500 text-xs">(模拟 Chainlink VRF 请求中)</p>
        </div>
      )}

      {/* 排兵布阵 */}
      {state.phase === "PREPARING" && (
        <div className="flex flex-col items-center gap-6 w-full">
          <h2 className="text-xl font-bold text-cyan-400">📋 排兵布阵</h2>
          <p className="text-gray-500 text-sm">调整站位顺序，前排先接战</p>

          <div className="flex gap-4 items-end">
            {state.playerSquad.map(
              (
                unit: {
                  currentHp: number;
                  maxHp: number;
                  atk: number;
                  name: string;
                  icon: string;
                  unitId: number;
                  isEnemy: boolean;
                },
                i: number,
              ) => (
                <div
                  key={`prep-${i}`}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMoveUp(i)}
                      className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30"
                      disabled={i === 0}
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => handleMoveDown(i)}
                      className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30"
                      disabled={i === state.playerSquad.length - 1}
                    >
                      ▶
                    </button>
                  </div>
                  <UnitCard unit={unit} index={i} size="lg" />
                  <span className="text-xs text-gray-500">
                    {i === 0
                      ? "🔰 前排"
                      : i === state.playerSquad.length - 1
                        ? "🎯 后排"
                        : "中坚"}
                  </span>
                </div>
              ),
            )}
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleBattle}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-lg hover:scale-105 transition-transform"
            >
              ⚔️ 开始战斗
            </button>
            {state.currentLevel > 1 && (
              <button
                onClick={handleCashOut}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-bold text-lg hover:scale-105 transition-transform"
              >
                💰 结算离场 ({state.jackpot.toFixed(2)})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 战斗中 + 战斗结果 */}
      {(state.phase === "BATTLING" || state.phase === "BATTLE_RESULT") && (
        <div className="flex flex-col items-center gap-6 w-full">
          <Battlefield
            playerSquad={state.playerSquad}
            enemySquad={state.enemySquad}
            currentLevel={state.currentLevel}
          />

          {state.battleLog.length > 0 && (
            <BattleLogViewer
              rounds={state.battleLog}
              autoPlay={state.phase === "BATTLING"}
            />
          )}

          {state.phase === "BATTLE_RESULT" && (
            <div className="flex flex-col items-center gap-4 mt-2">
              {state.lastBattleWon ? (
                <>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-400">
                      {state.lastBattleDraw ? "⚖️ 惨胜 (平局)" : "🎉 胜利!"}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      奖金池: {state.jackpot.toFixed(2)} USDT
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleNextLevel}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold hover:scale-105 transition-transform"
                    >
                      ⬇️ 深入下一层
                    </button>
                    <button
                      onClick={handleCashOut}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-bold hover:scale-105 transition-transform"
                    >
                      💰 见好就收 ({state.jackpot.toFixed(2)})
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-red-400">💀 全军覆没</p>
                  <p className="text-sm text-gray-400">
                    你的军团在深渊中化为灰烬…奖金池归零。
                  </p>
                  <button
                    onClick={handleGameOver}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold hover:scale-105 transition-transform"
                  >
                    确认
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 命运转盘 */}
      {(state.phase === "FATE_ROLL" || state.phase === "FATE_RESULT") && (
        <div className="flex flex-col items-center gap-6 mt-8">
          <h2 className="text-2xl font-bold text-purple-400">🎲 命运之间</h2>
          <p className="text-gray-400 text-sm">
            每 3 层的必经之路...掷出你的命运
          </p>

          {state.phase === "FATE_ROLL" && !isFateRolling && (
            <button
              onClick={handleRollFate}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl hover:scale-105 transition-transform animate-pulse"
            >
              🎲 掷骰子
            </button>
          )}

          {(isFateRolling || state.phase === "FATE_RESULT") && (
            <FateWheelDisplay
              result={state.lastFateResult}
              isRolling={isFateRolling}
            />
          )}

          {state.phase === "FATE_RESULT" && (
            <button
              onClick={handleFateContinue}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold hover:scale-105 transition-transform mt-4"
            >
              ⬇️ 继续深入
            </button>
          )}
        </div>
      )}

      {/* 结算画面 */}
      {state.phase === "CASH_OUT" && (
        <div className="flex flex-col items-center gap-6 mt-12">
          <div className="text-6xl">🏆</div>
          <h2 className="text-3xl font-extrabold text-yellow-400">
            成功逃离深渊!
          </h2>
          <div className="bg-gray-800/60 rounded-xl p-6 text-center border border-yellow-500/30">
            <p className="text-gray-400 text-sm">最终收益</p>
            <p className="text-4xl font-bold text-yellow-300 mt-2">
              {state.jackpot.toFixed(2)} USDT
            </p>
            <p className="text-sm text-gray-500 mt-2">
              到达层数: Level {state.maxLevelReached} | 投入本金:{" "}
              {state.betAmount} USDT
            </p>
            <p className="text-sm mt-1">
              {state.jackpot > state.betAmount ? (
                <span className="text-green-400">
                  净利润: +{(state.jackpot - state.betAmount).toFixed(2)} USDT
                  🎉
                </span>
              ) : (
                <span className="text-red-400">
                  净亏损: {(state.jackpot - state.betAmount).toFixed(2)} USDT
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold hover:scale-105 transition-transform"
          >
            🔄 再来一局
          </button>
        </div>
      )}

      {/* Game Over */}
      {state.phase === "GAME_OVER" && (
        <div className="flex flex-col items-center gap-6 mt-12">
          <div className="text-6xl">💀</div>
          <h2 className="text-3xl font-extrabold text-red-400">Game Over</h2>
          <p className="text-gray-500 max-w-sm text-center">
            你的军团在 Level {state.maxLevelReached} 全灭。
            <br />
            奖金池已被深渊吞噬。
          </p>
          <button
            onClick={handleReset}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold hover:scale-105 transition-transform"
          >
            🔄 重整旗鼓
          </button>
        </div>
      )}

      {/* 底部 */}
      <footer className="mt-auto py-4 text-center text-gray-600 text-xs">
        Ether Dungeon v0.1 — Local Prototype (Pseudo-Random) | SC6107
        Development Project
      </footer>
    </main>
  );
}
