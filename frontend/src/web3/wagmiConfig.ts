/**
 * wagmi + viem configuration for Sepolia testnet
 */
import { http, createConfig, fallback } from "wagmi";
import { sepolia } from "wagmi/chains";

// Use env RPC as primary, with public fallbacks
const rpcUrl = import.meta.env.VITE_RPC_URL || "";

const transports = [
  // User-provided RPC (highest priority)
  ...(rpcUrl ? [http(rpcUrl)] : []),
  // Reliable public fallbacks
  http("https://ethereum-sepolia-rpc.publicnode.com"),
  http("https://sepolia.gateway.tenderly.co"),
  http("https://rpc2.sepolia.org"),
];

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: fallback(transports),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
