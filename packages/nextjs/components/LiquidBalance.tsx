"use client";

import EarnYieldButton from "./EarnYieldButton";
import { useAccount } from "wagmi";
import { useLiquidToken } from "~~/hooks/useLiquidToken";

interface LiquidBalanceProps {
  address?: `0x${string}`;
  className?: string;
  showLabel?: boolean;
}

/**
 * Component to display LIQUID token balance
 * Uses the SoonPay LIQUID token contract
 */
export const LiquidBalance = ({ address, className = "", showLabel = true }: LiquidBalanceProps) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || (connectedAddress as `0x${string}` | undefined);

  const { formattedBalance, symbol, balanceLoading } = useLiquidToken(targetAddress);

  if (!targetAddress) {
    return (
      <div className={`text-gray-500 ${className}`}>
        {showLabel && "LIQUID Balance: "}
        Connect wallet
      </div>
    );
  }

  if (balanceLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        {showLabel && "LIQUID Balance: "}
        <span className="inline-block w-16 h-4 bg-gray-200 rounded"></span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 font-mono ${className}`}>
      <div>
        {showLabel && <span className="text-gray-600">LIQUID Balance: </span>}
        <span className="font-bold text-green-600">
          {parseFloat(formattedBalance).toFixed(4)} {symbol || "LIQUID"}
        </span>
      </div>
      {/* Earn yield button next to balance */}
      <EarnYieldButton />
    </div>
  );
};
