import React, { useEffect } from "react";
import CodexSidebar from "./CodexSidebar";
import { AVAILABLE_SPECIES } from "../../../config/constants";
import {
  getRarityFontColor,
  getSpeciesBaseStats,
} from "../../../utils/totems";
import { Rarity } from "../../../types/types";
import { Brain, Dumbbell, Wind, Flame, Dna, Shuffle, Tag } from "lucide-react";
import { VillageLink as Link } from "../../village/VillageLink";
import { useUser } from "../../../contexts/UserContext";

const TotemCodex: React.FC = () => {
  const totems = AVAILABLE_SPECIES;
  const { trackLink } = useUser();

  useEffect(() => {
    trackLink("codex_totem_link");
  }, [trackLink]);

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar expanded={true} />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Totems
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Totems are the living spirits, companions born from ancient forces,
            each with their own Domain, Affinity, and path of growth. From
            Hatchling to Wise Elder, every Totem evolves through care, training,
            and experience. Whether fierce or gentle, each Totem carries a
            unique presence, and together, they form the heart of every journey.
          </p>

<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-6">
            Known Totems
          </h2>
          <table className="w-full text-sm text-left text-gray-300 cursor-default">
            <thead className="uppercase text-xs text-gray-500 dark:text-gray-400 border-b border-zinc-400 dark:border-zinc-600">
              <tr>
                <th className="px-1 py-2">Totem</th>
                <th className="px-1 py-2">Domain</th>
                <th className="px-1 py-2">Affinity</th>
                <th className="px-1 py-2">Base Stats</th>
              </tr>
            </thead>
            <tbody>
              {totems.map((totem, index) => {
                const stats = getSpeciesBaseStats(totem.species, Rarity.Common);

                return (
                  <tr
                    key={totem.id}
                    className={`
                    ${
                      index % 2 === 0
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "bg-gray-50 dark:bg-gray-700"
                    }
                    hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150 text-zinc-900 dark:text-zinc-200
                `}
                  >
                    <td className="px-1 py-2 w-40">
                      <Link
                            className="flex flex-row items-center hover:underline"
                            to={`/guides/codex/totems/${totem.name.toLowerCase()}`}
                        >
                        <img
                            src={totem.image}
                            alt={totem.name}
                            className="w-8 h-8 rounded mr-3"
                        />
                        <strong>{totem.name}</strong>
                      </Link>
                    </td>
                    <td className="px-1 py-2 w-32">{totem.domain}</td>
                    <td className="px-1 py-2">{totem.affinity}</td>
                    <td className="px-1 py-2">
                      <div className="flex sm:flex-row flex-col sm:space-x-2 space-y-1 sm:space-y-0 text-sm">
                        <div className="w-12 flex items-center space-x-1">
                          <Dumbbell size={16} className="text-red-500" />
                          <span>{stats.strength}</span>
                        </div>
                        <div className="w-12 flex items-center space-x-1">
                          <Wind size={16} className="text-blue-500" />
                          <span>{stats.agility}</span>
                        </div>
                        <div className="w-12 flex items-center space-x-1">
                          <Brain size={16} className="text-purple-500" />
                          <span>{stats.wisdom}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-6">
            Evolution
          </h2>
          <table className="w-full text-sm text-left text-gray-300 cursor-default">
            <thead className="uppercase text-xs text-gray-500 dark:text-gray-400 border-b border-zinc-400 dark:border-zinc-600">
              <tr>
                <th className="px-1 py-2">Stage</th>
                <th className="px-1 py-2">Name</th>
                <th className="px-1 py-2 text-nowrap">EXP Req.</th>
                <th className="px-1 py-2 text-nowrap">Stat Bonus</th>
                <th className="px-1 py-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-zinc-900 dark:text-zinc-200">
              <tr
                className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 pl-4">1</td>
                <td className="px-1 py-2">Newborn</td>
                <td className="px-1 py-2">0</td>
                <td className="px-1 py-2 text-gray-500">—</td>
                <td className="px-1 py-2">
                  Just born, requires care, feeding, and early bonding.
                </td>
              </tr>
              <tr
                className="bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 pl-4">2</td>
                <td className="px-1 py-2">Youngling</td>
                <td className="px-1 py-2">500</td>
                <td className="px-1 py-2 text-green-600 dark:text-green-400">+1 all stats</td>
                <td className="px-1 py-2">
                  Begins to show personality. Unlocks basic Challenges.
                </td>
              </tr>
              <tr
                className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 pl-4">3</td>
                <td className="px-1 py-2">Juvenile</td>
                <td className="px-1 py-2">1,500</td>
                <td className="px-1 py-2 text-green-600 dark:text-green-400">+2 all stats</td>
                <td className="px-1 py-2">
                  Learns tactics. Can participate in long Expeditions.
                </td>
              </tr>
              <tr
                className="bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 pl-4">4</td>
                <td className="px-1 py-2">Adult</td>
                <td className="px-1 py-2">3,500</td>
                <td className="px-1 py-2 text-green-600 dark:text-green-400">+3 all stats</td>
                <td className="px-1 py-2">
                  Fully developed form. Can equip Gear and evolve aesthetics.
                </td>
              </tr>
              <tr
                className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 pl-4">5</td>
                <td className="px-1 py-2">Elder</td>
                <td className="px-1 py-2">7,500</td>
                <td className="px-1 py-2 text-green-600 dark:text-green-400">+4 all stats</td>
                <td className="px-1 py-2">
                  Spirit-matured Totem. Unlocks passive abilities and prestige
                  traits.
                </td>
              </tr>
              <tr
                className="bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 pl-4">*</td>
                <td className="px-1 py-2">Prestige</td>
                <td className="px-1 py-2">+2,500/ea</td>
                <td className="px-1 py-2 text-gray-500">—</td>
                <td className="px-1 py-2">
                  Starts a new legacy path and Codex recognition.
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            * Each evolution grants +(stage-1) all stats and +10 Happiness. Total from base to Elder: +10 all stats.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-6">
            Rarity
          </h2>
          <table className="w-full text-sm text-left text-gray-300 cursor-default">
            <thead className="uppercase text-xs text-gray-500 dark:text-gray-400 border-b border-zinc-400 dark:border-zinc-600">
              <tr>
                <th className="px-1 py-2">Name</th>
                <th className="px-1 py-2">Chance</th>
                <th className="px-1 py-2">Totem Names</th>
                <th className="px-1 py-2 text-nowrap">Stat Bonus</th>
                <th className="px-1 py-2">Special Traits</th>
              </tr>
            </thead>
            <tbody className="text-zinc-900 dark:text-zinc-200">
              <tr
                className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2">
                  <span
                    className={`font-medium ${getRarityFontColor(
                      Rarity.Common
                    )}`}
                  >
                    Common
                  </span>
                </td>
                <td className="px-1 py-2">75%</td>
                <td className="px-1 py-2">Standard</td>
                <td className="px-1 py-2 text-gray-500">—</td>
                <td className="px-1 py-2">None</td>
              </tr>
              <tr
                className="bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2">
                  <span
                    className={`font-medium ${getRarityFontColor(
                      Rarity.Uncommon
                    )}`}
                  >
                    Uncommon
                  </span>
                </td>
                <td className="px-1 py-2">15%</td>
                <td className="px-1 py-2">Standard</td>
                <td className="px-1 py-2 text-gray-500">—</td>
                <td className="px-1 py-2">Slightly rarer palette</td>
              </tr>
              <tr
                className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2">
                  <span
                    className={`font-medium ${getRarityFontColor(Rarity.Rare)}`}
                  >
                    Rare
                  </span>
                </td>
                <td className="px-1 py-2">7%</td>
                <td className="px-1 py-2">Unique full name</td>
                <td className="px-1 py-2 text-green-600 dark:text-green-400">+1 all stats</td>
                <td className="px-1 py-2">Unique color scheme</td>
              </tr>
              <tr
                className="bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2">
                  <span
                    className={`font-medium ${getRarityFontColor(Rarity.Epic)}`}
                  >
                    Epic
                  </span>
                </td>
                <td className="px-1 py-2">2.5%</td>
                <td className="px-1 py-2">Unique full name</td>
                <td className="px-1 py-2 text-green-600 dark:text-green-400">+2 all stats</td>
                <td className="px-1 py-2">Unique color scheme</td>
              </tr>
              <tr
                className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2">
                  <span
                    className={`font-medium ${getRarityFontColor(
                      Rarity.Legendary
                    )}`}
                  >
                    Legendary
                  </span>
                </td>
                <td className="px-1 py-2">0.5%</td>
                <td className="px-1 py-2">Mythical names</td>
                <td className="px-1 py-2 text-green-600 dark:text-green-400">+4 all stats</td>
                <td className="px-1 py-2">Visual aura, unlockable lore</td>
              </tr>
              <tr
                className="bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2">
                  <span
                    className={`font-medium ${getRarityFontColor(
                      Rarity.Limited
                    )}`}
                  >
                    Limited
                  </span>
                </td>
                <td className="px-1 py-2">*</td>
                <td className="px-1 py-2">Seasonal names</td>
                <td className="px-1 py-2 text-green-600 dark:text-green-400">+2 all stats</td>
                <td className="px-1 py-2">
                  Limited edition colors (season-tied), rarest cosmetics
                </td>
              </tr>
            </tbody>
          </table>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-6 flex items-center gap-2">
            <Tag size={20} className="text-amber-500" />
            Traits
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 mb-3">
            Every totem carries up to three traits — small flavor tags with real
            gameplay effects that make two totems of the same species feel
            meaningfully different. Each slot unlocks at a different stage and
            tunes a different part of how that totem plays.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/30">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Innate</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Random at birth — the nature your totem was born with. Small personal boosts (3–10%).
              </p>
            </div>
            <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Learned</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Your pick at Stage 3 (Adult) — what your totem studied. Stronger, focused rewards (~10%).
              </p>
            </div>
            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Awakened</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Your pick at Stage 5 (Ascended) — endgame identity. Most carry an Aura that buffs the expedition team.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <Link to="/guides/codex/traits" className="text-amber-600 dark:text-amber-400 hover:underline">
              See the full Traits codex →
            </Link>
          </p>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-6 flex items-center gap-2">
            <Flame size={20} className="text-orange-500" />
            Totem Fusion
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 mb-4">
            The Forge allows you to combine 3 totems of the same rarity into 1 new totem of the next rarity tier.
            The sacrificed totems are consumed in the process, and a fresh Stage 1 newborn emerges with a random
            color from the target rarity's palette. Legendary is the highest forgeable rarity — you cannot fuse
            Legendary or Limited totems.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20">
              <div className="flex items-center gap-2 mb-2">
                <Dna size={18} className="text-indigo-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Pure Fusion</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Combine 3 totems of the <strong className="text-gray-800 dark:text-gray-200">same species and rarity</strong>.
                The result is <strong className="text-indigo-600 dark:text-indigo-400">guaranteed to be the same species</strong> at the next rarity tier.
                Rewards players who collect multiples of a favourite species.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 mb-2">
                <Shuffle size={18} className="text-emerald-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Wild Fusion</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Combine 3 totems of the <strong className="text-gray-800 dark:text-gray-200">same rarity, any species</strong>.
                The result is a <strong className="text-emerald-600 dark:text-emerald-400">random species</strong> at the next rarity tier.
                The easier path — mix and match whatever you have.
              </p>
            </div>
          </div>

          <table className="w-full text-sm text-left text-gray-300 cursor-default">
            <thead className="uppercase text-xs text-gray-500 dark:text-gray-400 border-b border-zinc-400 dark:border-zinc-600">
              <tr>
                <th className="px-1 py-2">Fuse 3&times;</th>
                <th className="px-1 py-2">Result</th>
                <th className="px-1 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="text-zinc-900 dark:text-zinc-200">
              <tr className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors duration-150">
                <td className="px-1 py-2"><span className={`font-medium ${getRarityFontColor(Rarity.Common)}`}>Common</span></td>
                <td className="px-1 py-2"><span className={`font-medium ${getRarityFontColor(Rarity.Uncommon)}`}>Uncommon</span></td>
                <td className="px-1 py-2">Easiest fusion — Commons are plentiful</td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors duration-150">
                <td className="px-1 py-2"><span className={`font-medium ${getRarityFontColor(Rarity.Uncommon)}`}>Uncommon</span></td>
                <td className="px-1 py-2"><span className={`font-medium ${getRarityFontColor(Rarity.Rare)}`}>Rare</span></td>
                <td className="px-1 py-2">Requires 9 original totems (3&times;3)</td>
              </tr>
              <tr className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors duration-150">
                <td className="px-1 py-2"><span className={`font-medium ${getRarityFontColor(Rarity.Rare)}`}>Rare</span></td>
                <td className="px-1 py-2"><span className={`font-medium ${getRarityFontColor(Rarity.Epic)}`}>Epic</span></td>
                <td className="px-1 py-2">Requires 27 original totems</td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors duration-150">
                <td className="px-1 py-2"><span className={`font-medium ${getRarityFontColor(Rarity.Epic)}`}>Epic</span></td>
                <td className="px-1 py-2"><span className={`font-medium ${getRarityFontColor(Rarity.Legendary)}`}>Legendary</span></td>
                <td className="px-1 py-2">Requires 81 original totems — the ultimate forge</td>
              </tr>
              <tr className="bg-gray-100 dark:bg-gray-800 transition-colors duration-150">
                <td className="px-1 py-2"><span className={`font-medium ${getRarityFontColor(Rarity.Legendary)}`}>Legendary</span></td>
                <td className="px-1 py-2 text-gray-500">—</td>
                <td className="px-1 py-2 text-gray-500">Cannot be forged (highest tier)</td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700 transition-colors duration-150">
                <td className="px-1 py-2"><span className={`font-medium ${getRarityFontColor(Rarity.Limited)}`}>Limited</span></td>
                <td className="px-1 py-2 text-gray-500">—</td>
                <td className="px-1 py-2 text-gray-500">Special editions are never consumed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TotemCodex;
