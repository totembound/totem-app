/**
 * Roadmap Page
 *
 * Gaming-style development roadmap with quarterly milestones.
 * Q1 shows completed v1 features with checkmarks.
 * Q2-Q4 show planned features with status indicators.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Check, Circle, Clock, Swords, Map,
  Zap, Crown, Star,
  Target, ArrowRight
} from 'lucide-react';

type ItemStatus = 'done' | 'in-progress' | 'planned';
type QuarterStatus = 'complete' | 'current' | 'upcoming';

interface RoadmapItem {
  label: string;
  status: ItemStatus;
  detail?: string;
}

interface Quarter {
  id: string;
  title: string;
  subtitle: string;
  status: QuarterStatus;
  color: string;
  glowColor: string;
  borderColor: string;
  bgColor: string;
  iconBg: string;
  icon: React.ReactNode;
  items: RoadmapItem[];
}

const StatusIcon: React.FC<{ status: ItemStatus }> = ({ status }) => {
  if (status === 'done') {
    return <Check className="h-4 w-4 text-green-400 flex-shrink-0" />;
  }
  if (status === 'in-progress') {
    return <Clock className="h-4 w-4 text-amber-400 flex-shrink-0 animate-pulse" />;
  }
  return <Circle className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />;
};

const StatusBadge: React.FC<{ status: QuarterStatus }> = ({ status }) => {
  if (status === 'complete') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
        Complete
      </span>
    );
  }
  if (status === 'current') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
        In Progress
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">
      Upcoming
    </span>
  );
};

const quarters: Quarter[] = [
  {
    id: 'q2',
    title: 'Q2 2026',
    subtitle: 'Foundation — v1.0 Launch',
    status: 'current',
    color: 'text-green-400',
    glowColor: 'shadow-green-500/20',
    borderColor: 'border-green-500/40',
    bgColor: 'bg-green-500/5',
    iconBg: 'bg-green-500/20',
    icon: <Zap className="h-6 w-6 text-green-400" />,
    items: [
      { label: '12 totem species across Earth, Water & Air domains, each with 16 color variants', status: 'done' },
      { label: 'Core gameplay — Feed, Train, Treat & 5-stage Evolution', status: 'done', detail: 'Daily care actions with cooldowns, XP, happiness, and stage thresholds' },
      { label: '6 rarity tiers — Common, Uncommon, Rare, Epic, Legendary & Limited', status: 'done' },
      { label: 'Totem Shop — buy, sell & marketplace listings', status: 'done' },
      { label: '10 challenge mini-games across Strength, Agility & Wisdom', status: 'done', detail: 'Skill-based mini-games with daily attempts that earn XP and happiness' },
      { label: '15 expeditions across 3 domains', status: 'done', detail: 'Send 3-totem teams on timed missions for Essence, XP, and rune drops' },
      { label: 'Daily & weekly rewards with streak bonuses', status: 'done', detail: 'Escalating streak multipliers with purchasable streak protection' },
      { label: '25+ achievements with progression milestones', status: 'done' },
      { label: 'Gem Store, Essence Exchange & collector bundles', status: 'done' },
      { label: 'Subscription tiers, loot boxes & prestige system', status: 'done' },
      { label: 'Interactive codex, guides & lore', status: 'done' },
      { label: 'Limited Edition monthly totems — 1 unique species each month', status: 'done' },
      { label: '6-step guided tutorial with sub-tasks, reward claims & completion celebration', status: 'done' },
      { label: 'Elder Sanctum — seat stage 4+ totems for daily passive Essence & solo advisory missions', status: 'in-progress', detail: 'Passive daily rewards, solo advisory expeditions, and sealed loot crates for the upcoming Gear system' },
      { label: 'Unlock remaining 4 totems (Turtle, Bear, Raven, Snake)', status: 'in-progress' },
    ],
  },
  {
    id: 'q3',
    title: 'Q3 2026',
    subtitle: 'Arena & Equipment',
    status: 'upcoming',
    color: 'text-purple-400',
    glowColor: 'shadow-purple-500/20',
    borderColor: 'border-purple-500/40',
    bgColor: 'bg-purple-500/5',
    iconBg: 'bg-purple-500/20',
    icon: <Swords className="h-6 w-6 text-purple-400" />,
    items: [
      { label: 'Arena Battles — PvE combat vs. domain guardians', status: 'planned', detail: 'Battle domain guardians in strategic turn-based combat' },
      { label: 'Arena rankings & battle log', status: 'planned' },
      { label: 'Gear system — equippable weapons, armor & accessories', status: 'planned', detail: 'Boost totem stats with craftable and droppable gear. Open sealed loot crates from Elder Sanctum!' },
      { label: 'Rune crafting & socketing', status: 'planned', detail: 'Combine collected runes into powerful enchantments' },
      { label: 'New expeditions for gear & rune material drops', status: 'planned' },
      { label: 'Gear-specific achievements & milestones', status: 'planned' },
      { label: 'Enhanced totem detail pages with gear loadout', status: 'planned' },
      { label: 'Seasonal events framework', status: 'planned' },
    ],
  },
  {
    id: 'q4',
    title: 'Q4 2026',
    subtitle: 'New Domains & Habitats',
    status: 'upcoming',
    color: 'text-orange-400',
    glowColor: 'shadow-orange-500/20',
    borderColor: 'border-orange-500/40',
    bgColor: 'bg-orange-500/5',
    iconBg: 'bg-orange-500/20',
    icon: <Map className="h-6 w-6 text-orange-400" />,
    items: [
      { label: '12 new totems from Fire, Spirit & Shadow domains', status: 'planned', detail: 'Fully balanced with unique stats, affinities & evolution art' },
      { label: 'Habitat system — customizable totem homes', status: 'planned', detail: 'Build and upgrade environments that provide passive bonuses' },
      { label: 'Player Exchange — auction house & buy-now marketplace', status: 'planned', detail: 'Trade prized totems at fair market prices vs. shop discount' },
      { label: 'Domain-specific challenge arenas', status: 'planned', detail: 'New mini-games themed around each domain element' },
      { label: 'Cross-domain expedition routes', status: 'planned', detail: 'Longer expeditions spanning multiple domains for greater rewards' },
      { label: 'Domain mastery progression system', status: 'planned' },
      { label: 'Habitat decoration achievements', status: 'planned' },
      { label: 'Expanded rune types from new domains', status: 'planned' },
      { label: 'New achievements for domain exploration', status: 'planned' },
    ],
  },
  {
    id: 'q1-27',
    title: 'Q1 2027',
    subtitle: 'Community & Competition',
    status: 'upcoming',
    color: 'text-amber-400',
    glowColor: 'shadow-amber-500/20',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/5',
    iconBg: 'bg-amber-500/20',
    icon: <Crown className="h-6 w-6 text-amber-400" />,
    items: [
      { label: 'PvP Arena — real-time player vs. player battles', status: 'planned', detail: 'Challenge other keepers with your strongest totems' },
      { label: 'Guilds & Clans — form alliances with other keepers', status: 'planned', detail: 'Shared guild habitats, pooled resources & group raids' },
      { label: 'Global leaderboards & seasonal rankings', status: 'planned' },
      { label: 'Seasonal tournaments with exclusive rewards', status: 'planned' },
      { label: 'Guild vs. Guild arena wars', status: 'planned' },
      { label: 'Social features — profiles, friends list, gifting', status: 'planned' },
      { label: 'Advanced prestige paths per domain', status: 'planned' },
      { label: 'Limited-edition seasonal event totems', status: 'planned' },
    ],
  },
];

const Roadmap: React.FC = () => {
  const doneCount = quarters[0].items.filter(i => i.status === 'done').length;
  const totalQ1 = quarters[0].items.length;
  const progressPercent = Math.round((doneCount / totalQ1) * 100);

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Development Roadmap
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Follow our journey as TotemBound grows from launch to a thriving world
            of mystical companions, epic battles, and community competition.
          </p>
        </div>

        {/* Overall Progress */}
        <div className="mb-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span className="font-semibold text-gray-900 dark:text-white">Q2 Launch Progress</span>
            </div>
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
              {doneCount} / {totalQ1} milestones
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-400" /> Done</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-400" /> In Progress</span>
              <span className="flex items-center gap-1"><Circle className="h-3 w-3 text-gray-500" /> Planned</span>
            </div>
            <span className="text-xs font-semibold text-green-500">{progressPercent}%</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 sm:left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-purple-500 to-amber-500 opacity-30" />

          <div className="space-y-8">
            {quarters.map((q, _qIndex) => (
              <div key={q.id} className="relative">
                {/* Timeline node */}
                <div className={`absolute left-2.5 sm:left-4.5 top-6 w-5 h-5 sm:w-5 sm:h-5 rounded-full ${q.iconBg} border-2 ${q.borderColor} z-10 flex items-center justify-center`}>
                  <div className={`w-2 h-2 rounded-full ${
                    q.status === 'complete' ? 'bg-green-400' :
                    q.status === 'current' ? 'bg-amber-400 animate-pulse' :
                    'bg-gray-500'
                  }`} />
                </div>

                {/* Quarter card */}
                <div className={`ml-12 sm:ml-16 ${q.bgColor} border ${q.borderColor} rounded-xl overflow-hidden shadow-lg ${q.glowColor}`}>
                  {/* Quarter header */}
                  <div className="px-5 py-4 border-b border-gray-200/10 dark:border-gray-700/50">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${q.iconBg}`}>
                          {q.icon}
                        </div>
                        <div>
                          <h2 className={`text-lg sm:text-xl font-bold ${q.color}`}>{q.title}</h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{q.subtitle}</p>
                        </div>
                      </div>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-5 py-4">
                    <ul className="space-y-2.5">
                      {q.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            <StatusIcon status={item.status} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm ${
                              item.status === 'done'
                                ? 'text-gray-500 dark:text-gray-400 line-through decoration-green-500/50'
                                : item.status === 'in-progress'
                                ? 'text-gray-800 dark:text-gray-200 font-medium'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {item.label}
                            </span>
                            {item.detail && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{item.detail}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Beyond 2026 teaser */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <Star className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              And beyond — world events, cross-realm raids, mobile app, and more...
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
          <div className="px-6 py-8 text-center md:text-left">
            <div className="md:flex md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Ready to Begin?
                </h2>
                <p className="text-purple-600 dark:text-purple-400">
                  Start your journey today and grow with TotemBound as we build together.
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-3 justify-center md:justify-end">
                <Link
                  to="/signup"
                  className="inline-flex items-center px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center px-5 py-2.5 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
