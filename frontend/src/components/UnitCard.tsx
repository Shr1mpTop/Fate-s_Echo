"use client";

import type { BattleUnit } from "@/game";

interface UnitCardProps {
  unit: BattleUnit;
  index?: number;
  isSelected?: boolean;
  onClick?: () => void;
  showHpBar?: boolean;
  size?: "sm" | "md" | "lg";
}

const rarityBorderColor: Record<string, string> = {
  Tank: "border-cyan-400",
  Assassin: "border-red-400",
  Warrior: "border-yellow-400",
  Ranger: "border-green-400",
  Mage: "border-purple-400",
  Legend: "border-amber-300",
};

export default function UnitCard({
  unit,
  index,
  isSelected = false,
  onClick,
  showHpBar = true,
  size = "md",
}: UnitCardProps) {
  const hpPercent = Math.max(0, (unit.currentHp / unit.maxHp) * 100);
  const isDead = unit.currentHp <= 0;

  const sizeClasses = {
    sm: "w-20 h-28 text-xs",
    md: "w-28 h-40 text-sm",
    lg: "w-36 h-48 text-base",
  };

  const iconSizes = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-between
        rounded-lg border-2 p-2 transition-all duration-200
        ${sizeClasses[size]}
        ${isDead ? "opacity-30 grayscale border-gray-600 bg-gray-900" : ""}
        ${!isDead && isSelected ? "ring-2 ring-cyan-400 scale-105 bg-gray-800" : ""}
        ${!isDead && !isSelected ? "bg-gray-900/80 hover:bg-gray-800/90" : ""}
        ${!isDead ? (unit.isEnemy ? "border-red-500/60" : "border-cyan-500/60") : ""}
        ${onClick && !isDead ? "cursor-pointer hover:scale-105" : ""}
      `}
    >
      {/* 索引标识 */}
      {index !== undefined && (
        <span className="absolute -top-2 -left-2 bg-gray-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
          {index + 1}
        </span>
      )}

      {/* 头像 (Emoji) */}
      <div className={`${iconSizes[size]} leading-none mt-1`}>{unit.icon}</div>

      {/* 名字 */}
      <div className="text-center font-bold text-white/90 truncate w-full px-1">
        {unit.name}
      </div>

      {/* 属性栏 */}
      <div className="flex gap-2 items-center text-xs">
        <span className="text-yellow-400">⚔️ {unit.atk}</span>
        <span className="text-red-400">
          ❤️ {unit.currentHp}/{unit.maxHp}
        </span>
      </div>

      {/* 血条 */}
      {showHpBar && !isDead && (
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              hpPercent > 60
                ? "bg-green-500"
                : hpPercent > 30
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      )}

      {/* 死亡标记 */}
      {isDead && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">💀</span>
        </div>
      )}
    </div>
  );
}
