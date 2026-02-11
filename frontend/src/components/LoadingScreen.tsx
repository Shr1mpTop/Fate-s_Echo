import React, { useState, useEffect, useRef } from "react";
import { soundManager } from "../utils/soundManager";
import type { GameFlowState } from "../web3/useFateEcho";

interface LoadingScreenProps {
  flowState: GameFlowState;
  onEnterBattle: () => void;
  errorMessage: string | null;
  onReset: () => void;
}

// Fun battle-themed loading messages — no technical jargon!
const LOADING_MESSAGES = [
  { icon: "⚔️", text: "Polishing the Sword of Kings..." },
  { icon: "🛡️", text: "Reinforcing the Shield of Pentacles..." },
  { icon: "🃏", text: "Shuffling the deck of fate..." },
  { icon: "🔥", text: "Lighting the Wands of Power..." },
  { icon: "🏰", text: "Opening the gates of the arena..." },
  { icon: "💫", text: "Channeling the Star's light..." },
  { icon: "🌙", text: "The Moon whispers your destiny..." },
  { icon: "☀️", text: "The Sun readies its blessing..." },
  { icon: "⚡", text: "The Tower crackles with energy..." },
  { icon: "🎭", text: "The Fool prepares for the journey..." },
  { icon: "🗡️", text: "Sharpening the Ace of Swords..." },
  { icon: "🏆", text: "Summoning the Cups of Fortune..." },
  { icon: "👑", text: "The Emperor takes his throne..." },
  { icon: "🔮", text: "The High Priestess reads the stars..." },
  { icon: "⚖️", text: "Justice balances the scales..." },
  { icon: "💀", text: "Death reshuffles the cards..." },
  { icon: "🌅", text: "Judgement awakens the warriors..." },
  { icon: "🌍", text: "The World spins into alignment..." },
  { icon: "❤️", text: "The Empress infuses life energy..." },
  { icon: "🐎", text: "The Chariot charges forward..." },
  { icon: "🔗", text: "The Devil sets the stakes..." },
  { icon: "🧙", text: "The Magician prepares the ritual..." },
  { icon: "🏹", text: "The Knight of Wands readies his bow..." },
  { icon: "🌊", text: "The Queen of Cups gazes into the depths..." },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  flowState,
  onEnterBattle,
  errorMessage,
  onReset,
}) => {
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeClass, setFadeClass] = useState("fade-in");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isBattleReady = flowState === "battle_ready";
  const isError = flowState === "error";

  // Play loading music
  useEffect(() => {
    soundManager.playLoadingMusic();
    return () => {
      soundManager.stopBackgroundMusic();
    };
  }, []);

  // Rotate loading messages every 3 seconds with fade
  useEffect(() => {
    if (isBattleReady || isError) return;

    // Shuffle the messages randomly
    const shuffled = [...Array(LOADING_MESSAGES.length).keys()].sort(
      () => Math.random() - 0.5
    );
    let idx = 0;

    msgIntervalRef.current = setInterval(() => {
      setFadeClass("fade-out");
      setTimeout(() => {
        idx = (idx + 1) % shuffled.length;
        setCurrentMsgIndex(shuffled[idx]);
        setFadeClass("fade-in");
      }, 400);
    }, 3000);

    // Random initial message
    setCurrentMsgIndex(shuffled[0]);

    return () => {
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    };
  }, [isBattleReady, isError]);

  // Progress bar animation
  useEffect(() => {
    if (isBattleReady) {
      // Jump to 100%
      setProgress(100);
      return;
    }

    if (isError) return;

    // Simulate progress: fast at start, slows down approaching 90%
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += Math.random() * 3 * (1 - p / 100);
      if (p > 90) p = 90; // Never reaches 100 until battle_ready
      setProgress(Math.floor(p));
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isBattleReady, isError]);

  const currentMsg = LOADING_MESSAGES[currentMsgIndex] || LOADING_MESSAGES[0];

  // Phase text (no technical jargon)
  const phaseText =
    flowState === "sending_tx"
      ? "Placing your wager on the altar..."
      : flowState === "waiting_vrf"
        ? "The Oracle is reading the cards..."
        : flowState === "battle_ready"
          ? "Your fate has been sealed!"
          : "Preparing the arena...";

  return (
    <div className="loading-screen">
      <div className="loading-particles">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="loading-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="loading-content">
        {/* Title */}
        <div className="loading-title-area">
          <div className="loading-tarot-symbol">🃏</div>
          <h1 className="loading-title">Fate's Echo</h1>
        </div>

        {/* Phase indicator */}
        <div className="loading-phase">{phaseText}</div>

        {/* Fun rotating message */}
        {!isBattleReady && !isError && (
          <div className={`loading-message ${fadeClass}`}>
            <span className="loading-msg-icon">{currentMsg.icon}</span>
            <span className="loading-msg-text">{currentMsg.text}</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="loading-progress-container">
          <div className="loading-progress-track">
            <div
              className={`loading-progress-fill ${isBattleReady ? "complete" : ""}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="loading-progress-text">
            {isBattleReady ? "Ready!" : `${progress}%`}
          </div>
        </div>

        {/* Battle Ready state */}
        {isBattleReady && (
          <div className="loading-ready">
            <div className="loading-ready-glow" />
            <p className="loading-ready-text">
              ⚔️ The cards are drawn. Your destiny awaits.
            </p>
            <button className="btn-primary enter-battle-btn" onClick={onEnterBattle}>
              ⚔️ Enter Battle
            </button>
          </div>
        )}

        {/* Error state */}
        {isError && errorMessage && (
          <div className="loading-error">
            <div className="loading-error-icon">💔</div>
            <p className="loading-error-text">
              The spirits have disrupted the ritual...
            </p>
            <p className="loading-error-detail">{errorMessage}</p>
            <button className="btn-secondary" onClick={onReset}>
              🔄 Try Again
            </button>
          </div>
        )}

        {/* Decorative card backs */}
        <div className="loading-cards-decoration">
          <div className="loading-card-back card-1">🂠</div>
          <div className="loading-card-back card-2">🂠</div>
          <div className="loading-card-back card-3">🂠</div>
        </div>
      </div>
    </div>
  );
};
