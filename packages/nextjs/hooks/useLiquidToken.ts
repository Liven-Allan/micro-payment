import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

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
 * Custom hook to interact with the LIQUID token
 * Uses MockLiquidToken for local development, real LIQUID token for production
 */
export const useLiquidToken = (address?: `0x${string}`, refreshKey?: number) => {
  const { targetNetwork } = useTargetNetwork();
  
  // Get the correct LIQUID token address based on network
  const getLiquidAddress = () => {
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

  // Format balance for display
  const formattedBalance = balance && decimals 
    ? formatUnits(balance, decimals)
    : "0";

  return {
    // Raw data
    balance,
    decimals,
    name,
    symbol,
    
    // Formatted data
    formattedBalance,
    
    // Loading states
    balanceLoading,
    
    // Contract info
    contractAddress: LIQUID_ADDRESS,
    abi: LIQUID_ABI,
    
    // Refresh function
    refetchBalance,
  };
};