/**
 * Fate's Echo - Quick Deployment Script
 *
 * Copy and paste this into Remix console to deploy quickly
 */

// Sepolia VRF Configuration
const VRF_COORDINATOR = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
const CALLBACK_GAS_LIMIT = 500000;

// Replace with your actual subscription ID
const YOUR_SUBSCRIPTION_ID = 1234; // ⚠️ CHANGE THIS!

// Deployment function
async function deployFateEcho() {
  try {
    console.log("🚀 Deploying Fate's Echo to Sepolia...");

    // Get the contract factory
    const FateEcho = await ethers.getContractFactory("FateEcho");

    // Deploy with VRF parameters
    const fateEcho = await FateEcho.deploy(
      VRF_COORDINATOR,
      YOUR_SUBSCRIPTION_ID,
      KEY_HASH,
      CALLBACK_GAS_LIMIT
    );

    console.log("⏳ Waiting for deployment...");
    await fateEcho.deployed();

    console.log("✅ Fate's Echo deployed successfully!");
    console.log("📍 Contract Address:", fateEcho.address);
    console.log("🔗 Sepolia Explorer:", `https://sepolia.etherscan.io/address/${fateEcho.address}`);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const owner = await fateEcho.owner();
    console.log("👑 Owner:", owner);

    const stats = await fateEcho.getStats();
    console.log("📊 Initial Stats:", {
      volume: ethers.utils.formatEther(stats.volume),
      payouts: ethers.utils.formatEther(stats.payouts),
      balance: ethers.utils.formatEther(stats.balance)
    });

    return fateEcho.address;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Run deployment
deployFateEcho()
  .then(address => {
    console.log("\n🎉 Deployment complete! Contract address:", address);
    console.log("📋 Next steps:");
    console.log("1. Fund your VRF subscription with LINK tokens");
    console.log("2. Copy the contract address to your frontend config");
    console.log("3. Test a game with a small bet");
  })
  .catch(console.error);