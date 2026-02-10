import React from "react";
import { Card } from "../engine/cardData";

interface CardDisplayProps {
  card: Card | null;
  revealed: boolean;
  side: "player" | "enemy";
  glowing?: boolean;
  damageNumber?: number | null;
  healNumber?: number | null;
  roundKey?: number;
  instantFlip?: boolean;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  revealed,
  side,
  glowing = false,
  damageNumber = null,
  healNumber = null,
  roundKey = 0,
  instantFlip = false,
}) => {
  const isMajor = card?.type === "major";

  return (
    <div className={`card-container ${side}`}>
      <div
        className={`card ${revealed ? "flipped" : ""} ${glowing ? "glowing" : ""} ${isMajor && revealed ? "major-glow" : ""}`}
      >
        <div className={`card-inner ${instantFlip ? "no-transition" : ""}`}>
          {/* Card Back */}
          <div className="card-back">
            <div className="card-back-design">
              <div className="card-back-symbol">✦</div>
              <div className="card-back-text">FATE</div>
            </div>
          </div>

          {/* Card Front */}
          <div className="card-front">
            {card && (
              <>
                <img
                  src={card.image}
                  alt={card.name}
                  className="card-image"
                  draggable={false}
                />
                <div
                  className={`card-label ${isMajor ? "major-label" : "minor-label"}`}
                >
                  {card.name}
                </div>
                {isMajor && card.effect && (
                  <div className="card-effect-badge">
                    {card.effect.description.split(" — ")[0]}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating damage/heal numbers */}
      {damageNumber !== null && damageNumber > 0 && (
        <div
          className={`floating-number damage ${side}`}
          key={`dmg-${side}-${roundKey}-${damageNumber}`}
        >
          -{damageNumber}
        </div>
      )}
      {healNumber !== null && healNumber > 0 && (
        <div
          className={`floating-number heal ${side}`}
          key={`heal-${side}-${roundKey}-${healNumber}`}
        >
          +{healNumber}
        </div>
      )}
    </div>
  );
};
