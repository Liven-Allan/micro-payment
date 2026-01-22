/**
 * SoonPay Authentication Component
 * Provides login/register functionality while maintaining local wallet compatibility
 */
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useSoonPayAuth } from "~~/hooks/useSoonPayAuth";
import { useNotifications } from "~~/hooks/useNotifications";
import { NotificationContainer } from "~~/components/CustomNotification";

interface SoonPayAuthProps {
  onAuthSuccess?: () => void;
  userType?: "student" | "merchant";
}

export const SoonPayAuth = ({ onAuthSuccess, userType = "student" }: SoonPayAuthProps) => {
  const { address: connectedAddress } = useAccount();
  const { isAuthenticated, user, isLoading, error, login, logout, register, isEnabled } = useSoonPayAuth();
  const { notifications, removeNotification, showWarning } = useNotifications();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  // If SoonPay integration is disabled, show info message
  if (!isEnabled) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Local Development Mode</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>SoonPay integration is currently disabled. You&apos;re using local wallet authentication only.</p>
              <p className="mt-1">
                To enable SoonPay integration, set <code>NEXT_PUBLIC_SOONPAY_ENABLED=true</code> in your environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If already authenticated, show user info
  if (isAuthenticated && user) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-green-800">SoonPay Account Connected</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Email: {user.email}</p>
              <p>Type: {user.userType}</p>
              <p>Status: {user.verified ? "Verified" : "Unverified"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm hover:bg-green-200"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectedAddress) {
      showWarning("Wallet Required", "Please connect your wallet first before proceeding.");
      return;
    }

    try {
      if (mode === "login") {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          showWarning("Password Mismatch", "Passwords do not match. Please check and try again.");
          return;
        }
        await register(formData.email, formData.password, userType, connectedAddress);
      }

      onAuthSuccess?.();
    } catch (error) {
      console.error("Authentication failed:", error);
      // Error is already handled by the hook
    }
  };

  return (
    <>
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === "login" ? "Login to SoonPay" : "Create SoonPay Account"}
          </h2>
          <p className="text-gray-600 mt-2">
            {mode === "login"
              ? "Access your SoonPay account for enhanced features"
              : `Create a ${userType} account to get started`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="student@makerere.ac.ug"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
                ? "Login"
                : "Create Account"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>

        {!connectedAddress && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="text-sm text-yellow-700">
              Please connect your wallet first to link it with your SoonPay account.
            </div>
          </div>
        )}
      </div>
    </>
  );
};
