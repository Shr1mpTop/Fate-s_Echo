"use client";

interface GameHUDProps {
  currentLevel: number;
  jackpot: number;
  betAmount: number;
  squadSize: number;
}

export default function GameHUD({
  currentLevel,
  jackpot,
  betAmount,
  squadSize,
}: GameHUDProps) {
  const profitPercent =
    betAmount > 0
      ? (((jackpot - betAmount) / betAmount) * 100).toFixed(1)
      : "0";
  const isProfit = jackpot > betAmount;

  return (
    <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4 px-4 py-3 bg-gray-900/60 backdrop-blur rounded-xl border border-gray-700">
      {/* 关卡 */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs uppercase">Floor</span>
        <span className="text-2xl font-extrabold text-white">
          {currentLevel}
        </span>
      </div>

      {/* 奖金池 */}
      <div className="flex flex-col items-center">
        <span className="text-gray-500 text-xs uppercase">Jackpot</span>
        <span className="text-xl font-bold text-yellow-400">
          💰 {jackpot.toFixed(2)} USDT
        </span>
        <span
          className={`text-xs ${isProfit ? "text-green-400" : "text-red-400"}`}
        >
          {isProfit ? "+" : ""}
          {profitPercent}%
        </span>
      </div>

      {/* 兵力 */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs uppercase">Squad</span>
        <span className="text-2xl font-extrabold text-cyan-400">
          {squadSize} 🗡️
        </span>
      </div>
    </div>
  );
}
