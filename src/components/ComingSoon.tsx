import React, { useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';

export const ComingSoon: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await fetch('https://api.totembound.com/v1/waitlist', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': 'http://localhost:3000'
                }
            });
            
            const data = await response.json();
            setStatus(data.message);
            if (response.ok) setEmail('');
            if (response.ok) {
                setStatus('✨ Thanks for joining our waitlist!');
                setEmail('');
            } else {
                setStatus('❌ ' + (data.error || 'Failed to subscribe'));
            }
        } catch (error) {
            setStatus('❌ Network error. Please try again.');
        }
        
        setLoading(false);
    };

    return (
        <div className="bg-gray-200 dark:bg-gray-800 p-4 md:p-8 rounded-xl mb-8 transition-colors duration-200">
            <div className="flex items-center justify-center gap-3 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-purple-900 dark:text-purple-100">
                    Coming Soon!
                </h2>
                <Clock className="animate-pulse text-purple-600 dark:text-purple-400" size={28} />
            </div>
            
            <p className="text-lg text-center mb-8 text-gray-700 dark:text-gray-300">
                Join our waitlist to be first in line when we launch!
            </p>

            <div className="bg-white dark:bg-gray-700/30 p-2 mb-3 rounded-xl backdrop-blur-sm">
                <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
                    <input 
                        autoFocus
                        required
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email" 
                        className="flex-1 px-4 py-3 rounded-lg bg-white dark:bg-gray-800 
                                 border border-purple-200 dark:border-purple-800
                                 text-gray-900 dark:text-gray-100
                                 placeholder:text-gray-500 dark:placeholder:text-gray-400
                                 focus:border-purple-500 dark:focus:border-purple-400 
                                 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                                 dark:focus:ring-purple-400/20 transition-all"
                    />
                    <button className="text-white bg-purple-600 hover:bg-purple-700 
                                 dark:bg-purple-500 dark:hover:bg-purple-600
                                 px-6 py-3 rounded-lg font-bold transition-all
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                                 dark:focus:ring-purple-400/20">
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Join Waitlist ✨'}
                    </button>
                    
                </form>
            </div>

            {status && (
                    <p className={`text-center font-bold text-lg transition-colors
                        ${status.includes('✨') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {status}
                    </p>
                    )}

            <div className="text-center text-gray-800 dark:text-gray-200 mt-8"> 
                <p className="font-medium mb-4">Be the first to know about:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-700/30 p-3 rounded-lg">
                        <span className="text-xl">🚀</span>
                        <span className="font-medium">Launch date</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-700/30 p-3 rounded-lg">
                        <span className="text-xl">🎁</span>
                        <span className="font-medium">Early adopter rewards</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-700/30 p-3 rounded-lg">
                        <span className="text-xl">🔥</span>
                        <span className="font-medium">Special events</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-700/30 p-3 rounded-lg">
                        <span className="text-xl">💎</span>
                        <span className="font-medium">Exclusive drops</span>
                    </div>
                </div>
            </div>
        </div>
    );
};