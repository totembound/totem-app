import React from 'react';
import { useUser } from '../contexts/UserContext';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const PremiumSuccess: React.FC = () => {
    const { gaslessApiKey, accountType } = useUser();
    const isNewAccount  = !gaslessApiKey;

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-6 md:p-8 rounded-lg max-w-[95%] md:max-w-2xl mx-auto 
            shadow-lg border border-gray-100 dark:border-gray-700 relative">
            <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 text-green-500 dark:text-green-400">
                    <CheckCircle className="w-full h-full" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                    Welcome to TotemBound!
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {isNewAccount ? "Your account has been created successfully!" : "Your account has been upgraded successfully!"}
                </p>
                
                <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 
                    rounded-lg p-4 mb-6 text-center">
                    {isNewAccount ? (
                        <p className="text-green-800 dark:text-green-200">
                            We've added 2000 TOTEM to your account to help you start your journey!
                        </p>
                    ) : (
                        <p className="text-green-800 dark:text-green-200">
                            Your premium benefits are now active!
                        </p>
                    )}
                </div>
                
                <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 
                        rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Important Next Step</h3>
                    <p className="text-blue-800 dark:text-blue-200 mb-3">
                        Don't forget to enter your API key in Account Settings to enable {accountType === 'Premium' ? 'premium' : 'sponsored'} transactions.
                    </p>
                    <Link 
                        to="/account/settings"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 
                            rounded-lg inline-block transition-colors">
                        Go to Account Settings
                    </Link>
                </div>
                
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 
                        rounded-lg w-full text-lg transition-all">
                    Enter TotemBound
                </button>
            </div>
        </div>
    );
};

export default PremiumSuccess;