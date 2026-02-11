/**
 * useFateEcho — Main game hook (imperative version)
 *
 * Uses viem publicClient directly for reads (not reactive hooks),
 * so the flow cannot get stuck due to React re-render timing.
 *
 * Flow:
 *   1. playGame() — send ETH bet via MetaMask
 *   2. waitForTransactionReceipt() — get requestId
 *   3. poll isSeedReady() — wait for VRF callback
 *   4. getGame() — fetch seed
 *   5. resolveBattle(seed) — compute battle client side
 *   6. settleBattle() — settle on-chain, receive payout
 */

import { useState, useCallback, useRef } from "react";
import { useAccount, useWriteContract, useBalance } from "wagmi";
import {
  parseEther,
  formatEther,
  decodeEventLog,
  type PublicClient,
} from "viem";
import { getPublicClient } from "wagmi/actions";
import { sepolia } from "wagmi/chains";
import { config } from "./wagmiConfig";
import { FATE_ECHO_ABI, FATE_ECHO_ADDRESS } from "./contract";
import { resolveBattle, type BattleResult } from "../engine/battleEngine";

// ── Game flow states ──────────────────────────────────────────
export type GameFlowState =
  | "idle" // Ready to play
  | "sending_tx" // Waiting for playGame tx confirmation
  | "waiting_vrf" // Waiting for Chainlink VRF callback
  | "battle_ready" // Seed received, ready to animate
  | "animating" // Battle animation playing
  | "settling" // Sending settleBattle tx
  | "settled" // Game complete
  | "error"; // Something went wrong

export interface GameFlowData {
  requestId: bigint | null;
  seed: string | null;
  betAmount: string; // ETH string
  battleResult: BattleResult | null;
  txHash: `0x${string}` | null;
  settleTxHash: `0x${string}` | null;
  errorMessage: string | null;
  payoutAmount: string | null; // ETH string
}

const INITIAL_FLOW_DATA: GameFlowData = {
  requestId: null,
  seed: null,
  betAmount: "0",
  battleResult: null,
  txHash: null,
  settleTxHash: null,
  errorMessage: null,
  payoutAmount: null,
};

/** Helper: sleep for ms */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Helper: get viem public client from wagmi config */
function getClient(): PublicClient {
  return getPublicClient(config, { chainId: sepolia.id }) as PublicClient;
}

export function useFateEcho() {
  const { address, isConnected } = useAccount();

  // ── Flow state ──
  const [flowState, setFlowState] = useState<GameFlowState>("idle");
  const [flowData, setFlowData] = useState<GameFlowData>(INITIAL_FLOW_DATA);

  // Abort ref — cancel ongoing flow when user resets
  const abortRef = useRef<AbortController | null>(null);

  // ── Wallet balance ──
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    chainId: sepolia.id,
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  });

  // ── Write hooks (only used for MetaMask signing) ──
  const {
    writeContractAsync: writePlayGame,
    reset: resetPlay,
  } = useWriteContract();

  const {
    writeContractAsync: writeSettle,
    reset: resetSettle,
  } = useWriteContract();

  // ═══════════════════════════════════════════════════════════
  //  startGame — kicks off the entire imperative async flow
  // ═══════════════════════════════════════════════════════════
  const startGame = useCallback(
    async (betEth: string) => {
      if (!isConnected) return;

      // Cancel any previous flow
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      resetPlay();
      resetSettle();
      setFlowState("sending_tx");
      setFlowData({ ...INITIAL_FLOW_DATA, betAmount: betEth });

      try {
        // ──── Step 1: Send playGame tx via MetaMask ────
        console.log("[FateEcho] 📤 Sending playGame tx...", betEth, "ETH");

        const txHash = await writePlayGame({
          address: FATE_ECHO_ADDRESS,
          abi: FATE_ECHO_ABI,
          functionName: "playGame",
          value: parseEther(betEth),
          chainId: sepolia.id,
        });

        if (abort.signal.aborted) return;
        console.log("[FateEcho] ✅ TX sent:", txHash);

        setFlowData((prev) => ({ ...prev, txHash }));

        // ──── Step 2: Wait for receipt (imperative!) ────
        console.log("[FateEcho] ⏳ Waiting for receipt...");
        const client = getClient();

        const receipt = await client.waitForTransactionReceipt({
          hash: txHash,
          confirmations: 1,
          timeout: 120_000, // 2 min max
        });

        if (abort.signal.aborted) return;
        console.log("[FateEcho] ✅ Receipt received, logs:", receipt.logs.length);

        // ──── Step 3: Extract requestId from GameRequested event ────
        let requestId: bigint | null = null;

        for (const log of receipt.logs) {
          if (log.address.toLowerCase() !== FATE_ECHO_ADDRESS.toLowerCase())
            continue;
          try {
            const decoded = decodeEventLog({
              abi: FATE_ECHO_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === "GameRequested") {
              requestId = (decoded.args as any).requestId;
              console.log("[FateEcho] 🎯 RequestId:", requestId?.toString());
              break;
            }
          } catch {
            // Not a matching event, skip
          }
        }

        if (!requestId) {
          throw new Error("Could not find requestId in transaction logs");
        }

        if (abort.signal.aborted) return;
        setFlowData((prev) => ({ ...prev, requestId, txHash: receipt.transactionHash }));
        setFlowState("waiting_vrf");

        // ──── Step 4: Poll isSeedReady every 3s ────
        console.log("[FateEcho] 🔮 Polling for VRF seed...");

        let seedReady = false;
        let pollCount = 0;
        const MAX_POLLS = 100; // 5 min max

        while (!seedReady && pollCount < MAX_POLLS) {
          if (abort.signal.aborted) return;
          await sleep(3000);
          pollCount++;

          try {
            const ready = await client.readContract({
              address: FATE_ECHO_ADDRESS,
              abi: FATE_ECHO_ABI,
              functionName: "isSeedReady",
              args: [requestId],
            });
            seedReady = !!ready;
            console.log(`[FateEcho] 📡 Poll #${pollCount}: seedReady=${seedReady}`);
          } catch (e) {
            console.warn(`[FateEcho] ⚠️ Poll #${pollCount} failed:`, e);
            // RPC hiccup, keep trying
          }
        }

        if (!seedReady) {
          throw new Error(`VRF seed not ready after ${MAX_POLLS} polls (~5min). Try again later.`);
        }

        // ──── Step 5: Fetch game data to get seed ────
        if (abort.signal.aborted) return;

        const gameData = await client.readContract({
          address: FATE_ECHO_ADDRESS,
          abi: FATE_ECHO_ABI,
          functionName: "getGame",
          args: [requestId],
        });

        const gameSeed = (gameData as any).seed ?? (gameData as any)[3];
        if (!gameSeed || gameSeed === 0n) {
          throw new Error("Game seed is zero despite isSeedReady=true");
        }

        console.log("[FateEcho] 🌟 Seed received:", gameSeed.toString().slice(0, 20) + "...");

        // ──── Step 6: Resolve battle client-side ────
        const seedStr = gameSeed.toString();
        const result = resolveBattle(seedStr);

        console.log(
          "[FateEcho] ⚔️ Battle resolved:",
          result.playerWon ? "WIN" : result.isDraw ? "DRAW" : "LOSE",
          `HP ${result.playerFinalHp} vs ${result.enemyFinalHp}`
        );

        if (abort.signal.aborted) return;
        setFlowData((prev) => ({
          ...prev,
          seed: seedStr,
          battleResult: result,
        }));
        setFlowState("battle_ready");

      } catch (err: any) {
        if (abort.signal.aborted) return;
        const msg = err?.shortMessage || err?.message || "Unknown error";
        console.error("[FateEcho] ❌ Error:", msg, err);
        setFlowData((prev) => ({ ...prev, errorMessage: msg }));
        setFlowState("error");
      }
    },
    [isConnected, writePlayGame, resetPlay, resetSettle]
  );

  // ═══════════════════════════════════════════════════════════
  //  settleBattle — called after animation completes
  // ═══════════════════════════════════════════════════════════
  const settleBattle = useCallback(async () => {
    const reqId = flowData.requestId;
    if (!reqId) return;

    const abort = abortRef.current;

    try {
      setFlowState("settling");
      console.log("[FateEcho] 💰 Sending settleBattle tx...");

      const txHash = await writeSettle({
        address: FATE_ECHO_ADDRESS,
        abi: FATE_ECHO_ABI,
        functionName: "settleBattle",
        args: [reqId],
        chainId: sepolia.id,
      });

      if (abort?.signal.aborted) return;
      console.log("[FateEcho] ✅ Settle TX sent:", txHash);

      const client = getClient();
      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
        timeout: 120_000,
      });

      if (abort?.signal.aborted) return;
      console.log("[FateEcho] ✅ Settle receipt, logs:", receipt.logs.length);

      // Extract payout from GamePaid event
      let payoutAmount: string = "0";
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== FATE_ECHO_ADDRESS.toLowerCase())
          continue;
        try {
          const decoded = decodeEventLog({
            abi: FATE_ECHO_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "GamePaid") {
            const amount = (decoded.args as any).amount;
            payoutAmount = formatEther(amount);
            console.log("[FateEcho] 💸 Payout:", payoutAmount, "ETH");
            break;
          }
          if (decoded.eventName === "GameResolved") {
            const payout = (decoded.args as any).payout;
            if (payout && payout > 0n) {
              payoutAmount = formatEther(payout);
              console.log("[FateEcho] 💸 Payout (from GameResolved):", payoutAmount, "ETH");
            }
          }
        } catch {
          // Not matching event
        }
      }

      setFlowData((prev) => ({
        ...prev,
        settleTxHash: receipt.transactionHash,
        payoutAmount,
      }));
      setFlowState("settled");
      refetchBalance();

    } catch (err: any) {
      if (abort?.signal.aborted) return;
      const msg = err?.shortMessage || err?.message || "Unknown error";
      console.error("[FateEcho] ❌ Settle error:", msg, err);
      setFlowData((prev) => ({ ...prev, errorMessage: msg }));
      setFlowState("error");
    }
  }, [flowData.requestId, writeSettle, refetchBalance]);

  // ══════════════════════════════════════════════════════════
  //  markAnimating / resetGame
  // ══════════════════════════════════════════════════════════
  const startAnimation = useCallback(() => {
    setFlowState("animating");
  }, []);

  const resetGame = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    resetPlay();
    resetSettle();
    setFlowState("idle");
    setFlowData(INITIAL_FLOW_DATA);
    refetchBalance();
  }, [resetPlay, resetSettle, refetchBalance]);

  return {
    // State
    flowState,
    flowData,
    isConnected,
    address,
    balance: balanceData ? formatEther(balanceData.value) : "0",
    balanceRaw: balanceData?.value ?? 0n,

    // Actions
    startGame,
    startAnimation,
    settleBattle,
    resetGame,
  };
}
