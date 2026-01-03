"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { parseEther } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { LiquidBalance } from "~~/components/LiquidBalance";
import { QRScanner } from "~~/components/QRScanner";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useLiquidToken } from "~~/hooks/useLiquidToken";

/**
 * Student Payment Interface - The "Scan & Pay" Experience
 * This page allows students to:
 * 1. Scan merchant QR codes
 * 2. Enter payment amounts
 * 3. Approve and execute payments
 * 4. Receive loyalty rewards automatically
 */
const StudentWallet = () => {
  const { address: connectedAddress } = useAccount();

  // State management
  const [scannerActive, setScannerActive] = useState(false);
  const [merchantAddress, setMerchantAddress] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"scan" | "amount" | "confirm" | "processing">("scan");

  // Get LIQUID token info and balance
  const {
    formattedBalance,
    contractAddress: liquidAddress,
    abi: liquidAbi,
  } = useLiquidToken(connectedAddress as `0x${string}`);

  // Get merchant info to verify it's a valid merchant
  const { data: merchantInfo } = useScaffoldReadContract({
    contractName: "MerchantService",
    functionName: "getMerchantInfo",
    args: merchantAddress ? [merchantAddress as `0x${string}`] : undefined,
  });

  // Check if scanned address is a registered merchant
  const { data: isMerchant } = useScaffoldReadContract({
    contractName: "MerchantService",
    functionName: "isMerchant",
    args: merchantAddress ? [merchantAddress as `0x${string}`] : undefined,
  });

  // Contract write functions
  const { writeContract: approveLiquid } = useWriteContract();
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

  // Calculate loyalty reward (5%)
  const calculateLoyaltyReward = (amount: string) => {
    if (!amount) return "0";
    const amountNum = parseFloat(amount);
    return (amountNum * 0.05).toFixed(4);
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

    if (parseFloat(formattedBalance) < parseFloat(paymentAmount)) {
      toast.error("Insufficient LIQUID balance");
      return;
    }

    try {
      setIsProcessing(true);
      setStep("processing");

      const amountWei = parseEther(paymentAmount);

      // Step 1: Approve LIQUID tokens for MerchantService contract
      toast.loading("Step 1/2: Approving LIQUID tokens...", { id: "payment-process" });

      approveLiquid({
        address: liquidAddress as `0x${string}`,
        abi: liquidAbi,
        functionName: "approve",
        args: [
          (process.env.NEXT_PUBLIC_MERCHANT_SERVICE_ADDRESS as `0x${string}`) ||
            "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Default local address
          amountWei,
        ],
      });

      console.log("Approval transaction initiated");

      // Wait a moment for approval to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Execute payment
      toast.loading("Step 2/2: Processing payment...", { id: "payment-process" });

      const paymentResult = await makePayment({
        functionName: "receivePayment",
        args: [merchantAddress as `0x${string}`, amountWei],
      });

      console.log("Payment transaction:", paymentResult);

      // Calculate loyalty reward for display
      const loyaltyReward = calculateLoyaltyReward(paymentAmount);

      // Success!
      toast.success(`Payment successful! You earned ${loyaltyReward} LIQUID in cashback!`, {
        id: "payment-process",
        duration: 5000,
      });

      // Show success modal
      showSuccessModal(paymentAmount, loyaltyReward);

      // Reset form
      resetForm();
    } catch (error: any) {
      console.error("Payment failed:", error);
      toast.error(
        error?.message?.includes("insufficient")
          ? "Insufficient balance or allowance"
          : "Payment failed. Please try again.",
        { id: "payment-process" },
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Show success modal
  const showSuccessModal = (amount: string, reward: string) => {
    // Create a custom success notification
    const successMessage = (
      <div className="text-center">
        <div className="text-lg font-bold text-green-600 mb-2">🎉 Payment Successful!</div>
        <div className="text-sm">
          <div>Paid: {amount} LIQUID</div>
          <div className="text-green-600 font-semibold">Cashback: {reward} LIQUID (5%)</div>
        </div>
      </div>
    );

    toast.success(successMessage as any, { duration: 6000 });
  };

  // Reset form to initial state
  const resetForm = () => {
    setMerchantAddress("");
    setPaymentAmount("");
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
    <div className="container mx-auto px-4 py-8 max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Wallet</h1>
        <p className="text-gray-600">Scan & Pay with LIQUID tokens</p>

        {/* Balance Display */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <LiquidBalance address={connectedAddress} className="text-lg" />
        </div>
      </div>

      {/* Step 1: QR Scanner */}
      {step === "scan" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Scan Merchant QR Code</h2>

          {!scannerActive ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-semibold mb-4"
                >
                  📷 Start Camera Scanner
                </button>
              </div>

              {/* Manual entry option */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Or enter merchant address manually:</p>
                <input
                  type="text"
                  placeholder="0x..."
                  value={merchantAddress}
                  onChange={e => setMerchantAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                  className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Enter Payment Amount</h2>

          {/* Merchant Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Paying to:</div>
            <div className="font-semibold">{merchantInfo?.[0] || "Unknown Merchant"}</div>
            <div className="text-xs text-gray-500 mt-1 font-mono">{merchantAddress}</div>

            {isMerchant ? (
              <div className="text-green-600 text-sm mt-2">✅ Verified Merchant</div>
            ) : (
              <div className="text-red-600 text-sm mt-2">⚠️ Unregistered Address</div>
            )}
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (LIQUID)</label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              placeholder="0.0000"
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-lg text-center font-mono"
            />

            {/* Quick amount buttons */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {["1", "5", "10"].map(amount => (
                <button
                  key={amount}
                  onClick={() => setPaymentAmount(amount)}
                  className="py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  {amount} LIQUID
                </button>
              ))}
            </div>
          </div>

          {/* Loyalty Preview */}
          {paymentAmount && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-800">
                <div className="font-semibold">💰 You&apos;ll earn cashback:</div>
                <div className="text-lg font-bold">{calculateLoyaltyReward(paymentAmount)} LIQUID (5%)</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setStep("confirm")}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Review Payment
            </button>

            <button
              onClick={() => setStep("scan")}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
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

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">Payment Amount</div>
              <div className="text-2xl font-bold text-blue-900">{paymentAmount} LIQUID</div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-800">Loyalty Cashback (5%)</div>
              <div className="text-xl font-bold text-green-900">+{calculateLoyaltyReward(paymentAmount)} LIQUID</div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
            <div className="text-sm">
              <div>Your Balance: {parseFloat(formattedBalance).toFixed(4)} LIQUID</div>
              <div>
                After Payment:{" "}
                {(
                  parseFloat(formattedBalance) -
                  parseFloat(paymentAmount) +
                  parseFloat(calculateLoyaltyReward(paymentAmount))
                ).toFixed(4)}{" "}
                LIQUID
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePayment}
              disabled={isProcessing || parseFloat(formattedBalance) < parseFloat(paymentAmount)}
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
    </div>
  );
};

export default StudentWallet;
