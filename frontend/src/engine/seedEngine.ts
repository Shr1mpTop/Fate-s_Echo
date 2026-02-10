/**
 * Deterministic Pseudo-Random Number Generator (PRNG)
 *
 * Uses mulberry32 algorithm seeded from a string hash.
 * In the production version, this seed will come from Chainlink VRF (uint256).
 * The key property: same seed ALWAYS produces the same sequence of numbers.
 */

/** Hash a string to a 32-bit unsigned integer */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) || 1; // ensure non-zero
}

/**
 * Creates a deterministic PRNG using the mulberry32 algorithm.
 * Given the same seed, it will always produce the exact same sequence.
 */
export function createRNG(seed: number) {
  let state = seed | 0;

  return {
    /** Returns a float in [0, 1) */
    next(): number {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },

    /** Returns an integer in [min, max) */
    nextInt(min: number, max: number): number {
      return Math.floor(this.next() * (max - min)) + min;
    },

    /** Fisher-Yates shuffle — deterministic given the same seed state */
    shuffle<T>(array: T[]): T[] {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = this.nextInt(0, i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  };
}

export type RNG = ReturnType<typeof createRNG>;
