/**
 * Card Data Definitions — 78 Tarot Cards
 *
 * 22 Major Arcana  (id  0 – 21)  — "Event Cards" with special effects
 * 56 Minor Arcana  (id 22 – 77)  — "Combat Cards" with suit + value
 *   Cups 1-14, Pentacles 1-14, Swords 1-14, Wands 1-14
 *
 * Image filenames match the resources/Tarot Playing Cards/PNG directory.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Suit = "Wands" | "Cups" | "Swords" | "Pentacles";
export type CardType = "major" | "minor";
export type EffectType =
  | "dodge" // Take zero damage this round
  | "damage" // Deal fixed damage to opponent
  | "heal" // Heal self
  | "both_heal" // Both players heal
  | "drain" // Steal HP from opponent
  | "swap" // Swap HP values
  | "average" // Set both HP to average
  | "both_damage" // Both players take damage
  | "skip" // No combat; both heal a little
  | "conditional" // Damage depends on HP comparison
  | "damage_heal"; // Deal damage AND heal self

export interface MajorEffect {
  type: EffectType;
  value: number; // primary value (damage/heal amount)
  secondaryValue?: number; // for damage_heal: heal amount
  description: string;
}

export interface Card {
  id: number;
  type: CardType;
  name: string;
  image: string;

  // Minor-only
  suit?: Suit;
  value?: number; // 1-14

  // Major-only
  majorIndex?: number;
  effect?: MajorEffect;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const MAX_HP = 30;
export const TOTAL_ROUNDS = 5;
export const COUNTER_BONUS = 3;

/** Element counter chain: key counters value */
export const COUNTER_MAP: Record<Suit, Suit> = {
  Wands: "Pentacles", // Fire  > Earth
  Pentacles: "Swords", // Earth > Air
  Swords: "Cups", // Air   > Water
  Cups: "Wands", // Water > Fire
};

export const SUIT_EMOJI: Record<Suit, string> = {
  Wands: "🔥",
  Cups: "💧",
  Swords: "🌪️",
  Pentacles: "🌍",
};

export const SUIT_LABEL: Record<Suit, string> = {
  Wands: "Wands (Fire)",
  Cups: "Cups (Water)",
  Swords: "Swords (Air)",
  Pentacles: "Pentacles (Earth)",
};

// ─── Major Arcana Effects ────────────────────────────────────────────────────

const MAJOR_EFFECTS: MajorEffect[] = [
  /* 00 */ {
    type: "dodge",
    value: 0,
    description: "Dodge — Take no damage this round",
  },
  /* 01 */ {
    type: "damage",
    value: 16,
    description: "Arcane Burst — Deal 16 damage",
  },
  /* 02 */ {
    type: "damage",
    value: 11,
    description: "Foresight — Deal 11 piercing damage",
  },
  /* 03 */ { type: "heal", value: 8, description: "Nurture — Heal 8 HP" },
  /* 04 */ {
    type: "damage",
    value: 10,
    description: "Authority — Deal 10 fixed damage",
  },
  /* 05 */ {
    type: "both_heal",
    value: 5,
    description: "Blessing — Both players heal 5 HP",
  },
  /* 06 */ { type: "heal", value: 6, description: "Bond — Heal 6 HP" },
  /* 07 */ {
    type: "damage",
    value: 9,
    description: "Charge — Ram for 9 damage",
  },
  /* 08 */ {
    type: "damage",
    value: 14,
    description: "Might — Strike with power 14",
  },
  /* 09 */ {
    type: "dodge",
    value: 0,
    description: "Evasion — Fade into shadow, dodge all",
  },
  /* 10 */ {
    type: "swap",
    value: 0,
    description: "Fate Spin — Swap HP with opponent",
  },
  /* 11 */ {
    type: "conditional",
    value: 0,
    description: "Balance — Damage = |HP difference|",
  },
  /* 12 */ {
    type: "skip",
    value: 3,
    description: "Suspension — Skip round, both heal 3",
  },
  /* 13 */ {
    type: "damage",
    value: 15,
    description: "Reaper — Deal 15 true damage",
  },
  /* 14 */ {
    type: "average",
    value: 0,
    description: "Equilibrium — Set both HP to average",
  },
  /* 15 */ {
    type: "drain",
    value: 5,
    description: "Dark Pact — Steal 5 HP from opponent",
  },
  /* 16 */ {
    type: "both_damage",
    value: 10,
    description: "Destruction — Both take 10 damage",
  },
  /* 17 */ { type: "heal", value: 12, description: "Miracle — Heal 12 HP" },
  /* 18 */ {
    type: "damage",
    value: 7,
    description: "Illusion — Confuse for 7 damage",
  },
  /* 19 */ {
    type: "damage_heal",
    value: 12,
    secondaryValue: 5,
    description: "Radiance — Deal 12 damage & heal 5",
  },
  /* 20 */ {
    type: "conditional",
    value: 0,
    description: "Reckoning — If losing: 18 dmg; else 5",
  },
  /* 21 */ {
    type: "damage",
    value: 20,
    description: "Absolute — Deal 20 damage",
  },
];

// ─── Major Arcana Card Names / Filenames ─────────────────────────────────────

const MAJOR_NAMES: { name: string; filename: string }[] = [
  { name: "The Fool", filename: "00-TheFool" },
  { name: "The Magician", filename: "01-TheMagician" },
  { name: "The High Priestess", filename: "02-TheHighPriestess" },
  { name: "The Empress", filename: "03-TheEmpress" },
  { name: "The Emperor", filename: "04-TheEmperor" },
  { name: "The Hierophant", filename: "05-TheHierophant" },
  { name: "The Lovers", filename: "06-TheLovers" },
  { name: "The Chariot", filename: "07-TheChariot" },
  { name: "Strength", filename: "08-Strength" },
  { name: "The Hermit", filename: "09-TheHermit" },
  { name: "Wheel of Fortune", filename: "10-WheelOfFortune" },
  { name: "Justice", filename: "11-Justice" },
  { name: "The Hanged Man", filename: "12-TheHangedMan" },
  { name: "Death", filename: "13-Death" },
  { name: "Temperance", filename: "14-Temperance" },
  { name: "The Devil", filename: "15-TheDevil" },
  { name: "The Tower", filename: "16-TheTower" },
  { name: "The Star", filename: "17-TheStar" },
  { name: "The Moon", filename: "18-TheMoon" },
  { name: "The Sun", filename: "19-TheSun" },
  { name: "Judgement", filename: "20-Judgement" },
  { name: "The World", filename: "21-TheWorld" },
];

// ─── Value Display Names ─────────────────────────────────────────────────────

export const VALUE_NAMES: Record<number, string> = {
  1: "Ace",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
  11: "Page",
  12: "Knight",
  13: "Queen",
  14: "King",
};

// ─── Build the Full 78-Card Deck ─────────────────────────────────────────────

function buildDeck(): Card[] {
  const deck: Card[] = [];

  // Major Arcana (id 0-21)
  for (let i = 0; i < 22; i++) {
    deck.push({
      id: i,
      type: "major",
      name: MAJOR_NAMES[i].name,
      image: `/cards/${MAJOR_NAMES[i].filename}.png`,
      majorIndex: i,
      effect: MAJOR_EFFECTS[i],
    });
  }

  // Minor Arcana (id 22-77)
  const suits: Suit[] = ["Cups", "Pentacles", "Swords", "Wands"];
  let id = 22;
  for (const suit of suits) {
    for (let value = 1; value <= 14; value++) {
      const paddedValue = value.toString().padStart(2, "0");
      deck.push({
        id: id++,
        type: "minor",
        name: `${VALUE_NAMES[value]} of ${suit}`,
        image: `/cards/${suit}${paddedValue}.png`,
        suit,
        value,
      });
    }
  }

  return deck;
}

export const FULL_DECK: Card[] = buildDeck();
