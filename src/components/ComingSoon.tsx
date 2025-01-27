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
        <div className="bg-purple-300/50 p-4 md:p-6 mt-6 rounded-lg mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Coming Soon!</h2>
            <Clock className="animate-pulse" size={24} />
            </div>
            
            <p className="text-lg text-center mb-6">Join our waitlist to be first in line when we launch!</p>
            
            <div className="bg-gray-400 p-2 mb-2 rounded-lg">
                <form className="flex flex-col sm:flex-row gap-2 md:gap-3" onSubmit={handleSubmit}>
                    <input 
                        autoFocus
                        required
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email" 
                        className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                    <button className="text-white bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-bold transition-all">
                        {loading ? <Loader2 className="animate-spin" /> : 'Join Waitlist ✨'}
                    </button>
                    
                </form>
            </div>

            {status && (
                    <p className={`text-center font-bold ${status.includes('✨') ? 'text-green-600' : 'text-red-600'}`}>
                    {status}
                    </p>
                    )}

            <div className="text-center text-gray-800 mt-4">
            Be the first to know about:
            <div className="m-4 md:m-8 mt-3 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 justify-left">
                    <span>🚀</span> Launch date
                </div>
                <div className="flex items-center gap-2 justify-left">
                    <span>🎁</span> Early adopter rewards
                </div>
                <div className="flex items-center gap-2 justify-left">
                    <span>🔥</span> Special events
                </div>
                <div className="flex items-center gap-2 justify-left">
                    <span>💎</span> Exclusive drops
                </div>
            </div>
            </div>
        </div>
    );
};