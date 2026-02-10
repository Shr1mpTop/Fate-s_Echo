// ========================================
// 抽卡系统 (Gacha / Draw System)
// 本地伪随机版，未来替换为 Chainlink VRF
// ========================================

import {
  UNIT_LIBRARY,
  RARITY_WEIGHTS,
  type UnitStats,
} from "../data/cardRegistry";

/**
 * 根据权重随机抽取指定数量的卡牌
 * 同一张卡可以被重复抽到（不去重）
 *
 * @param count 抽取数量（默认 3）
 * @returns 抽到的卡牌数据数组
 */
export function drawCards(count: number = 3): UnitStats[] {
  const results: UnitStats[] = [];

  // 构建权重池
  const weightedPool: UnitStats[] = [];
  for (const unit of UNIT_LIBRARY) {
    const weight = RARITY_WEIGHTS[unit.rarity] ?? 1;
    for (let i = 0; i < weight; i++) {
      weightedPool.push(unit);
    }
  }

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * weightedPool.length);
    results.push(weightedPool[idx]);
  }

  return results;
}
