import React, { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
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
  Shield,
  Star,
} from "lucide-react";
import specialsData from "../data/specials.json";
import { getCurrentMonth } from "../../utils/totems";
import NewsSection from "../NewsSection";

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is logged in
  const isLoggedIn = isAuthenticated;

  useEffect(() => {
    // If user is authenticated and was redirected here from a protected route
    if (isLoggedIn && location.state?.from) {
      // Navigate back to their intended destination
      navigate(location.state.from.pathname);
    }
  }, [isLoggedIn, navigate, location]);

  // Show different content based on login status
  if (isLoggedIn) {
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
      {/* Hero Section — integrated split with featured totem (Option C) */}
      <div className="mb-8 relative overflow-hidden rounded-2xl">
        {/* Full background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(168,85,247,0.2),transparent_60%)]" />

        <div className="relative flex flex-col md:flex-row">
          {/* Left side: Game info */}
          <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
              TotemBound
              <span className="block text-lg md:text-xl font-semibold text-purple-300 mt-1">
                Mystical Companions Await
              </span>
            </h1>
            <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
              Discover a world where mystical animal spirits become your
              companions. Train, evolve, and bond with your Totems on a journey
              from Hatchling to Wise Elder.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <Link
                to="/signup"
                className="inline-flex items-center bg-purple-600 hover:bg-purple-500 text-white py-3 px-6 rounded-lg font-bold transition-all hover:scale-105"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Play Free Now
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white py-3 px-6 rounded-lg font-medium transition-all"
              >
                Learn More
              </Link>
            </div>
            <div className="flex text-base md:text-lg gap-0.5">
              <span>🐻</span><span>🐺</span><span>🦫</span><span>🐢</span><span>🦉</span><span className="raven-emoji">🦅</span><span>🦢</span><span>🐍</span><span>🦅</span><span>🦌</span><span>🦦</span><span>🐦</span>
            </div>
          </div>

          {/* Right side: Featured monthly totem — compact */}
          {currentMonthlySpecial && (
            <div className="md:w-1/2 relative flex flex-col items-center justify-center p-4 md:p-6">
              {/* Ambient glow behind totem */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pink-500/15 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-amber-400/10 blur-2xl" />

              {/* Badge */}
              <div className="relative inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full px-2.5 py-0.5 mb-2">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-amber-300 text-[10px] font-bold uppercase tracking-widest">
                  {getCurrentMonth()} Limited Edition
                </span>
              </div>

              {/* Totem image — balanced size */}
              <div className="relative mb-2">
                <img
                  src={currentMonthlySpecial.image}
                  alt={currentMonthlySpecial.name}
                  className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 object-contain drop-shadow-[0_0_25px_rgba(244,114,182,0.35)]"
                />
              </div>

              {/* Name plate */}
              <h3 className="text-lg md:text-xl font-black text-white text-center mb-0.5">
                {currentMonthlySpecial.name}
              </h3>
              <p className="text-xs text-gray-400 text-center mb-2">
                {currentMonthlySpecial.description}
              </p>

              {/* Star rating + collect button */}
              <div className="flex gap-0.5 mb-2">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white py-2 px-5 rounded-lg font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Collect This Totem
              </Link>
            </div>
          )}
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
              1. Sign Up & Collect
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
              Create your free account and adopt your first spirit Totem. Each Totem
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
              <strong>Free to Play:</strong> Create your account and start playing
              instantly with no upfront cost
            </span>
          </li>
          <li className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full mr-3 mt-0.5">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Your Collection:</strong> Your Totems evolve and grow with you,
              building a unique collection over time
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
