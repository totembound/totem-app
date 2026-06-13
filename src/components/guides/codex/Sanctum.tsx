import React from "react";
import { Clock, Heart, Star, Crown, Shield, Scroll, Gem, TrendingUp, Armchair } from "lucide-react";
import CodexSidebar from "./CodexSidebar";
import { COUNCIL_MISSIONS, SANCTUM_CONFIG, type CouncilMissionDef } from "../../../config/sanctum";
import { STAGES } from "../../../config/game-config";

const RUNE_TIERS: Record<string, { name: string; img: string }> = {
  lesser: { name: "Lesser", img: "/runes/lesser-rune.png" },
  greater: { name: "Greater", img: "/runes/greater-rune.png" },
  ancient: { name: "Ancient", img: "/runes/ancient-rune.png" },
};

type MissionTier = CouncilMissionDef["tier"];

const TIER_META: Record<MissionTier, {
  label: string;
  icon: React.ReactNode;
  badge: string;
  card: string;
  blurb: string;
}> = {
  governance: {
    label: "Governance",
    icon: <Shield size={18} className="text-blue-500" />,
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    card: "border-blue-200/70 dark:border-blue-900/50 from-blue-50 to-white dark:from-gray-800 dark:to-gray-900",
    blurb: "Short local duties for any seated Elder — guidance, surveys, and audience. They return Lesser Runes.",
  },
  diplomacy: {
    label: "Diplomacy",
    icon: <Scroll size={18} className="text-purple-500" />,
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    card: "border-purple-200/70 dark:border-purple-900/50 from-purple-50 to-white dark:from-gray-800 dark:to-gray-900",
    blurb: "Longer, higher-stakes envoy work for Ascended Elders. A strong chance at Greater Runes.",
  },
  legacy: {
    label: "Legacy",
    icon: <Crown size={18} className="text-amber-500" />,
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    card: "border-amber-200/70 dark:border-amber-900/50 from-amber-50 to-white dark:from-gray-800 dark:to-gray-900",
    blurb: "Epic endgame rites for Ascended Elders — the surest path to Greater and rare Ancient Runes.",
  },
};

const TIER_ORDER: MissionTier[] = ["governance", "diplomacy", "legacy"];

const formatDuration = (seconds: number) => {
  const hours = seconds / 3600;
  return hours < 1 ? `${Math.round(hours * 60)} min` : `${hours}h`;
};

const stageName = (stage: number) => STAGES.find((s) => s.stage === stage)?.name ?? `Stage ${stage + 1}`;

const MissionCard: React.FC<{ data: CouncilMissionDef }> = ({ data }) => {
  const meta = TIER_META[data.tier];
  const drops = Object.entries(data.rewards.runes ?? {})
    .map(([key, chance]) => ({ ...RUNE_TIERS[key], chance }))
    .filter((d) => d.chance > 0);

  return (
    <div className={`group rounded-2xl overflow-hidden border bg-gradient-to-br
      ${meta.card} shadow-md hover:shadow-xl transition-all duration-200 flex flex-col`}>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {data.name}
          </h3>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ${meta.badge}`}>
            {meta.icon}
            {meta.label}
          </span>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug flex-1">
          {data.description}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-900/5 dark:bg-white/10 text-gray-800 dark:text-gray-100">
            {stageName(data.requiredStage)}+
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300">
            <Clock size={12} /> {formatDuration(data.duration)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200/70 dark:border-gray-700 pt-2.5">
          <span className="inline-flex items-center gap-1" title="Happiness cost">
            <Heart size={13} /> -{data.cost.happiness}
          </span>
          <span className="inline-flex items-center gap-1" title="Experience earned">
            <Star size={13} /> {data.rewards.xp} XP
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

const Sanctum: React.FC = () => {
  const { passiveEarning, maxSeats, tenureBonuses, seatRequirements } = SANCTUM_CONFIG;

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Elder Sanctum
          </h1>
          <p className="italic text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mt-2 mb-6">
            &ldquo;The eldest spirits no longer wander — they sit, and the realm comes to them.&rdquo;
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            The Elder Sanctum is where your most experienced Totems — Stage 4 and beyond — take their
            seat. A seated Elder passively gathers Essence over time, and the longer they hold their
            seat, the more they earn. From the Sanctum, Elders may also take up Council Missions:
            volunteered service that spends a little happiness and the Totem&rsquo;s time in exchange
            for experience and Runes — all without giving up their seat.
          </p>

          {/* Seats & passive Essence */}
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <Armchair size={18} className="text-amber-500" />
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100">
                Seats &amp; Passive Essence
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              The Sanctum holds up to {maxSeats} seats. Each seated Elder earns a base of{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {passiveEarning.baseRatePerHour} Essence/hour
              </span>
              , accumulating until you claim — up to a cap of {passiveEarning.capHours} hours
              ({passiveEarning.capHours / 24} days). Claim regularly so a full seat doesn&rsquo;t sit idle.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tenure ladder */}
              <div className="rounded-2xl border border-amber-200/70 dark:border-gray-700 bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tenure Bonus</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  The longer a Totem stays seated, the higher its earning multiplier — from 1.0× up to 1.5×.
                </p>
                <ul className="space-y-1.5">
                  {tenureBonuses.map((b) => (
                    <li key={b.minHours} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {b.label}
                        <span className="text-gray-400 dark:text-gray-500">
                          {" "}· {b.minHours === 0 ? "from start" : `${b.minHours}h+ (${Math.round(b.minHours / 24)}d)`}
                        </span>
                      </span>
                      <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {b.multiplier.toFixed(1)}×
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Seat unlocks */}
              <div className="rounded-2xl border border-amber-200/70 dark:border-gray-700 bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gem size={16} className="text-purple-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Unlocking Seats</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  The first seat opens to any keeper with a Stage 4+ Totem. Further seats reward a
                  growing roster of Elders — or a VIP subscription.
                </p>
                <ul className="space-y-1.5">
                  {seatRequirements.map((s) => (
                    <li key={s.seatIndex} className="flex items-start gap-2 text-sm">
                      <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold">
                        {s.seatIndex + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{s.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Council Missions */}
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-2">
              <Scroll size={18} className="text-purple-500" />
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100">
                Council Missions
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              A seated Elder can take on Council Missions without leaving its seat — tenure keeps
              building while they serve. Missions cost only happiness and time; they return
              experience and a chance at Runes, growing richer with each tier.
            </p>

            {TIER_ORDER.map((tier) => {
              const meta = TIER_META[tier];
              const group = COUNCIL_MISSIONS.filter((m) => m.tier === tier);
              return (
                <div key={tier} className="mt-6 first:mt-0">
                  <div className="flex items-center gap-2 mb-1">
                    {meta.icon}
                    <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-gray-100">
                      {meta.label}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{meta.blurb}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.map((m) => (
                      <MissionCard key={m.id} data={m} />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Sanctum;
