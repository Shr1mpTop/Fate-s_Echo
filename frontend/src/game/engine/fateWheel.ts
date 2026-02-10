// ========================================
// 命运转盘 / 骰子系统 (Wheel of Fate)
// 每 3 关触发一次的纯概率博弈
// ========================================

import type { BattleUnit } from "../data/levelGenerator";

/**
 * 命运事件类型
 */
export type FateEventType =
  | "CURSED"
  | "SILENCE"
  | "GREED"
  | "BLESSING"
  | "JACKPOT";

/**
 * 命运事件结果
 */
export interface FateEventResult {
  roll: number; // 实际骰子点数 1-100
  eventType: FateEventType;
  eventName: string;
  eventNameZh: string;
  eventIcon: string;
  description: string;
  jackpotDelta: number; // 奖金池变化（正数为增加的倍率，负数为扣除的比例）
  healPercent: number; // 治疗百分比（0 = 不治疗, 1 = 满血）
  bonusCard: boolean; // 是否获得额外卡牌
}

/**
 * 事件配置表
 * 骰子范围 1 - 100：
 *   1-15  ☠️ 大凶：扣除 20% 奖金
 *   16-50 💤 平庸：回复 10% HP
 *   51-85 💰 吉：奖金池 +20%
 *   86-98 ❤️ 大吉：全队满血
 *   99-100 🎰 奇迹：获得额外卡牌
 */
const FATE_TABLE: {
  min: number;
  max: number;
  type: FateEventType;
  name: string;
  nameZh: string;
  icon: string;
  desc: string;
  jackpotDelta: number;
  healPercent: number;
  bonusCard: boolean;
}[] = [
  {
    min: 1,
    max: 15,
    type: "CURSED",
    name: "Abyss Gaze",
    nameZh: "深渊凝视",
    icon: "☠️",
    desc: "深渊的诅咒笼罩了你的军团！奖金池被扣除 20%。",
    jackpotDelta: -0.2,
    healPercent: 0,
    bonusCard: false,
  },
  {
    min: 16,
    max: 50,
    type: "SILENCE",
    name: "Silent Moment",
    nameZh: "寂静时刻",
    icon: "💤",
    desc: "一切归于平静…你的军团小憩片刻，少量恢复体力。",
    jackpotDelta: 0,
    healPercent: 0.1,
    bonusCard: false,
  },
  {
    min: 51,
    max: 85,
    type: "GREED",
    name: "Greed's Gift",
    nameZh: "贪婪馈赠",
    icon: "💰",
    desc: "发现了一个隐藏的宝箱！奖金池增加 20%！",
    jackpotDelta: 0.2,
    healPercent: 0,
    bonusCard: false,
  },
  {
    min: 86,
    max: 98,
    type: "BLESSING",
    name: "Fountain Blessing",
    nameZh: "泉水祝福",
    icon: "❤️",
    desc: "神秘的治愈泉水涌出！所有存活单位生命值完全恢复！",
    jackpotDelta: 0,
    healPercent: 1.0,
    bonusCard: false,
  },
  {
    min: 99,
    max: 100,
    type: "JACKPOT",
    name: "The Jackpot",
    nameZh: "命运大奖",
    icon: "🎰",
    desc: "难以置信！命运之轮降下奇迹！获得一张额外的卡牌加入你的队伍！",
    jackpotDelta: 0,
    healPercent: 0.5,
    bonusCard: true,
  },
];

/**
 * 判断当前关卡是否应触发命运转盘
 * 每 3 关触发一次（完成 Level 3, 6, 9...后）
 */
export function shouldTriggerFate(level: number): boolean {
  return level > 0 && level % 3 === 0;
}

/**
 * 掷骰子并返回命运事件结果
 * 本地使用 Math.random()，链上替换为 VRF
 */
export function rollFateDice(): FateEventResult {
  const roll = Math.floor(Math.random() * 100) + 1; // 1 ~ 100
  return resolveFateEvent(roll);
}

/**
 * 根据给定的骰子点数解析命运事件（纯函数，便于测试与链上迁移）
 */
export function resolveFateEvent(roll: number): FateEventResult {
  const event = FATE_TABLE.find((e) => roll >= e.min && roll <= e.max);

  if (!event) {
    // fallback: 不应该发生
    return {
      roll,
      eventType: "SILENCE",
      eventName: "Unknown",
      eventNameZh: "未知",
      eventIcon: "❓",
      description: "什么也没发生。",
      jackpotDelta: 0,
      healPercent: 0,
      bonusCard: false,
    };
  }

  return {
    roll,
    eventType: event.type,
    eventName: event.name,
    eventNameZh: event.nameZh,
    eventIcon: event.icon,
    description: event.desc,
    jackpotDelta: event.jackpotDelta,
    healPercent: event.healPercent,
    bonusCard: event.bonusCard,
  };
}

/**
 * 对玩家队伍应用治疗效果
 * @param squad 当前存活的玩家单位
 * @param healPercent 治疗比例 (0 ~ 1)
 * @returns 治疗后的单位列表
 */
export function applyHeal(
  squad: BattleUnit[],
  healPercent: number,
): BattleUnit[] {
  return squad.map((u) => ({
    ...u,
    currentHp: Math.min(
      u.maxHp,
      u.currentHp + Math.ceil(u.maxHp * healPercent),
    ),
  }));
}
