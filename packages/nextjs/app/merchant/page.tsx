"use client";

import { useEffect, useState } from "react";
import { Address } from "@scaffold-ui/components";
import { QRCodeSVG } from "qrcode.react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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
  const { data: transactions, error: transactionsError } = useScaffoldReadContract({
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
      alert("Please enter your business name");
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
            setForceRefresh(prev => prev + 1);
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
      alert("Registration failed. Please try again.");
      setRegistrationSuccess(false);
    } finally {
      setIsRegistering(false);
    }
  };

  // Calculate today's sales
  const getTodaysSales = () => {
    if (!transactions) return { count: 0, total: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(today.getTime() / 1000);

    const todaysTransactions = transactions.filter((tx: any) => Number(tx.timestamp) >= todayTimestamp);

    const totalAmount = todaysTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    return {
      count: todaysTransactions.length,
      total: totalAmount,
    };
  };

  const todaysSales = getTodaysSales();

  // Debug logging
  useEffect(() => {
    console.log("=== Debug Info ===");
    console.log("isMerchant value:", isMerchant);
    console.log("connectedAddress:", connectedAddress);
    console.log("merchantInfo:", merchantInfo);
    console.log("locallyRegistered:", locallyRegistered);
    console.log("=== Errors ===");
    console.log("merchantStatusError:", merchantStatusError);
    console.log("merchantInfoError:", merchantInfoError);
    console.log("transactionsError:", transactionsError);

    // If contract confirms registration, we can clear the local flag
    if (isMerchant && locallyRegistered) {
      setLocallyRegistered(false);
      setRegistrationSuccess(false);
    }
  }, [
    isMerchant,
    connectedAddress,
    merchantInfo,
    locallyRegistered,
    merchantStatusError,
    merchantInfoError,
    transactionsError,
  ]);

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
            <p className="font-semibold text-yellow-800 mb-2">⚠️ Network Setup Required</p>
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
            <p className="font-semibold text-red-800 mb-2">❌ Cannot connect to contracts</p>
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
  if (!isMerchant && !locallyRegistered) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          {registrationSuccess ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Registration Successful!</h2>
              <p className="text-gray-600 mb-4">Welcome to the merchant network!</p>
              <div className="text-sm text-gray-500">Loading your dashboard...</div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-6">Register Your Business</h1>

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

              {/* Debug button for manual refresh */}
              <button
                onClick={async () => {
                  console.log("Manual refresh triggered");
                  const result = await refetchMerchantStatus();
                  console.log("Manual refresh result:", result);
                  setForceRefresh(prev => prev + 1);
                }}
                className="w-full bg-gray-500 text-white py-1 px-4 rounded-md hover:bg-gray-600 text-sm mb-4"
              >
                🔄 Refresh Status (Debug)
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Merchant Dashboard</h1>
        <p className="text-center text-gray-600">Welcome back, {merchantInfo?.[0] || "Merchant"}!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Section - The "Cash Register" */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Payment QR Code</h2>

          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCodeSVG value={connectedAddress || ""} size={200} level="M" includeMargin={true} />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Students scan this code to pay you</p>
            <div className="bg-gray-100 p-2 rounded text-xs break-all">
              <Address address={connectedAddress} />
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>How it works:</strong> Students scan your QR code, enter the amount, and pay instantly with
              LIQUID tokens. They automatically get 5% cashback!
            </p>
          </div>
        </div>

        {/* Sales Dashboard */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Sales Dashboard</h2>

          {/* Today's Sales */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{todaysSales.count}</div>
              <div className="text-sm text-green-800">Today&apos;s Transactions</div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{formatEther(BigInt(todaysSales.total || 0))}</div>
              <div className="text-sm text-blue-800">LIQUID Earned Today</div>
            </div>
          </div>

          {/* All-Time Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{merchantInfo?.[3]?.toString() || "0"}</div>
              <div className="text-sm text-purple-800">Total Transactions</div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{formatEther(BigInt(merchantInfo?.[2] || 0))}</div>
              <div className="text-sm text-orange-800">Total Sales (LIQUID)</div>
            </div>
          </div>

          {/* Business Info */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Business Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Business Name:</span> {merchantInfo?.[0] || "N/A"}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                <span className={merchantInfo?.[1] ? "text-green-600" : "text-red-600"}>
                  {merchantInfo?.[1] ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <span className="font-medium">Wallet Address:</span>
                <div className="mt-1">
                  <Address address={connectedAddress} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>

        {transactions && transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Student</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Loyalty Given</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .slice(-10)
                  .reverse()
                  .map((tx: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{new Date(Number(tx.timestamp) * 1000).toLocaleDateString()}</td>
                      <td className="py-2">
                        <Address address={tx.student} size="sm" />
                      </td>
                      <td className="py-2 font-medium">{formatEther(BigInt(tx.amount))} LIQUID</td>
                      <td className="py-2 text-green-600">{formatEther(BigInt(tx.loyaltyReward))} LIQUID</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions yet</p>
            <p className="text-sm mt-2">Share your QR code with students to start receiving payments!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantHub;
