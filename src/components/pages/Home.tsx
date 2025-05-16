import React, { useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  UserPlus,
  PawPrint,
  Trophy,
  Map,
  Swords,
  Gift,
  ShoppingBag,
  Info,
  Sparkles,
  Zap,
} from "lucide-react";
import specialsData from "../data/specials.json";
import { getCurrentMonth } from "../../utils/totems";
import NewsSection from "../NewsSection";

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

  // Show different content based on login status
  if (isConnected && isSignedUp) {
    return <LoggedInHome />;
  } else {
    return <PublicHome />;
  }
};

// Component for visitors who aren't logged in
const PublicHome: React.FC = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthlySpecial = specialsData.monthlySpecials.find(
    (special) => special.month === currentMonth
  )!;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 sm:p-4 md:p-6">
      {/* Hero Section */}
      <div className="bg-purple-100 dark:bg-purple-900/20 rounded-xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className={currentMonthlySpecial ? 'md:w-2/3' : ''}>
            <h1 className="text-2xl md:text-3xl font-bold text-purple-900 dark:text-purple-200 mb-3">
              TotemBound - Mystical Companions Await
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Discover a world where mystical animal spirits become your
              companions. Train, evolve, and bond with your Totems on a journey
              from Hatchling to Wise Elder.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center bg-purple-600 text-white hover:bg-purple-700 py-3 px-6 rounded-lg font-medium transition-all"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Begin Your Journey
            </Link>
            <div className="text-lg md:text-xl text-center mt-4 mb-2 md:text-left">
              🐻🐺🦫🐢🦉<span className="raven-emoji">🦅</span>🦢🐍🦅🦌🦦🐦
            </div>
          </div>

          {/* Monthly Totem Feature */}
          {currentMonthlySpecial && 
          <div className="md:w-1/3 bg-white/50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h2 className="font-bold text-lg text-purple-900 dark:text-purple-200">
                  Monthly Totem Series
                </h2>
                <h4 className="font-bold text-purple-800 dark:text-purple-300 mt-1">
                  {currentMonthlySpecial.name}
                </h4>
                <div className="text-sm text-purple-800 dark:text-purple-300">
                  {getCurrentMonth()} Edition
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 line-clamp-3">
                  {currentMonthlySpecial.description}
                </p>
              </div>
              <div className="bg-purple-200 dark:bg-purple-800/20 rounded-lg w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden">
                <img
                  src={currentMonthlySpecial.image}
                  alt={currentMonthlySpecial.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
          }
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <Info className="mr-2 text-purple-600 dark:text-purple-400" />
          How TotemBound Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="mb-3 text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 h-12 w-12 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
              1. Connect & Collect
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
              Connect your wallet and adopt your first spirit Totem. Each Totem
              has unique attributes and personalities.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="mb-3 text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 h-12 w-12 rounded-full flex items-center justify-center mx-auto">
                <PawPrint className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
              2. Train & Nurture
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
              Feed, train, and interact with your Totems daily. Build bonds and
              help them grow through evolution stages.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="mb-3 text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 h-12 w-12 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
              3. Evolve & Compete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
              Complete challenges, join expeditions, explore mystical domains,
              and watch your Totems evolve to their Wise Elder forms with
              powerful abilities.
            </p>
          </div>
        </div>
      </div>

      {/* Features Highlight */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/50">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          Unique Features
        </h2>
        <ul className="space-y-2">
          <li className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full mr-3 mt-0.5">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Gasless Transactions:</strong> Standard and Premium plans
              cover your blockchain fees
            </span>
          </li>
          <li className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full mr-3 mt-0.5">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>True Ownership:</strong> Your Totems evolve on-chain, with
              metadata that grows with them
            </span>
          </li>
          <li className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full mr-3 mt-0.5">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Daily Rewards:</strong> Login streaks, challenges, and
              expeditions with valuable rewards
            </span>
          </li>
        </ul>
      </div>

      {/* News & Updates Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          📰 Latest Updates
        </h2>
        <NewsSection section="home" />
      </div>
    </div>
  );
};

// Component for logged-in users
const LoggedInHome: React.FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 sm:p-4 md:p-6">
      {/* Top Section */}
      <div className="dark:border-gray-700">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Welcome to TotemBound!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Continue your mystical journey with your Totem companions.
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
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          📰 Latest Updates
        </h2>
        <NewsSection section="home" />
      </div>
    </div>
  );
};

export default Home;
