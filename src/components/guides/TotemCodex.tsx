import React from "react";
import CodexSidebar from "./codex/CodexSidebar";
import GuidesHeader from "./GuidesHeader";

const TotemCodex: React.FC = () => {
  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <GuidesHeader title="Totem Codex"/>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            The Codex records all known Totems. This living record grows as new spirits emerge.
          </p>

          <div className="rounded-lg">
            <img 
              alt="Totem Codex"
              src="/guides/totem-codex-banner.jpg"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-3">Totems</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Totems are the living spirits, companions born from ancient forces, each with their own Domain, Affinity, and path of growth. 
            From Hatchling to Wise Elder, every Totem evolves through care, training, and experience. 
            Whether fierce or gentle, each Totem carries a unique presence, and together, they form the heart of every journey. 
          </p>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-3">Domains</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Every Totem is attuned to one of six elemental Domains: Air, Earth, Water, Fire, Spirit, or Shadow. 
            These Domains shape not only the totem’s nature, but how they interact with the world around them. 
            Air favors agility and perception. 
            Earth embodies strength and stability. 
            Water offers wisdom and memory. 
            Fire channels chaos and passion. 
            Spirit binds life to life, and Shadow weaves secrets into survival. 
            A Totem's Domain determines its role in challenges, expeditions, and beyond.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-3">Habitats</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Habitats are sacred spaces where Totems find peace, recovery, and power. 
            Each Domain is linked to a specific type of habitat - groves, cliffs, caves, sanctuaries - where aligned Totems thrive. 
            In time, assigning Totems to their native Habitats will unlock passive benefits: faster happiness recovery, reduced cooldowns, or bonus rewards from expeditions. 
            Habitats are part of the future expansion of the spirit world, deepening your connection to each Totem’s home.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-3">Gears</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Every Totem can eventually be equipped with sacred items: Amulets, Spirit Bands, and Essence Stones. 
            These gear pieces are more than simple boosts - they are spiritual tools, forged from Runic essence and shaped by Domain influence. 
            Amulets might increase affinity strength, Spirit Bands offer resilience, and Essence Stones awaken dormant abilities. 
            Gear adds a new layer of depth to your Totem’s journey, allowing you to customize their power and purpose.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-3">Challenges</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Challenges are sacred trials designed to test a Totem’s core strengths - whether that be raw force, quick reflexes, or spiritual wisdom. 
            Each challenge draws upon an Affinity and presents a unique interactive trial: cracking enchanted boulders, weaving memory runes, or navigating shifting spirit paths. 
            Totems grow stronger through these trials, gaining happiness and experience based on performance. 
            Early challenges are simple rites, but greater ones require mastery and synergy.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-3">Expeditions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Expeditions send your bonded Totems on long-form missions across the Totem Lands. 
            Guided by a team of three - including a Domain-aligned captain - each expedition explores ruins, gathers relics, negotiates with spirits, or maps forgotten paths. 
            Timed and strategic, expeditions reward patience and planning. Upon return, Totems earn experience, and may uncover powerful Runes or rare discoveries. 
            As the world expands, new expedition types and regions will reveal even deeper mysteries.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-500 mt-3">Runes</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Runes are fragments of spiritual energy left behind by trials, rituals, and deep journeys. 
            Collected through Expeditions, these Runes come in three tiers: Lesser, Greater, and Ancient. 
            While their exact power is still being uncovered, Runes are known to unlock gear crafting, enhance Totem evolution, and bind rare abilities. 
            The more powerful the expedition, the rarer the Rune - and the greater the potential it holds.
          </p>

        </div>
      </div>
    </div>
  );
};

export default TotemCodex;
