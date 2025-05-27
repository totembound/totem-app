import React from "react";
import CodexSidebar from "./CodexSidebar";

const Runes: React.FC = () => {
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

          <div className="space-y-6 mt-6">
            {/* Lesser Rune */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <img
                    src="/runes/lesser-rune.png"
                    alt="Lesser Rune"
                    className={`w-full h-full object-contain`}/>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lesser Rune</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Lesser Runes are common spiritual fragments gathered from any completed expedition. They are stable, modest in energy, and form the foundation of most gear upgrades and basic enhancements. While unassuming, their purity is essential for all greater forms.
              </p>
            </div>

            {/* Greater Rune */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-orange-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <img
                    src="/runes/greater-rune.png"
                    alt="Greater Rune"
                    className={`w-full h-full object-contain`}/>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Greater Rune</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Greater Runes are rare finds, often uncovered in longer or domain-aligned expeditions. They hold concentrated elemental energy and are essential for crafting advanced gear. When forged with the right resonance, they awaken powerful Totem traits.
              </p>
            </div>

            {/* Ancient Rune */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <img
                    src="/runes/ancient-rune.png"
                    alt="Ancient Rune"
                    className={`w-full h-full object-contain`}/>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ancient Rune</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Ancient Runes are legendary relics, unstable, potent, and deeply tied to the oldest layers of the spirit world. Found only in the longest and rarest expeditions, they are rumored to hold the power to alter fate, unlock rituals, or bind Totems to deeper forces.
              </p>
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
