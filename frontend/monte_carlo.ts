/**
 * ═══════════════════════════════════════════════════════════════════
 *  Fate's Echo — Monte Carlo Simulation
 *  
 *  大规模蒙特卡洛模拟（100万局+），科学分析庄家收益
 *  算法 100% 匹配 FateEcho.sol 合约
 * ═══════════════════════════════════════════════════════════════════
 */

import { ethers } from "ethers";

// ─── Contract Constants ──────────────────────────────────────────
const MAX_HP = 30;
const TOTAL_ROUNDS = 5;
const COUNTER_BONUS = 3;

// ─── Contract-Matching Functions ─────────────────────────────────

function hashToCardId(seed: string, nonce: number): number {
  const hash = ethers.keccak256(
    ethers.solidityPacked(["uint256", "uint256"], [seed, nonce])
  );
  return Number(BigInt(hash) % 78n);
}

function isMajorArcana(cardId: number): boolean {
  return cardId < 22;
}

function getMinorValue(cardId: number): number {
  return ((cardId - 22) % 14) + 1;
}

function getMinorSuitIndex(cardId: number): number {
  return Math.floor((cardId - 22) / 14);
}

function doesCounter(attackerSuit: number, defenderSuit: number): boolean {
  if (attackerSuit === 0 && defenderSuit === 3) return true;
  if (attackerSuit === 3 && defenderSuit === 2) return true;
  if (attackerSuit === 2 && defenderSuit === 1) return true;
  if (attackerSuit === 1 && defenderSuit === 0) return true;
  return false;
}

function getMajorEffectType(cardId: number): number {
  return cardId % 2;
}

function getMajorValue(cardId: number): number {
  return 5 + ((cardId * 3) % 16);
}

// ─── Round Resolution (Contract-exact) ───────────────────────────

interface Dmg { pDmg: number; eDmg: number; pHeal: number; eHeal: number; }

function resolveMajorClash(pCardId: number, eCardId: number): Dmg {
  const hash = ethers.keccak256(
    ethers.solidityPacked(["uint256", "uint256"], [pCardId, eCardId])
  );
  const h = BigInt(hash);
  return { pDmg: 5 + Number(h % 11n), eDmg: 5 + Number((h >> 8n) % 11n), pHeal: 0, eHeal: 0 };
}

function resolveMajorVsMinor(majorId: number, minorId: number, majorIsPlayer: boolean): Dmg {
  let pDmg = 0, eDmg = 0, pHeal = 0, eHeal = 0;
  const effectType = getMajorEffectType(majorId);
  const value = getMajorValue(majorId);

  if (effectType === 0) {
    if (majorIsPlayer) pDmg = value; else eDmg = value;
  } else {
    if (majorIsPlayer) pHeal = value; else eHeal = value;
  }

  const minorValue = getMinorValue(minorId);
  const retaliation = Math.floor(minorValue / 2);
  if (majorIsPlayer) eDmg = retaliation; else pDmg = retaliation;

  return { pDmg, eDmg, pHeal, eHeal };
}

function resolveMinorVsMinor(pCardId: number, eCardId: number): Dmg {
  let pValue = getMinorValue(pCardId);
  let eValue = getMinorValue(eCardId);
  const pSuit = getMinorSuitIndex(pCardId);
  const eSuit = getMinorSuitIndex(eCardId);

  if (doesCounter(pSuit, eSuit)) pValue += COUNTER_BONUS;
  if (doesCounter(eSuit, pSuit)) eValue += COUNTER_BONUS;

  let pDmg: number, eDmg: number;
  if (pValue > eValue) { pDmg = pValue - eValue + 2; eDmg = 1; }
  else if (eValue > pValue) { eDmg = eValue - pValue + 2; pDmg = 1; }
  else { pDmg = 2; eDmg = 2; }

  return { pDmg, eDmg, pHeal: 0, eHeal: 0 };
}

function resolveRound(pCardId: number, eCardId: number): Dmg {
  const pM = isMajorArcana(pCardId);
  const eM = isMajorArcana(eCardId);
  if (pM && eM) return resolveMajorClash(pCardId, eCardId);
  if (pM) return resolveMajorVsMinor(pCardId, eCardId, true);
  if (eM) return resolveMajorVsMinor(eCardId, pCardId, false);
  return resolveMinorVsMinor(pCardId, eCardId);
}

// ─── Simulation Core ─────────────────────────────────────────────

interface GameResult {
  playerWon: boolean;
  isDraw: boolean;
  playerFinalHp: number;
  enemyFinalHp: number;
  hpDiff: number;           // playerHp - enemyHp
  totalDmgDealt: number;    // player dealt to enemy
  totalDmgTaken: number;    // enemy dealt to player
  totalPlayerHeal: number;
  totalEnemyHeal: number;
  majorCards: number;        // total major arcana appearances
  earlyFinish: boolean;     // someone hit 0 HP before round 5
}

function simulateGame(seed: string): GameResult {
  const playerCardIds: number[] = [];
  const enemyCardIds: number[] = [];

  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    playerCardIds.push(hashToCardId(seed, i * 2));
    enemyCardIds.push(hashToCardId(seed, i * 2 + 1));
  }

  let playerHp = MAX_HP;
  let enemyHp = MAX_HP;
  let totalDmgDealt = 0, totalDmgTaken = 0;
  let totalPlayerHeal = 0, totalEnemyHeal = 0;
  let majorCards = 0;
  let earlyFinish = false;

  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    if (playerHp === 0 || enemyHp === 0) { earlyFinish = true; break; }

    const pId = playerCardIds[i];
    const eId = enemyCardIds[i];

    if (isMajorArcana(pId)) majorCards++;
    if (isMajorArcana(eId)) majorCards++;

    const dmg = resolveRound(pId, eId);

    totalDmgDealt += dmg.pDmg;
    totalDmgTaken += dmg.eDmg;
    totalPlayerHeal += dmg.pHeal;
    totalEnemyHeal += dmg.eHeal;

    enemyHp = enemyHp > dmg.pDmg ? enemyHp - dmg.pDmg : 0;
    playerHp = playerHp > dmg.eDmg ? playerHp - dmg.eDmg : 0;
    playerHp = playerHp > MAX_HP - dmg.pHeal ? MAX_HP : playerHp + dmg.pHeal;
    enemyHp = enemyHp > MAX_HP - dmg.eHeal ? MAX_HP : enemyHp + dmg.eHeal;
  }

  return {
    playerWon: playerHp > enemyHp,
    isDraw: playerHp === enemyHp,
    playerFinalHp: playerHp,
    enemyFinalHp: enemyHp,
    hpDiff: playerHp - enemyHp,
    totalDmgDealt,
    totalDmgTaken,
    totalPlayerHeal,
    totalEnemyHeal,
    majorCards,
    earlyFinish,
  };
}

// ─── Monte Carlo Engine ──────────────────────────────────────────

function runMonteCarlo(numGames: number) {
  console.log("═".repeat(70));
  console.log("  Fate's Echo — Monte Carlo Simulation");
  console.log(`  ${numGames.toLocaleString()} games | Algorithm: keccak256 contract-matching`);
  console.log("═".repeat(70));
  console.log();

  const startTime = Date.now();

  // Counters
  let wins = 0, losses = 0, draws = 0;
  let totalHpDiff = 0;
  let totalPlayerFinalHp = 0, totalEnemyFinalHp = 0;
  let totalDmgDealt = 0, totalDmgTaken = 0;
  let totalPlayerHeal = 0, totalEnemyHeal = 0;
  let totalMajorCards = 0;
  let earlyFinishes = 0;

  // HP difference distribution
  const hpDiffBuckets: Record<number, number> = {};

  // Win streak tracking
  let maxWinStreak = 0, maxLoseStreak = 0;
  let curWinStreak = 0, curLoseStreak = 0;

  // Final HP distributions
  const playerHpDist: number[] = new Array(MAX_HP + 1).fill(0);
  const enemyHpDist: number[] = new Array(MAX_HP + 1).fill(0);

  // Win rate by major arcana count
  const majorBucketWins: number[] = new Array(11).fill(0); // 0-10 majors possible
  const majorBucketTotal: number[] = new Array(11).fill(0);

  // Margin of victory distribution
  let closeGames = 0;    // |hpDiff| <= 3
  let blowouts = 0;      // |hpDiff| >= 15

  for (let i = 0; i < numGames; i++) {
    // Generate a pseudo-random seed (simulating VRF randomness)
    // Use keccak256(i) as seed to ensure determinism + even distribution
    const seed = BigInt(
      ethers.keccak256(ethers.solidityPacked(["uint256"], [i]))
    ).toString();

    const result = simulateGame(seed);

    // Outcome tracking
    if (result.isDraw) {
      draws++;
    } else if (result.playerWon) {
      wins++;
      curWinStreak++;
      maxWinStreak = Math.max(maxWinStreak, curWinStreak);
      curLoseStreak = 0;
    } else {
      losses++;
      curLoseStreak++;
      maxLoseStreak = Math.max(maxLoseStreak, curLoseStreak);
      curWinStreak = 0;
    }

    // Aggregate stats
    totalHpDiff += result.hpDiff;
    totalPlayerFinalHp += result.playerFinalHp;
    totalEnemyFinalHp += result.enemyFinalHp;
    totalDmgDealt += result.totalDmgDealt;
    totalDmgTaken += result.totalDmgTaken;
    totalPlayerHeal += result.totalPlayerHeal;
    totalEnemyHeal += result.totalEnemyHeal;
    totalMajorCards += result.majorCards;
    if (result.earlyFinish) earlyFinishes++;

    // HP diff distribution
    const diff = result.hpDiff;
    hpDiffBuckets[diff] = (hpDiffBuckets[diff] || 0) + 1;

    // Final HP distributions
    playerHpDist[result.playerFinalHp]++;
    enemyHpDist[result.enemyFinalHp]++;

    // Major arcana correlation
    const mc = Math.min(result.majorCards, 10);
    majorBucketTotal[mc]++;
    if (result.playerWon) majorBucketWins[mc]++;

    // Margin analysis
    const margin = Math.abs(result.hpDiff);
    if (margin <= 3) closeGames++;
    if (margin >= 15) blowouts++;

    // Progress report every 100k games
    if ((i + 1) % 100000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = ((i + 1) / numGames * 100).toFixed(0);
      process.stdout.write(`\r  ⏳ Progress: ${pct}% (${(i+1).toLocaleString()} games, ${elapsed}s)`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\r  ✅ Completed ${numGames.toLocaleString()} games in ${elapsed}s                    `);
  console.log();

  // ─── Results ───────────────────────────────────────────────

  const winRate = wins / numGames;
  const drawRate = draws / numGames;
  const loseRate = losses / numGames;

  // 95% confidence interval for win rate (Wilson score interval)
  const z = 1.96; // 95% CI
  const n = numGames;
  const p = winRate;
  const wilsonCenter = (p + z*z/(2*n)) / (1 + z*z/n);
  const wilsonMargin = z * Math.sqrt((p*(1-p) + z*z/(4*n)) / n) / (1 + z*z/n);
  const ciLow = wilsonCenter - wilsonMargin;
  const ciHigh = wilsonCenter + wilsonMargin;

  console.log("━".repeat(70));
  console.log("  📊 CORE OUTCOME STATISTICS");
  console.log("━".repeat(70));
  console.log(`  样本量:        ${numGames.toLocaleString()} 局`);
  console.log(`  执行时间:      ${elapsed} 秒`);
  console.log();
  console.log(`  ✅ 玩家胜率:   ${(winRate * 100).toFixed(4)}%  (${wins.toLocaleString()} 局)`);
  console.log(`  ❌ 玩家败率:   ${(loseRate * 100).toFixed(4)}%  (${losses.toLocaleString()} 局)`);
  console.log(`  ⚖️  平局率:     ${(drawRate * 100).toFixed(4)}%  (${draws.toLocaleString()} 局)`);
  console.log();
  console.log(`  📐 95% CI (Wilson):  [${(ciLow * 100).toFixed(4)}%, ${(ciHigh * 100).toFixed(4)}%]`);
  console.log(`  📐 标准误差:   ±${((Math.sqrt(p*(1-p)/n)) * 100).toFixed(4)}%`);
  console.log();
  console.log(`  连胜最长:      ${maxWinStreak} 局`);
  console.log(`  连败最长:      ${maxLoseStreak} 局`);

  console.log();
  console.log("━".repeat(70));
  console.log("  ⚔️ COMBAT STATISTICS (per game avg)");
  console.log("━".repeat(70));
  const avgDmgDealt = totalDmgDealt / numGames;
  const avgDmgTaken = totalDmgTaken / numGames;
  const avgPlayerHeal = totalPlayerHeal / numGames;
  const avgEnemyHeal = totalEnemyHeal / numGames;
  const avgPlayerFinalHp = totalPlayerFinalHp / numGames;
  const avgEnemyFinalHp = totalEnemyFinalHp / numGames;
  const avgMajorCards = totalMajorCards / numGames;

  console.log(`  玩家平均输出:  ${avgDmgDealt.toFixed(2)} damage`);
  console.log(`  敌人平均输出:  ${avgDmgTaken.toFixed(2)} damage`);
  console.log(`  玩家平均治疗:  ${avgPlayerHeal.toFixed(2)} HP`);
  console.log(`  敌人平均治疗:  ${avgEnemyHeal.toFixed(2)} HP`);
  console.log(`  玩家平均终HP:  ${avgPlayerFinalHp.toFixed(2)} / ${MAX_HP}`);
  console.log(`  敌人平均终HP:  ${avgEnemyFinalHp.toFixed(2)} / ${MAX_HP}`);
  console.log(`  平均HP差:      ${(totalHpDiff / numGames).toFixed(4)} (正=玩家优势)`);
  console.log(`  平均大秘仪数:  ${avgMajorCards.toFixed(2)} / 10 张`);
  console.log(`  提前结束率:    ${((earlyFinishes / numGames) * 100).toFixed(2)}%`);
  console.log(`  接近比赛率:    ${((closeGames / numGames) * 100).toFixed(2)}% (|Δ| ≤ 3)`);
  console.log(`  碾压率:        ${((blowouts / numGames) * 100).toFixed(2)}% (|Δ| ≥ 15)`);

  console.log();
  console.log("━".repeat(70));
  console.log("  🃏 MAJOR ARCANA IMPACT (大秘仪出现数 vs 胜率)");
  console.log("━".repeat(70));
  for (let i = 0; i <= 10; i++) {
    if (majorBucketTotal[i] > 100) {
      const wr = (majorBucketWins[i] / majorBucketTotal[i] * 100).toFixed(2);
      const pct = (majorBucketTotal[i] / numGames * 100).toFixed(2);
      console.log(`  ${i} 张大秘仪: 胜率 ${wr}%  (${majorBucketTotal[i].toLocaleString()} 局, ${pct}%)`);
    }
  }

  console.log();
  console.log("━".repeat(70));
  console.log("  📈 HP DIFFERENCE DISTRIBUTION (final hpDiff histogram)");
  console.log("━".repeat(70));
  // Group into buckets of 5
  const hpRanges = [
    { label: "≤ -20 (enemy crushes)", min: -30, max: -20 },
    { label: "-19 to -10 (enemy wins big)", min: -19, max: -10 },
    { label: " -9 to  -1 (enemy wins)", min: -9, max: -1 },
    { label: "     0     (draw)", min: 0, max: 0 },
    { label: " +1 to  +9 (player wins)", min: 1, max: 9 },
    { label: "+10 to +19 (player wins big)", min: 10, max: 19 },
    { label: "≥ +20 (player crushes)", min: 20, max: 30 },
  ];

  for (const range of hpRanges) {
    let count = 0;
    for (let d = range.min; d <= range.max; d++) {
      count += hpDiffBuckets[d] || 0;
    }
    const bar = "█".repeat(Math.round(count / numGames * 100));
    const pct = (count / numGames * 100).toFixed(2);
    console.log(`  ${range.label}: ${pct}% ${bar}`);
  }

  // ─── House Edge Analysis ───────────────────────────────────
  console.log();
  console.log("━".repeat(70));
  console.log("  💰 HOUSE EDGE / PAYOUT MULTIPLIER ANALYSIS");
  console.log("━".repeat(70));
  console.log();

  // Current parameters
  console.log("  ▸ Current Settings:");
  console.log("    Win Multiplier:   1.9x");
  console.log("    Draw:             refund (1.0x)");
  console.log("    Lose:             0x");
  console.log();

  // EV calculation: EV = P(win)*mult + P(draw)*1 + P(lose)*0 - 1
  const evCurrent = winRate * 1.9 + drawRate * 1.0 + loseRate * 0 - 1;
  const houseEdgeCurrent = -evCurrent * 100;

  console.log("  ▸ Expected Value (per 1 ETH bet):");
  console.log(`    EV = ${winRate.toFixed(6)} × 1.9 + ${drawRate.toFixed(6)} × 1.0 + ${loseRate.toFixed(6)} × 0 - 1`);
  console.log(`    EV = ${evCurrent.toFixed(6)} ETH`);
  console.log(`    House Edge = ${houseEdgeCurrent.toFixed(4)}%`);
  console.log();

  // Find optimal multiplier for various house edge targets
  console.log("  ▸ Optimal Multiplier Table (draw=refund):");
  console.log("    ┌──────────────┬───────────┬─────────────┬──────────────────┐");
  console.log("    │ House Edge % │ Win Mult  │ EV per 1ETH │ House per 1000   │");
  console.log("    ├──────────────┼───────────┼─────────────┼──────────────────┤");

  for (const targetEdge of [1, 2, 3, 4, 5, 6, 7, 8, 10, 15, 20]) {
    // Solve: P(win)*mult + P(draw)*1 - 1 = -targetEdge/100
    // mult = (1 - P(draw) - targetEdge/100) / P(win)
    const mult = (1 - drawRate - targetEdge / 100) / winRate;
    const ev = winRate * mult + drawRate * 1.0 - 1;
    const housePer1000 = (-ev * 1000).toFixed(2);
    console.log(`    │    ${targetEdge.toString().padStart(2)}%       │  ${mult.toFixed(4)}x  │  ${ev.toFixed(6)}  │  ${housePer1000.padStart(7)} ETH     │`);
  }
  console.log("    └──────────────┴───────────┴─────────────┴──────────────────┘");
  console.log();

  // Fair multiplier
  const fairMult = (1 - drawRate) / winRate;
  console.log(`  ▸ 公平赔率 (0% house edge): ${fairMult.toFixed(6)}x`);
  console.log(`    当前 1.9x 对应庄家优势: ${houseEdgeCurrent.toFixed(4)}%`);
  console.log();

  // ─── Risk Analysis ─────────────────────────────────────────
  console.log("━".repeat(70));
  console.log("  🎲 VARIANCE & RISK ANALYSIS");
  console.log("━".repeat(70));

  // Variance of single bet
  // Returns: playerWon→mult, draw→1, lose→0
  // Var = E(X²) - E(X)²
  const ex = winRate * 1.9 + drawRate * 1.0;
  const ex2 = winRate * 1.9 * 1.9 + drawRate * 1.0;
  const variance = ex2 - ex * ex;
  const stdDev = Math.sqrt(variance);

  console.log(`  单注方差:      ${variance.toFixed(6)}`);
  console.log(`  单注标准差:    ${stdDev.toFixed(6)} ETH (per 1 ETH bet)`);
  console.log(`  波动率:        ${(stdDev / ex * 100).toFixed(2)}%`);
  console.log();

  // Ruin probability estimate (simplified)
  // Gamblers ruin: with house edge h and starting bankroll B,
  // P(ruin) ≈ e^(-2hB/σ²) for small h
  const bankroll = 100; // hypothetical 100 ETH bankroll
  const h = -evCurrent; // house edge per unit
  const pRuin = Math.exp(-2 * h * bankroll / variance);
  console.log(`  庄家破产概率 (${bankroll} ETH 启动资金):`);
  console.log(`    P(ruin) ≈ ${(pRuin * 100).toFixed(6)}%`);
  console.log(`    (基于简化赌徒破产模型)`);
  console.log();

  // Kelly criterion for optimal bet sizing (for player)
  const kelly = (winRate * 1.9 - 1) / 0.9;
  console.log(`  凯利准则 (玩家最优下注比例):`);
  console.log(`    f* = ${(kelly * 100).toFixed(4)}% of bankroll`);
  if (kelly < 0) {
    console.log(`    ⚠️ 凯利值为负！说明庄家有优势，玩家长期必亏`);
  } else {
    console.log(`    ⚠️ 凯利值为正！庄家赔率过高，玩家有长期正EV`);
  }

  // ─── 1000 Games Simulation (Profit Trajectory) ─────────────
  console.log();
  console.log("━".repeat(70));
  console.log("  📉 HOUSE PROFIT TRAJECTORY (10,000 bets × 0.01 ETH)");
  console.log("━".repeat(70));

  let houseProfit = 0;
  const betSize = 0.01;
  const checkpoints = [100, 500, 1000, 2000, 5000, 10000];
  let checkIdx = 0;

  for (let i = 0; i < 10000; i++) {
    const seed = BigInt(
      ethers.keccak256(ethers.solidityPacked(["uint256"], [numGames + i]))
    ).toString();
    const result = simulateGame(seed);

    if (result.isDraw) {
      houseProfit += 0; // refund
    } else if (result.playerWon) {
      houseProfit -= betSize * 0.9; // pay out 1.9x (house loses 0.9 bet)
    } else {
      houseProfit += betSize; // keep bet
    }

    if (checkIdx < checkpoints.length && (i + 1) === checkpoints[checkIdx]) {
      console.log(`  After ${(i + 1).toString().padStart(5)} bets: House profit = ${houseProfit.toFixed(4)} ETH (${(houseProfit / ((i+1) * betSize) * 100).toFixed(2)}%)`);
      checkIdx++;
    }
  }

  // ─── RECOMMENDATION ────────────────────────────────────────
  console.log();
  console.log("═".repeat(70));
  console.log("  📋 RECOMMENDATION SUMMARY");
  console.log("═".repeat(70));
  console.log();
  console.log(`  🎯 Measured Win Rate:  ${(winRate * 100).toFixed(4)}%`);
  console.log(`  🎯 Measured Draw Rate: ${(drawRate * 100).toFixed(4)}%`);
  console.log(`  🎯 Measured Loss Rate: ${(loseRate * 100).toFixed(4)}%`);
  console.log();

  // Suggested configs
  const suggestions = [
    { edge: 3, label: "低抽水 (高竞争力)" },
    { edge: 5, label: "标准抽水 (平衡)" },
    { edge: 8, label: "高抽水 (安全)" },
  ];

  for (const s of suggestions) {
    const m = (1 - drawRate - s.edge / 100) / winRate;
    const ev = winRate * m + drawRate - 1;
    console.log(`  ${s.label}:`);
    console.log(`    Win Multiplier = ${m.toFixed(4)}x | House Edge = ${s.edge}% | EV = ${ev.toFixed(6)}`);
    console.log(`    每 1000 ETH 投注量，庄家预期利润 = ${(s.edge * 10).toFixed(0)} ETH`);
    console.log();
  }

  console.log(`  💡 当前配置 (1.9x): House Edge = ${houseEdgeCurrent.toFixed(4)}%`);
  if (houseEdgeCurrent > 0) {
    console.log(`     ✅ 庄家有 ${houseEdgeCurrent.toFixed(2)}% 优势，长期盈利`);
  } else {
    console.log(`     ❌ 庄家有 ${Math.abs(houseEdgeCurrent).toFixed(2)}% 劣势！需要降低赔率！`);
  }
  console.log("═".repeat(70));
}

// ─── Run ─────────────────────────────────────────────────────

const NUM_GAMES = parseInt(process.argv[2] || "1000000", 10);
runMonteCarlo(NUM_GAMES);
