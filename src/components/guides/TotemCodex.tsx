import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import CodexSidebar from "./codex/CodexSidebar";
import GuidesHeader from "./GuidesHeader";
import { withVillagePrefix } from "../village/villagePath";

const SectionHeading: React.FC<{ title: string; to: string }> = ({ title, to }) => {
  const location = useLocation();
  return (
    <Link
      to={withVillagePrefix(location.pathname, to)}
      className="group inline-flex items-center gap-1 mt-3 text-gray-800 dark:text-gray-500
        hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      <ChevronRight size={18} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
    </Link>
  );
};

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

          <SectionHeading title="Totems" to="/guides/codex/totems" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Totems are the living spirits, companions born from ancient forces, each with their own Domain, Affinity, and path of growth.
            From Hatchling to Wise Elder, every Totem evolves through care, training, and experience.
            Whether fierce or gentle, each Totem carries a unique presence, and together, they form the heart of every journey.
          </p>

          <SectionHeading title="Traits" to="/guides/codex/traits" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Every Totem carries up to three Traits - small markers of nature, learning, and awakening that make each individual feel distinct from others of the same species and color.
            The first is Innate, granted at birth. The second is Learned, chosen as an Adult, and the third is Awakened, chosen once Ascended.
            Together they shape temperament and subtle advantages, and once chosen, a Totem's path is set - choices are permanent.
          </p>

          <SectionHeading title="Domains" to="/guides/codex/domains" />
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

          <SectionHeading title="Habitats" to="/guides/codex/habitats" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Habitats are sacred spaces where Totems find peace, recovery, and power.
            Each Domain is linked to a specific type of habitat - groves, cliffs, caves, sanctuaries - where aligned Totems thrive.
            In time, assigning Totems to their native Habitats will unlock passive benefits: faster happiness recovery, reduced cooldowns, or bonus rewards from expeditions.
            Habitats are part of the future expansion of the spirit world, deepening your connection to each Totem’s home.
          </p>

          <SectionHeading title="Map" to="/guides/codex/map" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The Explorer's Map spans vast biomes shaped by elemental forces, where every region holds secrets, trials, and sacred grounds.
            While much of the Air, Earth, and Water Domains has been charted, the lands of Fire, Spirit, and Shadow remain largely uncharted - veiled in mystery, danger, and forgotten truths.
            Here, evolution is tied not just to combat, but to place, lore, and elemental resonance.
          </p>

          <SectionHeading title="Challenges" to="/guides/codex/challenges" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Challenges are sacred trials designed to test a Totem’s core strengths - whether that be raw force, quick reflexes, or spiritual wisdom.
            Each challenge draws upon an Affinity and presents a unique interactive trial: cracking enchanted boulders, weaving memory runes, or navigating shifting spirit paths.
            Totems grow stronger through these trials, gaining happiness and experience based on performance.
            Early challenges are simple rites, but greater ones require mastery and synergy.
          </p>

          <SectionHeading title="Expeditions" to="/guides/codex/expeditions" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Expeditions send your bonded Totems on long-form missions across the Totem Lands.
            Guided by a team of three - including a Domain-aligned captain - each expedition explores ruins, gathers relics, negotiates with spirits, or maps forgotten paths.
            Timed and strategic, expeditions reward patience and planning. Upon return, Totems earn experience, and may uncover powerful Runes or rare discoveries.
            As the world expands, new expedition types and regions will reveal even deeper mysteries.
          </p>

          <SectionHeading title="Runes" to="/guides/codex/runes" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Runes are fragments of spiritual energy left behind by trials, rituals, and deep journeys.
            Collected through Expeditions, these Runes come in three tiers: Lesser, Greater, and Ancient.
            While their exact power is still being uncovered, Runes are known to unlock gear crafting, enhance Totem evolution, and bind rare abilities.
            The more powerful the expedition, the rarer the Rune - and the greater the potential it holds.
          </p>

          <SectionHeading title="Gear" to="/guides/codex/gear" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Every Totem can eventually be equipped with sacred items: Amulets, Spirit Bands, and Essence Stones.
            These gear pieces are more than simple boosts - they are spiritual tools, forged from Runic essence and shaped by Domain influence.
            Amulets might increase affinity strength, Spirit Bands offer resilience, and Essence Stones awaken dormant abilities.
            Gear adds a new layer of depth to your Totem’s journey, allowing you to customize their power and purpose.
          </p>

        </div>
      </div>
    </div>
  );
};

export default TotemCodex;
