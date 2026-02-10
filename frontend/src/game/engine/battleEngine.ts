// ========================================
// 战斗引擎 (Battle Engine)
// 核心：队列对冲机制 (Queue Collision)
// 模拟链上 DungeonEngine.sol 的 battle() 函数
// ========================================

import type { BattleUnit } from "../data/levelGenerator";

/**
 * 单回合战斗日志
 */
export interface BattleRoundLog {
  round: number;
  attackerName: string;
  attackerIcon: string;
  defenderName: string;
  defenderIcon: string;
  attackerDamage: number; // 攻击方对防御方造成的伤害
  defenderDamage: number; // 防御方对攻击方造成的伤害
  attackerHpAfter: number;
  defenderHpAfter: number;
  attackerDied: boolean;
  defenderDied: boolean;
}

/**
 * 战斗最终结果
 */
export interface BattleResult {
  won: boolean; // 玩家是否胜利
  isDraw: boolean; // 是否平局（双方同归于尽）
  rounds: BattleRoundLog[]; // 回合日志（用于前端回放动画）
  survivingPlayerUnits: BattleUnit[];
  survivingEnemyUnits: BattleUnit[];
  totalPlayerDamageDealt: number;
  totalEnemyDamageDealt: number;
}

/**
 * 执行一场完整的队列对冲战斗
 *
 * 规则（来自 GAME_DESIGN_SPEC.md）：
 * 1. 玩家队列 P[0] 对撞 敌方队列 E[0]
 * 2. 双方同时扣血：P[0].hp -= E[0].atk; E[0].hp -= P[0].atk
 * 3. HP ≤ 0 的单位死亡移出队列
 * 4. 幸存者继续与对方下一位单位战斗（保持残血）
 * 5. 一方队列清空则战斗结束
 *
 * @param playerSquad 玩家方阵容（按站位顺序）
 * @param enemySquad  敌方阵容
 * @returns BattleResult 详细战斗结果
 */
export function executeBattle(
  playerSquad: BattleUnit[],
  enemySquad: BattleUnit[],
): BattleResult {
  // 深拷贝，不污染原数据
  const players = playerSquad.map((u) => ({ ...u }));
  const enemies = enemySquad.map((u) => ({ ...u }));

  const rounds: BattleRoundLog[] = [];
  let round = 0;
  let totalPlayerDmg = 0;
  let totalEnemyDmg = 0;

  let pIdx = 0; // 玩家方当前上场索引
  let eIdx = 0; // 敌方当前上场索引

  // 最大回合数限制（防止死循环，链上也需要这个保护）
  const MAX_ROUNDS = 100;

  while (pIdx < players.length && eIdx < enemies.length && round < MAX_ROUNDS) {
    round++;
    const attacker = players[pIdx];
    const defender = enemies[eIdx];

    // 同时扣血
    const dmgToEnemy = attacker.atk;
    const dmgToPlayer = defender.atk;

    defender.currentHp -= dmgToEnemy;
    attacker.currentHp -= dmgToPlayer;

    totalPlayerDmg += dmgToEnemy;
    totalEnemyDmg += dmgToPlayer;

    const attackerDied = attacker.currentHp <= 0;
    const defenderDied = defender.currentHp <= 0;

    rounds.push({
      round,
      attackerName: attacker.name,
      attackerIcon: attacker.icon,
      defenderName: defender.name,
      defenderIcon: defender.icon,
      attackerDamage: dmgToEnemy,
      defenderDamage: dmgToPlayer,
      attackerHpAfter: Math.max(0, attacker.currentHp),
      defenderHpAfter: Math.max(0, defender.currentHp),
      attackerDied,
      defenderDied,
    });

    // 死亡判定与队列推进
    if (attackerDied) pIdx++;
    if (defenderDied) eIdx++;
  }

  // 收集存活单位
  const survivingPlayerUnits = players.filter((u) => u.currentHp > 0);
  const survivingEnemyUnits = enemies.filter((u) => u.currentHp > 0);

  // 胜负判定
  const playerAlive = survivingPlayerUnits.length > 0;
  const enemyAlive = survivingEnemyUnits.length > 0;

  let won = false;
  let isDraw = false;

  if (!playerAlive && !enemyAlive) {
    // 同归于尽：算惨胜
    isDraw = true;
    won = true;
  } else if (playerAlive && !enemyAlive) {
    won = true;
  } else {
    won = false;
  }

  return {
    won,
    isDraw,
    rounds,
    survivingPlayerUnits,
    survivingEnemyUnits,
    totalPlayerDamageDealt: totalPlayerDmg,
    totalEnemyDamageDealt: totalEnemyDmg,
  };
}
