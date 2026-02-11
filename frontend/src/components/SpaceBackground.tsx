import { useEffect, useRef, useCallback } from "react";

// ─── Noise Functions (ported from Godot shaders) ────────────────────────────

function seededRand(x: number, y: number, seed: number): number {
  return (
    (((Math.sin(x * 12.9898 + y * 78.233) * (15.5453 + seed)) % 1.0) + 1.0) %
    1.0
  );
}

function noise2D(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const a = seededRand(ix, iy, seed);
  const b = seededRand(ix + 1, iy, seed);
  const c = seededRand(ix, iy + 1, seed);
  const d = seededRand(ix + 1, iy + 1, seed);

  const cx = fx * fx * (3 - 2 * fx);
  const cy = fy * fy * (3 - 2 * fy);

  return a + (b - a) * cx + (c - a) * cy * (1 - cx) + (d - b) * cx * cy;
}

function fbm(x: number, y: number, octaves: number, seed: number): number {
  let value = 0;
  let scale = 0.5;
  let cx = x;
  let cy = y;
  for (let i = 0; i < octaves; i++) {
    value += noise2D(cx, cy, seed) * scale;
    cx *= 2;
    cy *= 2;
    scale *= 0.5;
  }
  return value;
}

function circleNoise(ux: number, uy: number, seed: number): number {
  const uvY = Math.floor(uy);
  const px = ux + uvY * 0.31;
  const fx = px - Math.floor(px);
  const fy = uy - Math.floor(uy);
  const h = seededRand(Math.floor(px), Math.floor(uvY), seed);
  const dx = fx - 0.25 - h * 0.5;
  const dy = fy - 0.25 - h * 0.5;
  const m = Math.sqrt(dx * dx + dy * dy);
  const r = h * 0.25;
  if (r <= 0) return 1;
  const t = (m * 0.75) / r;
  return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); // smoothstep
}

function cloudAlpha(
  ux: number,
  uy: number,
  size: number,
  seed: number,
): number {
  let cNoise = 0;
  for (let i = 0; i < 2; i++) {
    cNoise += circleNoise(ux * 0.5 + (i + 1) - 0.3, uy * 0.5 + (i + 1), seed);
  }
  return fbm(ux + cNoise, uy + cNoise, 5, seed);
}

// ─── Color Schemes ──────────────────────────────────────────────────────────

interface ColorStop {
  r: number;
  g: number;
  b: number;
}

interface ColorScheme {
  name: string;
  nebula: ColorStop[];
  stars: ColorStop[];
  particles: ColorStop[];
  background: ColorStop;
}

const COLOR_SCHEMES: ColorScheme[] = [
  // Mystical Purple-Gold (原始配色)
  {
    name: "mystical",
    nebula: [
      { r: 10, g: 10, b: 30 },
      { r: 20, g: 15, b: 50 },
      { r: 60, g: 30, b: 90 },
      { r: 100, g: 40, b: 120 },
      { r: 140, g: 60, b: 100 },
      { r: 180, g: 90, b: 50 },
      { r: 212, g: 175, b: 55 },
      { r: 230, g: 210, b: 130 },
    ],
    stars: [
      { r: 200, g: 210, b: 255 },
      { r: 255, g: 240, b: 220 },
      { r: 180, g: 190, b: 255 },
      { r: 255, g: 220, b: 180 },
      { r: 212, g: 175, b: 55 },
      { r: 200, g: 160, b: 255 },
    ],
    particles: [
      { r: 212, g: 175, b: 55 },
      { r: 180, g: 140, b: 255 },
      { r: 100, g: 180, b: 255 },
      { r: 255, g: 200, b: 100 },
    ],
    background: { r: 10, g: 10, b: 26 },
  },
  // Deep Blue Ocean
  {
    name: "ocean",
    nebula: [
      { r: 5, g: 10, b: 30 },
      { r: 10, g: 25, b: 50 },
      { r: 15, g: 50, b: 90 },
      { r: 20, g: 80, b: 130 },
      { r: 30, g: 120, b: 160 },
      { r: 50, g: 150, b: 180 },
      { r: 100, g: 200, b: 220 },
      { r: 150, g: 230, b: 250 },
    ],
    stars: [
      { r: 200, g: 230, b: 255 },
      { r: 180, g: 220, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 150, g: 200, b: 255 },
      { r: 100, g: 200, b: 240 },
      { r: 120, g: 210, b: 255 },
    ],
    particles: [
      { r: 100, g: 200, b: 240 },
      { r: 150, g: 230, b: 255 },
      { r: 80, g: 180, b: 220 },
      { r: 120, g: 210, b: 250 },
    ],
    background: { r: 5, g: 10, b: 25 },
  },
  // Crimson Fury (红色主题)
  {
    name: "crimson",
    nebula: [
      { r: 30, g: 5, b: 10 },
      { r: 50, g: 10, b: 15 },
      { r: 90, g: 20, b: 30 },
      { r: 130, g: 30, b: 40 },
      { r: 170, g: 40, b: 50 },
      { r: 200, g: 60, b: 40 },
      { r: 230, g: 100, b: 50 },
      { r: 255, g: 150, b: 80 },
    ],
    stars: [
      { r: 255, g: 200, b: 200 },
      { r: 255, g: 220, b: 210 },
      { r: 255, g: 180, b: 180 },
      { r: 255, g: 240, b: 220 },
      { r: 255, g: 150, b: 100 },
      { r: 255, g: 200, b: 180 },
    ],
    particles: [
      { r: 255, g: 100, b: 80 },
      { r: 255, g: 150, b: 100 },
      { r: 230, g: 80, b: 60 },
      { r: 255, g: 180, b: 120 },
    ],
    background: { r: 20, g: 5, b: 10 },
  },
  // Emerald Dream (绿色主题)
  {
    name: "emerald",
    nebula: [
      { r: 10, g: 25, b: 15 },
      { r: 15, g: 40, b: 25 },
      { r: 20, g: 60, b: 40 },
      { r: 30, g: 90, b: 60 },
      { r: 40, g: 120, b: 80 },
      { r: 60, g: 150, b: 100 },
      { r: 100, g: 200, b: 130 },
      { r: 150, g: 240, b: 180 },
    ],
    stars: [
      { r: 200, g: 255, b: 220 },
      { r: 180, g: 255, b: 200 },
      { r: 220, g: 255, b: 230 },
      { r: 255, g: 255, b: 240 },
      { r: 150, g: 240, b: 180 },
      { r: 180, g: 250, b: 200 },
    ],
    particles: [
      { r: 100, g: 220, b: 150 },
      { r: 120, g: 240, b: 170 },
      { r: 80, g: 200, b: 130 },
      { r: 150, g: 255, b: 190 },
    ],
    background: { r: 8, g: 18, b: 12 },
  },
  // Violet Storm (紫罗兰主题)
  {
    name: "violet",
    nebula: [
      { r: 20, g: 5, b: 30 },
      { r: 40, g: 10, b: 60 },
      { r: 70, g: 20, b: 100 },
      { r: 100, g: 30, b: 140 },
      { r: 140, g: 50, b: 180 },
      { r: 180, g: 80, b: 200 },
      { r: 210, g: 120, b: 220 },
      { r: 240, g: 180, b: 250 },
    ],
    stars: [
      { r: 230, g: 200, b: 255 },
      { r: 255, g: 220, b: 255 },
      { r: 200, g: 180, b: 255 },
      { r: 255, g: 240, b: 255 },
      { r: 210, g: 150, b: 240 },
      { r: 220, g: 190, b: 255 },
    ],
    particles: [
      { r: 200, g: 120, b: 230 },
      { r: 220, g: 150, b: 250 },
      { r: 180, g: 100, b: 220 },
      { r: 240, g: 180, b: 255 },
    ],
    background: { r: 15, g: 5, b: 22 },
  },
  // Amber Sunset (琥珀日落)
  {
    name: "amber",
    nebula: [
      { r: 30, g: 20, b: 10 },
      { r: 60, g: 35, b: 15 },
      { r: 100, g: 60, b: 20 },
      { r: 150, g: 90, b: 30 },
      { r: 200, g: 120, b: 40 },
      { r: 230, g: 150, b: 50 },
      { r: 255, g: 190, b: 80 },
      { r: 255, g: 220, b: 130 },
    ],
    stars: [
      { r: 255, g: 240, b: 200 },
      { r: 255, g: 230, b: 180 },
      { r: 255, g: 250, b: 220 },
      { r: 255, g: 220, b: 160 },
      { r: 255, g: 200, b: 140 },
      { r: 255, g: 235, b: 190 },
    ],
    particles: [
      { r: 255, g: 180, b: 80 },
      { r: 255, g: 200, b: 100 },
      { r: 240, g: 160, b: 60 },
      { r: 255, g: 220, b: 120 },
    ],
    background: { r: 18, g: 12, b: 8 },
  },
];

function sampleColor(t: number, colorScheme: ColorStop[]): ColorStop {
  const ct = Math.max(0, Math.min(1, t));
  const idx = ct * (colorScheme.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  const a = colorScheme[Math.min(i, colorScheme.length - 1)];
  const b = colorScheme[Math.min(i + 1, colorScheme.length - 1)];
  return {
    r: a.r + (b.r - a.r) * f,
    g: a.g + (b.g - a.g) * f,
    b: a.b + (b.b - a.b) * f,
  };
}

// ─── Star Types ─────────────────────────────────────────────────────────────

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: { r: number; g: number; b: number };
}

interface BigStar {
  x: number;
  y: number;
  size: number;
  glowSize: number;
  pulseSpeed: number;
  pulsePhase: number;
  color: { r: number; g: number; b: number };
  rays: number;
}

interface FloatingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: { r: number; g: number; b: number };
}

// ─── SpaceBackground Component ──────────────────────────────────────────────

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nebulaRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const bigStarsRef = useRef<BigStar[]>([]);
  const particlesRef = useRef<FloatingParticle[]>([]);
  const animRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const currentSchemeRef = useRef<ColorScheme>(COLOR_SCHEMES[0]);

  // Generate nebula texture (lower res for performance, pixel art aesthetic)
  const generateNebula = useCallback(
    (w: number, h: number, scheme: ColorScheme) => {
      const scale = 0.15; // render at 15% resolution → pixel art look
      const nw = Math.ceil(w * scale);
      const nh = Math.ceil(h * scale);

      const offscreen = document.createElement("canvas");
      offscreen.width = nw;
      offscreen.height = nh;
      const ctx = offscreen.getContext("2d")!;
      const imageData = ctx.createImageData(nw, nh);
      const data = imageData.data;

      const seed1 = 1.0 + Math.random() * 9.0;
      const seed2 = 1.0 + Math.random() * 9.0;
      const noiseSize = 50;

      for (let py = 0; py < nh; py++) {
        for (let px = 0; px < nw; px++) {
          const ux = (px / nw) * noiseSize;
          const uy = (py / nh) * noiseSize;

          // Distance from center (for vignette)
          const dx = px / nw - 0.5;
          const dy = py / nh - 0.5;
          const dist = Math.sqrt(dx * dx + dy * dy) * 0.4;

          // Nebulae layer
          const n = cloudAlpha(ux, uy, noiseSize, seed1);
          const n2 = fbm(ux + 1, uy + 1, 5, seed1);
          const nLerp = n2 * n;
          const nDustLerp = cloudAlpha(ux, uy, noiseSize, seed1) * nLerp;

          const a = n2 > 0.1 + dist ? 1 : 0;
          const a2 = n2 > 0.115 + dist ? 1 : 0;

          let colValue: number;
          if (a2 > a) {
            colValue = Math.floor(nDustLerp * 35) / 7;
          } else {
            colValue = Math.floor(nDustLerp * 14) / 7;
          }
          colValue = Math.max(0, Math.min(1, colValue));

          // StarStuff (dust) layer
          const nAlpha = fbm(
            ux * Math.ceil(noiseSize * 0.5) + 2,
            uy * Math.ceil(noiseSize * 0.5) + 2,
            5,
            seed2,
          );
          const nDust = cloudAlpha(ux, uy, noiseSize, seed2);
          const nDust2 = fbm(
            ux * Math.ceil(noiseSize * 0.2) - 2,
            uy * Math.ceil(noiseSize * 0.2) - 2,
            5,
            seed2,
          );
          let nDustLerp2 = nDust2 * nDust;
          const aDust = nAlpha < nDustLerp2 * 1.8 ? 1 : 0;
          nDustLerp2 = Math.pow(nDustLerp2, 3.2) * 56;
          const dustColValue = Math.max(
            0,
            Math.min(1, Math.floor(nDustLerp2) / 7),
          );

          // Blend nebula and dust
          const nebColor = sampleColor(colValue, scheme.nebula);
          const dustColor = sampleColor(dustColValue, scheme.nebula);

          const nebAlpha = a2 * 0.7;
          const dustAlpha2 = aDust * 0.35;

          // Background base color
          const bgR = scheme.background.r;
          const bgG = scheme.background.g;
          const bgB = scheme.background.b;

          let r = bgR;
          let g = bgG;
          let b = bgB;

          // Blend nebula
          r = r * (1 - nebAlpha) + nebColor.r * nebAlpha;
          g = g * (1 - nebAlpha) + nebColor.g * nebAlpha;
          b = b * (1 - nebAlpha) + nebColor.b * nebAlpha;

          // Blend dust
          r = r * (1 - dustAlpha2) + dustColor.r * dustAlpha2;
          g = g * (1 - dustAlpha2) + dustColor.g * dustAlpha2;
          b = b * (1 - dustAlpha2) + dustColor.b * dustAlpha2;

          const idx = (py * nw + px) * 4;
          data[idx] = Math.min(255, r);
          data[idx + 1] = Math.min(255, g);
          data[idx + 2] = Math.min(255, b);
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      nebulaRef.current = offscreen;
    },
    [],
  );

  // Generate stars
  const generateStars = useCallback(
    (w: number, h: number, scheme: ColorScheme) => {
      const starCount = Math.floor((w * h) / 800);
      const stars: Star[] = [];

      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 1.8 + 0.3,
          brightness: Math.random() * 0.6 + 0.4,
          twinkleSpeed: Math.random() * 2 + 0.5,
          twinklePhase: Math.random() * Math.PI * 2,
          color: scheme.stars[Math.floor(Math.random() * scheme.stars.length)],
        });
      }
      starsRef.current = stars;

      // Big stars with cross/glow
      const bigCount = Math.floor(Math.max(w, h) / 150);
      const bigStars: BigStar[] = [];
      for (let i = 0; i < bigCount; i++) {
        bigStars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2 + 1.5,
          glowSize: Math.random() * 20 + 10,
          pulseSpeed: Math.random() * 1.5 + 0.3,
          pulsePhase: Math.random() * Math.PI * 2,
          color: scheme.stars[Math.floor(Math.random() * scheme.stars.length)],
          rays: Math.random() > 0.5 ? 4 : 6,
        });
      }
      bigStarsRef.current = bigStars;
    },
    [],
  );

  // Initialize floating particles
  const initParticles = useCallback(
    (w: number, h: number, scheme: ColorScheme) => {
      const count = Math.floor((w * h) / 6000);
      const particles: FloatingParticle[] = [];
      for (let i = 0; i < count; i++) {
        const maxLife = Math.random() * 8000 + 4000;
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -Math.random() * 0.3 - 0.05,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random(),
          life: Math.random() * maxLife,
          maxLife,
          color:
            scheme.particles[
              Math.floor(Math.random() * scheme.particles.length)
            ],
        });
      }
      particlesRef.current = particles;
    },
    [],
  );

  // Animation loop
  const animate = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const draw = (time: number) => {
        ctx.clearRect(0, 0, w, h);

        // 1. Draw nebula background (pre-rendered, scaled up → pixel art)
        if (nebulaRef.current) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(nebulaRef.current, 0, 0, w, h);
          ctx.imageSmoothingEnabled = true;
        }

        // 2. Draw small twinkling stars
        for (const star of starsRef.current) {
          const twinkle =
            0.5 +
            0.5 *
              Math.sin(time * 0.001 * star.twinkleSpeed + star.twinklePhase);
          const alpha = star.brightness * twinkle;
          const { r, g, b } = star.color;

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fill();

          // Subtle glow for brighter stars
          if (star.size > 1.2) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.1})`;
            ctx.fill();
          }
        }

        // 3. Draw big stars with glow + rays
        for (const bs of bigStarsRef.current) {
          const pulse =
            0.6 + 0.4 * Math.sin(time * 0.001 * bs.pulseSpeed + bs.pulsePhase);
          const { r, g, b } = bs.color;

          // Outer glow
          const gradient = ctx.createRadialGradient(
            bs.x,
            bs.y,
            0,
            bs.x,
            bs.y,
            bs.glowSize * pulse,
          );
          gradient.addColorStop(0, `rgba(${r},${g},${b},${0.3 * pulse})`);
          gradient.addColorStop(0.4, `rgba(${r},${g},${b},${0.08 * pulse})`);
          gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(bs.x, bs.y, bs.glowSize * pulse, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Light rays
          ctx.save();
          ctx.translate(bs.x, bs.y);
          ctx.globalAlpha = 0.4 * pulse;
          ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`;
          ctx.lineWidth = 0.8;
          for (let i = 0; i < bs.rays; i++) {
            const angle = (i / bs.rays) * Math.PI * 2;
            const rayLen = bs.glowSize * 0.8 * pulse;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * rayLen, Math.sin(angle) * rayLen);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.restore();

          // Core
          ctx.beginPath();
          ctx.arc(bs.x, bs.y, bs.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.9 * pulse})`;
          ctx.fill();
        }

        // 4. Floating particles
        const dt = 16; // ~60fps
        for (const p of particlesRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.life += dt;

          if (p.life > p.maxLife) {
            p.x = Math.random() * w;
            p.y = h + 10;
            p.life = 0;
          }
          if (p.y < -10) {
            p.y = h + 10;
            p.x = Math.random() * w;
          }

          // Fade in/out based on life
          const lifeRatio = p.life / p.maxLife;
          let alpha: number;
          if (lifeRatio < 0.1) alpha = lifeRatio / 0.1;
          else if (lifeRatio > 0.8) alpha = (1 - lifeRatio) / 0.2;
          else alpha = 1;
          alpha *= p.opacity * 0.5;

          const { r, g, b } = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fill();
        }

        animRef.current = requestAnimationFrame(draw);
      };

      animRef.current = requestAnimationFrame(draw);
    },
    [],
  );

  // Setup & resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setup = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.scale(dpr, dpr);

      sizeRef.current = { w, h };

      // Cancel existing animation
      if (animRef.current) cancelAnimationFrame(animRef.current);

      // Randomly select a color scheme
      const randomScheme =
        COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];
      currentSchemeRef.current = randomScheme;

      // Generate everything
      generateNebula(w, h, randomScheme);
      generateStars(w, h, randomScheme);
      initParticles(w, h, randomScheme);
      animate(ctx, w, h);
    };

    setup();

    const onResize = () => {
      setup();
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [generateNebula, generateStars, initParticles, animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
