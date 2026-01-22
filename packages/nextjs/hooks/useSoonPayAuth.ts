/**
 * SoonPay Authentication Hook
 * Handles user authentication with SoonPay while maintaining local wallet functionality
 */
import { useEffect, useState } from "react";
import { soonPayConfig } from "~~/config/soonpay.config";

export interface SoonPayUser {
  id: string;
  email: string;
  walletAddress: string;
  userType: "student" | "merchant";
  verified: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: SoonPayUser | null;
  isLoading: boolean;
  error: string | null;
}

export const useSoonPayAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
  });

  // Initialize authentication state
  useEffect(() => {
    if (soonPayConfig.enabled) {
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = async () => {
    if (!soonPayConfig.enabled) {
      return;
    }

    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Check if user has stored auth token
      const token = localStorage.getItem("soonpay_auth_token");
      if (!token) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Validate token with SoonPay API (simulated for local development)
      const response = await validateAuthToken(token);

      if (response.valid) {
        setAuthState({
          isAuthenticated: true,
          user: response.user || null,
          isLoading: false,
          error: null,
        });
      } else {
        // Clear invalid token
        localStorage.removeItem("soonpay_auth_token");
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: "Authentication check failed",
      });
    }
  };

  const login = async (email: string, password: string) => {
    if (!soonPayConfig.enabled) {
      throw new Error("SoonPay integration is disabled");
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate SoonPay login (replace with actual API call)
      const response = await authenticateUser(email, password);

      if (response.success) {
        localStorage.setItem("soonpay_auth_token", response.token);
        setAuthState({
          isAuthenticated: true,
          user: response.user,
          isLoading: false,
          error: null,
        });
        return response.user;
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem("soonpay_auth_token");
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  };

  const register = async (email: string, password: string, userType: "student" | "merchant", walletAddress: string) => {
    if (!soonPayConfig.enabled) {
      throw new Error("SoonPay integration is disabled");
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate SoonPay registration (replace with actual API call)
      const response = await registerUser(email, password, userType, walletAddress);

      if (response.success) {
        localStorage.setItem("soonpay_auth_token", response.token);
        setAuthState({
          isAuthenticated: true,
          user: response.user,
          isLoading: false,
          error: null,
        });
        return response.user;
      } else {
        throw new Error(response.error || "Registration failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  return {
    ...authState,
    login,
    logout,
    register,
    checkAuthStatus,
    isEnabled: soonPayConfig.enabled,
  };
};

// Simulated API functions (replace with actual SoonPay API calls)
const validateAuthToken = async (token: string): Promise<{ valid: boolean; user: SoonPayUser | null }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // For local development, simulate a valid user
  if (soonPayConfig.environment === "local") {
    return {
      valid: true,
      user: {
        id: "local_user_123",
        email: "student@makerere.ac.ug",
        walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        userType: "student",
        verified: true,
      },
    };
  }

  // For live environments, make actual API call
  try {
    const response = await fetch(`${soonPayConfig.authEndpoint}/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return {
      valid: result.valid || false,
      user: result.user || null,
    };
  } catch (error) {
    return { valid: false, user: null };
  }
};

const authenticateUser = async (email: string, password: string): Promise<any> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // For local development, simulate successful login
  if (soonPayConfig.environment === "local") {
    return {
      success: true,
      token: "local_auth_token_" + Date.now(),
      user: {
        id: "local_user_" + Date.now(),
        email,
        walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        userType: email.includes("merchant") ? "merchant" : "student",
        verified: true,
      },
    };
  }

  // For live environments, make actual API call
  try {
    const response = await fetch(`${soonPayConfig.authEndpoint}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: "Network error" };
  }
};

const registerUser = async (
  email: string,
  password: string,
  userType: "student" | "merchant",
  walletAddress: string,
): Promise<any> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // For local development, simulate successful registration
  if (soonPayConfig.environment === "local") {
    return {
      success: true,
      token: "local_auth_token_" + Date.now(),
      user: {
        id: "local_user_" + Date.now(),
        email,
        walletAddress,
        userType,
        verified: true,
      },
    };
  }

  // For live environments, make actual API call
  try {
    const response = await fetch(`${soonPayConfig.authEndpoint}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, userType, walletAddress }),
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: "Network error" };
  }
};
