// ========================================
// 关卡数据 & 敌方生成器 (Level & Enemy Generator)
// 模拟链上基于 Level + RandomSeed 生成敌方阵容
// ========================================

import { UNIT_LIBRARY, type UnitStats } from "./cardRegistry";

export interface EnemyTemplate {
  id: number;
  name: string;
  nameZh: string;
  atk: number;
  hp: number;
  icon: string;
}

/**
 * 敌方单位模板库 - 深渊梦魇 (Glitch Nightmare) 阵营
 */
const ENEMY_TEMPLATES: EnemyTemplate[] = [
  {
    id: 101,
    name: "Glitch Slime",
    nameZh: "故障史莱姆",
    atk: 2,
    hp: 5,
    icon: "👾",
  },
  { id: 102, name: "Void Rat", nameZh: "虚空鼠", atk: 3, hp: 4, icon: "🐀" },
  {
    id: 103,
    name: "Pixel Skeleton",
    nameZh: "像素骷髅",
    atk: 4,
    hp: 6,
    icon: "💀",
  },
  {
    id: 104,
    name: "Data Wraith",
    nameZh: "数据幽灵",
    atk: 5,
    hp: 8,
    icon: "👁️",
  },
  {
    id: 105,
    name: "Corrupted Bot",
    nameZh: "崩坏机器人",
    atk: 6,
    hp: 10,
    icon: "🤖",
  },
  {
    id: 106,
    name: "Abyss Knight",
    nameZh: "深渊骑士",
    atk: 7,
    hp: 12,
    icon: "⚫",
  },
  {
    id: 107,
    name: "Nightmare Beast",
    nameZh: "梦魇巨兽",
    atk: 8,
    hp: 15,
    icon: "🦇",
  },
  {
    id: 108,
    name: "Virus Dragon",
    nameZh: "病毒巨龙",
    atk: 12,
    hp: 25,
    icon: "🐲",
  },
];

/**
 * 根据关卡 Level 和随机种子生成敌方阵容
 *
 * 难度公式：
 * - 敌方数量：min(1 + floor(level/2), 5)
 * - 属性缩放：baseAtk * (1 + level * 0.15), baseHp * (1 + level * 0.15)
 *
 * @param level 当前关卡
 * @param seed  随机种子（本地用 Math.random, 链上用 VRF）
 */
export function generateEnemySquad(level: number, seed?: number): BattleUnit[] {
  const rng = createSeededRandom(seed ?? Math.random() * 999999);

  // 敌方数量：1~5 随层数递增
  const enemyCount = Math.min(1 + Math.floor(level / 2), 5);

  // 根据层级选择可用的敌方模板范围
  const maxTemplateIndex = Math.min(
    Math.floor(level / 2) + 2,
    ENEMY_TEMPLATES.length,
  );
  const availableTemplates = ENEMY_TEMPLATES.slice(0, maxTemplateIndex);

  const squad: BattleUnit[] = [];
  const scaleFactor = 1 + level * 0.15;

  for (let i = 0; i < enemyCount; i++) {
    const tmpl =
      availableTemplates[Math.floor(rng() * availableTemplates.length)];
    squad.push({
      unitId: tmpl.id,
      name: tmpl.nameZh,
      icon: tmpl.icon,
      atk: Math.ceil(tmpl.atk * scaleFactor),
      maxHp: Math.ceil(tmpl.hp * scaleFactor),
      currentHp: Math.ceil(tmpl.hp * scaleFactor),
      isEnemy: true,
    });
  }

  return squad;
}

/**
 * 战斗中使用的单位实例（包含当前血量等运行时状态）
 */
export interface BattleUnit {
  unitId: number;
  name: string;
  icon: string;
  atk: number;
  maxHp: number;
  currentHp: number;
  isEnemy: boolean;
}

/**
 * 根据卡牌数据创建玩家方的战斗单位
 */
export function createPlayerBattleUnit(stats: UnitStats): BattleUnit {
  return {
    unitId: stats.id,
    name: stats.nameZh,
    icon: stats.icon,
    atk: stats.baseAtk,
    maxHp: stats.baseHp,
    currentHp: stats.baseHp,
    isEnemy: false,
  };
}

// ===== 伪随机数生成器 (Seeded PRNG) =====
// 本地用，上链后替换为 Chainlink VRF
function createSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
