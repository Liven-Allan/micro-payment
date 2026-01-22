"use client";

import { useEffect, useState } from "react";

interface StudentSavingsProps {
  connectedAddress: string | undefined;
  liquidBalance: string;
  onBalanceChange: (newBalance: string) => void; // Callback to update parent balance
  onWithdrawnInterestChange: (withdrawnInterest: string) => void; // Callback to update withdrawn interest
}

export const StudentSavings = ({
  connectedAddress,
  liquidBalance,
  onBalanceChange,
  onWithdrawnInterestChange,
}: StudentSavingsProps) => {
  // Simulated savings data (no smart contracts, just local state)
  const [savingsBalance, setSavingsBalance] = useState("0");
  const [totalEarned, setTotalEarned] = useState("0");
  const [totalWithdrawnInterest, setTotalWithdrawnInterest] = useState("0"); // Track withdrawn interests
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Track if localStorage data is loaded
  const [currentAPY] = useState(8.5); // 8.5% APY
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWithdrawingInterest, setIsWithdrawingInterest] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    if (connectedAddress) {
      const savedSavingsData = localStorage.getItem(`studentSavings_${connectedAddress}`);
      if (savedSavingsData) {
        const data = JSON.parse(savedSavingsData);
        setSavingsBalance(data.savingsBalance || "0");
        setTotalEarned(data.totalEarned || "0");
        setTotalWithdrawnInterest(data.totalWithdrawnInterest || "0");

        // Notify parent of the loaded withdrawn interest
        if (data.totalWithdrawnInterest && parseFloat(data.totalWithdrawnInterest) > 0) {
          setTimeout(() => onWithdrawnInterestChange(data.totalWithdrawnInterest), 0);
        }
      }
      setIsDataLoaded(true); // Mark data as loaded
    }
  }, [connectedAddress, onWithdrawnInterestChange]); // Add onWithdrawnInterestChange to dependencies

  // Save data to localStorage whenever savings data changes
  useEffect(() => {
    if (connectedAddress && isDataLoaded) {
      const savingsData = {
        savingsBalance,
        totalEarned,
        totalWithdrawnInterest,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(`studentSavings_${connectedAddress}`, JSON.stringify(savingsData));
    }
  }, [savingsBalance, totalEarned, totalWithdrawnInterest, connectedAddress, isDataLoaded]);

  // Calculate available balance (main balance minus what's already in savings)
  const availableBalance = liquidBalance;

  // Real-time interest accrual simulation (for demo purposes)
  useEffect(() => {
    if (parseFloat(savingsBalance) > 0) {
      const interval = setInterval(() => {
        setSavingsBalance(prev => {
          const currentBalance = parseFloat(prev);
          // Calculate interest per second: APY / (365 * 24 * 60 * 60)
          const interestPerSecond = currentAPY / 100 / (365 * 24 * 60 * 60);
          const newBalance = currentBalance * (1 + interestPerSecond);
          return newBalance.toFixed(8);
        });

        setTotalEarned(prev => {
          const currentEarned = parseFloat(prev);
          const savingsBalanceNum = parseFloat(savingsBalance);
          if (savingsBalanceNum > 0) {
            const interestPerSecond = currentAPY / 100 / (365 * 24 * 60 * 60);
            const interestEarned = savingsBalanceNum * interestPerSecond;
            return (currentEarned + interestEarned).toFixed(8);
          }
          return prev;
        });
      }, 1000); // Update every second for demo effect

      return () => clearInterval(interval);
    }
  }, [savingsBalance, currentAPY]);

  // Notify parent when withdrawn interest changes
  useEffect(() => {
    onWithdrawnInterestChange(totalWithdrawnInterest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalWithdrawnInterest]);

  // Handle deposit (simulated)
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (parseFloat(depositAmount) > parseFloat(availableBalance)) {
      alert("Insufficient LIQUID balance");
      return;
    }

    setIsDepositing(true);

    try {
      // Simulate deposit transaction (2 second delay)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update savings balance
      const newSavingsBalance = (parseFloat(savingsBalance) + parseFloat(depositAmount)).toFixed(8);
      setSavingsBalance(newSavingsBalance);

      // Update main balance by reducing the deposited amount
      const newMainBalance = (parseFloat(availableBalance) - parseFloat(depositAmount)).toFixed(8);
      onBalanceChange(newMainBalance);

      // Reset form
      setDepositAmount("");
      setShowDepositModal(false);

      alert(
        `Successfully deposited ${depositAmount} LIQUID to savings!\nYour available balance is now ${newMainBalance} LIQUID`,
      );
    } catch (error) {
      console.error("Deposit failed:", error);
      alert("Deposit failed. Please try again.");
    } finally {
      setIsDepositing(false);
    }
  };

  // Handle withdraw (simulated)
  const handleWithdraw = async () => {
    if (parseFloat(savingsBalance) <= 0) {
      alert("No funds to withdraw");
      return;
    }

    const withdrawAmount = savingsBalance; // Withdraw everything including interest
    const interestAmount = totalEarned;
    setIsWithdrawing(true);

    try {
      // Simulate withdrawal
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add withdrawn amount (including interest) back to main balance
      const newMainBalance = (parseFloat(availableBalance) + parseFloat(withdrawAmount)).toFixed(8);
      onBalanceChange(newMainBalance);

      // Update total withdrawn interest (add current interest to total)
      setTotalWithdrawnInterest(prev => {
        const newWithdrawnTotal = (parseFloat(prev) + parseFloat(interestAmount)).toFixed(8);
        onWithdrawnInterestChange(newWithdrawnTotal); // Notify parent
        return newWithdrawnTotal;
      });

      // Reset savings
      setSavingsBalance("0");
      setTotalEarned("0");

      alert(
        `Successfully withdrew ${parseFloat(withdrawAmount).toFixed(6)} LIQUID from savings!\nYour balance is now ${newMainBalance} LIQUID (including ${parseFloat(interestAmount).toFixed(6)} LIQUID interest earned!)`,
      );
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Withdrawal failed. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Handle withdraw interest only (simulated)
  const handleWithdrawInterest = async () => {
    if (parseFloat(totalEarned) <= 0) {
      alert("No interest to withdraw");
      return;
    }

    const interestAmount = totalEarned;
    setIsWithdrawingInterest(true);

    try {
      // Simulate withdrawal
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add interest to main balance
      const newMainBalance = (parseFloat(availableBalance) + parseFloat(interestAmount)).toFixed(8);
      onBalanceChange(newMainBalance);

      // Update total withdrawn interest
      setTotalWithdrawnInterest(prev => {
        const newWithdrawnTotal = (parseFloat(prev) + parseFloat(interestAmount)).toFixed(8);
        onWithdrawnInterestChange(newWithdrawnTotal); // Notify parent
        return newWithdrawnTotal;
      });

      // Reduce savings balance by the interest amount (keep principal)
      const principalAmount = (parseFloat(savingsBalance) - parseFloat(totalEarned)).toFixed(8);
      setSavingsBalance(principalAmount);

      // Reset interest earned
      setTotalEarned("0");

      alert(
        `Successfully withdrew ${parseFloat(interestAmount).toFixed(6)} LIQUID interest!\nYour balance is now ${newMainBalance} LIQUID\nPrincipal of ${parseFloat(principalAmount).toFixed(6)} LIQUID remains in savings.`,
      );
    } catch (error) {
      console.error("Interest withdrawal failed:", error);
      alert("Interest withdrawal failed. Please try again.");
    } finally {
      setIsWithdrawingInterest(false);
    }
  };

  return (
    <div className="mt-8 bg-base-100 rounded-lg shadow-md p-6 border border-base-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-success mb-2">Student Savings</h2>
          <p className="text-base-content opacity-70">Earn passive income on your idle LIQUID tokens</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-success">{currentAPY}%</div>
          <div className="text-sm text-base-content opacity-70">Current APY</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Savings Balance */}
        <div className="bg-base-200 rounded-lg p-4 border border-success border-opacity-30 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-success mb-1">{parseFloat(savingsBalance).toFixed(6)}</div>
            <div className="text-sm text-base-content opacity-80">LIQUID in Savings</div>
            <div className="text-xs text-base-content opacity-60 mt-1">
              {parseFloat(savingsBalance) > 0 ? "Growing every second" : "Start earning now"}
            </div>
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-base-200 rounded-lg p-4 border border-info border-opacity-30 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-info mb-1">{parseFloat(totalEarned).toFixed(6)}</div>
            <div className="text-sm text-base-content opacity-80">Current Interest</div>
            <div className="text-xs text-base-content opacity-60 mt-1">
              {parseFloat(totalEarned) > 0 ? "Ready to withdraw" : "Earning interest"}
            </div>
          </div>
        </div>

        {/* Total Withdrawn Interest */}
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {parseFloat(totalWithdrawnInterest).toFixed(6)}
            </div>
            <div className="text-sm text-purple-700">Total Withdrawn</div>
            <div className="text-xs text-gray-500 mt-1">
              {parseFloat(totalWithdrawnInterest) > 0 ? "Profits taken" : "No withdrawals yet"}
            </div>
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-base-200 rounded-lg p-4 border border-warning border-opacity-30 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning mb-1">{parseFloat(availableBalance).toFixed(4)}</div>
            <div className="text-sm text-base-content opacity-80">Available to Deposit</div>
            <div className="text-xs text-base-content opacity-60 mt-1">
              {parseFloat(availableBalance) > 0 ? "Ready to earn" : "Get more LIQUID"}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => setShowDepositModal(true)}
          disabled={parseFloat(availableBalance) <= 0 || isDepositing}
          className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
        >
          {isDepositing ? "Depositing..." : "Deposit to Savings"}
        </button>

        <button
          onClick={handleWithdrawInterest}
          disabled={parseFloat(totalEarned) <= 0 || isWithdrawingInterest}
          className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
        >
          {isWithdrawingInterest ? "Withdrawing..." : "Withdraw Interest"}
        </button>

        <button
          onClick={handleWithdraw}
          disabled={parseFloat(savingsBalance) <= 0 || isWithdrawing}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
        >
          {isWithdrawing ? "Withdrawing..." : "Withdraw All"}
        </button>
      </div>

      {/* Balance Summary */}
      <div className="bg-base-200 rounded-lg p-4 border border-base-300 mb-4">
        <h3 className="font-semibold text-base-content mb-3">Balance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-base-content opacity-70">Available Balance:</span>
              <span className="font-semibold text-warning">{parseFloat(availableBalance).toFixed(4)} LIQUID</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content opacity-70">In Savings:</span>
              <span className="font-semibold text-success">{parseFloat(savingsBalance).toFixed(6)} LIQUID</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content opacity-70">Current Interest:</span>
              <span className="font-semibold text-info">+{parseFloat(totalEarned).toFixed(6)} LIQUID</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Withdrawn:</span>
              <span className="font-semibold text-purple-600">
                +{parseFloat(totalWithdrawnInterest).toFixed(6)} LIQUID
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content opacity-70">Lifetime Interest:</span>
              <span className="font-semibold text-accent">
                +{(parseFloat(totalEarned) + parseFloat(totalWithdrawnInterest)).toFixed(6)} LIQUID
              </span>
            </div>
            <div className="flex justify-between border-t border-base-300 pt-2">
              <span className="text-base-content font-semibold">Total Value:</span>
              <span className="font-bold text-success">
                {(parseFloat(availableBalance) + parseFloat(savingsBalance)).toFixed(4)} LIQUID
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-base-200 rounded-lg p-4 border border-base-300">
        <h3 className="font-semibold text-base-content mb-3">How Student Savings Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-base-content opacity-80">
          <div className="space-y-2">
            <div className="flex items-start">
              <span className="text-success mr-2">✓</span>
              <span>
                <strong>Flexible:</strong> Withdraw anytime, no lock-up periods
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-success mr-2">✓</span>
              <span>
                <strong>Safe:</strong> Your tokens are lent to verified borrowers
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start">
              <span className="text-info mr-2">•</span>
              <span>
                <strong>Passive Income:</strong> Earn {currentAPY}% APY automatically
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-info mr-2">•</span>
              <span>
                <strong>Real-time:</strong> Watch your balance grow every second
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Deposit to Savings</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Deposit (LIQUID)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                placeholder="0.0"
                max={availableBalance}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                Available: {parseFloat(availableBalance).toFixed(4)} LIQUID
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-md mb-4">
              <div className="text-sm text-green-800">
                <div>
                  Estimated yearly earnings: {((parseFloat(depositAmount || "0") * currentAPY) / 100).toFixed(6)} LIQUID
                </div>
                <div>Interest compounds every second</div>
                <div className="mt-2 pt-2 border-t border-green-200">
                  <strong>After deposit:</strong>
                  <div>
                    Available: {(parseFloat(availableBalance) - parseFloat(depositAmount || "0")).toFixed(4)} LIQUID
                  </div>
                  <div>
                    In Savings: {(parseFloat(savingsBalance) + parseFloat(depositAmount || "0")).toFixed(6)} LIQUID
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isDepositing ? "Depositing..." : "Deposit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
