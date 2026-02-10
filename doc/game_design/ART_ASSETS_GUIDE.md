# 🎨 Web3 Casino: Art & Asset Style Guide

**风格定位**: **Dark Cyber-Pixel (暗黑赛博像素风)**  
**核心色调**:

- **背景**: 深渊黑 (#0f0f13), 虚空紫 (#2d1b4e)
- **玩家 (Genesis)**: 霓虹青 (#00f3ff), 翡翠绿 (#00ff9d)
- **敌方 (Glitch)**: 故障红 (#ff0055), 警告黄 (#ffcc00)

---

## 1. 📂 资源管理与目录结构

我们已创建标准的 Next.js 静态资源目录。请将下载或绘制的素材按以下结构归档：

```
frontend/public/assets/
├── cards/          # 卡牌相关资源
│   ├── frames/     # 卡框 (R, SR, SSR)
│   ├── units/      # 单位像素图 (64x64 或 128x128)
│   └── icons/      # 属性图标 (剑, 盾, 心)
├── dice/           # 骰子动画序列帧或 SVG
├── bg/             # 游戏背景图 (地牢, 全息网格)
└── ui/             # 按钮, 进度条, 粒子效果
```

---

## 2. 🃏 卡面渲染与设计 (Cards)

### 渲染方案 (Technical Approach)

不要把整张卡做成一张死图。为了灵活性和性能，采用 **"三层叠加法"** 在前端渲染：

1.  **底层 (Card Base)**: 卡牌边框容器 (div)，根据稀有度改变边框颜色（CSS `border-image` 或 SVG 贴图）。
2.  **中层 (Portrait)**: 像素角色的透明 PNG 居中。
3.  **顶层 (UI Overlay)**: 左下角的攻击力数值，右下角的血量数值，顶部的名字。

### 视觉参考

- **尺寸**: 建议原画为 `64x64` 像素，前端渲染时使用 CSS `image-rendering: pixelated` 放大 4 倍显示。
- **画风**: 类似于 _Realm of the Mad God_ 或 _Crypt of the NecroDancer_。

---

## 3. 🎲 骰子设计 (Dice)

虽然逻辑是 1-100，但视觉上建议使用 **D20 (二十面骰)** 模型，因为 D20 最具 RPG 仪式感。

- **样式**: 全息线框风格 (Holographic Wireframe)。
- **动画**:
  - **Idle**: 悬浮自转。
  - **Rolling**: 剧烈发光旋转，带有动态模糊 (Motion Blur)。
  - **Result**: 停止瞬间爆出粒子特效（大凶为紫色烟雾，大吉为金色火花）。

---

## 4. 🖼️ 场景与桌面 (Tabletop)

不要使用传统的绿色赌场桌布！那太 Web2 了。

- **概念**: **"战术全息台 (Tactical Console)"**。
- **视觉**:
  - 背景是深邃的网格线滚动。
  - 桌布是一块半透明的黑色玻璃面板，边缘有发光的电路纹理。
  - "放置卡牌"时，卡牌底部会有全息投影的光圈。

---

## 5. 🛠️ 素材获取渠道 (Sourcing)

鉴于我们主要需要**像素风**素材，以下是最高效的获取方式：

### A. 开源素材网站 (推荐先用这些占位)

1.  **Itch.io (Assets Section)**: 搜索 "Pixel Art RPG Icons" 或 "Card Components".
    - 推荐包含: _16x16 Dungeon Tileset_, _RPG Battlers_.
2.  **OpenGameArt.org**: 资源虽老但完全免费。
3.  **Kenney Assets**: 质量极高的免费资源，搜索 "Pixel Platformer" 或 "UI Pack".

### B. AI 生成 (Midjourney / DALL-E 3)

如果不擅长手绘，可以用 AI 生成素材库，然后用 PS 扣除背景。

- **Prompt 示例**:
  > _Please generate a pixel art sprite sheet of a fantasy dungeon warrior, 16-bit style, clean dark background, isolate character, --v 5_
  > _Pixel art icon set for RPG game, sword, shield, potion, skull, limited color palette neon green and black --v 5_

### C. SVG 代码生成 (我可以直接提供)

对于 UI 图标（剑、盾、心）和简单的骰子，我作为 AI 可以直接为你生成 **SVG 代码**。这对前端性能最好，且无限放大不失真。

---

## ✅ 行动建议

1.  **我 (GitHub Copilot)**: 负责提供 **UI 图标的 SVG 代码** 和 **卡牌 CSS 样式代码**（占位符），确保你可以立刻看到效果。
2.  **你 (美术组)**: 负责去 itch.io 或通过 AI 生成 **具体的角色立绘 (Unit Portraits)**，因为这决定了游戏的灵魂。
