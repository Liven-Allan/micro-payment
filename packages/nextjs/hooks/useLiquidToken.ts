import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { formatTokenAmount, parseTokenAmount } from "~~/utils/tokenFormatter";
import { soonPayConfig, getCurrentTokenAddress } from "~~/config/soonpay.config";
import { useState } from "react";

const LIQUID_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Enhanced LIQUID token hook with SoonPay integration
 * Uses MockLiquidToken for local development, real LIQUID token for production
 * Includes professional token formatting and SoonPay API support
 */
export const useLiquidToken = (address?: `0x${string}`, refreshKey?: number) => {
  const { targetNetwork } = useTargetNetwork();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the correct LIQUID token address based on network and SoonPay config
  const getLiquidAddress = () => {
    // If SoonPay integration is enabled, use configured addresses
    if (soonPayConfig.enabled) {
      const configuredAddress = getCurrentTokenAddress('LIQUID');
      if (configuredAddress) {
        return configuredAddress as `0x${string}`;
      }
    }
    
    // For local networks, use MockLiquidToken if available
    if (targetNetwork.id === 31337 && deployedContracts[31337]?.MockLiquidToken) {
      return deployedContracts[31337].MockLiquidToken.address as `0x${string}`;
    }
    // For other networks, use the real LIQUID token
    return "0x11DFC652eb62c723ad8c2ae731FcEdE58aB07564" as `0x${string}`;
  };

  const LIQUID_ADDRESS = getLiquidAddress();

  // Get LIQUID token balance
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useReadContract({
    address: LIQUID_ADDRESS,
    abi: LIQUID_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Get token decimals
  const { data: decimals } = useReadContract({
    address: LIQUID_ADDRESS,
    abi: LIQUID_ABI,
    functionName: "decimals",
  });

  // Get token name
  const { data: name } = useReadContract({
    address: LIQUID_ADDRESS,
    abi: LIQUID_ABI,
    functionName: "name",
  });

  // Get token symbol
  const { data: symbol } = useReadContract({
    address: LIQUID_ADDRESS,
    abi: LIQUID_ABI,
    functionName: "symbol",
  });

  // Format balance for display using professional formatting
  const formattedBalance = balance && decimals 
    ? formatTokenAmount(balance.toString(), 'LIQUID', 4).formatted
    : "0";

  // Enhanced balance refresh with SoonPay sync
  const enhancedRefetch = async () => {
    setIsLoading(true);
    try {
      await refetchBalance();
      
      // If SoonPay integration is enabled, also sync with SoonPay API
      if (soonPayConfig.enabled && address) {
        await syncWithSoonPay(address);
      }
    } catch (error) {
      console.error("Balance refresh failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync balance with SoonPay API (if enabled)
  const syncWithSoonPay = async (walletAddress: string) => {
    try {
      console.log(`Syncing balance for ${walletAddress} with SoonPay...`);
      
      // For local development, we skip the actual API call
      if (soonPayConfig.environment === 'local') {
        return;
      }
      
      // In production, make API call to SoonPay
      // const response = await fetch(`${soonPayConfig.apiEndpoint}/balance/${walletAddress}`);
      // const data = await response.json();
      // Handle response...
    } catch (error) {
      console.error("SoonPay sync failed:", error);
    }
  };

  // Utility functions for token operations
  const parseAmount = (amount: string | number) => {
    return parseTokenAmount(amount, 'LIQUID');
  };

  const formatAmount = (amount: string | bigint | number, precision: number = 4) => {
    return formatTokenAmount(amount, 'LIQUID', precision);
  };

  return {
    // Raw data
    balance,
    decimals,
    name,
    symbol,
    
    // Formatted data
    formattedBalance,
    
    // Loading states
    balanceLoading: balanceLoading || isLoading,
    
    // Contract info
    contractAddress: LIQUID_ADDRESS,
    abi: LIQUID_ABI,
    
    // Enhanced refresh function
    refetchBalance: enhancedRefetch,
    
    // Utility functions
    parseAmount,
    formatAmount,
    
    // SoonPay integration info
    soonPayEnabled: soonPayConfig.enabled,
    currentNetwork: soonPayConfig.environment,
    
    // Network info
    targetNetwork: targetNetwork.name,
    chainId: targetNetwork.id
  };
};