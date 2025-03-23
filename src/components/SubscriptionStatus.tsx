import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { Crown } from 'lucide-react';

interface SubscriptionData {
  tier: 'free' | 'premium' | 'web3';
  memberSince?: string;
  renewalDate?: string;
  cancelledAt?: string;
  status?: string;
}

const SubscriptionStatus: React.FC = () => {
  const { address, accountType, gaslessApiKey, showError } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const API_GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || 'https://api.totembound.com/v1';
  
  useEffect(() => {
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
      } catch (err) {
        console.error('Error fetching subscription status:', err);
        setError((err as Error).message || 'An error occurred while fetching subscription status');
      } finally {
        setLoading(false);
      }
    };
    
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
      setLoading(true);
      const response = await fetch(`${API_GATEWAY_URL}/stripe/customer-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': gaslessApiKey
        },
        body: JSON.stringify({
          walletAddress: address
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create customer portal session');
      }
      
      const { url } = await response.json();
      
      // Open portal in a new window
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error opening customer portal:', err);
      showError('Portal Error', 'Could not open customer portal. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_GATEWAY_URL}/subscription`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': gaslessApiKey
        },
        body: JSON.stringify({
          walletAddress: address
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      setCancelConfirmOpen(false);
      showError(
        "Subscription Cancelled", 
        "Your subscription has been cancelled. You will still have Premium access until the end of your current billing period."
      );
      
      // Update local subscription data
      if (subscriptionData) {
        setSubscriptionData({
          ...subscriptionData,
          cancelledAt: new Date().toISOString(),
          status: 'canceled'
        });
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      showError('Cancellation Error', 'Could not cancel your subscription. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center">
          <Crown className="h-5 w-5 text-purple-500 mr-2" />
          Subscription
        </h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          Active
        </span>
      </div>
      
      {loading ? (
        <div className="py-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 dark:text-red-400 text-sm py-2">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Current Plan
            </p>
            <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">
              Premium ($10/month)
            </p>
          </div>
          
          {subscriptionData?.renewalDate && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Next Billing Date
              </p>
              <p className="mt-1 text-base text-gray-900 dark:text-white">
                {formatDate(subscriptionData.renewalDate)}
              </p>
            </div>
          )}
          
          {subscriptionData?.memberSince && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Member Since
              </p>
              <p className="mt-1 text-base text-gray-900 dark:text-white">
                {formatDate(subscriptionData.memberSince)}
              </p>
            </div>
          )}
          
          <div className="pt-4 space-y-2">
            <button 
              onClick={handleOpenPortal}
              disabled={loading}
              className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-200 ease-in-out disabled:opacity-50"
            >
              Manage Billing
            </button>
            
            {!cancelConfirmOpen ? (
              <button 
                onClick={() => setCancelConfirmOpen(true)}
                disabled={loading}
                className="w-full py-2 px-3 bg-transparent border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200 ease-in-out disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            ) : (
              <div className="space-y-2 p-3 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Are you sure you want to cancel? You'll lose access at the end of your current billing period.
                </p>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 ease-in-out disabled:opacity-50"
                  >
                    Yes, Cancel
                  </button>
                  <button 
                    onClick={() => setCancelConfirmOpen(false)}
                    disabled={loading}
                    className="flex-1 py-2 px-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 ease-in-out disabled:opacity-50"
                  >
                    No, Keep It
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;