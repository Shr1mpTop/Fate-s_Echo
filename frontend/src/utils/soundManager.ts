/**
 * Sound Manager - Handles all game audio effects
 */

import type { Suit, EffectType } from "../engine/cardData";

type SoundEffect =
  | "attack1"
  | "boom"
  | "broke"
  | "happend"
  | "healing"
  | "shake"
  | "shoot"
  | "sword"
  | "sword2";

type BackgroundMusic = "menu" | "start-level" | "battle" | "scream" | "loading";

class SoundManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
  private bgMusic: Map<BackgroundMusic, HTMLAudioElement> = new Map();
  private currentBgMusic: HTMLAudioElement | null = null;
  private currentBgMusicName: BackgroundMusic | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;
  private bgMusicVolume: number = 0.3;
  private fadeIntervals: Set<number> = new Set();
  private pendingTimeouts: Set<number> = new Set();

  constructor() {
    this.preloadSounds();
    this.preloadBackgroundMusic();
  }

  private preloadSounds() {
    const soundFiles: SoundEffect[] = [
      "attack1",
      "boom",
      "broke",
      "happend",
      "healing",
      "shake",
      "shoot",
      "sword",
      "sword2",
    ];

    soundFiles.forEach((name) => {
      const audio = new Audio(`/sound/${name}.m4a`);
      audio.volume = this.volume;
      audio.preload = "auto";
      this.sounds.set(name, audio);
    });
  }

  private preloadBackgroundMusic() {
    const musicFiles: BackgroundMusic[] = [
      "menu",
      "start-level",
      "battle",
      "scream",
      "loading",
    ];

    musicFiles.forEach((name) => {
      const audio = new Audio(`/sound/backgounrd_music/${name}.wav`);
      audio.volume = 0;
      audio.loop = name !== "start-level" && name !== "scream"; // start-level and scream don't loop; loading loops
      audio.preload = "auto";
      this.bgMusic.set(name, audio);
    });
  }

  private play(effect: SoundEffect) {
    if (!this.enabled) return;

    const audio = this.sounds.get(effect);
    if (audio) {
      // Clone to allow overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = this.volume;
      clone.play().catch((err) => console.warn("Sound play failed:", err));
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.sounds.forEach((audio) => {
      audio.volume = this.volume;
    });
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    }
  }

  // ─── Background Music Control ────────────────────────────────────────────

  private fadeOut(audio: HTMLAudioElement, duration: number = 1000) {
    const startVolume = audio.volume;
    if (startVolume <= 0) { audio.pause(); return; }
    const step = startVolume / (duration / 50);

    const id = window.setInterval(() => {
      if (audio.volume > step) {
        audio.volume = Math.max(0, audio.volume - step);
      } else {
        audio.volume = 0;
        audio.pause();
        audio.currentTime = 0;
        clearInterval(id);
        this.fadeIntervals.delete(id);
      }
    }, 50);
    this.fadeIntervals.add(id);
  }

  private fadeIn(
    audio: HTMLAudioElement,
    targetVolume: number,
    duration: number = 1000,
  ) {
    audio.volume = 0;
    audio.play().catch((err) => console.warn("Music play failed:", err));

    const step = targetVolume / (duration / 50);

    const id = window.setInterval(() => {
      if (audio.volume < targetVolume - step) {
        audio.volume = Math.min(targetVolume, audio.volume + step);
      } else {
        audio.volume = targetVolume;
        clearInterval(id);
        this.fadeIntervals.delete(id);
      }
    }, 50);
    this.fadeIntervals.add(id);
  }

  /** Schedule a timeout that will be auto-cleared on stopBackgroundMusic */
  private scheduleBg(fn: () => void, delay: number) {
    const id = window.setTimeout(() => {
      this.pendingTimeouts.delete(id);
      fn();
    }, delay);
    this.pendingTimeouts.add(id);
  }

  private switchBackgroundMusic(
    musicName: BackgroundMusic,
    fadeTime: number = 1000,
  ) {
    if (!this.enabled) return;

    const newMusic = this.bgMusic.get(musicName);
    if (!newMusic) return;

    // Same music already playing
    if (
      this.currentBgMusicName === musicName &&
      this.currentBgMusic &&
      !this.currentBgMusic.paused
    ) {
      return;
    }

    // Fade out current music
    if (this.currentBgMusic && !this.currentBgMusic.paused) {
      this.fadeOut(this.currentBgMusic, fadeTime);
    }

    // Fade in new music
    this.currentBgMusic = newMusic;
    this.currentBgMusicName = musicName;
    this.fadeIn(newMusic, this.bgMusicVolume, fadeTime);
  }

  /**
   * Play menu background music
   */
  playMenuMusic() {
    this.switchBackgroundMusic("menu", 1500);
  }

  /**
   * Play loading/waiting background music
   */
  playLoadingMusic() {
    this.switchBackgroundMusic("loading", 800);
  }

  /**
   * Play battle sequence: start-level -> battle
   */
  playBattleMusic() {
    if (!this.enabled) return;

    const startLevel = this.bgMusic.get("start-level");
    const battle = this.bgMusic.get("battle");

    if (!startLevel || !battle) return;

    // Stop current music immediately
    if (this.currentBgMusic && !this.currentBgMusic.paused) {
      this.fadeOut(this.currentBgMusic, 500);
    }

    // Play start-level
    this.currentBgMusic = startLevel;
    this.currentBgMusicName = "start-level";
    startLevel.currentTime = 0;
    startLevel.loop = false;
    this.fadeIn(startLevel, this.bgMusicVolume, 800);

    // Transition to battle music after 2.5 seconds
    this.scheduleBg(() => {
      if (this.currentBgMusicName === "start-level") {
        this.fadeOut(startLevel, 1000);

        this.scheduleBg(() => {
          this.currentBgMusic = battle;
          this.currentBgMusicName = "battle";
          battle.currentTime = 0;
          battle.loop = true;
          this.fadeIn(battle, this.bgMusicVolume, 1500);
        }, 1000);
      }
    }, 2500);
  }

  /**
   * Play game over scream music
   */
  playGameOverMusic() {
    if (!this.enabled) return;

    const scream = this.bgMusic.get("scream");
    if (!scream) return;

    // Fade out current music quickly
    if (this.currentBgMusic && !this.currentBgMusic.paused) {
      this.fadeOut(this.currentBgMusic, 500);
    }

    // Play scream
    this.scheduleBg(() => {
      this.currentBgMusic = scream;
      this.currentBgMusicName = "scream";
      scream.currentTime = 0;
      scream.loop = false;
      this.fadeIn(scream, this.bgMusicVolume, 800);
    }, 500);
  }

  /**
   * Stop all background music
   */
  stopBackgroundMusic() {
    // Clear all pending scheduled transitions
    for (const id of this.pendingTimeouts) {
      clearTimeout(id);
    }
    this.pendingTimeouts.clear();

    // Clear all active fade intervals
    for (const id of this.fadeIntervals) {
      clearInterval(id);
    }
    this.fadeIntervals.clear();

    // Stop ALL background music audio elements, not just current
    this.bgMusic.forEach((audio) => {
      if (!audio.paused) {
        audio.volume = 0;
        audio.pause();
        audio.currentTime = 0;
      }
    });

    this.currentBgMusic = null;
    this.currentBgMusicName = null;
  }

  /**
   * Set background music volume (0-1)
   */
  setBgMusicVolume(vol: number) {
    this.bgMusicVolume = Math.max(0, Math.min(1, vol));
    if (this.currentBgMusic) {
      this.currentBgMusic.volume = this.bgMusicVolume;
    }
  }

  // ─── Game-specific sound triggers ────────────────────────────────────────

  /**
   * Play sound when cards are dealt
   */
  playCardDeal() {
    this.play("happend");
  }

  /**
   * Play sound when cards flip
   */
  playCardFlip() {
    this.play("broke");
  }

  /**
   * Play attack sound based on card suit
   */
  playAttack(suit: Suit | undefined, isMajor: boolean, damage: number) {
    // Major arcana with high damage
    if (isMajor && damage >= 12) {
      this.play("boom");
      return;
    }

    // Suit-based sounds
    if (suit) {
      switch (suit) {
        case "Wands": // Fire
          this.play("boom");
          break;
        case "Cups": // Water
          this.play("shoot");
          break;
        case "Swords": // Air/Wind
          this.play(Math.random() > 0.5 ? "sword" : "sword2");
          break;
        case "Pentacles": // Earth
          this.play("shake");
          break;
      }
    } else {
      this.play("attack1");
    }
  }

  /**
   * Play sound based on major arcana effect type
   */
  playEffect(effectType: EffectType) {
    switch (effectType) {
      case "dodge":
        this.play("broke"); // Evasion/deflect sound
        break;
      case "heal":
      case "both_heal":
        this.play("healing");
        break;
      case "drain":
        this.play("sword"); // Vampiric strike
        break;
      case "damage":
        this.play("boom");
        break;
      case "damage_heal":
        this.play("sword2"); // Combined effect
        break;
      case "swap":
      case "average":
      case "conditional":
        this.play("happend"); // Special event
        break;
      case "both_damage":
        this.play("boom");
        break;
      case "skip":
        this.play("happend");
        break;
    }
  }

  /**
   * Play critical hit sound
   */
  playCritical() {
    this.play("boom");
  }

  /**
   * Play healing sound
   */
  playHeal() {
    this.play("healing");
  }

  /**
   * Play victory sound
   */
  playVictory() {
    this.play("happend");
  }

  /**
   * Play defeat sound
   */
  playDefeat() {
    this.play("broke");
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
