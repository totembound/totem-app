import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PremiumSuccess: React.FC = () => {
    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-6 md:p-8 rounded-lg max-w-[95%] md:max-w-2xl mx-auto 
            shadow-lg border border-gray-100 dark:border-gray-700 relative">
            <div className="p-8 text-center dark:text-gray-200">
                <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
                <p>Your premium subscription has been activated.</p>
                <Link to="/account/settings" className="mt-4 inline-block text-blue-600 hover:underline">
                    Back to Account Settings
                </Link>
            </div>
        </div>
    );
};

export default PremiumSuccess;