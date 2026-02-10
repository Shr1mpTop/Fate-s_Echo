import React from "react";

interface HealthBarProps {
  current: number;
  max: number;
  label: string;
  side: "player" | "enemy";
  animating?: boolean;
}

export const HealthBar: React.FC<HealthBarProps> = ({
  current,
  max,
  label,
  side,
  animating = false,
}) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  const getBarColor = () => {
    if (percentage > 60) return "var(--hp-high)";
    if (percentage > 30) return "var(--hp-mid)";
    return "var(--hp-low)";
  };

  return (
    <div className={`health-bar-container ${side}`}>
      <div className="health-bar-label">
        <span className="health-bar-name">{label}</span>
        <span className="health-bar-value">
          {current} / {max}
        </span>
      </div>
      <div className="health-bar-track">
        <div
          className={`health-bar-fill ${animating ? "animating" : ""}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: getBarColor(),
          }}
        />
        {animating && <div className="health-bar-flash" />}
      </div>
    </div>
  );
};
