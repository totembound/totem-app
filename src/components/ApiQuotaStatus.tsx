import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Tooltip from "./Tooltip";

const API_GATEWAY_URL =
  process.env.REACT_APP_RELAYER_API_URL || "https://api.totembound.com/v1";

interface QuotaData {
  userId: string;
  email: string;
  tier: "free" | "premium" | "advanced";
  quota: {
    dailyLimit: number;
    currentUsage: number;
    remaining: number;
    exceeded: boolean;
    resetTime: string;
  };
  timestamp: string;
}

const ApiQuotaStatus: React.FC = () => {
  const { gaslessApiKey, showError } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchQuotaStatus = async () => {
    if (!gaslessApiKey) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_GATEWAY_URL}/relay/quotas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": gaslessApiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid API key");
        }
        throw new Error("Failed to fetch quota status");
      }

      const data = await response.json();
      setQuotaData(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching quota status:", err);
      setError(
        (err as Error).message ||
          "An error occurred while fetching quota status"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotaStatus();
  }, [gaslessApiKey]);

  const getUsagePercentage = () => {
    if (!quotaData) return 0;
    return Math.min(
      (quotaData.quota.currentUsage / quotaData.quota.dailyLimit) * 100,
      100
    );
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-amber-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatLastRefresh = () => {
    if (!lastRefresh) return "";
    return lastRefresh.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!gaslessApiKey) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>API Key Required</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Please generate an API key to view your quota status.
        </p>
      </div>
    );
  }

  if (loading && !quotaData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading quota information...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center text-red-500 dark:text-red-400 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Error loading quota information</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{error}</p>
        <button
          onClick={fetchQuotaStatus}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!quotaData) {
    return null;
  }

  const usagePercentage = getUsagePercentage();
  const isNearLimit = usagePercentage >= 80;
  const isExceeded = quotaData.quota.exceeded;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          API Usage
        </h3>
        <div className="flex items-center space-x-2">
          <Tooltip content="Refresh quota">
            <button
                onClick={fetchQuotaStatus}
                className="flex items-center gap-2 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Usage Alert */}
      {(isNearLimit || isExceeded) && (
        <div
          className={`p-4 rounded-md mb-6 flex items-center ${
            isExceeded
              ? "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
              : "bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 mr-3 flex-shrink-0 ${
              isExceeded ? "text-red-500" : "text-amber-500"
            }`}
          />
          <div>
            <p
              className={`font-medium ${
                isExceeded
                  ? "text-red-800 dark:text-red-200"
                  : "text-amber-800 dark:text-amber-200"
              }`}
            >
              {isExceeded ? "Daily Limit Exceeded" : "Approaching Daily Limit"}
            </p>
            <p
              className={`text-sm ${
                isExceeded
                  ? "text-red-600 dark:text-red-300"
                  : "text-amber-600 dark:text-amber-300"
              }`}
            >
              {isExceeded
                ? "Your requests will be rejected until the limit resets at midnight UTC."
                : "Consider upgrading to premium for higher limits and priority processing."}
            </p>
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="space-y-6">
        {/* Daily Usage Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Daily Usage
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {quotaData.quota.currentUsage.toLocaleString()} /{" "}
              {quotaData.quota.dailyLimit.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getUsageColor()}`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {quotaData.quota.remaining.toLocaleString()} remaining
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {usagePercentage.toFixed(1)}% used
            </span>
          </div>
        </div>

        {/* Reset Information */}
        <div className="flex items-start">
          <Clock className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Reset Schedule
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your daily quota resets at{" "}
              <span className="font-medium">{quotaData.quota.resetTime}</span>
            </p>
          </div>
        </div>

        {/* Account Information */}
        <div className="border-t dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Account:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {quotaData.email}
            </span>
          </div>
          {lastRefresh && (
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">
                Last updated:
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {formatLastRefresh()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiQuotaStatus;
