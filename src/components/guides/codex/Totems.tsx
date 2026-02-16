import React from "react";
import CodexSidebar from "./CodexSidebar";
import { AVAILABLE_SPECIES } from "../../../config/constants";
import {
  getRarityFontColor,
  getSpeciesBaseStats,
} from "../../../utils/totems";
import { Rarity } from "../../../types/types";
import { Brain, Dumbbell, Wind } from "lucide-react";
import { Link } from "react-router-dom";

const TotemCodex: React.FC = () => {
  const totems = AVAILABLE_SPECIES;

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

        </div>
      </div>
    </div>
  );
};

export default TotemCodex;
