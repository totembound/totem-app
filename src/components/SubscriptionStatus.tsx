import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { AlertCircle, CalendarClock, CreditCard, Crown, Loader2, RefreshCw, X } from 'lucide-react';

interface SubscriptionData {
  tier: 'free' | 'premium' | 'web3';
  memberSince?: string;
  renewalDate?: string;
  canceled?: boolean;
  cancelledAt?: string;
  status?: string;
}

const SubscriptionStatus: React.FC = () => {
  const { address, accountType, gaslessApiKey, showError } = useUser();
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const API_GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || 'https://api.totembound.com/v1';
  
  const fetchSubscriptionStatus = async () => {
    if (!gaslessApiKey) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_GATEWAY_URL}/subscription`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': gaslessApiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      
      const data = await response.json();
      setSubscriptionData(data);
    }
    catch (err) {
      console.error('Error fetching subscription status:', err);
      setError((err as Error).message || 'An error occurred while fetching subscription status');
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [gaslessApiKey, API_GATEWAY_URL]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleOpenPortal = async () => {
    try {
      setWaiting(true);
      const response = await fetch(`${API_GATEWAY_URL}/subscription/portal`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': gaslessApiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to create customer portal session');
      }
      
      const { portalUrl } = await response.json();
      
      // Open portal in a new window
      window.open(portalUrl, '_blank', 'noopener,noreferrer');
      setShowRefreshPrompt(true);
    }
    catch (err) {
      console.error('Error opening customer portal:', err);
      showError('Portal Error', 'Could not open customer portal. Please try again later.');
    }
    finally {
      setWaiting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading subscription details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center text-red-500 dark:text-red-400 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Error loading subscription details</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <Crown className="h-6 w-6 text-purple-500 mr-2" />
          Membership
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          subscriptionData?.canceled 
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400' 
            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400'
        }`}>
          {subscriptionData?.canceled ? 'Ending Soon' : 'Active'}
        </span>
      </div>

      <div className="space-y-5 mb-6">
        {/* Membership Info */}
        <div className="flex items-start">
          <CalendarClock className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Subscription</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Premium member since: <span className="font-medium">{formatDate(subscriptionData?.memberSince)}</span>
              {subscriptionData?.canceled && ' (Canceled)'}
            </p>
          </div>
        </div>

        {/* Billing Info */}
        <div className="flex items-start">
          <CreditCard className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Billing</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {subscriptionData?.canceled 
                ? "Your subscription will expire at the end of the current billing period: "
                : "Next billing date: "
              }
              <span className="font-medium">{formatDate(subscriptionData?.renewalDate)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-2">
        <button 
          onClick={handleOpenPortal}
          disabled={waiting}
          className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-200 ease-in-out disabled:opacity-50"
        >
          Manage Billing
        </button>
        
        {showRefreshPrompt && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md relative">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-2 text-center">
              Made changes in the billing portal? Your subscription information may have changed.
            </p>
            <button 
                onClick={() => setShowRefreshPrompt(false)}
                className="absolute top-1 right-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Dismiss message"
            >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <button 
              onClick={fetchSubscriptionStatus}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
            >
              Refresh Now
            </button>
          </div>
          )}

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Use the Billing Portal to manage your subscription, update payment methods, view billing history, or cancel your plan.
        </p>

      </div>
    </div>
  );
};

export default SubscriptionStatus;