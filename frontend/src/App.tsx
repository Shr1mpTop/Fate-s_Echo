import { useState, useCallback, useEffect } from "react";
import { GameSetup } from "./components/GameSetup";
import { BattleScene } from "./components/BattleScene";
import { GameOver } from "./components/GameOver";
import { LoadingScreen } from "./components/LoadingScreen";
import { SettlingScreen } from "./components/SettlingScreen";
import { CardGallery } from "./components/CardGallery";
import { HowToPlay } from "./components/HowToPlay";
import { SpaceBackground } from "./components/SpaceBackground";
import { useFateEcho } from "./web3/useFateEcho";

type GamePhase =
  | "setup"
  | "loading"    // sending_tx / waiting_vrf / battle_ready
  | "battle"     // animating
  | "settling"   // settleBattle in progress
  | "gameover"   // settled
  | "gallery"
  | "howtoplay";

function App() {
  const [phase, setPhase] = useState<GamePhase>("setup");

  const {
    flowState,
    flowData,
    isConnected,
    balance,
    startGame,
    startAnimation,
    settleBattle,
    resetGame,
  } = useFateEcho();

  // ── Auto-transition: settled → show GameOver ──
  useEffect(() => {
    if (flowState === "settled" && phase === "settling") {
      setPhase("gameover");
    }
  }, [flowState, phase]);

  // ── If error happens during loading/settling, stay on that screen (it shows errors) ──
  // No auto-transition needed — LoadingScreen and SettlingScreen handle error display.

  // ── Handlers ──
  const handleStartGame = useCallback(
    (betEth: string) => {
      startGame(betEth);
      setPhase("loading"); // Immediately go to loading screen
    },
    [startGame]
  );

  const handleEnterBattle = useCallback(() => {
    // User clicked "Enter Battle" on LoadingScreen
    if (flowData.battleResult) {
      startAnimation();
      setPhase("battle");

      // Debug log
      const result = flowData.battleResult;
      console.group(`🔮 Battle Resolved — Seed: "${flowData.seed}"`);
      console.log(
        "Result:",
        result.playerWon ? "PLAYER WINS" : result.isDraw ? "DRAW" : "ENEMY WINS"
      );
      console.log(
        `Final HP — Player: ${result.playerFinalHp}/${result.playerMaxHp}, Enemy: ${result.enemyFinalHp}/${result.enemyMaxHp}`
      );
      result.rounds.forEach((r) => {
        console.log(
          `  Round ${r.round}: ${r.playerCard.name} vs ${r.enemyCard.name} → ` +
            `Player ${r.playerHpBefore}→${r.playerHpAfter} | Enemy ${r.enemyHpBefore}→${r.enemyHpAfter}`
        );
      });
      console.groupEnd();
    }
  }, [flowData.battleResult, flowData.seed, startAnimation]);

  const handleBattleComplete = useCallback(() => {
    // Animation done → go to settling screen, then settle on-chain
    setPhase("settling");
    settleBattle();
  }, [settleBattle]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setPhase("setup");
  }, [resetGame]);

  const betAmountNum = parseFloat(flowData.betAmount) || 0;

  return (
    <div className="app">
      <SpaceBackground />

      {phase === "setup" && (
        <GameSetup
          onStartGame={handleStartGame}
          onOpenGallery={() => setPhase("gallery")}
          onOpenHowToPlay={() => setPhase("howtoplay")}
          balance={balance}
        />
      )}

      {phase === "loading" && (
        <LoadingScreen
          flowState={flowState}
          onEnterBattle={handleEnterBattle}
          errorMessage={flowData.errorMessage}
          onReset={handlePlayAgain}
        />
      )}

      {phase === "battle" && flowData.battleResult && (
        <BattleScene
          battleResult={flowData.battleResult}
          betAmount={betAmountNum}
          onBattleComplete={handleBattleComplete}
        />
      )}

      {phase === "settling" && flowData.battleResult && (
        <SettlingScreen
          flowState={flowState}
          battleResult={flowData.battleResult}
          betAmount={flowData.betAmount}
          errorMessage={flowData.errorMessage}
          onReset={handlePlayAgain}
        />
      )}

      {phase === "gameover" && flowData.battleResult && (
        <GameOver
          battleResult={flowData.battleResult}
          betAmount={flowData.betAmount}
          payoutAmount={flowData.payoutAmount}
          txHash={flowData.txHash}
          settleTxHash={flowData.settleTxHash}
          requestId={flowData.requestId}
          onPlayAgain={handlePlayAgain}
          onReturnHome={handlePlayAgain}
        />
      )}

      {phase === "gallery" && <CardGallery onBack={() => setPhase("setup")} />}
      {phase === "howtoplay" && <HowToPlay onBack={() => setPhase("setup")} />}
    </div>
  );
}

export default App;
