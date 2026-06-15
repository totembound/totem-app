import React from "react";
import { Clock, Sparkles, Heart, Star } from "lucide-react";
import CodexSidebar from "./CodexSidebar";
import { getDomainColor, getTotemDomainIcon } from "../../../utils/totems";
import { Domain } from "../../../types/types";
import { STAGES } from "../../../config/game-config";
import expeditionData from "../../data/expeditions.json";

type Expedition = (typeof expeditionData)[number];

const RUNE_TIERS = [
  { name: "Lesser", img: "/runes/lesser-rune.png" },
  { name: "Greater", img: "/runes/greater-rune.png" },
  { name: "Ancient", img: "/runes/ancient-rune.png" },
];

const formatDuration = (hours: number) => (hours < 1 ? `${Math.round(hours * 60)} min` : `${hours}h`);

const stageName = (stage: number) => STAGES.find((s) => s.stage === stage)?.name ?? `Stage ${stage + 1}`;

const ExpeditionCard: React.FC<{ data: Expedition }> = ({ data }) => {
  const drops = data.runeDropChances
    .map((chance, i) => ({ ...RUNE_TIERS[i], chance }))
    .filter((d) => d.chance > 0);

  return (
    <div className="group rounded-2xl overflow-hidden border border-amber-200/70 dark:border-gray-700
      bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900
      shadow-md hover:shadow-xl transition-all duration-200 flex flex-col">
      <div className="relative h-32 overflow-hidden">
        <img
          src={data.image}
          alt={data.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${getDomainColor(data.domain as Domain)}`}>
            {getTotemDomainIcon(data.domainName)}
            <span>{data.domainName}</span>
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-black/55 text-white">
            <Clock size={13} /> {formatDuration(data.durationHours)}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-serif text-lg font-bold text-white text-shadow-lg leading-tight">
            {data.name}
          </h3>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug flex-1">
          {data.description}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-900/5 dark:bg-white/10 text-gray-800 dark:text-gray-100">
            {stageName(data.minStage)}+
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300">
            <Sparkles size={12} /> {data.primaryAffinity}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200/70 dark:border-gray-700 pt-2.5">
          <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400" title="Essence reward">
            <Sparkles size={13} /> +{data.baseEssence}
          </span>
          <span className="inline-flex items-center gap-1" title="Happiness cost">
            <Heart size={13} /> -{data.happinessCost}
          </span>
          <span className="inline-flex items-center gap-1" title="Base experience">
            <Star size={13} /> {data.baseExperience} XP
          </span>
        </div>

        {drops.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Runes</span>
            {drops.map((d) => (
              <span key={d.name} className="inline-flex items-center gap-1" title={`${d.name} Rune`}>
                <img src={d.img} alt={d.name} className="w-4 h-4" />
                {d.chance}%
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Expeditions: React.FC = () => {
  // Group by duration tier so each row reads as a set of domain-aligned options.
  const tiers = Array.from(new Set(expeditionData.map((e) => e.durationHours))).sort((a, b) => a - b);

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Expeditions
          </h1>
          <p className="italic text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mt-2 mb-6">
            &ldquo;The longest journeys return the rarest gifts.&rdquo;
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Expeditions send your bonded Totems on long-form missions across the Totem Lands. Each
            journey costs Essence and a little happiness, and rewards experience on return — with a
            chance to uncover Lesser, Greater, and Ancient Runes. Longer expeditions carry richer
            rewards, but tie up your Totem until they return. A Totem whose Affinity matches the
            expedition&rsquo;s focus performs best.
          </p>

          {tiers.map((hours) => {
            const group = expeditionData.filter((e) => e.durationHours === hours);
            return (
              <section key={hours} className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={18} className="text-purple-500" />
                  <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatDuration(hours)} Expeditions
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.map((e) => (
                    <ExpeditionCard key={e.id} data={e} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Expeditions;
