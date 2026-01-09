"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { parseEther } from "viem";
import { useAccount, useBalance, useSendTransaction } from "wagmi";

const PROTOCOLS: Record<string, Record<number, { id: string; name: string; address: `0x${string}` }>> = {
  lido: {
    1: { id: "lido", name: "Lido (Mainnet)", address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84" },
    5: { id: "lido", name: "Lido (Goerli)", address: "0x2F0b23f53734252BDA2677341545525450842F68" },
    31337: { id: "lido", name: "Lido (Local Test)", address: "0x0000000000000000000000000000000000000001" },
  },
  aave: {
    1: { id: "aave", name: "Aave (Mainnet)", address: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9" },
    5: { id: "aave", name: "Aave (Goerli)", address: "0xE12aFEC5aa12Cf614678f9bfeeb98ca9bb95b5B0" },
    31337: { id: "aave", name: "Aave (Local Test)", address: "0x0000000000000000000000000000000000000002" },
  },
};

type Props = { open: boolean; onClose: () => void };

export default function DepositModal({ open, onClose }: Props) {
  const { address, chainId } = useAccount();
  const [amount, setAmount] = useState<string>("");
  const [token, setToken] = useState<string>("ETH");
  const [protocol, setProtocol] = useState<string>("lido");
  const [txHash, setTxHash] = useState<string | null>(null);

  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address,
    chainId,
  });

  useEffect(() => {
    if (!open) {
      setAmount("");
      setToken("ETH");
      setProtocol("lido");
      setTxHash(null);
    }
  }, [open]);

  const balance = balanceData?.value || BigInt(0);
  const currentProtocols = PROTOCOLS[protocol] || {};
  const selectedProtocol = currentProtocols[chainId || 1];

  // Validation checks
  const isWalletConnected = Boolean(address);
  const hasAmount = amount && parseFloat(amount) > 0;
  const amountBig = hasAmount ? parseEther(amount) : BigInt(0);
  const hasSufficientBalance = amountBig > BigInt(0) && amountBig <= balance;
  const protocolAvailable = Boolean(selectedProtocol);
  const isETH = token === "ETH";

  const canDeposit = isWalletConnected && hasAmount && hasSufficientBalance && protocolAvailable && isETH;

  const { sendTransaction, isPending, data: txData } = useSendTransaction();

  const handleConfirm = async () => {
    if (!isWalletConnected) return toast.error("Connect your wallet first");
    if (!hasAmount) return toast.error("Enter an amount");
    if (!hasSufficientBalance) return toast.error("Insufficient ETH balance");
    if (!protocolAvailable) return toast.error("Protocol not available on this network");
    if (!isETH) return toast.error("Only ETH deposits are currently supported");

    try {
      const toastId = toast.loading("Waiting for wallet confirmation...");

      await sendTransaction({
        to: selectedProtocol.address,
        value: amountBig,
      });

      // Wait a bit for txData to update, then show success
      setTimeout(() => {
        toast.dismiss(toastId);
        if (txData) {
          toast.success(`Transaction submitted! Hash: ${txData.substring(0, 10)}...`);
          setTxHash(txData);
        } else {
          toast.success("Transaction submitted!");
        }

        setTimeout(() => {
          onClose();
        }, 2500);
      }, 500);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Transaction failed");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 max-w-xl rounded bg-white p-6 shadow-lg">
        <h3 className="mb-2 text-lg font-semibold">Deposit to Staking</h3>

        <div className="mb-4 text-sm text-gray-700">
          <p>Token supported: ETH, stablecoins (stablecoin staking is shown as informational).</p>
          <p className="mt-2">Protocol used: {selectedProtocol?.name || "N/A on this network"}</p>
          <p className="mt-2">
            Lock-up / liquidity: Varies by protocol — ETH to Lido mints liquid stETH; Aave supplies are withdrawable
            subject to protocol rules.
          </p>
          <p className="mt-3 font-semibold text-red-600">Risk disclaimer:</p>
          <p className="text-xs text-gray-600">
            Staking protocols are third-party contracts. Funds are sent directly from your wallet to the protocol and
            are not held by this app. Review protocol docs before depositing.
          </p>
        </div>

        {isWalletConnected && (
          <div className="mb-4 rounded bg-gray-50 p-3 text-sm">
            <p className="text-gray-700">
              Available ETH:{" "}
              <span className="font-semibold">{balanceLoading ? "..." : (Number(balance) / 1e18).toFixed(4)}</span>
            </p>
          </div>
        )}

        {!isWalletConnected && (
          <div className="mb-4 rounded bg-yellow-50 p-3 text-sm text-yellow-800">
            <p className="font-semibold">⚠️ Wallet not connected</p>
          </div>
        )}
        {isWalletConnected && hasAmount && !hasSufficientBalance && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">❌ Insufficient balance</p>
            <p className="text-xs">
              You need {parseFloat(amount).toFixed(4)} ETH but only have {(Number(balance) / 1e18).toFixed(4)} ETH
            </p>
          </div>
        )}
        {isWalletConnected && !isETH && (
          <div className="mb-4 rounded bg-orange-50 p-3 text-sm text-orange-800">
            <p className="font-semibold">🔐 Token deposits not yet supported</p>
            <p className="text-xs">Currently only ETH direct deposits are available. Token support coming soon.</p>
          </div>
        )}
        {isWalletConnected && protocol && !protocolAvailable && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">❌ Protocol unavailable</p>
            <p className="text-xs">{protocol} is not available on the current network. Please switch networks.</p>
          </div>
        )}

        {txHash && (
          <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-800">
            <p className="font-semibold">✓ Transaction Submitted</p>
            <p className="mt-1 break-all font-mono text-xs">{txHash}</p>
            <p className="mt-2 text-xs text-green-700">
              Check MetaMask or the blockchain explorer for confirmation status.
            </p>
          </div>
        )}

        {isPending && (
          <div className="mb-4 rounded bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-semibold">⏳ Waiting for wallet confirmation...</p>
            <p className="mt-1 text-xs">Please confirm the transaction in your wallet.</p>
          </div>
        )}

        <div className="mb-3 flex gap-2">
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount"
            className="w-1/2 rounded border px-3 py-2"
          />

          <select value={token} onChange={e => setToken(e.target.value)} className="w-1/2 rounded border px-3 py-2">
            <option>ETH</option>
            <option>DAI</option>
            <option>USDC</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Protocol</label>
          <select
            value={protocol}
            onChange={e => setProtocol(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            {Object.keys(PROTOCOLS).map(key => (
              <option key={key} value={key}>
                {PROTOCOLS[key][chainId || 1]?.name || `${key} (unsupported network)`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-4 py-2">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending || !canDeposit}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60"
            title={!canDeposit ? "Check the issues above to deposit" : ""}
          >
            {token === "ETH" ? "Confirm in MetaMask" : "Show instructions"}
          </button>
        </div>
      </div>
    </div>
  );
}
