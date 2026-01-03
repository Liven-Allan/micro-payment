"use client";

import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";

interface LocalBalanceProps {
  address?: `0x${string}`;
  style?: React.CSSProperties;
}

/**
 * Simple balance component that doesn't fetch prices from external sources
 * Perfect for local development
 */
export const LocalBalance = ({ address, style }: LocalBalanceProps) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { data: balance, isLoading } = useBalance({
    address: targetAddress,
  });

  if (isLoading) {
    return (
      <div style={style} className="animate-pulse">
        <span className="inline-block w-16 h-4 bg-gray-200 rounded"></span>
      </div>
    );
  }

  if (!balance) {
    return (
      <div style={style} className="text-gray-500">
        0 ETH
      </div>
    );
  }

  return (
    <div style={style} className="font-mono">
      {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
    </div>
  );
};