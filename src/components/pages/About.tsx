import React from "react";
import {
  Flame,
  Award,
  Swords,
  Map,
  Gift,
  PawPrint,
  Zap,
  Github,
} from "lucide-react";
import specialsData from "../data/specials.json";
import { getCurrentMonth } from "../../utils/totems";
import { Link } from "react-router-dom";

const About: React.FC = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthlySpecial = specialsData.monthlySpecials.find(
    (special) => special.month === currentMonth
  )!;

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            About TotemBound
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto text-center">
            TotemBound is a mystical game where players adopt, evolve, and care
            for powerful animal spirit companions called Totems. From hatchling
            to Wise Elder, each Totem follows a unique growth path driven by
            your choices and rituals.
          </p>
        </div>

        {/* Hero section with featured image */}
        <div className="bg-purple-100 dark:bg-purple-900/20 rounded-xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className={currentMonthlySpecial ? 'md:w-1/2 mb-auto' : 'mb-auto'}> 
              <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-200 mb-3">
                Begin Your Spiritual Journey
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Become a Totem Keeper and forge bonds with mystical animal
                spirits. Train, nurture, and grow your companions through unique
                evolution paths, unlocking powerful abilities along the way.
              </p>
              <div className="text-lg md:text-xl text-center mt-4 mb-2 md:text-left">
                🐻🐺🦫🐢🦉<span className="raven-emoji">🦅</span>🦢🐍🦅🦌🦦🐦
              </div>
            </div>
            {currentMonthlySpecial && 
            <div className="md:w-1/2 flex flex-col md:flex-row justify-center gap-4 h-auto md:h-64">
              <div className="flex-grow">
                <h2 className="font-bold text-xl text-purple-900 dark:text-purple-200">
                  Monthly Totem Series
                </h2>
                <h4 className="font-bold text-lg text-purple-800 dark:text-purple-300 mt-2">
                  {currentMonthlySpecial.name}
                </h4>
                <div className="text-purple-800 dark:text-purple-300">
                  {getCurrentMonth()} Edition
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-base mt-4 leading-relaxed">
                  {currentMonthlySpecial.description}
                </p>
              </div>
              <div className="aspect-square bg-purple-200 dark:bg-purple-800/20 rounded-lg">
                <img
                  src={currentMonthlySpecial.image}
                  alt={currentMonthlySpecial.name}
                  className="w-full h-64 object-contain"
                />
              </div>
            </div>
            }
          </div>
        </div>

        {/* What Makes TotemBound Different */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <Award className="mr-2 text-purple-600 dark:text-purple-400" />
            What Makes TotemBound Different?
          </h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              TotemBound blends rich lore, user ownership, and play-to-own
              mechanics. Every action you take, from training to evolution,
              shapes your Totem's destiny. Your companions are stored on-chain,
              with metadata that updates as they grow.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Unlike traditional games, TotemBound gives you true ownership of
              your digital companions and items. Our unique transaction system
              eliminates the complexity of blockchain interactions, making Web3
              gaming accessible to everyone.
            </p>
          </div>
        </div>

        <div className="space-y-12">
          {/* Core Gameplay Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <PawPrint className="mr-2 text-purple-600 dark:text-purple-400" />
              Core Gameplay
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="text-2xl mr-2">🦉</span> Collect Spiritual
                  Companions
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Discover and collect unique animal spirit Totems, each with
                  distinct personalities, abilities, and evolution paths.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="text-2xl mr-2">⚙️</span> Train and Evolve
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Feed, train, and bond with your Totems as they grow from young
                  spirits to powerful Wise Elders through multiple evolution
                  stages.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="text-2xl mr-2">🏆</span> Achievements &
                  Rewards
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Complete achievements, maintain daily streaks, and earn TOTEM
                  tokens to enhance your gameplay experience and unlock
                  exclusive content.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="text-2xl mr-2">🌍</span> Adventure &
                  Competition
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Embark on expeditions to discover rare resources, face
                  challenges in arena competitions, and prove your skills as a
                  Totem Keeper.
                </p>
              </div>
            </div>
          </div>

          {/* Key Features Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <Zap className="mr-2 text-purple-600 dark:text-purple-400" />
              Key Features
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mb-3">
                  <PawPrint className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  Totem Growth
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Watch your companions evolve through distinct growth stages,
                  each with new abilities and visual transformations.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mb-3">
                  <Gift className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Rewards
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Earn in-game currency and special items through regular play,
                  community events, and special promotions.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mb-3">
                  <Flame className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Daily Streaks
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Maintain your daily login streak to earn progressively
                  valuable rewards and strengthen your bond with your Totems.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mb-3">
                  <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Achievements
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Accomplish milestones in your journey and showcase your
                  dedication with exclusive badges and rewards.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mb-3">
                  <Swords className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Challenges
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Test your strategy and your Totems' power in competitive
                  arenas and time-limited events.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mb-3">
                  <Map className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Expeditions
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Explore mystical realms, each with unique resources and
                  challenges that test your Totems' abilities.
                </p>
              </div>
            </div>
          </div>

          {/* Join Now CTA */}
          <div className="bg-purple-100 dark:bg-purple-900/20 text-gray-800 dark:text-gray-200 rounded-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center md:text-left">
              <div className="md:flex md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Ready to Begin Your Journey?
                  </h2>
                  <p className="text-purple-600 dark:text-purple-400">
                    Join thousands of players in the mystical world of
                    TotemBound today.
                  </p>
                </div>
                <div className="mt-6 md:mt-0">
                  <Link
                    to="/signup"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-purple-700 bg-white hover:bg-purple-50"
                  >
                    Start Your Adventure
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* For Partners & Creators */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <Zap className="mr-2 text-purple-600 dark:text-purple-400" />
              For Partners & Creators
            </h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We welcome collaboration across Web3, game dev, art, and
                community building. TotemBound offers unique merchandising and
                event integration opportunities. Let's build the future of
                spiritual gaming together.
              </p>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/50 text-center">
                <p className="text-purple-700 dark:text-purple-300 font-medium">
                  Contact us at{" "}
                  <a
                    href="mailto:partners@totembound.com"
                    className="underline"
                  >
                    partners@totembound.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Open Source Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <Github className="mr-2 text-purple-600 dark:text-purple-400" />{" "}
              {/* Import Github icon from lucide-react */}
              Open Source
            </h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                TotemBound is proudly open source! We believe in transparency,
                community collaboration, and shared ownership of the platform.
                Our codebase is available on GitHub where you can contribute,
                report issues, or simply explore how we've built the game.
              </p>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/50 text-center">
                <p className="text-purple-700 dark:text-purple-300 font-medium mb-2">
                  Visit our GitHub repositories:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <a
                    href="https://github.com/totembound/totem-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-md text-gray-700 dark:text-gray-300 text-sm transition-colors"
                  >
                    <Github className="h-4 w-4 mr-1" />
                    API
                  </a>
                  <a
                    href="https://github.com/totembound/totem-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-md text-gray-700 dark:text-gray-300 text-sm transition-colors"
                  >
                    <Github className="h-4 w-4 mr-1" />
                    Frontend
                  </a>
                  <a
                    href="https://github.com/totembound/totem-contracts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-md text-gray-700 dark:text-gray-300 text-sm transition-colors"
                  >
                    <Github className="h-4 w-4 mr-1" />
                    Smart Contracts
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
