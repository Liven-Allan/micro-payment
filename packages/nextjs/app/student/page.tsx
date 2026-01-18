"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { formatUnits, parseEther } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { CurrencyInput } from "~~/components/CurrencyInput";
import { LiquidBalance } from "~~/components/LiquidBalance";
import { QRScanner } from "~~/components/QRScanner";
import { StudentSavings } from "~~/components/StudentSavings";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useLiquidToken } from "~~/hooks/useLiquidToken";

/**
 * Student Payment Interface - The "Scan & Pay" Experience
 * This page allows students to:
 * 1. Scan merchant QR codes
 * 2. Enter payment amounts
 * 3. Approve and execute payments
 */
const StudentWallet = () => {
  const { address: connectedAddress } = useAccount();

  // State management
  const [scannerActive, setScannerActive] = useState(false);
  const [merchantAddress, setMerchantAddress] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>(""); // LIQUID amount
  const [ugxAmount, setUgxAmount] = useState<string>(""); // UGX amount
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"scan" | "amount" | "confirm" | "processing" | "dashboard">("scan");
  const [refreshBalance, setRefreshBalance] = useState(0);
  const [localBalance, setLocalBalance] = useState<string | null>(null);

  // Get LIQUID token info and balance
  const {
    formattedBalance,
    contractAddress: liquidAddress,
    abi: liquidAbi,
    refetchBalance,
  } = useLiquidToken(connectedAddress as `0x${string}`);

  // Use local balance if available (after savings interactions), otherwise use the actual balance
  const displayBalance = localBalance || formattedBalance;

  // Handle balance changes from savings component
  const handleBalanceChange = (newBalance: string) => {
    setLocalBalance(newBalance);
  };

  // Get merchant info to verify it's a valid merchant
  const { data: merchantInfo } = useScaffoldReadContract({
    contractName: "MerchantService",
    functionName: "getMerchantInfo",
    args: merchantAddress ? [merchantAddress as `0x${string}`] : ["0x0000000000000000000000000000000000000000"],
  });

  // Check if scanned address is a registered merchant
  const { data: isMerchant } = useScaffoldReadContract({
    contractName: "MerchantService",
    functionName: "isMerchant",
    args: merchantAddress ? [merchantAddress as `0x${string}`] : ["0x0000000000000000000000000000000000000000"],
  });

  // Debug logging
  console.log("Debug - Merchant Address:", merchantAddress);
  console.log("Debug - Is Merchant:", isMerchant);
  console.log("Debug - Merchant Info:", merchantInfo);

  // Get student transaction history
  const { data: studentTransactions, refetch: refetchTransactions } = useScaffoldReadContract({
    contractName: "MerchantService",
    functionName: "getStudentTransactions",
    args: connectedAddress ? [connectedAddress as `0x${string}`] : ["0x0000000000000000000000000000000000000000"],
  });

  // Contract write functions
  const { writeContractAsync: approveLiquid } = useWriteContract();
  const { writeContractAsync: makePayment } = useScaffoldWriteContract({
    contractName: "MerchantService",
  });

  // Handle QR code scan result
  const handleScan = (data: string) => {
    console.log("QR Code scanned:", data);

    // Check if it's a valid Ethereum address
    if (data.match(/^0x[a-fA-F0-9]{40}$/)) {
      setMerchantAddress(data);
      setScannerActive(false);
      setStep("amount");
      toast.success("Merchant QR code scanned successfully!");
    } else {
      toast.error("Invalid QR code. Please scan a merchant's payment QR code.");
    }
  };

  // Handle scan error
  const handleScanError = (error: string) => {
    console.error("QR Scanner error:", error);
    toast.error("Camera access failed. Please check permissions.");
    setScannerActive(false);
  };

  // Process payment
  const handlePayment = async () => {
    if (!connectedAddress || !merchantAddress || !paymentAmount) {
      toast.error("Missing required information");
      return;
    }

    if (parseFloat(paymentAmount) <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    if (parseFloat(displayBalance) < parseFloat(paymentAmount)) {
      toast.error("Insufficient LIQUID balance");
      return;
    }

    try {
      setIsProcessing(true);
      setStep("processing");

      const amountWei = parseEther(paymentAmount);

      // Step 1: Approve LIQUID tokens for MerchantService contract
      toast.loading("Step 1/2: Approving LIQUID tokens...", { id: "payment-process" });

      // Get the correct MerchantService address from deployed contracts
      const merchantServiceAddress =
        deployedContracts[31337]?.MerchantService?.address || "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";

      console.log("=== PAYMENT DEBUG INFO ===");
      console.log("Student address:", connectedAddress);
      console.log("Merchant address:", merchantAddress);
      console.log("Token address:", liquidAddress);
      console.log("MerchantService address:", merchantServiceAddress);
      console.log("Payment amount (wei):", amountWei.toString());
      console.log("Payment amount (ether):", paymentAmount);

      const approvalResult = await approveLiquid({
        address: liquidAddress as `0x${string}`,
        abi: liquidAbi,
        functionName: "approve",
        args: [merchantServiceAddress as `0x${string}`, amountWei],
      });

      console.log("Approval transaction hash:", approvalResult);

      // Step 1.5: Wait for approval to be mined
      toast.loading("Waiting for approval confirmation...", { id: "payment-process" });

      // Wait for the approval transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      // Step 2: Execute payment
      toast.loading("Step 2/2: Processing payment...", { id: "payment-process" });

      const paymentResult = await makePayment({
        functionName: "receivePayment",
        args: [merchantAddress as `0x${string}`, amountWei],
      });

      console.log("Payment transaction:", paymentResult);

      // Success!
      toast.success(
        `Payment successful! ${ugxAmount ? `${parseFloat(ugxAmount).toLocaleString()} UGX` : paymentAmount} LIQUID sent to merchant.`,
        {
          id: "payment-process",
          duration: 5000,
        },
      );

      // Show success modal
      showSuccessModal(paymentAmount);

      // Force balance refresh and transaction history refresh
      setRefreshBalance(prev => prev + 1);
      refetchTransactions();
      refetchBalance();

      // Reset form
      resetForm();
    } catch (error: any) {
      console.error("=== PAYMENT ERROR ===");
      console.error("Full error:", error);
      console.error("Error message:", error?.message);
      console.error("Error cause:", error?.cause);

      let errorMessage = "Payment failed. Please try again.";

      if (error?.message?.includes("insufficient") || error?.message?.includes("allowance")) {
        errorMessage = "Insufficient balance or allowance. Please try again.";
      }

      toast.error(errorMessage, { id: "payment-process" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Show success modal
  const showSuccessModal = (liquidAmount: string) => {
    // Create a custom success notification
    const successMessage = (
      <div className="text-center">
        <div className="text-lg font-bold text-green-600 mb-2">Payment Successful!</div>
        <div className="text-sm space-y-1">
          <div>Paid: {ugxAmount ? `${parseFloat(ugxAmount).toLocaleString()} UGX` : "0 UGX"}</div>
          <div className="text-gray-600">≈ {liquidAmount} LIQUID</div>
        </div>
      </div>
    );

    toast.success(successMessage as any, { duration: 6000 });
  };

  // Handle currency amount changes
  const handleCurrencyAmountChange = (liquidAmount: string, ugxAmount: string) => {
    setPaymentAmount(liquidAmount);
    setUgxAmount(ugxAmount);
  };

  // Reset form to initial state
  const resetForm = () => {
    setMerchantAddress("");
    setPaymentAmount("");
    setUgxAmount("");
    setStep("scan");
  };

  // If wallet not connected
  if (!connectedAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Student Wallet</h1>
          <p className="text-lg mb-4">Please connect your wallet to start making payments</p>
          <div className="text-sm text-gray-600">Use the &quot;Connect Wallet&quot; button in the top navigation</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Student Wallet</h1>
        <p className="text-gray-600">Scan & Pay with LIQUID tokens</p>

        {/* Balance Display */}
        <div className="mt-4 p-4 bg-base-200 rounded-lg">
          <LiquidBalance address={connectedAddress as `0x${string}`} className="text-lg" key={refreshBalance} />
          {localBalance && (
            <div className="text-sm text-base-content opacity-60 mt-2">
              (After savings: {parseFloat(localBalance).toFixed(4)} LIQUID)
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setStep("scan")}
            className={`flex-1 py-2 px-4 rounded-md font-medium ${
              step === "scan" || step === "amount" || step === "confirm" || step === "processing"
                ? "bg-primary text-primary-content"
                : "bg-base-200 text-base-content hover:bg-base-300"
            }`}
          >
            Pay
          </button>
          <button
            onClick={() => setStep("dashboard")}
            className={`flex-1 py-2 px-4 rounded-md font-medium ${
              step === "dashboard"
                ? "bg-primary text-primary-content"
                : "bg-base-200 text-base-content hover:bg-base-300"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Payment Steps Container */}
      <div className="max-w-md mx-auto">

      {/* Step 1: QR Scanner */}
      {step === "scan" && (
        <div className="bg-base-100 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-base-content">Scan Merchant QR Code</h2>

          {!scannerActive ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-32 h-32 mx-auto bg-base-200 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-16 h-16 text-base-content opacity-60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h.01M12 8h4.01M12 8h-4.01"
                    />
                  </svg>
                </div>
                <button
                  onClick={() => setScannerActive(true)}
                  className="w-full bg-primary text-primary-content py-3 px-4 rounded-md hover:bg-primary-focus font-semibold mb-4"
                >
                  Start Camera Scanner
                </button>
              </div>

              {/* Manual entry option */}
              <div className="mt-4 pt-4 border-t border-base-300">
                <p className="text-sm text-base-content opacity-70 mb-2">Or enter merchant address manually:</p>
                <input
                  type="text"
                  placeholder="0x..."
                  value={merchantAddress}
                  onChange={e => setMerchantAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-base-300 bg-base-100 text-base-content rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => {
                    if (merchantAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                      setStep("amount");
                    } else {
                      toast.error("Invalid address format");
                    }
                  }}
                  disabled={!merchantAddress}
                  className="w-full mt-2 bg-primary text-primary-content py-2 px-4 rounded-md hover:bg-primary-focus disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <QRScanner onScan={handleScan} onError={handleScanError} isActive={scannerActive} />
              </div>

              <button
                onClick={() => setScannerActive(false)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
              >
                Close Scanner
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Enter Amount */}
      {step === "amount" && (
        <div className="bg-base-100 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-base-content">Enter Payment Amount</h2>

          {/* Merchant Info */}
          <div className="mb-6 p-4 bg-base-200 rounded-lg">
            <div className="text-sm text-base-content opacity-70 mb-1">Paying to:</div>
            <div className="font-semibold text-base-content">{merchantInfo?.[0] || "Unknown Merchant"}</div>
            <div className="text-xs text-base-content opacity-50 mt-1 font-mono">{merchantAddress}</div>

            {isMerchant ? (
              <div className="text-success text-sm mt-2">Verified Merchant</div>
            ) : (
              <div className="text-error text-sm mt-2">Unregistered Address</div>
            )}
          </div>

          {/* Currency Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-base-content mb-3">Payment Amount</label>
            <CurrencyInput onAmountChange={handleCurrencyAmountChange} disabled={isProcessing} className="w-full" />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setStep("confirm")}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              className="w-full bg-primary text-primary-content py-3 px-4 rounded-md hover:bg-primary-focus disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Review Payment
            </button>

            <button
              onClick={() => setStep("scan")}
              className="w-full bg-base-300 text-base-content py-2 px-4 rounded-md hover:bg-base-200"
            >
              Back to Scanner
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm Payment */}
      {step === "confirm" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Confirm Payment</h2>

          {/* Payment Summary */}
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Merchant</div>
              <div className="font-semibold">{merchantInfo?.[0] || "Unknown"}</div>
              <div className="text-xs text-gray-500 font-mono">{merchantAddress}</div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg space-y-2">
              <div className="text-sm text-blue-800">Payment Amount</div>
              <div className="text-xl font-bold text-blue-900">
                {ugxAmount ? `${parseFloat(ugxAmount).toLocaleString()} UGX` : "0 UGX"}
              </div>
              <div className="text-lg font-semibold text-blue-700">≈ {paymentAmount} LIQUID</div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
            <div className="text-sm">
              <div>Your Balance: {parseFloat(displayBalance).toFixed(4)} LIQUID</div>
              <div>After Payment: {(parseFloat(displayBalance) - parseFloat(paymentAmount)).toFixed(4)} LIQUID</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePayment}
              disabled={isProcessing || parseFloat(displayBalance) < parseFloat(paymentAmount)}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isProcessing ? "Processing..." : "Confirm & Pay"}
            </button>

            <button
              onClick={() => setStep("amount")}
              disabled={isProcessing}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Back to Edit Amount
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Processing */}
      {step === "processing" && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
          <p className="text-gray-600 mb-4">Please wait while we process your transaction</p>
          <div className="text-sm text-gray-500">This may take a few seconds</div>
        </div>
      )}

      {/* Step 5: Dashboard */}
      {step === "dashboard" && (
        <div className="bg-base-100 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-base-content">Spending Dashboard</h2>

          {/* Current Balance */}
          <div className="mb-6 p-4 bg-gradient-to-r from-primary from-opacity-10 to-success to-opacity-10 rounded-lg border border-primary border-opacity-20">
            <div className="text-center">
              <div className="text-sm text-base-content opacity-70 mb-1">Current Balance</div>
              <div className="text-3xl font-bold text-green-600">{parseFloat(displayBalance).toFixed(4)} LIQUID</div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-info bg-opacity-20 rounded-lg text-center border border-info border-opacity-30">
              <div className="text-2xl font-bold text-blue-600">{studentTransactions?.length || 0}</div>
              <div className="text-sm text-blue-800">Total Payments</div>
            </div>
            <div className="p-4 bg-error bg-opacity-20 rounded-lg text-center border border-error border-opacity-30">
              <div className="text-2xl font-bold text-red-600">
                {studentTransactions
                  ?.reduce((total, tx) => {
                    return total + parseFloat(formatUnits(tx.amount, 18));
                  }, 0)
                  .toFixed(2) || "0.00"}
              </div>
              <div className="text-sm text-red-800">Total Spent (LIQUID)</div>
            </div>
          </div>

          {/* Quick Stats */}
          {studentTransactions && studentTransactions.length > 0 && (
            <div className="mb-6 p-4 bg-base-200 rounded-lg">
              <div className="text-sm text-base-content opacity-70 mb-2">Quick Stats</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-base-content opacity-60">Largest Payment:</span>
                  <div className="font-semibold text-gray-900">
                    {Math.max(...studentTransactions.map(tx => parseFloat(formatUnits(tx.amount, 18)))).toFixed(4)}{" "}
                    LIQUID
                  </div>
                </div>
                <div>
                  <span className="text-base-content opacity-60">Average Payment:</span>
                  <div className="font-semibold text-gray-900">
                    {(
                      studentTransactions.reduce((total, tx) => total + parseFloat(formatUnits(tx.amount, 18)), 0) /
                      studentTransactions.length
                    ).toFixed(4)}{" "}
                    LIQUID
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3 text-base-content">Recent Transactions</h3>

            {!studentTransactions || studentTransactions.length === 0 ? (
              <div className="text-center py-8 text-base-content opacity-60">
                <div>No transactions yet</div>
                <div className="text-sm">Make your first payment to see it here!</div>
              </div>
            ) : (
              <div className="relative">
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {studentTransactions
                    .slice()
                    .reverse()
                    .slice(0, 10) // Show only last 10 transactions
                    .map((transaction, index) => (
                      <div key={index} className="p-4 border border-base-300 bg-base-100 rounded-lg hover:bg-base-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-base-content flex items-center">
                              Payment to Merchant
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Completed
                              </span>
                            </div>
                            <div className="text-xs text-base-content opacity-50 font-mono mt-1">
                              To: {transaction.merchant.slice(0, 6)}...{transaction.merchant.slice(-4)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600 text-lg">
                              -{parseFloat(formatUnits(transaction.amount, 18)).toFixed(4)} LIQUID
                            </div>
                            <div className="text-xs text-base-content opacity-50">
                              {new Date(Number(transaction.timestamp) * 1000).toLocaleDateString()}{" "}
                              {new Date(Number(transaction.timestamp) * 1000).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Scroll indicator */}
                {studentTransactions && studentTransactions.length > 2 && (
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-base-100 to-transparent pointer-events-none flex items-end justify-center">
                    <div className="text-xs text-base-content opacity-40 mb-1">↓ Scroll for more ↓</div>
                  </div>
                )}

                {studentTransactions && studentTransactions.length > 10 && (
                  <div className="text-center py-2 text-base-content opacity-70 text-sm border-t border-base-300 mt-2">
                    Showing last 10 transactions of {studentTransactions.length} total
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-base-300 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  refetchTransactions();
                  setRefreshBalance(prev => prev + 1);
                  refetchBalance();
                  toast.success("Data refreshed!");
                }}
                className="bg-primary text-primary-content py-2 px-4 rounded-md hover:bg-primary-focus text-sm"
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  if (studentTransactions && studentTransactions.length > 0) {
                    const csvContent =
                      "data:text/csv;charset=utf-8," +
                      "Date,Time,Merchant,Amount (LIQUID)\n" +
                      studentTransactions
                        .map(tx => {
                          const date = new Date(Number(tx.timestamp) * 1000);
                          return `${date.toLocaleDateString()},${date.toLocaleTimeString()},${tx.merchant},${parseFloat(formatUnits(tx.amount, 18)).toFixed(4)}`;
                        })
                        .join("\n");

                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `liquid-transactions-${new Date().toISOString().split("T")[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Transaction history exported!");
                  } else {
                    toast.error("No transactions to export");
                  }
                }}
                className="bg-base-300 text-base-content py-2 px-4 rounded-md hover:bg-base-200 text-sm"
              >
                Export
              </button>
            </div>
            <button
              onClick={() => setStep("scan")}
              className="w-full bg-success text-success-content py-3 px-4 rounded-md hover:bg-success-focus font-semibold"
            >
              Make New Payment
            </button>
          </div>
        </div>
      )}
    </div>
      {/* Student Savings Component */}
      <StudentSavings
        connectedAddress={connectedAddress}
        liquidBalance={formattedBalance}
        onBalanceChange={handleBalanceChange}
        onWithdrawnInterestChange={() => {}}
      />
    </div>
  );
};

export default StudentWallet;
