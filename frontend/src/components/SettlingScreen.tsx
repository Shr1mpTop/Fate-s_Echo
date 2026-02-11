import React, { useEffect, useState } from "react";
import { soundManager } from "../utils/soundManager";
import type { BattleResult } from "../engine/battleEngine";
import type { GameFlowState } from "../web3/useFateEcho";

interface SettlingScreenProps {
  flowState: GameFlowState;
  battleResult: BattleResult;
  betAmount: string;
  errorMessage: string | null;
  onReset: () => void;
}

const SETTLING_MESSAGES = [
  { icon: "📜", text: "The scribe records the battle..." },
  { icon: "⚖️", text: "Justice weighs the outcome..." },
  { icon: "💎", text: "Counting the spoils of war..." },
  { icon: "🏛️", text: "The Oracle seals the verdict..." },
  { icon: "✨", text: "Inscribing fate into the stars..." },
  { icon: "🔒", text: "Locking the result into destiny..." },
  { icon: "🌟", text: "The World confirms your fate..." },
  { icon: "📖", text: "Writing the final chapter..." },
];

export const SettlingScreen: React.FC<SettlingScreenProps> = ({
  flowState,
  battleResult,
  betAmount,
  errorMessage,
  onReset,
}) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState("");
  const isError = flowState === "error";

  const { playerWon, isDraw, playerFinalHp, enemyFinalHp, playerMaxHp } =
    battleResult;

  // Rotate messages
  useEffect(() => {
    if (isError) return;
    const shuffled = [...Array(SETTLING_MESSAGES.length).keys()].sort(
      () => Math.random() - 0.5
    );
    let idx = 0;
    setMsgIndex(shuffled[0]);

    const interval = setInterval(() => {
      idx = (idx + 1) % shuffled.length;
      setMsgIndex(shuffled[idx]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isError]);

  // Animated dots
  useEffect(() => {
    if (isError) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [isError]);

  const resultIcon = isDraw ? "⚖️" : playerWon ? "🏆" : "💀";
  const resultText = isDraw
    ? "A Draw..."
    : playerWon
      ? "Victory!"
      : "Defeat...";
  const resultColor = isDraw ? "#b0b0b0" : playerWon ? "#ffd700" : "#ff4444";

  const currentMsg = SETTLING_MESSAGES[msgIndex] || SETTLING_MESSAGES[0];

  return (
    <div className="settling-screen">
      <div className="settling-backdrop" />

      <div className="settling-content">
        {/* Battle outcome preview */}
        <div className="settling-result-preview" style={{ color: resultColor }}>
          <span className="settling-result-icon">{resultIcon}</span>
          <span className="settling-result-text">{resultText}</span>
        </div>

        {/* HP summary */}
        <div className="settling-hp-summary">
          <div className="settling-hp">
            <span>You: {playerFinalHp}/{playerMaxHp}</span>
            <div className="settling-hp-bar">
              <div
                className="settling-hp-fill player"
                style={{ width: `${(playerFinalHp / playerMaxHp) * 100}%` }}
              />
            </div>
          </div>
          <div className="settling-hp">
            <span>Enemy: {enemyFinalHp}/{playerMaxHp}</span>
            <div className="settling-hp-bar">
              <div
                className="settling-hp-fill enemy"
                style={{ width: `${(enemyFinalHp / playerMaxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Settling animation */}
        {!isError && (
          <div className="settling-animation">
            <div className="settling-spinner" />
            <div className="settling-message">
              <span className="settling-msg-icon">{currentMsg.icon}</span>
              <span className="settling-msg-text">
                {currentMsg.text}{dots}
              </span>
            </div>
            <p className="settling-sub">Confirming your fate on the chain...</p>
          </div>
        )}

        {/* Error */}
        {isError && errorMessage && (
          <div className="settling-error">
            <div className="settling-error-icon">💔</div>
            <p className="settling-error-text">
              The ritual was interrupted...
            </p>
            <p className="settling-error-detail">{errorMessage}</p>
            <button className="btn-secondary" onClick={onReset}>
              🔄 Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
