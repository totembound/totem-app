import React from "react";
import CodexSidebar from "./CodexSidebar";
import { RunesDisplayPouchLarge } from "../../RunesDisplay";
import { useAuth } from "../../../contexts/AuthContext";

const Runes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Runes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Runes are fragments of spiritual energy left behind by trials,
            rituals, and deep journeys. Collected through Expeditions, these
            Runes come in three tiers: Lesser, Greater, and Ancient. While their
            exact power is still being uncovered, Runes are known to unlock gear
            crafting, enhance Totem evolution, and bind rare abilities. The more
            powerful the expedition, the rarer the Rune and the greater the
            potential it holds.
          </p>

          {/* Your Rune Collection - only shown when logged in */}
          {isAuthenticated && (
            <div className="mt-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Your Collection</h2>
              <RunesDisplayPouchLarge showUserCounts={true} />
            </div>
          )}

          {/* Rune Details */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Rune Details</h2>
          <div className="space-y-4">
            {/* Lesser Rune */}
            <div className="bg-gradient-to-r from-blue-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-lg overflow-hidden border border-blue-200 dark:border-slate-600">
              <div className="flex">
                <div className="w-2 bg-blue-500" />
                <div className="p-4 flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <img src="/runes/lesser-rune.png" alt="Lesser Rune" className="w-12 h-12" />
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">Lesser Rune</h3>
                  </div>
                  <p className="text-gray-600 dark:text-slate-300 text-sm">
                    Lesser Runes are common spiritual fragments gathered from any completed expedition. They are stable, modest in energy, and form the foundation of most gear upgrades and basic enhancements. While unassuming, their purity is essential for all greater forms.
                  </p>
                </div>
              </div>
            </div>

            {/* Greater Rune */}
            <div className="bg-gradient-to-r from-amber-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-lg overflow-hidden border border-amber-200 dark:border-slate-600">
              <div className="flex">
                <div className="w-2 bg-amber-500" />
                <div className="p-4 flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <img src="/runes/greater-rune.png" alt="Greater Rune" className="w-12 h-12" />
                    <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400">Greater Rune</h3>
                  </div>
                  <p className="text-gray-600 dark:text-slate-300 text-sm">
                    Greater Runes are rare finds, often uncovered in longer or domain-aligned expeditions. They hold concentrated elemental energy and are essential for crafting advanced gear. When forged with the right resonance, they awaken powerful Totem traits.
                  </p>
                </div>
              </div>
            </div>

            {/* Ancient Rune */}
            <div className="bg-gradient-to-r from-purple-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-lg overflow-hidden border border-purple-200 dark:border-slate-600">
              <div className="flex">
                <div className="w-2 bg-purple-500" />
                <div className="p-4 flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <img src="/runes/ancient-rune.png" alt="Ancient Rune" className="w-12 h-12" />
                    <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400">Ancient Rune</h3>
                  </div>
                  <p className="text-gray-600 dark:text-slate-300 text-sm">
                    Ancient Runes are legendary relics, unstable, potent, and deeply tied to the oldest layers of the spirit world. Found only in the longest and rarest expeditions, they are rumored to hold the power to alter fate, unlock rituals, or bind Totems to deeper forces.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">
            Base Runes
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Minor spiritual tokens aligned with the six Domains. While they are not awarded directly as loot, they are crafted by players during trials of focus and memory.
          </p>
          <ul className="text-gray-500 dark:text-gray-500 list-disc list-inside text-sm">
            <li>Air Rune – Swirl-shaped, light blue</li>
            <li>Earth Rune – Stone-marked sigil with root patterns</li>
            <li>Water Rune – Rippled spiral shaped like a droplet</li>
            <li>Fire Rune – Cracked red glyphs radiating heat</li>
            <li>Spirit Rune – Twinned arc forming a radiant eye</li>
            <li>Shadow Rune – Split ring or veil with dual edges</li>
          </ul>

          <p className="text-gray-600 dark:text-gray-400 mt-2">
          These Base Runes don’t power gear directly — yet. We’re actively exploring how they may be woven into spells, rituals, or future evolution mechanics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Runes;
