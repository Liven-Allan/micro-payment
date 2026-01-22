/**
 * Professional Token Formatting Utilities
 * Implements proper formatUnits usage and decimal handling as per SoonPay standards
 * Uses viem for compatibility with Scaffold-ETH 2
 */
import { formatUnits, parseUnits } from "viem";
import { tokenConfig } from "~~/config/soonpay.config";

export interface TokenAmount {
  raw: string; // Raw amount in wei/smallest unit
  formatted: string; // Human-readable amount
  symbol: string; // Token symbol
  decimals: number; // Token decimals
}

/**
 * Format token amount using proper viem formatUnits
 */
export const formatTokenAmount = (
  amount: string | bigint | number,
  tokenSymbol: keyof typeof tokenConfig,
  precision: number = 4,
): TokenAmount => {
  const token = tokenConfig[tokenSymbol];

  // Convert to bigint if needed
  let rawAmount: bigint;
  if (typeof amount === "bigint") {
    rawAmount = amount;
  } else {
    rawAmount = BigInt(amount.toString());
  }

  // Format using viem formatUnits
  const formattedAmount = formatUnits(rawAmount, token.decimals);

  // Apply precision
  const preciseAmount = parseFloat(formattedAmount).toFixed(precision);

  return {
    raw: rawAmount.toString(),
    formatted: preciseAmount,
    symbol: token.symbol,
    decimals: token.decimals,
  };
};

/**
 * Parse human-readable amount to raw token units
 */
export const parseTokenAmount = (amount: string | number, tokenSymbol: keyof typeof tokenConfig): string => {
  const token = tokenConfig[tokenSymbol];

  // Convert to string if needed
  const amountStr = amount.toString();

  // Parse using viem parseUnits
  const parsedAmount = parseUnits(amountStr, token.decimals);

  return parsedAmount.toString();
};

/**
 * Convert between different token representations
 */
export const convertTokenAmount = (
  amount: string | number,
  fromDecimals: number,
  toDecimals: number,
  precision: number = 6,
): string => {
  // Convert to bigint first
  const amountBigInt = typeof amount === "string" ? BigInt(amount) : BigInt(amount.toString());

  // Convert to base units first
  const baseAmount = formatUnits(amountBigInt, fromDecimals);

  // Then to target decimals
  const targetAmount = parseUnits(baseAmount, toDecimals);

  // Format for display
  const displayAmount = formatUnits(targetAmount, toDecimals);

  return parseFloat(displayAmount).toFixed(precision);
};

/**
 * Validate token amount format
 */
export const validateTokenAmount = (
  amount: string,
  tokenSymbol: keyof typeof tokenConfig,
  maxAmount?: string | bigint,
): { valid: boolean; error?: string } => {
  const token = tokenConfig[tokenSymbol];

  // Check if amount is a valid number
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    return { valid: false, error: "Invalid amount" };
  }

  // Check if amount is zero
  if (numAmount === 0) {
    return { valid: false, error: "Amount must be greater than zero" };
  }

  // Check maximum amount if provided
  if (maxAmount) {
    const maxAmountBigInt = typeof maxAmount === "bigint" ? maxAmount : BigInt(maxAmount);
    const maxNum = parseFloat(formatUnits(maxAmountBigInt, token.decimals));
    if (numAmount > maxNum) {
      return { valid: false, error: "Amount exceeds available balance" };
    }
  }

  // Check decimal precision
  const decimalPlaces = (amount.split(".")[1] || "").length;
  if (decimalPlaces > token.decimals) {
    return { valid: false, error: `Maximum ${token.decimals} decimal places allowed` };
  }

  return { valid: true };
};

/**
 * Format currency amounts for display (UGX, USD, etc.)
 */
export const formatCurrency = (amount: number | string, currency: string = "UGX", precision: number = 2): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return `0 ${currency}`;
  }

  // Format with commas for thousands
  const formatted = numAmount.toFixed(precision).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${formatted} ${currency}`;
};

/**
 * Calculate percentage with proper precision
 */
export const calculatePercentage = (
  amount: string | number,
  percentage: number,
  tokenSymbol: keyof typeof tokenConfig,
): TokenAmount => {
  const token = tokenConfig[tokenSymbol];
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  const percentageAmount = (numAmount * percentage) / 100;
  const rawAmount = parseUnits(percentageAmount.toString(), token.decimals);

  return formatTokenAmount(rawAmount, tokenSymbol);
};

/**
 * Safe arithmetic operations for token amounts
 */
export const tokenMath = {
  add: (a: string, b: string, tokenSymbol: keyof typeof tokenConfig): TokenAmount => {
    const token = tokenConfig[tokenSymbol];
    const aBigInt = BigInt(a);
    const bBigInt = BigInt(b);
    const aFormatted = formatUnits(aBigInt, token.decimals);
    const bFormatted = formatUnits(bBigInt, token.decimals);
    const sum = parseFloat(aFormatted) + parseFloat(bFormatted);
    const rawSum = parseUnits(sum.toString(), token.decimals);
    return formatTokenAmount(rawSum, tokenSymbol);
  },

  subtract: (a: string, b: string, tokenSymbol: keyof typeof tokenConfig): TokenAmount => {
    const token = tokenConfig[tokenSymbol];
    const aBigInt = BigInt(a);
    const bBigInt = BigInt(b);
    const aFormatted = formatUnits(aBigInt, token.decimals);
    const bFormatted = formatUnits(bBigInt, token.decimals);
    const difference = parseFloat(aFormatted) - parseFloat(bFormatted);
    const rawDifference = parseUnits(Math.max(0, difference).toString(), token.decimals);
    return formatTokenAmount(rawDifference, tokenSymbol);
  },

  multiply: (amount: string, multiplier: number, tokenSymbol: keyof typeof tokenConfig): TokenAmount => {
    const token = tokenConfig[tokenSymbol];
    const amountBigInt = BigInt(amount);
    const amountFormatted = formatUnits(amountBigInt, token.decimals);
    const product = parseFloat(amountFormatted) * multiplier;
    const rawProduct = parseUnits(product.toString(), token.decimals);
    return formatTokenAmount(rawProduct, tokenSymbol);
  },
};

/**
 * Format amounts for transaction display
 */
export const formatTransactionAmount = (
  amount: string | bigint,
  tokenSymbol: keyof typeof tokenConfig,
  showSymbol: boolean = true,
): string => {
  const formatted = formatTokenAmount(amount, tokenSymbol, 6);
  return showSymbol ? `${formatted.formatted} ${formatted.symbol}` : formatted.formatted;
};

/**
 * Get token decimals for a given symbol
 */
export const getTokenDecimals = (tokenSymbol: keyof typeof tokenConfig): number => {
  return tokenConfig[tokenSymbol].decimals;
};
