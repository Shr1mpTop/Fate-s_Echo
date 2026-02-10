"use client";

import { useState, useEffect } from "react";
import type { FateEventResult } from "@/game";

interface FateWheelDisplayProps {
  result: FateEventResult | null;
  isRolling: boolean;
  onRollComplete?: () => void;
}

export default function FateWheelDisplay({
  result,
  isRolling,
  onRollComplete,
}: FateWheelDisplayProps) {
  const [displayNumber, setDisplayNumber] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!isRolling) return;

    setShowResult(false);
    let frame = 0;
    const maxFrames = 30;

    const timer = setInterval(() => {
      frame++;
      setDisplayNumber(Math.floor(Math.random() * 100) + 1);

      if (frame >= maxFrames) {
        clearInterval(timer);
        if (result) {
          setDisplayNumber(result.roll);
        }
        setTimeout(() => {
          setShowResult(true);
          onRollComplete?.();
        }, 500);
      }
    }, 80);

    return () => clearInterval(timer);
  }, [isRolling, result, onRollComplete]);

  const eventColors: Record<string, string> = {
    CURSED: "text-purple-400 bg-purple-900/30 border-purple-500",
    SILENCE: "text-gray-400 bg-gray-800/30 border-gray-500",
    GREED: "text-yellow-400 bg-yellow-900/30 border-yellow-500",
    BLESSING: "text-green-400 bg-green-900/30 border-green-500",
    JACKPOT: "text-amber-300 bg-amber-900/30 border-amber-400",
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 骰子 */}
      <div className="relative">
        <div
          className={`
            w-32 h-32 rounded-2xl border-4 flex items-center justify-center
            transition-all duration-300
            ${isRolling ? "border-white animate-spin bg-gray-800" : "border-cyan-500 bg-gray-900"}
            ${showResult && result ? eventColors[result.eventType]?.split(" ")[0] || "" : ""}
          `}
          style={isRolling ? { animationDuration: "0.3s" } : {}}
        >
          <span
            className={`font-mono font-extrabold ${isRolling ? "text-3xl text-white" : "text-5xl"}`}
          >
            {displayNumber || "?"}
          </span>
        </div>
      </div>

      {/* 事件结果 */}
      {showResult && result && (
        <div
          className={`
            max-w-md w-full rounded-xl border-2 p-6 text-center
            animate-fade-in
            ${eventColors[result.eventType] || "border-gray-500 bg-gray-800/30"}
          `}
        >
          <div className="text-5xl mb-3">{result.eventIcon}</div>
          <h3 className="text-xl font-bold mb-1">{result.eventNameZh}</h3>
          <p className="text-sm text-gray-300">{result.eventName}</p>
          <p className="mt-3 text-sm leading-relaxed">{result.description}</p>

          {/* 效果标签 */}
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            {result.jackpotDelta !== 0 && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  result.jackpotDelta > 0
                    ? "bg-green-800 text-green-300"
                    : "bg-red-800 text-red-300"
                }`}
              >
                奖金池 {result.jackpotDelta > 0 ? "+" : ""}
                {(result.jackpotDelta * 100).toFixed(0)}%
              </span>
            )}
            {result.healPercent > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-800 text-green-300">
                治疗 {(result.healPercent * 100).toFixed(0)}%
              </span>
            )}
            {result.bonusCard && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-800 text-amber-300">
                +1 卡牌
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
