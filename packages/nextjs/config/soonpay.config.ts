/**
 * SoonPay Integration Configuration
 * This file manages the integration with SoonPay API while maintaining local development capabilities
 */

export interface SoonPayConfig {
  enabled: boolean;
  apiEndpoint: string;
  rpcEndpoint: string;
  authEndpoint: string;
  environment: "local" | "testnet" | "mainnet";
}

// Environment-based configuration
export const soonPayConfig: SoonPayConfig = {
  // Toggle SoonPay integration on/off
  enabled: process.env.NEXT_PUBLIC_SOONPAY_ENABLED === "true",

  // API endpoints
  apiEndpoint: process.env.NEXT_PUBLIC_SOONPAY_API_URL || "https://api.soonpay.com",
  rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://eth.drpc.org",
  authEndpoint: process.env.NEXT_PUBLIC_SOONPAY_AUTH_URL || "https://auth.soonpay.com",

  // Current environment
  environment: (process.env.NEXT_PUBLIC_ENVIRONMENT as "local" | "testnet" | "mainnet") || "local",
};

// Network configurations
export const networkConfigs = {
  local: {
    chainId: 31337,
    name: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    currency: "ETH",
  },
  testnet: {
    chainId: 11155111, // Sepolia
    name: "Sepolia Testnet",
    rpcUrl: "https://eth.drpc.org",
    currency: "ETH",
  },
  mainnet: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: "https://eth.drpc.org",
    currency: "ETH",
  },
};

// Token configuration with proper decimal handling
export const tokenConfig = {
  LIQUID: {
    symbol: "LIQUID",
    decimals: 18,
    // Local contract address (will be populated after deployment)
    localAddress: process.env.NEXT_PUBLIC_LIQUID_TOKEN_LOCAL || "",
    // Live network addresses (if available)
    testnetAddress: process.env.NEXT_PUBLIC_LIQUID_TOKEN_TESTNET || "",
    mainnetAddress: process.env.NEXT_PUBLIC_LIQUID_TOKEN_MAINNET || "",
  },
};

// Get current network configuration
export const getCurrentNetworkConfig = () => {
  return networkConfigs[soonPayConfig.environment];
};

// Get current token address based on environment
export const getCurrentTokenAddress = (tokenSymbol: keyof typeof tokenConfig) => {
  const token = tokenConfig[tokenSymbol];
  switch (soonPayConfig.environment) {
    case "local":
      return token.localAddress;
    case "testnet":
      return token.testnetAddress;
    case "mainnet":
      return token.mainnetAddress;
    default:
      return token.localAddress;
  }
};
