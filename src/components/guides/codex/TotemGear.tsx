import React from "react";
import CodexSidebar from "./CodexSidebar";
import { getRarityFontColor } from "../../../utils/totems";
import { Rarity } from "../../../types/types";

const TotemGear: React.FC = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Totem Gear
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Every Totem can eventually be equipped with sacred items: Amulets, Spirit Bands, and Essence Stones. 
            These gear pieces are more than simple boosts - they are spiritual tools, forged from Runic essence and shaped by Domain influence. 
            Amulets might increase affinity strength, Spirit Bands offer resilience, and Essence Stones awaken dormant abilities. 
            Gear adds a new layer of depth to your Totem’s journey, allowing you to customize their power and purpose.
          </p>

          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">
            Gear Types
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Each slot can be filled with crafted or discovered gear. Some will be universal, others will be <b>Domain-specific</b> or <b>Affinity-locked</b>.
          </p>
          <table className="w-full text-sm text-left text-gray-300 cursor-default">
            <thead className="uppercase text-xs text-gray-500 dark:text-gray-400 border-b border-zinc-400 dark:border-zinc-600">
              <tr>
                <th className="px-1 py-2 w-32">Type</th>
                <th className="px-1 py-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-zinc-900 dark:text-zinc-200">
              <tr
                className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 font-bold">Amulet</td>
                <td className="px-1 py-2">Carried around the Totem's neck or spirit collar. Channels runes or ancestral energy.</td>
              </tr>
              <tr
                className="bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 font-bold text-nowrap">Spirit Band</td>
                <td className="px-1 py-2">Woven bracelet, wraps around limbs or body, attuned to Domain resonance. Often tied to agility or timing.</td>
              </tr>
              <tr
                className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 font-bold text-nowrap">Essence Stone</td>
                <td className="px-1 py-2">Crystalline node that stores infused Rune energy. May glow, pulse, or change shape with power level.</td>
              </tr>
              <tr
                className="bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 font-bold text-nowrap">Aura Token</td>
                <td className="px-1 py-2">A floating talisman or sigil that follows the Totem in battle or rest, shaped by Affinity. May offer passive buffs or link with other Totems.</td>
              </tr>
              <tr
                className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 font-bold text-nowrap">Totem Carving</td>
                <td className="px-1 py-2">Sacred engraved charm or brand carved into the Totem's spiritual essence (non-visible but lore-deep). Used for permanent bonuses or prestige marks.</td>
              </tr>
              <tr
                className="bg-gray-50 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-800/30
                    transition-colors duration-150"
              >
                <td className="px-1 py-2 font-bold text-nowrap">Spirit Mark</td>
                <td className="px-1 py-2">A runic symbol painted, burned, or woven into the Totem’s fur, feathers, or shell, created via ritual, grants bonus based on Domain affinity.</td>
              </tr>
              </tbody>
            </table>


            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">
              Gear Crafting
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Players will be able to combine Base Runes (from each Domain) to create Totem-aligned gear. Early crafting will begin with simple charms and bands, e.g. using a combination of:
            </p>
            <ul className="text-gray-500 dark:text-gray-500 list-disc list-inside">
              <li>
                3× Base Runes (e.g., Earth + Earth + Water)
              </li>
              <li>
                1× Lesser Rune
              </li>
              <li>
                Totem Domain match for bonus
              </li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Over time, more advanced crafting will allow players to create customized gear with embedded rune logic, affix traits, and even prestige-linked visuals.
            </p>

            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">
              Gear Rarity &amp; Power
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Each gear item will come with a rarity tier, much like Totems themselves, from <b>Common</b> to 
              <span className={`font-medium ${getRarityFontColor(Rarity.Legendary)}`}> Legendary</span>.
              Rarity will be determined by how gear is crafted, discovered, or evolved, with some pieces only obtainable through high-tier Expeditions or Ritual Crafting.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              As rarity increases, gear will gain:
            </p>
            <ul className="text-gray-500 dark:text-gray-500 list-disc list-inside">
              <li>Improved stat bonuses</li>
              <li>Additional Rune infusion slots</li>
              <li>Visual effects, such as glowing engravings or spiritual auras</li>
              <li>Set bonuses when equipped with matching Domain gear</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              <span className={`font-medium ${getRarityFontColor(Rarity.Epic)}`}>Epic </span>
               and above gear may also unlock passive traits like:
            </p>
            <ul className="text-gray-500 dark:text-gray-500 list-disc list-inside">
              <li>Reduced cooldowns</li>
              <li>Bonus Expedition rewards</li>
              <li>Affinity-based crit enhancements</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default TotemGear;
