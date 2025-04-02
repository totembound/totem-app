import { CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PremiumSuccess: React.FC = () => {
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
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                    Your account has been created successfully
                </p>
                
                <div className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-6">
                    <p className="text-green-800 dark:text-green-200">
                        We've added 2000 TOTEM to your account to help you start your journey!
                    </p>
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