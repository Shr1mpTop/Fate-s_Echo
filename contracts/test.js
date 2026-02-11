/**
 * Fate's Echo - Contract Testing Script
 *
 * Use this in Remix console to test the deployed contract
 */

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0x..."; // ⚠️ CHANGE THIS!

async function testContract() {
  try {
    console.log("🧪 Testing Fate's Echo Contract...");
    console.log("📍 Contract:", CONTRACT_ADDRESS);

    // Get contract instance
    const fateEcho = await ethers.getContractAt("FateEcho", CONTRACT_ADDRESS);

    // Test 1: Check initial stats
    console.log("\n📊 Test 1: Initial Stats");
    const stats = await fateEcho.getStats();
    console.log("Volume:", ethers.utils.formatEther(stats.volume), "ETH");
    console.log("Payouts:", ethers.utils.formatEther(stats.payouts), "ETH");
    console.log("Balance:", ethers.utils.formatEther(stats.balance), "ETH");

    // Test 2: Get game configuration
    console.log("\n⚙️ Test 2: Game Configuration");
    console.log("Max HP:", (await fateEcho.MAX_HP()).toString());
    console.log("Total Rounds:", (await fateEcho.TOTAL_ROUNDS()).toString());
    console.log("House Edge:", (await fateEcho.HOUSE_EDGE()).toString() + "%");

    // Test 3: Simulate a small bet (if you have ETH)
    console.log("\n🎮 Test 3: Game Simulation");
    const betAmount = ethers.utils.parseEther("0.01"); // 0.01 ETH test bet

    console.log("Bet Amount:", ethers.utils.formatEther(betAmount), "ETH");

    // Check if we have enough balance
    const signer = await ethers.getSigner();
    const balance = await signer.getBalance();
    console.log("Your Balance:", ethers.utils.formatEther(balance), "ETH");

    if (balance.lt(betAmount)) {
      console.log("❌ Insufficient balance for test bet");
      return;
    }

    console.log("🎲 Starting game...");
    const tx = await fateEcho.playGame({ value: betAmount });
    console.log("Transaction sent:", tx.hash);

    console.log("⏳ Waiting for VRF callback (may take 30-60 seconds)...");
    await tx.wait();

    // Get the request ID from transaction logs
    const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    const requestId = receipt.logs[0].topics[1]; // Extract from event

    console.log("Request ID:", requestId);

    // Wait for VRF callback (this might take time)
    console.log("🔄 Monitoring for game resolution...");

    // Set up event listener
    fateEcho.on("GameResolved", (reqId, player, playerWon, payout) => {
      console.log("\n🎉 Game Resolved!");
      console.log("Request ID:", reqId);
      console.log("Player:", player);
      console.log("Player Won:", playerWon);
      console.log("Payout:", ethers.utils.formatEther(payout), "ETH");

      // Get final game details
      fateEcho.getGame(reqId).then(game => {
        console.log("Game Details:", {
          seed: game.seed.toString(),
          playerFinalHp: game.playerFinalHp.toString(),
          enemyFinalHp: game.enemyFinalHp.toString(),
          state: game.state
        });
      });
    });

    console.log("✅ Test setup complete!");
    console.log("💡 The game will resolve automatically when VRF responds");
    console.log("🔄 Keep this console open to see the result");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests
testContract();