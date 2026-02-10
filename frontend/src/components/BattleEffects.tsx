/**
 * BattleEffects — Canvas-based suit special effects
 *
 * Each suit has a unique particle VFX:
 *   🔥 Wands (Fire)      — Flame burst with rising embers
 *   💧 Cups (Water)       — Water splash with ripple waves
 *   🌪️ Swords (Air)       — Slash trails with wind particles
 *   🌍 Pentacles (Earth)  — Rock shatter with dust cloud
 *   ✨ Major Arcana       — Golden arcane explosion
 */

import { useEffect, useRef, useCallback } from "react";
import type { Suit } from "../engine/cardData";
import type { SpecialEffect } from "../engine/battleEngine";

// ─── Particle Types ─────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  shape: "circle" | "square" | "diamond" | "line" | "ring";
  gravity: number;
  drag: number;
  scale: number;
}

type EffectConfig = {
  particles: number;
  duration: number;
  generator: (cx: number, cy: number, w: number, h: number) => Particle;
  postDraw?: (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    progress: number,
    w: number,
    h: number,
  ) => void;
};

// ─── Color Palettes ─────────────────────────────────────────────────────────

const FIRE_COLORS = [
  "#ff4500",
  "#ff6600",
  "#ff8c00",
  "#ffa500",
  "#ffd700",
  "#fff44f",
  "#ff3200",
];
const WATER_COLORS = [
  "#00bfff",
  "#1e90ff",
  "#4169e1",
  "#87ceeb",
  "#b0e0e6",
  "#00ced1",
  "#40e0d0",
];
const AIR_COLORS = [
  "#c0c0c0",
  "#e0e0e0",
  "#ffffff",
  "#a8d8ea",
  "#d4e5f7",
  "#b8cfe6",
  "#e8f4fd",
];
const EARTH_COLORS = [
  "#8b4513",
  "#a0522d",
  "#cd853f",
  "#daa520",
  "#b8860b",
  "#d2691e",
  "#f4a460",
];
const ARCANE_COLORS = [
  "#d4af37",
  "#f0d060",
  "#ffd700",
  "#ffec8b",
  "#fff8dc",
  "#e6c200",
  "#b8860b",
];
const CRITICAL_COLORS = ["#ff0000", "#ff4444", "#ff6666", "#ffffff", "#ffcc00"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// ─── Effect Generators ──────────────────────────────────────────────────────

const SUIT_EFFECTS: Record<string, EffectConfig> = {
  // 🔥 FIRE — Explosive flame burst with rising embers
  Wands: {
    particles: 80,
    duration: 1200,
    generator: (cx, cy) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(2, 12);
      return {
        x: cx + rand(-20, 20),
        y: cy + rand(-20, 20),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(1, 4),
        size: rand(3, 10),
        life: 0,
        maxLife: rand(400, 1000),
        color: pick(FIRE_COLORS),
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: rand(-0.1, 0.1),
        shape: pick([
          "circle",
          "diamond",
          "circle",
          "circle",
        ]) as Particle["shape"],
        gravity: -0.08,
        drag: 0.98,
        scale: 1,
      };
    },
    postDraw: (ctx, cx, cy, progress) => {
      // Central fireball flash
      if (progress < 0.3) {
        const flashAlpha = (1 - progress / 0.3) * 0.6;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
        gradient.addColorStop(0, `rgba(255, 165, 0, ${flashAlpha})`);
        gradient.addColorStop(0.5, `rgba(255, 69, 0, ${flashAlpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    },
  },

  // 💧 WATER — Splash outward with ripple rings
  Cups: {
    particles: 60,
    duration: 1100,
    generator: (cx, cy) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(1, 8);
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + rand(0, 2),
        size: rand(2, 7),
        life: 0,
        maxLife: rand(500, 1000),
        color: pick(WATER_COLORS),
        alpha: 0.9,
        rotation: 0,
        rotationSpeed: 0,
        shape: "circle",
        gravity: 0.12,
        drag: 0.97,
        scale: 1,
      };
    },
    postDraw: (ctx, cx, cy, progress) => {
      // Expanding ripple rings
      for (let i = 0; i < 3; i++) {
        const ringProgress = (progress * 1.5 - i * 0.15) % 1;
        if (ringProgress > 0 && ringProgress < 1) {
          const radius = ringProgress * 100;
          const alpha = (1 - ringProgress) * 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(30, 144, 255, ${alpha})`;
          ctx.lineWidth = 3 - ringProgress * 2;
          ctx.stroke();
        }
      }
    },
  },

  // 🌪️ AIR — Slash trails with wind swirls
  Swords: {
    particles: 70,
    duration: 1000,
    generator: (cx, cy) => {
      const angle = rand(-0.8, 0.8) + Math.PI * 1.75;
      const speed = rand(4, 15);
      return {
        x: cx + rand(-60, 60),
        y: cy + rand(-40, 40),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(1, 4),
        life: 0,
        maxLife: rand(300, 700),
        color: pick(AIR_COLORS),
        alpha: 0.8,
        rotation: angle,
        rotationSpeed: rand(-0.2, 0.2),
        shape: "line",
        gravity: 0,
        drag: 0.96,
        scale: rand(1, 3),
      };
    },
    postDraw: (ctx, cx, cy, progress) => {
      // Slash trails
      if (progress < 0.5) {
        const slashProgress = progress / 0.5;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = (1 - slashProgress) * 0.7;
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        // Diagonal slash
        const len = 120 * slashProgress;
        ctx.beginPath();
        ctx.moveTo(-len * 0.5, -len * 0.3);
        ctx.lineTo(len * 0.5, len * 0.3);
        ctx.stroke();

        // Cross slash
        ctx.beginPath();
        ctx.moveTo(len * 0.3, -len * 0.4);
        ctx.lineTo(-len * 0.3, len * 0.4);
        ctx.stroke();

        ctx.restore();
      }
    },
  },

  // 🌍 EARTH — Rock shatter with dust explosion
  Pentacles: {
    particles: 50,
    duration: 1300,
    generator: (cx, cy) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(1, 7);
      return {
        x: cx + rand(-15, 15),
        y: cy + rand(-15, 15),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(0, 3),
        size: rand(4, 12),
        life: 0,
        maxLife: rand(600, 1200),
        color: pick(EARTH_COLORS),
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: rand(-0.15, 0.15),
        shape: "square",
        gravity: 0.2,
        drag: 0.97,
        scale: 1,
      };
    },
    postDraw: (ctx, cx, cy, progress) => {
      // Ground impact wave
      if (progress < 0.4) {
        const waveProgress = progress / 0.4;
        const width = waveProgress * 140;
        const alpha = (1 - waveProgress) * 0.4;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 30, width, width * 0.25, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
        ctx.fill();
      }
    },
  },

  // ✨ MAJOR ARCANA — Golden arcane explosion
  major: {
    particles: 100,
    duration: 1500,
    generator: (cx, cy) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(3, 14);
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(2, 8),
        life: 0,
        maxLife: rand(500, 1300),
        color: pick(ARCANE_COLORS),
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: rand(-0.1, 0.1),
        shape: pick(["diamond", "circle", "ring"]) as Particle["shape"],
        gravity: -0.03,
        drag: 0.975,
        scale: 1,
      };
    },
    postDraw: (ctx, cx, cy, progress) => {
      // Magic circle
      if (progress < 0.6) {
        const circleAlpha = (1 - progress / 0.6) * 0.4;
        const radius = 60 + progress * 40;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(progress * Math.PI * 2);
        ctx.strokeStyle = `rgba(212, 175, 55, ${circleAlpha})`;
        ctx.lineWidth = 2;
        // Outer circle
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        // Inner circle
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        // Rays
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * radius * 0.6, Math.sin(a) * radius * 0.6);
          ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
          ctx.stroke();
        }
        ctx.restore();
      }
    },
  },

  // 💥 CRITICAL — Screen shake + flash
  critical: {
    particles: 40,
    duration: 800,
    generator: (cx, cy, w, h) => {
      return {
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-2, 2),
        vy: rand(-2, 2),
        size: rand(2, 6),
        life: 0,
        maxLife: rand(300, 600),
        color: pick(CRITICAL_COLORS),
        alpha: 1,
        rotation: 0,
        rotationSpeed: 0,
        shape: "diamond",
        gravity: 0,
        drag: 0.95,
        scale: 1,
      };
    },
    postDraw: (ctx, _cx, _cy, progress, w, h) => {
      // White flash
      if (progress < 0.15) {
        const flashAlpha = (1 - progress / 0.15) * 0.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, w, h);
      }
    },
  },
};

// ─── Particle Renderer ──────────────────────────────────────────────────────

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const lifeRatio = p.life / p.maxLife;
  const alpha = p.alpha * (1 - lifeRatio * lifeRatio); // quadratic fade
  if (alpha <= 0) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  ctx.strokeStyle = p.color;

  const s = p.size * p.scale * (1 - lifeRatio * 0.3);

  switch (p.shape) {
    case "circle":
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "square":
      ctx.fillRect(-s / 2, -s / 2, s, s);
      break;
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case "line":
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * p.scale, 0);
      ctx.lineTo(s * p.scale, 0);
      ctx.stroke();
      break;
    case "ring":
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }

  ctx.restore();
}

// ─── Effect Trigger Interface ───────────────────────────────────────────────

export interface EffectTrigger {
  suit?: Suit;
  isMajor?: boolean;
  specialEffects?: SpecialEffect[];
  isCritical?: boolean;
  side: "player" | "enemy"; // which side to center the effect on
}

interface BattleEffectsProps {
  trigger: EffectTrigger | null;
  onEffectComplete?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BattleEffects({
  trigger,
  onEffectComplete,
}: BattleEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const activeRef = useRef(false);

  const runEffect = useCallback(
    (effectKey: string, cx: number, cy: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const config = SUIT_EFFECTS[effectKey];
      if (!config) return;

      const w = canvas.width;
      const h = canvas.height;

      // Generate particles
      const particles: Particle[] = [];
      for (let i = 0; i < config.particles; i++) {
        particles.push(config.generator(cx, cy, w, h));
      }

      const startTime = performance.now();
      activeRef.current = true;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / config.duration, 1);
        const dt = 16; // ~60fps

        ctx.clearRect(0, 0, w, h);

        // Update and draw particles
        for (const p of particles) {
          p.life += dt;
          if (p.life > p.maxLife) continue;

          p.vx *= p.drag;
          p.vy *= p.drag;
          p.vy += p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;

          drawParticle(ctx, p);
        }

        // Post-draw overlay effects
        config.postDraw?.(ctx, cx, cy, progress, w, h);

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, w, h);
          activeRef.current = false;
          onEffectComplete?.();
        }
      };

      animRef.current = requestAnimationFrame(animate);
    },
    [onEffectComplete],
  );

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size canvas to viewport
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    // Determine center point based on side
    const cx = trigger.side === "player" ? w * 0.72 : w * 0.28;
    const cy = h * 0.45;

    // Cancel any existing animation
    if (animRef.current) cancelAnimationFrame(animRef.current);

    // Determine which effects to play
    const effectsToPlay: Array<{ key: string; delay: number }> = [];

    if (trigger.isCritical) {
      effectsToPlay.push({ key: "critical", delay: 0 });
    }

    if (trigger.isMajor) {
      effectsToPlay.push({ key: "major", delay: trigger.isCritical ? 200 : 0 });
    } else if (trigger.suit) {
      effectsToPlay.push({
        key: trigger.suit,
        delay: trigger.isCritical ? 200 : 0,
      });
    }

    // Play effects with delays
    for (const { key, delay } of effectsToPlay) {
      if (delay > 0) {
        setTimeout(() => runEffect(key, cx, cy), delay);
      } else {
        runEffect(key, cx, cy);
      }
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [trigger, runEffect]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 10,
        pointerEvents: "none",
      }}
    />
  );
}
