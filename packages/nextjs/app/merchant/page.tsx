"use client";

import { useCallback, useEffect, useState } from "react";
import { Address } from "@scaffold-ui/components";
import { QRCodeSVG } from "qrcode.react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { MerchantSavings } from "~~/components/MerchantSavings";
import { useNotifications } from "~~/hooks/useNotifications";
import { NotificationContainer } from "~~/components/CustomNotification";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useLiquidToken } from "~~/hooks/useLiquidToken";

/**
 * Merchant Hub - The "Cash Register" Interface
 * This page serves as the main dashboard for vendors to:
 * 1. Display their QR code for payments
 * 2. Register their business
 * 3. View their sales dashboard
 * 4. Monitor their LIQUID token balance
 */
const MerchantHub = () => {
  const { address: connectedAddress } = useAccount();
  const [businessName, setBusinessName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [locallyRegistered, setLocallyRegistered] = useState(false);

  // Notification system
  const { notifications, removeNotification, showWarning, showError } = useNotifications();

  // Get LIQUID token balance
  const { formattedBalance } = useLiquidToken(connectedAddress as `0x${string}`);

  // Local balance state for savings interactions (simulated)
  const [localBalance, setLocalBalance] = useState<string | null>(null);
  const [withdrawnInterest, setWithdrawnInterest] = useState<string>("0");

  // Load local balance from localStorage on component mount
  useEffect(() => {
    if (connectedAddress) {
      const savedBalance = localStorage.getItem(`merchantBalance_${connectedAddress}`);
      if (savedBalance) {
        setLocalBalance(savedBalance);
      }
    }
  }, [connectedAddress]);

  // Save local balance to localStorage whenever it changes
  useEffect(() => {
    if (connectedAddress && localBalance !== null) {
      localStorage.setItem(`merchantBalance_${connectedAddress}`, localBalance);
    }
  }, [connectedAddress, localBalance]);

  // Use local balance if available, otherwise use the actual balance
  const displayBalance = localBalance || formattedBalance;

  // Handle balance changes from savings component
  const handleBalanceChange = useCallback((newBalance: string) => {
    setLocalBalance(newBalance);
  }, []);

  // Handle withdrawn interest changes from savings component
  const handleWithdrawnInterestChange = useCallback((newWithdrawnInterest: string) => {
    setWithdrawnInterest(newWithdrawnInterest);
  }, []);

  // Read merchant information from the smart contract
  const {
    data: merchantInfo,
    refetch: refetchMerchantInfo,
    error: merchantInfoError,
  } = useScaffoldReadContract({
    contractName: "MerchantService",
    functionName: "getMerchantInfo",
    args: [connectedAddress],
  });

  // Check if current address is registered as merchant
  const {
    data: isMerchant,
    refetch: refetchMerchantStatus,
    error: merchantStatusError,
  } = useScaffoldReadContract({
    contractName: "MerchantService",
    functionName: "isMerchant",
    args: [connectedAddress],
  });

  // Get merchant's transaction history
  const { data: transactions, refetch: refetchTransactions } = useScaffoldReadContract({
    contractName: "MerchantService",
    functionName: "getMerchantTransactions",
    args: [connectedAddress],
  });

  // Contract write function for merchant registration
  const { writeContractAsync: registerMerchant } = useScaffoldWriteContract({
    contractName: "MerchantService",
  });

  // Handle merchant registration
  const handleRegisterMerchant = async () => {
    if (!businessName.trim()) {
      showWarning("Business Name Required", "Please enter your business name to continue with registration.");
      return;
    }

    try {
      setIsRegistering(true);
      const tx = await registerMerchant({
        functionName: "registerMerchant",
        args: [businessName],
      });

      console.log("Registration transaction:", tx);
      setRegistrationSuccess(true);
      setLocallyRegistered(true); // Set local flag immediately

      // Multiple attempts to refresh the data
      const refreshData = async () => {
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          try {
            await Promise.all([refetchMerchantStatus(), refetchMerchantInfo()]);
            console.log(`Refresh attempt ${i + 1} completed`);

            // Check if we're now registered
            const updatedStatus = await refetchMerchantStatus();
            console.log("Updated merchant status:", updatedStatus);

            if (updatedStatus.data === true) {
              console.log("Registration confirmed, breaking refresh loop");
              break;
            }
          } catch (error) {
            console.error(`Refresh attempt ${i + 1} failed:`, error);
          }
        }
      };

      refreshData();
    } catch (error) {
      console.error("Registration failed:", error);
      showError("Registration Failed", "Unable to register your business. Please try again.");
      setRegistrationSuccess(false);
    } finally {
      setIsRegistering(false);
    }
  };

  // Calculate today's sales
  const getTodaysSales = () => {
    if (!transactions || transactions.length === 0) return { count: 0, total: 0 };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTimestamp = Math.floor(today.getTime() / 1000);

    const todaysTransactions = transactions.filter((tx: any) => {
      const txTimestamp = Number(tx.timestamp);
      return txTimestamp >= todayTimestamp;
    });

    const totalAmount = todaysTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    return {
      count: todaysTransactions.length,
      total: totalAmount,
    };
  };

  const todaysSales = getTodaysSales();

  // Auto-refresh data every 30 seconds (reduced frequency)
  useEffect(() => {
    if (isMerchant && connectedAddress) {
      const interval = setInterval(() => {
        console.log("Auto-refreshing merchant data...");
        refetchTransactions();
        refetchMerchantInfo();
      }, 30000); // 30 seconds instead of 10

      return () => clearInterval(interval);
    }
  }, [isMerchant, connectedAddress, refetchTransactions, refetchMerchantInfo]); // Add missing dependencies

  // Handle registration status - simplified to avoid setState during render
  useEffect(() => {
    // If contract confirms registration, we can clear the local flag
    if (isMerchant && locallyRegistered) {
      setLocallyRegistered(false);
      setRegistrationSuccess(false);
    }
  }, [isMerchant, locallyRegistered]); // Simplified dependencies

  // If wallet not connected
  if (!connectedAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Merchant Hub</h1>
          <p className="text-lg mb-4">Please connect your wallet to access the merchant dashboard</p>
          <div className="text-sm text-gray-600 mb-4">
            Use the &quot;Connect Wallet&quot; button in the top navigation
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-yellow-800 mb-2">Network Setup Required</p>
            <p className="text-yellow-700">
              Make sure you&apos;re connected to the <strong>Hardhat Local Network</strong>:
            </p>
            <ul className="text-left mt-2 text-yellow-700">
              <li>• Network Name: Hardhat</li>
              <li>• RPC URL: http://127.0.0.1:8545</li>
              <li>• Chain ID: 31337</li>
              <li>• Currency: ETH</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show error if contract calls are failing
  if (merchantStatusError || merchantInfoError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Network Error</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm mb-4">
            <p className="font-semibold text-red-800 mb-2">Cannot connect to contracts</p>
            <p className="text-red-700 mb-3">
              You&apos;re connected to the wrong network. Please switch to the Hardhat Local Network.
            </p>
            <div className="text-left bg-white p-3 rounded border">
              <p className="font-semibold mb-2">Add this network to your wallet:</p>
              <ul className="text-xs space-y-1">
                <li>
                  <strong>Network Name:</strong> Hardhat
                </li>
                <li>
                  <strong>RPC URL:</strong> http://127.0.0.1:8545
                </li>
                <li>
                  <strong>Chain ID:</strong> 31337
                </li>
                <li>
                  <strong>Currency:</strong> ETH
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // If not registered as merchant, show registration form
  const shouldShowRegistration = (!isMerchant || isMerchant === undefined) && !locallyRegistered;

  if (shouldShowRegistration) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-base-100 rounded-lg shadow-md p-6 border border-base-300">
          {registrationSuccess ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-success bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-success mb-2">Registration Successful!</h2>
              <p className="text-base-content opacity-70 mb-4">Welcome to the merchant network!</p>
              <div className="text-sm text-base-content opacity-50">Loading your dashboard...</div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-6 text-base-content">Register Your Business</h1>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g., Mama Ntilie's Food Stall"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleRegisterMerchant}
                disabled={isRegistering}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isRegistering ? "Registering..." : "Register Business"}
              </button>

              <div className="mt-4 text-sm text-gray-600">
                <p>After registration, you&apos;ll be able to:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>Accept LIQUID token payments</li>
                  <li>Display your payment QR code</li>
                  <li>Track your daily sales</li>
                  <li>View transaction history</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main merchant dashboard
  return (
    <>
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold">Merchant Dashboard</h1>
              <p className="text-gray-600">Welcome back, {merchantInfo?.[0] || "Merchant"}!</p>
            </div>
            {/* Balance and Withdrawn Interest Display */}
            <div className="flex items-center bg-gray-50 rounded-lg px-4 py-3 space-x-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">LIQUID Balance:</div>
                <div className="text-xl font-bold text-green-600">{parseFloat(displayBalance).toFixed(4)}</div>
                <div className="text-xs text-gray-500">
                  {localBalance ? "Local" : "Contract"} | Actual: {parseFloat(formattedBalance).toFixed(4)}
                </div>
              </div>
              {parseFloat(withdrawnInterest) > 0 && (
                <div className="text-center border-l border-gray-300 pl-4">
                  <div className="text-sm text-gray-600">Interest Withdrawn:</div>
                  <div className="text-lg font-bold text-purple-600">+{parseFloat(withdrawnInterest).toFixed(6)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Section - The "Cash Register" */}
          <div className="bg-base-100 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-center text-base-content">Payment QR Code</h2>

            <div className="flex justify-center mb-4">
              <div className="p-4 bg-base-100 border-2 border-base-300 rounded-lg">
                <QRCodeSVG value={connectedAddress || ""} size={200} level="M" includeMargin={true} />
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-base-content opacity-70 mb-2">Students scan this code to pay you</p>
              <div className="bg-base-200 p-2 rounded text-xs break-all">
                <Address address={connectedAddress} />
              </div>
            </div>

            <div className="mt-4 p-3 bg-info bg-opacity-20 rounded-lg">
              <p className="text-sm text-base-content">
                <strong>How it works:</strong> Students scan your QR code, enter the amount, and pay instantly with
                LIQUID tokens. Simple and secure payments!
              </p>
            </div>
          </div>

          {/* Sales Dashboard */}
          <div className="bg-base-100 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-base-content">Sales Dashboard</h2>

            {/* Today&apos;s Sales */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-base-content mb-3">Today&apos;s Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-success bg-opacity-20 p-4 rounded-lg text-center border border-success border-opacity-30">
                  <div className="text-2xl font-bold text-green-600">{todaysSales.count}</div>
                  <div className="text-sm text-green-800">Today&apos;s Transactions</div>
                </div>

                <div className="bg-info bg-opacity-20 p-4 rounded-lg text-center border border-info border-opacity-30">
                  <div className="text-2xl font-bold text-blue-600">
                    {parseFloat(formatEther(BigInt(todaysSales.total || 0))).toFixed(4)}
                  </div>
                  <div className="text-sm text-blue-800">LIQUID Earned Today</div>
                </div>
              </div>
            </div>

            {/* All-Time Stats */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-base-content mb-3">All-Time Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary bg-opacity-20 p-4 rounded-lg text-center border border-secondary border-opacity-30">
                  <div className="text-2xl font-bold text-purple-600">{merchantInfo?.[3]?.toString() || "0"}</div>
                  <div className="text-sm text-purple-800">Total Transactions</div>
                </div>

                <div className="bg-warning bg-opacity-20 p-4 rounded-lg text-center border border-warning border-opacity-30">
                  <div className="text-2xl font-bold text-orange-600">
                    {parseFloat(formatEther(BigInt(merchantInfo?.[2] || 0))).toFixed(4)}
                  </div>
                  <div className="text-sm text-orange-800">Total Sales (LIQUID)</div>
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="border-t border-base-300 pt-4">
              <h3 className="font-semibold mb-2 text-base-content">Business Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-base-content">Business Name:</span>
                  <span className="text-base-content opacity-80"> {merchantInfo?.[0] || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-base-content">Status:</span>{" "}
                  <span className={merchantInfo?.[1] ? "text-success" : "text-error"}>
                    {merchantInfo?.[1] ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-base-content">Wallet Address:</span>
                  <div className="mt-1">
                    <Address address={connectedAddress} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Merchant Savings Section */}
        <MerchantSavings
          connectedAddress={connectedAddress}
          liquidBalance={displayBalance}
          onBalanceChange={handleBalanceChange}
          onWithdrawnInterestChange={handleWithdrawnInterestChange}
        />

        {/* Recent Transactions */}
        <div className="mt-8 bg-base-100 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-base-content">Recent Transactions</h2>

          {transactions && transactions.length > 0 ? (
            <div className="relative">
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {transactions
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((tx: any, index: number) => {
                    console.log(`Rendering transaction ${index}:`, tx);
                    return (
                      <div key={index} className="p-4 border border-base-300 bg-base-100 rounded-lg hover:bg-base-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-base-content flex items-center">
                              Payment Received
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Completed
                              </span>
                            </div>
                            <div className="text-sm text-base-content opacity-70 mt-1">
                              From: <Address address={tx.student} size="sm" />
                            </div>
                            <div className="text-xs text-base-content opacity-50 mt-1">
                              {new Date(Number(tx.timestamp) * 1000).toLocaleDateString()}{" "}
                              {new Date(Number(tx.timestamp) * 1000).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600 text-lg">
                              +{parseFloat(formatEther(BigInt(tx.amount))).toFixed(4)} LIQUID
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Scroll indicator */}
              {transactions && transactions.length > 3 && (
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-base-100 to-transparent pointer-events-none flex items-end justify-center">
                  <div className="text-xs text-base-content opacity-40 mb-1">↓ Scroll for more ↓</div>
                </div>
              )}

              {transactions.length > 10 && (
                <div className="text-center py-2 text-base-content opacity-70 text-sm border-t border-base-300 mt-2">
                  Showing last 10 transactions of {transactions.length} total
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-base-content opacity-60">
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm mt-2">Share your QR code with students to start receiving payments!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MerchantHub;
