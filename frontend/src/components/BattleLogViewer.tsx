"use client";

import type { BattleRoundLog } from "@/game";
import { useEffect, useState } from "react";

interface BattleLogViewerProps {
  rounds: BattleRoundLog[];
  autoPlay?: boolean;
  onComplete?: () => void;
}

export default function BattleLogViewer({
  rounds,
  autoPlay = true,
  onComplete,
}: BattleLogViewerProps) {
  const [visibleCount, setVisibleCount] = useState(
    autoPlay ? 0 : rounds.length,
  );

  useEffect(() => {
    if (!autoPlay || rounds.length === 0) return;

    setVisibleCount(0);
    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      setVisibleCount(idx);
      if (idx >= rounds.length) {
        clearInterval(timer);
        setTimeout(() => onComplete?.(), 800);
      }
    }, 600);

    return () => clearInterval(timer);
  }, [rounds, autoPlay, onComplete]);

  const visibleRounds = rounds.slice(0, visibleCount);

  return (
    <div className="w-full max-w-2xl mx-auto bg-black/40 rounded-lg border border-gray-700 p-4 max-h-64 overflow-y-auto">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
        ⏳ Battle Log
      </h3>
      {visibleRounds.length === 0 && (
        <p className="text-gray-500 text-sm animate-pulse">战斗即将开始...</p>
      )}
      {visibleRounds.map((r) => (
        <div
          key={r.round}
          className="flex items-center gap-2 py-1.5 border-b border-gray-800 text-sm animate-fade-in"
        >
          <span className="text-gray-500 w-8 text-right">R{r.round}</span>
          <span className="text-cyan-400">
            {r.attackerIcon} {r.attackerName}
          </span>
          <span className="text-yellow-300">⚔️ {r.attackerDamage}</span>
          <span className="text-gray-500">vs</span>
          <span className="text-red-400">
            {r.defenderIcon} {r.defenderName}
          </span>
          <span className="text-yellow-300">⚔️ {r.defenderDamage}</span>

          {/* 死亡标识 */}
          <span className="ml-auto flex gap-1">
            {r.attackerDied && (
              <span className="text-cyan-300 text-xs">💀己</span>
            )}
            {r.defenderDied && (
              <span className="text-red-300 text-xs">💀敌</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
