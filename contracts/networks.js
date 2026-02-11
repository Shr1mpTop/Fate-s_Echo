/**
 * Network Configurations for Fate's Echo
 */

export const NETWORKS = {
  sepolia: {
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia ETH",
      symbol: "ETH",
      decimals: 18
    },
    vrf: {
      coordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
      keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
      callbackGasLimit: 500000,
      confirmations: 3
    }
  },

  // For future multi-chain support
  amoy: {
    name: "Amoy",
    chainId: 80002,
    rpcUrl: "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18
    },
    vrf: {
      // Add Amoy VRF config when available
      coordinator: "",
      keyHash: "",
      callbackGasLimit: 500000,
      confirmations: 3
    }
  }
};

// Current active network
export const ACTIVE_NETWORK = NETWORKS.sepolia;

// Game configuration
export const GAME_CONFIG = {
  minBet: "0.001",    // 0.001 ETH
  maxBet: "1",        // 1 ETH
  houseEdge: 5,       // 5%
  winMultiplier: 1.9, // 1.9x payout
  maxHp: 30,
  totalRounds: 5
};

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  [NETWORKS.sepolia.chainId]: "0x...", // Replace with your deployed address
  [NETWORKS.amoy.chainId]: "0x..."     // For future use
};