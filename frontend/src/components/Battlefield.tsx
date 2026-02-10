"use client";

import type { BattleUnit } from "@/game";
import UnitCard from "./UnitCard";

interface BattlefieldProps {
  playerSquad: BattleUnit[];
  enemySquad: BattleUnit[];
  currentLevel: number;
}

export default function Battlefield({
  playerSquad,
  enemySquad,
  currentLevel,
}: BattlefieldProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 关卡标题 */}
      <div className="text-center mb-6">
        <span className="text-xs text-gray-500 uppercase tracking-widest">
          Floor
        </span>
        <h2 className="text-3xl font-bold text-white">Level {currentLevel}</h2>
        <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mt-2" />
      </div>

      {/* 战场网格 */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        {/* 己方 (左侧) */}
        <div className="flex flex-col items-end gap-3">
          <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            🔵 Genesis Legion
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            {playerSquad.map((unit, i) => (
              <UnitCard key={`p-${i}`} unit={unit} index={i} size="md" />
            ))}
          </div>
        </div>

        {/* VS 分隔符 */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-4xl font-extrabold text-white/20">VS</div>
          <div className="w-0.5 h-20 bg-gradient-to-b from-cyan-500 via-white/20 to-red-500" />
        </div>

        {/* 敌方 (右侧) */}
        <div className="flex flex-col items-start gap-3">
          <span className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">
            🔴 Glitch Nightmare
          </span>
          <div className="flex flex-wrap gap-2">
            {enemySquad.map((unit, i) => (
              <UnitCard key={`e-${i}`} unit={unit} index={i} size="md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
