"use client";

import { useState } from "react";
import { useCurrencyConverter } from "~~/hooks/useCurrencyConverter";

interface CurrencyInputProps {
  onAmountChange: (liquidAmount: string, ugxAmount: string) => void;
  disabled?: boolean;
  className?: string;
}

export const CurrencyInput = ({ onAmountChange, disabled = false, className = "" }: CurrencyInputProps) => {
  const [inputMode, setInputMode] = useState<"UGX" | "LIQUID">("UGX");
  const [ugxAmount, setUgxAmount] = useState("");
  const [liquidAmount, setLiquidAmount] = useState("");

  const { ugxToLiquid, liquidToUgx, exchangeRate, isLoading, error, refreshRate } = useCurrencyConverter();

  const handleUgxChange = (value: string) => {
    setUgxAmount(value);
    const convertedLiquid = ugxToLiquid(value);
    setLiquidAmount(convertedLiquid);
    onAmountChange(convertedLiquid, value);
  };

  const handleLiquidChange = (value: string) => {
    setLiquidAmount(value);
    const convertedUgx = liquidToUgx(value);
    setUgxAmount(convertedUgx);
    onAmountChange(value, convertedUgx);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only allow numbers and decimal point
    if (!/^\d*\.?\d*$/.test(value)) return;

    if (inputMode === "UGX") {
      handleUgxChange(value);
    } else {
      handleLiquidChange(value);
    }
  };

  const toggleInputMode = () => {
    setInputMode(prev => (prev === "UGX" ? "LIQUID" : "UGX"));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Exchange Rate Display */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Exchange Rate:</span>
          {isLoading ? (
            <span className="text-blue-600">Loading...</span>
          ) : error ? (
            <button onClick={refreshRate} className="text-red-600 hover:text-red-800 underline">
              Retry
            </button>
          ) : (
            <span className="font-medium">1 LIQUID = {exchangeRate?.toLocaleString()} UGX</span>
          )}
        </div>
        <button
          onClick={refreshRate}
          disabled={isLoading}
          className="text-blue-600 hover:text-blue-800 text-xs underline"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Input Field */}
      <div className="relative">
        <div className="flex">
          <button
            type="button"
            onClick={toggleInputMode}
            className="px-4 py-2 bg-blue-600 text-white rounded-l-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          >
            {inputMode}
          </button>
          <input
            type="text"
            value={inputMode === "UGX" ? ugxAmount : liquidAmount}
            onChange={handleInputChange}
            disabled={disabled || isLoading}
            placeholder={`Enter amount in ${inputMode}`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Conversion Display */}
      <div className="bg-gray-50 p-3 rounded-md space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Amount in UGX:</span>
          <span className="font-medium text-lg">
            {ugxAmount ? `${parseFloat(ugxAmount).toLocaleString()} UGX` : "0 UGX"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Amount in LIQUID:</span>
          <span className="font-medium text-lg text-blue-600">
            {liquidAmount ? `${parseFloat(liquidAmount).toFixed(4)} LIQUID` : "0 LIQUID"}
          </span>
        </div>
      </div>

      {/* Cashback Preview */}
      {liquidAmount && parseFloat(liquidAmount) > 0 && (
        <div className="bg-green-50 p-3 rounded-md border border-green-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-700">💰 Cashback (5%):</span>
            <span className="font-medium text-green-600">{(parseFloat(liquidAmount) * 0.05).toFixed(4)} LIQUID</span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            ≈ {(parseFloat(liquidToUgx(liquidAmount)) * 0.05).toFixed(0)} UGX
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md border border-red-200">
          ⚠️ {error}. Using fallback rate.
        </div>
      )}
    </div>
  );
};
