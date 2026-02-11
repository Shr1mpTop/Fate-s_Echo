/**
 * Fate's Echo - Chainlink VRF Configuration
 *
 * Copy these values to your Remix deployment
 */

// Sepolia Testnet VRF v2 Configuration
export const VRF_CONFIG = {
  // VRF Coordinator Address
  COORDINATOR: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",

  // Gas Lane (Key Hash) - 500 gwei
  KEY_HASH: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",

  // Callback Gas Limit
  CALLBACK_GAS_LIMIT: 500000,

  // Minimum Confirmations
  CONFIRMATIONS: 3,

  // Number of Random Words
  NUM_WORDS: 1,
};

// Game Configuration
export const GAME_CONFIG = {
  MIN_BET: "0.001", // 0.001 ETH
  MAX_BET: "1",     // 1 ETH
  HOUSE_EDGE: 5,    // 5% house edge
  WIN_MULTIPLIER: 1.9, // 1.9x payout (2x - 5% edge)
};

// Useful Links
export const LINKS = {
  CHAINLINK_VRF: "https://vrf.chain.link/sepolia",
  SEPOLIA_FAUCET: "https://sepoliafaucet.com",
  REMIX_IDE: "https://remix.ethereum.org",
  SEPOLIA_EXPLORER: "https://sepolia.etherscan.io",
};