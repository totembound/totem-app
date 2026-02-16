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
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CURRENCY_NAMES } from "../../config/constants";

const About: React.FC = () => {

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
        {/* Hero section — species grid showcase */}
        <div className="mb-8 relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(168,85,247,0.15),transparent_70%)]" />

          <div className="relative flex flex-col md:flex-row h-full">
            {/* Left side: About text */}
            <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
                About TotemBound
              </h1>
              <p className="text-purple-300 text-base mb-4">
                Begin Your Spiritual Journey
              </p>
              <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                TotemBound is a mystical game where players adopt, evolve, and care
                for powerful animal spirit companions called Totems. From youngling
                to Wise Elder, each Totem follows a unique growth path driven by
                your choices and rituals.
              </p>
              <div>
                <Link
                  to="/signup"
                  className="inline-flex items-center bg-purple-600 hover:bg-purple-500 text-white py-3 px-6 rounded-lg font-bold transition-all hover:scale-105"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Start Your Adventure
                </Link>
              </div>
            </div>

            {/* Right side: Species grid */}
            <div className="md:w-1/2 relative flex items-center justify-center p-6 md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(168,85,247,0.1),transparent_60%)]" />
              <div className="relative grid grid-cols-4 gap-3 max-w-xs">
                {[
                  { name: 'Bear', img: '/totems/bearplacecard.png' },
                  { name: 'Wolf', img: '/totems/wolfplacecard.png' },
                  { name: 'Owl', img: '/totems/owlplacecard.png' },
                  { name: 'Falcon', img: '/totems/falconplacecard.png' },
                  { name: 'Deer', img: '/totems/deerplacecard.png' },
                  { name: 'Turtle', img: '/totems/turtleplacecard.png' },
                  { name: 'Otter', img: '/totems/otterplacecard.png' },
                  { name: 'Snake', img: '/totems/snakeplacecard.png' },
                  { name: 'Raven', img: '/totems/ravenplacecard.png' },
                  { name: 'Beaver', img: '/totems/beaverplacecard.png' },
                  { name: 'Goose', img: '/totems/gooseplacecard.png' },
                  { name: 'Woodpecker', img: '/totems/woodpeckerplacecard.png' },
                ].map((species) => (
                  <div key={species.name} className="flex flex-col items-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-white/5 border border-white/10 p-1 hover:border-purple-400/50 transition-colors">
                      <img
                        src={species.img}
                        alt={species.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1">{species.name}</span>
                  </div>
                ))}
              </div>
            </div>
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
              TotemBound blends rich lore, meaningful progression, and engaging
              gameplay mechanics. Every action you take, from training to evolution,
              shapes your Totem's destiny. Your companions grow and evolve based on
              the care and attention you give them.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Unlike other games, TotemBound offers a deep, persistent experience
              where your digital companions truly feel like your own. Start playing
              instantly with no barriers to entry.
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
                  Complete achievements, maintain daily streaks, and earn {CURRENCY_NAMES.SOFT}
                  to enhance your gameplay experience and unlock
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-3">
                    <PawPrint className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Totem Growth
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Watch your companions evolve through 5 distinct growth stages,
                  each with new abilities and visual transformations from Newborn to Wise Elder.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-3">
                    <Gift className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Daily Rewards
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Earn {CURRENCY_NAMES.SOFT} currency through daily check-ins, weekly bonuses,
                  and special community events. Use it to train and care for your Totems.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-3">
                    <Flame className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Login Streaks
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Build your daily login streak to unlock progressively better rewards.
                  The longer your streak, the more valuable your daily bonuses become.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-3">
                    <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Achievements
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Complete milestones like evolving your first Totem, winning challenges,
                  and exploring new territories. Earn badges and exclusive rewards.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-3">
                    <Swords className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Challenges
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Test your skills in 10 unique mini-games including Memory Match,
                  Spirit Run, and Crystal Catch. Earn {CURRENCY_NAMES.SOFT} and XP for your Totems.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-3">
                    <Map className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Expeditions
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Send your Totems on adventures through mystical realms like the
                  Enchanted Forest, Crystal Caves, and Spirit Mountains to discover rare treasures.
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
                    className="inline-flex items-center bg-purple-600 hover:bg-purple-500 text-white py-3 px-6 rounded-lg font-bold transition-all hover:scale-105"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
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
                We welcome collaboration across game development, art, and
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
                    Backend API
                  </a>
                  <a
                    href="https://github.com/totembound/totem-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-md text-gray-700 dark:text-gray-300 text-sm transition-colors"
                  >
                    <Github className="h-4 w-4 mr-1" />
                    Frontend App
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
