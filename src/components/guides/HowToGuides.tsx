import React, { useState, useEffect } from "react";
import GuidesHeader from "./GuidesHeader";
import { ChevronDown, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { VillageLink as Link } from "../village/VillageLink";
import { CURRENCY_NAMES } from '../../config/constants';

interface Guide {
  title: string;
  searchableText: string;
  content: JSX.Element;
}

const howToGuides: Guide[] = [
  {
    title: "How to Create Your Account",
    searchableText: 'signup create account email password register login sign up',
    content: (
      <div>
        <p>To get started, create your TotemBound account:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Go to the <Link to="/signup" className="text-purple-500 underline font-medium">Sign Up</Link> page.</li>
          <li>Enter your email address and choose a password.</li>
          <li>Pick a display name for your Spiritkeeper profile.</li>
          <li>Once registered, you'll receive a starter Totem and {CURRENCY_NAMES.SOFT} to begin your journey!</li>
        </ol>
      </div>
    )
  },
  {
    title: "How to Explore the Keeper's Village",
    searchableText: "keepers village spirit village hub buildings tap navigate map home explore",
    content: (
      <div>
        <p>The Keeper's Village is your living hub — every game area is a tappable building on the map:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Open the <Link to="/keepers-village" className="text-purple-500 underline font-medium">Keeper's Village</Link> from the top nav.</li>
          <li>Tap a building to enter that area (Rewards, Shop, Challenges, Expeditions, and more).</li>
          <li>Watch for <strong>notification badges</strong> on buildings — they signal unclaimed rewards or available actions.</li>
          <li>Some buildings unlock progressively as you grow your collection and complete milestones.</li>
        </ol>
      </div>
    )
  },
  {
    title: "How to Claim Daily Rewards",
    searchableText: "daily reward claim free token gift check-in spiritkeeper totem",
    content: (
      <div>
        <p>Daily rewards are gifted to active Spiritkeepers. Here's how to claim yours:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Go to the <Link to="/rewards" className="text-purple-500 underline font-medium">Rewards</Link> page.</li>
          <li>Click the <strong>"Claim Daily"</strong> button.</li>
          <li>Your {CURRENCY_NAMES.SOFT} will be added to your account instantly.</li>
          <li>Build your streak by claiming daily - bonuses increase with consistency!</li>
        </ol>
      </div>
    )
  },
  {
    title: "How to Complete Daily Quests",
    searchableText: "daily quests rotating objectives essence rune bonus theme slots claim wizard",
    content: (
      <div>
        <p>Daily Quests give you five themed objectives that refresh every day:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Open the <Link to="/rewards" className="text-purple-500 underline font-medium">Rewards</Link> page or tap the floating Daily Quests wizard.</li>
          <li>Each quest tracks progress automatically as you play — feed, train, challenge, or send expeditions.</li>
          <li>Click <strong>"Claim Rewards"</strong> on any completed slot to collect {CURRENCY_NAMES.SOFT}.</li>
          <li>Finish all five for a bonus reward: extra {CURRENCY_NAMES.SOFT} plus a random Rune.</li>
        </ol>
      </div>
    )
  },
  {
    title: "How to Get More Totems",
    searchableText: 'purchase buy shop totem species tokens navigate browse select collection',
    content: (
      <div>
        <p>Expand your collection with new Totems:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Go to the <Link to="/shop" className="text-purple-500 underline font-medium">Shop</Link> page.</li>
          <li>Browse available Totems and select one you'd like.</li>
          <li>Click <strong>"Buy Totem"</strong> to add it to your collection.</li>
          <li>Your new Totem will appear on your <Link to="/totems" className="text-purple-500 underline font-medium">Totems</Link> page.</li>
        </ol>
      </div>
    )
  },
  {
    title: "How to Feed and Train Your Totem",
    searchableText: "feed train totem raise happiness care",
    content: (
      <div>
      <p>Your Totem requires care to grow strong and remain happy. Here’s how to feed and train it:</p>
      <ol className="list-decimal list-inside mt-2 space-y-1">
        <li>Go to the <Link to="/totems" className="text-purple-500 underline font-medium">Totems</Link> page.</li>
        <li>Select the Totem you want to care for to open its <strong>profile</strong>.</li>
        <li>Use the <strong>Feed</strong> button to raise Happiness and restore energy.</li>
        <li>Use the <strong>Train</strong> option to increase experience.</li>
      </ol>
    </div>
    )
  },
  {
    title: "How to Complete a Challenge",
    searchableText: "challenge starter rite test pounce trial",
    content: (
      <div>
        <p>Start with a Stage 1 challenge from the <strong>Rites</strong> category:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Visit the <Link to="/challenges" className="text-purple-500 underline font-medium">Challenges</Link> page.</li>
          <li>Select a Rite like <em>"First Pounce, First Path."</em></li>
          <li>Choose your totem and begin the challenge.</li>
        </ol>
      </div>
    )
  },
  {
    title: "How to Evolve Your Totem",
    searchableText: "evolve totem level up stage 2 grow",
    content: (
      <div>
        <p>When your Totem reaches Level 2 exp, evolution becomes available:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Go to the <Link to="/totems" className="text-purple-500 underline font-medium">Totems</Link> page.</li>
          <li>Select the Totem you want to evolve to open its <strong>profile</strong>.</li>
          <li>Train and feed your Totem to gain EXP.</li>
          <li>Once Level 2, click <strong>“Evolve”</strong> on the Totem page.</li>
          <li>Confirm evolution and witness your Totem’s next form.</li>
        </ul>
      </div>
    )
  },
  {
    title: "How to Join an Expedition",
    searchableText: "expedition join send totem rewards mission rune experience duration",
    content: (
      <div>
        <p>Send your totems on expeditions to earn EXP, runes, and other valuable items:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Go to the <Link to="/expeditions" className="text-purple-500 underline font-medium">Expeditions</Link> page.</li>
          <li>Select a mission that fits your totem's stats and available time window.</li>
          <li>Choose up to 3 totems, including 1 captain, to form your expedition team.</li>
          <li>Click <strong>"Start Expedition"</strong> to begin the journey.</li>
          <li>Return later to collect rewards once the expedition is complete.</li>
        </ol>
      </div>
    )
  },
  {
    title: "How to Fuse Totems at the Forge",
    searchableText: "forge fuse fusion totem rarity upgrade pure wild combine three same species mixed",
    content: (
      <div>
        <p>The Forge lets you fuse three totems into a single, higher-rarity totem:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Visit the <Link to="/forge" className="text-purple-500 underline font-medium">Totem Forge</Link>.</li>
          <li>Choose <strong>Pure Fusion</strong> (3 totems of the same species) or <strong>Wild Fusion</strong> (mixed species).</li>
          <li>Select three totems of the same rarity from your collection.</li>
          <li>Confirm the fusion to mint a new totem one rarity tier higher — the source totems are consumed.</li>
          <li>Forge achievements unlock as you complete more fusions.</li>
        </ol>
      </div>
    )
  },
  {
    title: "How to Seat Elders in the Sanctum",
    searchableText: "elder sanctum council seat stage 4 adult passive essence missions tenure claim bonus",
    content: (
      <div>
        <p>The Elder Sanctum turns your most powerful totems into a passive {CURRENCY_NAMES.SOFT} engine:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Open the <Link to="/sanctum" className="text-purple-500 underline font-medium">Elder Sanctum</Link>.</li>
          <li>Seat any Stage 4 (Adult) or higher totem in one of the three Council Seats.</li>
          <li>Each seated Elder earns {CURRENCY_NAMES.SOFT} every hour, with tenure bonuses up to 1.5x.</li>
          <li>Click <strong>"Claim"</strong> to collect accumulated earnings whenever you visit.</li>
          <li>Send Elders on exclusive <strong>Council Missions</strong> for rune drops and rare rewards.</li>
        </ol>
      </div>
    )
  },
  {
    title: "How to Track Your Progress and Achievements",
    searchableText: "track progress achievements level totem tutorial challenges completed profile dashboard spiritkeeper journey",
    content: (
      <div>
        <p>Stay connected to your Spiritkeeper journey with built-in tracking tools:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Visit the <Link to="/achievements" className="text-purple-500 underline font-medium">Achievements</Link> page to view earned milestones, badges, and progress.</li>
          <li>Track your current level, evolution stage, and challenge completions there.</li>
          <li>You can also open your <strong>Totems</strong> profile to view totem growth and expedition history.</li>
          <li>The <Link to="/guides/tutorial" className="text-purple-500 underline font-medium">Spiritkeeper's Path</Link> highlights tutorial progress and what's next on your journey.</li>
        </ol>
      </div>
    )
  },
  {
    title: "How to Manage Notifications",
    searchableText: "notifications alerts bell read delete filter game messages spiritkeeper",
    content: (
      <div>
        <p>Stay informed about important events, rewards, and activity in TotemBound by managing your notifications:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Click the <strong>bell icon</strong> at the top-right of the screen.</li>
          <li>Browse your latest messages including rewards, challenge results, and system updates.</li>
          <li>Use the <strong>filter</strong> dropdown to view specific types of notifications.</li>
          <li>Click <strong>Mark as Read</strong> to clear attention from viewed messages.</li>
          <li>Use <strong>Delete</strong> to remove individual items you no longer need.</li>
        </ol>
      </div>
    )
  },
  {
    title: "How to Join the TotemBound Community on Discord",
    searchableText: "join discord totemBound community social support announcements roles events chat spiritkeeper connect",
    content: (
      <div>
        <p>Connect with fellow Spiritkeepers, share strategies, and get live updates:</p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Visit the <a href="https://discord.gg/MhKQC5E6xe" target="_blank" rel="noopener noreferrer" className="text-purple-500 underline font-medium">official TotemBound Discord</a>.</li>
          <li>Verify your account if prompted, then browse channels like <strong>#welcome</strong>, <strong>#roles</strong>, and <strong>#general</strong>.</li>
          <li>Pick your roles in <strong>#roles</strong> to unlock relevant channels (domains, IRL, fan art, and more).</li>
          <li>Stay tuned for announcements, exclusive events, and Spiritkeeper Q&A!</li>
        </ol>
      </div>
    )
  },
];

const HowToGuides: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Handle incoming state from tutorial links
  useEffect(() => {
    if (location.state?.openSection !== undefined) {
      const sectionToOpen = location.state.openSection;
      setOpenIndex(sectionToOpen);
      
      // Clear the state so back/forward navigation works normally
      navigate(location.pathname, { replace: true, state: {} });
      
      // Scroll to the opened section for better UX
      setTimeout(() => {
        const element = document.querySelector(`[data-section="${sectionToOpen}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [location.state, navigate, location.pathname]);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredGuides = howToGuides.filter(guide => {
    if (!searchQuery) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    const matchesSearch = guide.title.toLowerCase().includes(query) ||
                          guide.searchableText.toLowerCase().includes(query);
    return matchesSearch;
  });

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
        <GuidesHeader title="How-To Guides"/>
        <p className="text-gray-600 dark:text-gray-400">
            Learn how to care for your Totem, master challenges, and explore the world of TotemBound.
        </p>
      </div>
      <div className="space-y-4">
        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
        {filteredGuides.map((guide, idx) => (
          <div 
            key={idx} 
            data-section={idx} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggle(idx)}
              className={`w-full text-left p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-color ${openIndex === idx ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            >
              <span className="font-semibold text-gray-900 dark:text-white">{guide.title}</span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${openIndex === idx ? 'rotate-180' : ''}`} />
            </button>
            {openIndex === idx && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 z-0">
                      <img
                        src="/guides/how-to-banner.jpg"
                        alt=""
                        className="w-full h-full object-cover opacity-10 dark:opacity-15"
                      />
                    </div>
                    <div className="relative z-10 p-6 text-sm text-gray-600 dark:text-gray-400">
                      {guide.content}
                    </div>
                  </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowToGuides;
