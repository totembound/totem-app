import React, { useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { PawPrint, Trophy, Map, Swords, Gift, ShoppingBag } from 'lucide-react';
import { SignupForm } from '../SignupForm';

const Home: React.FC = () => {
    const { isConnected, isSignedUp } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // If user is authenticated and was redirected here from a protected route
        if (isConnected && isSignedUp && location.state?.from) {
            // Navigate back to their intended destination
            navigate(location.state.from.pathname);
        }
    }, [isConnected, isSignedUp, navigate, location]);

    // If not connected or not signed up, show the signup form
    if (!isConnected || !isSignedUp) {
        return <SignupForm />;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg">
            {/* Top Section */}
            <div className="p-2 sm:p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">


                <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                    Welcome to TotemBound!
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                Explore a mystical world of spirit totems, collect, train, and evolve your unique companions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Quick Actions */}
                    <div className="bg-purple-100 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800/50">
                        <h2 className="text-xl font-semibold mb-3 text-purple-800 dark:text-purple-100">
                            Quick Actions
                        </h2>
                        <div className="space-y-2">
                            <Link 
                                to="/totems"  
                                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
                            >
                                <PawPrint className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                View Totems
                            </Link>
                            <Link 
                                to="/shop" 
                                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
                            >
                                <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                Visit Shop
                            </Link>
                            <Link 
                                to="/achievements" 
                                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
                            >
                                <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                                Check Achievements
                            </Link>
                        </div>
                    </div>

                    {/* Game Stats */}
                    <div className="bg-blue-100 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/50">
                        <h2 className="text-xl font-semibold mb-3 text-blue-800 dark:text-blue-100">
                            Your Journey
                        </h2>
                        <div className="space-y-3">
                            <Link 
                                to="/rewards" 
                                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
                            >
                                <Gift className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                <span>Daily Rewards</span>
                            </Link>
                            <Link 
                                to="/challenges" 
                                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
                            >
                                <Swords className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <span>Challenges</span>
                            </Link>
                            <Link 
                                to="/expeditions" 
                                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
                            >
                                <Map className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                <span>Expeditions</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* News & Updates Section */}
            <div className="p-2 sm:p-4 md:p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    📰 Latest Updates
                </h2>
                <div className="space-y-4">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h3 className="font-semibold text-purple-600 dark:text-purple-400">
                            🎉 Welcome to TotemBound Beta!
                        </h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">
                            Explore the world of spiritual companions and start your journey as a Totem Keeper.
                        </p>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h3 className="font-semibold text-purple-600 dark:text-purple-400">
                            🔮 Coming Soon: Enhanced Training
                        </h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">
                            New training mechanics and rewards system in development!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;