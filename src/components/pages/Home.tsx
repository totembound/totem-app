import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useGame } from "../../contexts/GameContext";
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
  Hammer,
  Crown,
  BookOpenText,
  Image as ImageIcon,
  ArrowLeft,
  Castle,
  ScrollText,
} from "lucide-react";
import specialsData from "../data/specials.json";
import { getCurrentMonth } from "../../utils/totems";
import NewsSection from "../NewsSection";

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [wallpaperMode, setWallpaperMode] = useState(false);

  const isLoggedIn = isAuthenticated;

  useEffect(() => {
    if (isLoggedIn && location.state?.from) {
      navigate(location.state.from.pathname);
    }
  }, [isLoggedIn, navigate, location]);

  // body.wallpaper-mode hides global header/nav/footer via index.css. Cleanup
  // ensures the class never leaks if the user navigates away while in mode.
  useEffect(() => {
    document.body.classList.toggle('wallpaper-mode', wallpaperMode);
    return () => document.body.classList.remove('wallpaper-mode');
  }, [wallpaperMode]);

  if (wallpaperMode) {
    return (
      <div className="fixed inset-x-0 top-4 z-40 flex justify-center pointer-events-none px-4">
        <button
          type="button"
          onClick={() => setWallpaperMode(false)}
          className="pointer-events-auto inline-flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    );
  }

  if (isLoggedIn) {
    return <LoggedInHome onShowWallpaper={() => setWallpaperMode(true)} />;
  }
  return <PublicHome onShowWallpaper={() => setWallpaperMode(true)} />;
};

// Component for visitors who aren't logged in
const PublicHome: React.FC<{ onShowWallpaper: () => void }> = ({ onShowWallpaper }) => {
  const currentMonth = new Date().getUTCMonth() + 1;
  const currentMonthlySpecial = specialsData.monthlySpecials.find(
    (special) => special.month === currentMonth
  )!;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 sm:p-4 md:p-6">
      {/* Hero Section — integrated split with featured totem (Option C).
          Wallpaper button overlays the hero (top-right, z-10) so it doesn't
          consume its own row of vertical space. */}
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
            <Info className="mr-2 text-purple-600 dark:text-purple-400" />
            How TotemBound Works
          </h2>
          <button
            type="button"
            onClick={onShowWallpaper}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition-colors"
            title="Hide UI to view the background"
          >
            <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Show Wallpaper</span>
          </button>
        </div>
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
const LoggedInHome: React.FC<{ onShowWallpaper: () => void }> = ({ onShowWallpaper }) => {
  const navigate = useNavigate();
  const { setDailyQuestWizardVisible } = useGame();
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 sm:p-4 md:p-6">
      {/* Top Section */}
      <div className="dark:border-gray-700">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to TotemBound!
          </h1>
          <button
            type="button"
            onClick={onShowWallpaper}
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-md"
            title="Hide UI to view the background"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Show Wallpaper</span>
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Continue your mystical journey with your Totem companions.
        </p>

        {/* Village hero card — flagship hub experience */}
        <Link
          to="/keepers-village"
          className="group relative block w-full mb-6 overflow-hidden rounded-xl shadow-lg ring-1 ring-amber-500/40 hover:ring-amber-400/70 hover:shadow-[0_0_14px_1px_rgba(245,158,11,0.4)] transition-all"
        >
          <img
            src="/village-background.png"
            alt=""
            className="block w-full h-28 sm:h-32 md:h-40 object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
            draggable={false}
          />
          {/* Stronger overlay — keeps the card readable on both light + dark backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-900/45" />
          {/* Warm radial accent on the left so the panorama still shows through on the right */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(217,119,6,0.18),_transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-6 md:px-8">
            <div className="flex items-center gap-3 sm:gap-4 text-white">
              <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/20 ring-1 ring-amber-300/40 flex items-center justify-center backdrop-blur-sm">
                <Castle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />
              </div>
              <div>
                <div className="text-base sm:text-lg md:text-xl font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                  Keeper&rsquo;s Village
                </div>
                <div className="text-xs sm:text-sm text-amber-100/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  Explore your village hub
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-md group-hover:translate-x-0.5 transition-transform">
              Visit
              <span aria-hidden>→</span>
            </span>
          </div>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions — daily / utility */}
          <div className="bg-purple-100 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800/50">
            <h2 className="text-xl font-semibold mb-3 text-purple-800 dark:text-purple-100">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                to="/rewards"
                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
              >
                <Gift className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                Daily Rewards
              </Link>
              <button
                type="button"
                onClick={() => {
                  setDailyQuestWizardVisible(true);
                  navigate('/rewards');
                }}
                className="w-full flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
              >
                <ScrollText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Daily Quests
              </button>
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
                to="/guides"
                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
              >
                <BookOpenText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Guides, Codex &amp; Lore
              </Link>
            </div>
          </div>

          {/* Adventures — progression / challenges */}
          <div className="bg-blue-100 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/50">
            <h2 className="text-xl font-semibold mb-3 text-blue-800 dark:text-blue-100">
              Adventures
            </h2>
            <div className="space-y-2">
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
              <Link
                to="/achievements"
                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
              >
                <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <span>Achievements</span>
              </Link>
              <Link
                to="/forge"
                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
              >
                <Hammer className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span>Totem Forge</span>
              </Link>
              <Link
                to="/sanctum"
                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-100 shadow-sm"
              >
                <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Elder Sanctum</span>
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
