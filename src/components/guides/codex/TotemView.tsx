import React from "react";
import CodexSidebar from "./CodexSidebar";
import {
  getAffinityColor,
  getDomainColor,
  getRarityBorderColor,
  getSpeciesBaseStats,
  getSpeciesHabitat,
  getSpeciesMetadata,
  getTotemAffinityIcon,
  getTotemDomainIcon,
} from "../../../utils/totems";
import { TotemCodex } from "../../../config/constants";
import { Brain, Wind, Dumbbell, Info, Lock } from "lucide-react";
import Tooltip from "../../Tooltip";
import { Affinity, Domain, Rarity, Species } from "../../../types/types";
import InteractiveMap from "../InteractiveMap";

export interface TotemViewConfig {
  species: Species;
  variants: TotemCodex[];
}

interface TotemViewProps {
  config: TotemViewConfig;
}

export const TotemView: React.FC<TotemViewProps> = ({ config }) => {
  const metadata = getSpeciesMetadata(config.species);
  const baseStats = getSpeciesBaseStats(config.species, Rarity.Common);
  const domain = Domain[metadata.domain as keyof typeof Domain];
  const affinity = Affinity[metadata.affinity as keyof typeof Affinity];
  const habitat = getSpeciesHabitat(config.species);

  const comingSoon = config.variants.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-400 dark flex items-center h-10">
          <Lock className="w-4 h-4 mr-1" />
          Coming Soon
        </div>
    ) : null;

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {Species[config.species]} Totem
          </h1>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {metadata.title}
          </p>
          <p className="text-gray-600 dark:text-gray-400">{metadata.desc}</p>

          {/* Base Stats */}
          <div className="text-gray-600 dark:text-gray-300 grid grid-cols-1 gap-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                Rarity & Colors
              </h3>
              <div className="flex flex-wrap gap-3">
                {comingSoon}
                {config.variants.map((variant) => {
                  const rarityColors = getRarityBorderColor(variant.rarity);

                  return (
                    <div
                      key={variant.id}
                      className={`w-10 h-10 rounded-lg border ${rarityColors.border}`}
                    >
                      <Tooltip content={`${variant.name} (${Rarity[variant.rarity]})`}>
                        <img
                            className="w-full h-full object-cover"
                            src={variant.image}
                            alt={variant.name}
                        />
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                Domain & Affinity
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-md ${getDomainColor(domain)}`}
                  >
                    {getTotemDomainIcon(Domain[domain])}
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {Domain[domain]}
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-md ${getAffinityColor(affinity)}`}
                  >
                    {getTotemAffinityIcon(Affinity[affinity])}
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {Affinity[affinity]}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                Base Stats
                <div className="ml-1 group relative">
                  <Tooltip content="Base stats determine your Totem's strengths in challenges">
                    <Info size={14} className="text-gray-400" />
                  </Tooltip>
                </div>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30">
                    <Dumbbell
                      size={16}
                      className="text-red-600 dark:text-red-400"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Strength
                    </div>
                    <div className="text-lg font-medium ml-2">
                      {baseStats.strength}
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                    <Wind
                      size={16}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Agility
                    </div>
                    <div className="text-lg font-medium ml-2">
                      {baseStats.agility}
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                    <Brain
                      size={16}
                      className="text-purple-600 dark:text-purple-400"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Wisdom
                    </div>
                    <div className="text-lg font-medium ml-2">
                      {baseStats.wisdom}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Habitat Location</h3>
              <p className="text-gray-400 italic">
                {habitat.name}
              </p>
            </div>

            <InteractiveMap selected={habitat} />

          </div>
        </div>
      </div>
    </div>
  );
};
