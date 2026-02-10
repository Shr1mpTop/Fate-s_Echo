// ========================================
// 卡牌数据库 (Card Registry)
// 模拟链上 CardRegistry.sol 的查表功能
// ========================================

export interface UnitStats {
  id: number;
  name: string;
  nameZh: string; // 中文名
  type: string; // 职业类型
  baseAtk: number; // 基础攻击
  baseHp: number; // 基础生命
  rarity: "N" | "R" | "SR" | "SSR";
  description: string;
  icon: string; // 前端图标标识
}

/**
 * 全部可用的兵种数据。
 * 未来迁移链上时，这些数据将通过 CardRegistry.sol 的 setCardStats() 批量录入。
 */
export const UNIT_LIBRARY: UnitStats[] = [
  {
    id: 1,
    name: "Iron Guard",
    nameZh: "铁壁卫士",
    type: "Tank",
    baseAtk: 2,
    baseHp: 20,
    rarity: "N",
    description: "坚如磐石的盾卫，以血肉之躯为后方争取时间。",
    icon: "🛡️",
  },
  {
    id: 2,
    name: "Shadow Blade",
    nameZh: "暗影刺客",
    type: "Assassin",
    baseAtk: 8,
    baseHp: 4,
    rarity: "R",
    description: "一击致命的杀手，但脆如薄纸。",
    icon: "🗡️",
  },
  {
    id: 3,
    name: "Noble Knight",
    nameZh: "均衡骑士",
    type: "Warrior",
    baseAtk: 4,
    baseHp: 10,
    rarity: "N",
    description: "攻守兼备的全能战士，适合应对未知局面。",
    icon: "⚔️",
  },
  {
    id: 4,
    name: "Berserker",
    nameZh: "暴怒狂战士",
    type: "Warrior",
    baseAtk: 6,
    baseHp: 8,
    rarity: "R",
    description: "嗜血的疯狂战士，善于撕裂防线。",
    icon: "🪓",
  },
  {
    id: 5,
    name: "Elven Archer",
    nameZh: "精灵弓手",
    type: "Ranger",
    baseAtk: 5,
    baseHp: 6,
    rarity: "N",
    description: "精准的远程输出，是阵容的稳定火力来源。",
    icon: "🏹",
  },
  {
    id: 6,
    name: "Dark Mage",
    nameZh: "暗黑法师",
    type: "Mage",
    baseAtk: 7,
    baseHp: 5,
    rarity: "R",
    description: "操纵虚空能量的法师，高攻击但身体脆弱。",
    icon: "🔮",
  },
  {
    id: 7,
    name: "Stone Golem",
    nameZh: "岩石傀儡",
    type: "Tank",
    baseAtk: 3,
    baseHp: 16,
    rarity: "R",
    description: "远古造物，移动缓慢但异常坚韧。",
    icon: "🗿",
  },
  {
    id: 8,
    name: "Holy Paladin",
    nameZh: "圣光骑士",
    type: "Warrior",
    baseAtk: 5,
    baseHp: 12,
    rarity: "SR",
    description: "圣光眷顾的骑士，攻防高于均衡骑士。",
    icon: "✨",
  },
  {
    id: 9,
    name: "Phantom Thief",
    nameZh: "幻影盗贼",
    type: "Assassin",
    baseAtk: 9,
    baseHp: 3,
    rarity: "SR",
    description: "来无影去无踪，攻击力极高但触碰即死。",
    icon: "👻",
  },
  {
    id: 10,
    name: "Genesis Dragon",
    nameZh: "创世巨龙",
    type: "Legend",
    baseAtk: 15,
    baseHp: 30,
    rarity: "SSR",
    description: "传说中的创世巨龙，出现概率极低，无人可挡。",
    icon: "🐉",
  },
];

/**
 * 卡牌稀有度对应的抽取权重（权重越大越容易抽到）
 */
export const RARITY_WEIGHTS: Record<string, number> = {
  N: 50,
  R: 30,
  SR: 15,
  SSR: 1,
};

/**
 * 根据 ID 查询单位属性
 */
export function getUnitById(id: number): UnitStats | undefined {
  return UNIT_LIBRARY.find((u) => u.id === id);
}

/**
 * 获取所有 ID 列表
 */
export function getAllUnitIds(): number[] {
  return UNIT_LIBRARY.map((u) => u.id);
}
