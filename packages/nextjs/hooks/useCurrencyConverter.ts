import { useCallback, useEffect, useState } from "react";

// Configuration for LIQUID token exchange rate
const LIQUID_CONFIG = {
  // Using Artificial Liquid Intelligence (ALI) token as LIQUID
  // This provides real exchange rates from CoinGecko
  EXCHANGE_RATE_UGX: 2000, // Fallback rate if API fails
  USE_LIVE_API: true, // Enable live API for real rates
  COINGECKO_ID: "alethea-artificial-liquid-intelligence-token", // Artificial Liquid Intelligence (ALI/$LIQUID)
};

interface CurrencyConverterHook {
  ugxToLiquid: (ugxAmount: string) => string;
  liquidToUgx: (liquidAmount: string) => string;
  exchangeRate: number | null;
  isLoading: boolean;
  error: string | null;
  refreshRate: () => void;
}

export const useCurrencyConverter = (): CurrencyConverterHook => {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExchangeRate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (LIQUID_CONFIG.USE_LIVE_API) {
        // Try to fetch from CoinGecko API
        console.log("🔄 Fetching live LIQUID rate from CoinGecko...");

        // First try to get UGX directly
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${LIQUID_CONFIG.COINGECKO_ID}&vs_currencies=ugx&x_cg_demo_api_key=CG-fBP52GvjZkm2CZunNEQUCL2m`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          console.log("📊 ALI token API response (UGX):", data);

          if (data[LIQUID_CONFIG.COINGECKO_ID] && data[LIQUID_CONFIG.COINGECKO_ID].ugx) {
            console.log("✅ Live LIQUID rate fetched (UGX):", data[LIQUID_CONFIG.COINGECKO_ID].ugx, "UGX");
            setExchangeRate(data[LIQUID_CONFIG.COINGECKO_ID].ugx);
            return;
          } else {
            console.warn("⚠️ UGX not available, trying USD conversion...");
          }
        }

        // If UGX not available, get USD price and convert
        console.log("🔄 Fetching USD price for conversion...");
        const usdResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${LIQUID_CONFIG.COINGECKO_ID}&vs_currencies=usd&x_cg_demo_api_key=CG-fBP52GvjZkm2CZunNEQUCL2m`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (usdResponse.ok) {
          const usdData = await usdResponse.json();
          console.log("📊 ALI token USD response:", usdData);

          if (usdData[LIQUID_CONFIG.COINGECKO_ID] && usdData[LIQUID_CONFIG.COINGECKO_ID].usd) {
            const usdPrice = usdData[LIQUID_CONFIG.COINGECKO_ID].usd;
            console.log("💵 ALI price in USD:", usdPrice);

            // Convert USD to UGX (approximate rate: 1 USD = 3700 UGX)
            const usdToUgxRate = 3700; // You can make this dynamic too if needed
            const ugxPrice = usdPrice * usdToUgxRate;

            console.log("🔄 Converting USD to UGX:", usdPrice, "USD * ", usdToUgxRate, "= ", ugxPrice, "UGX");
            console.log("✅ Live LIQUID rate calculated:", ugxPrice, "UGX per LIQUID");

            setExchangeRate(ugxPrice);
            return;
          }
        }
      }

      // Use configured custom rate for LIQUID token
      console.log("💡 Using configured LIQUID token rate for micro-payment system");
      console.log("✅ LIQUID rate set:", LIQUID_CONFIG.EXCHANGE_RATE_UGX, "UGX per LIQUID");
      setExchangeRate(LIQUID_CONFIG.EXCHANGE_RATE_UGX);

      // Test API connection (optional)
      console.log("🧪 Testing API connection...");

      // Test Bitcoin (we know this works)
      const testResponse = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&x_cg_demo_api_key=CG-fBP52GvjZkm2CZunNEQUCL2m",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log("🧪 API connection successful. Bitcoin price:", testData.bitcoin?.usd);
      }

      // Test ALI token directly
      console.log("🧪 Testing ALI token API call directly...");
      const aliTestResponse = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=alethea-artificial-liquid-intelligence-token&vs_currencies=usd,ugx&x_cg_demo_api_key=CG-fBP52GvjZkm2CZunNEQUCL2m",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (aliTestResponse.ok) {
        const aliTestData = await aliTestResponse.json();
        console.log("🧪 ALI token test response:", aliTestData);
      } else {
        console.error("❌ ALI token test failed with status:", aliTestResponse.status);
      }
    } catch (err) {
      console.error("❌ Error in currency setup:", err);
      setError("Using default exchange rate");
      // Fallback to configured rate
      console.warn("🔄 Using configured fallback rate:", LIQUID_CONFIG.EXCHANGE_RATE_UGX, "UGX = 1 LIQUID");
      setExchangeRate(LIQUID_CONFIG.EXCHANGE_RATE_UGX);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch rate on mount and set up periodic refresh
  useEffect(() => {
    fetchExchangeRate();

    // Refresh rate every 5 minutes
    const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchExchangeRate]);

  const ugxToLiquid = useCallback(
    (ugxAmount: string): string => {
      if (!exchangeRate || !ugxAmount || isNaN(parseFloat(ugxAmount))) {
        return "0";
      }

      const ugxValue = parseFloat(ugxAmount);
      const liquidValue = ugxValue / exchangeRate;
      return liquidValue.toFixed(6); // 6 decimal places for precision
    },
    [exchangeRate],
  );

  const liquidToUgx = useCallback(
    (liquidAmount: string): string => {
      if (!exchangeRate || !liquidAmount || isNaN(parseFloat(liquidAmount))) {
        return "0";
      }

      const liquidValue = parseFloat(liquidAmount);
      const ugxValue = liquidValue * exchangeRate;
      return ugxValue.toFixed(0); // No decimal places for UGX
    },
    [exchangeRate],
  );

  return {
    ugxToLiquid,
    liquidToUgx,
    exchangeRate,
    isLoading,
    error,
    refreshRate: fetchExchangeRate,
  };
};
