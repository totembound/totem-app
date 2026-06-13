import React from "react";
import { Dumbbell, Wind, Brain, Scale, Repeat, Trophy, Star, Swords, Award, Gauge } from "lucide-react";
import CodexSidebar from "./CodexSidebar";
import { CHALLENGES, AffinityType } from "../../../config/challenges";
import { STAGES } from "../../../config/game-config";
import { getMasteryConfig } from "../../../config/config-loader";
import { MASTERY_TIER_COLOR } from "../../challenges/mastery-tier-colors";

const AFFINITY_META: Record<AffinityType, { label: string; icon: React.ReactNode; badge: string; bar: string }> = {
  strength: {
    label: "Strength",
    icon: <Dumbbell size={14} />,
    badge: "bg-red-500/80 text-red-50 border-red-600",
    bar: "bg-red-500",
  },
  agility: {
    label: "Agility",
    icon: <Wind size={14} />,
    badge: "bg-sky-500/80 text-sky-50 border-sky-600",
    bar: "bg-sky-500",
  },
  wisdom: {
    label: "Wisdom",
    icon: <Brain size={14} />,
    badge: "bg-purple-500/80 text-purple-50 border-purple-600",
    bar: "bg-purple-500",
  },
  balance: {
    label: "Balance",
    icon: <Scale size={14} />,
    badge: "bg-amber-500/80 text-amber-50 border-amber-600",
    bar: "bg-amber-500",
  },
};

const stageName = (stage: number) => STAGES.find((s) => s.stage === stage)?.name ?? `Stage ${stage + 1}`;

// Display order: group by affinity (Balance, Strength, Agility, Wisdom), then by required stage.
const AFFINITY_ORDER: AffinityType[] = ["balance", "strength", "agility", "wisdom"];
const SORTED_CHALLENGES = [...CHALLENGES].sort(
  (a, b) =>
    AFFINITY_ORDER.indexOf(a.type) - AFFINITY_ORDER.indexOf(b.type) ||
    a.requirements.stage - b.requirements.stage
);

const StatPill: React.FC<{ label: string; value: number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <span
    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
      highlight
        ? "bg-gray-900/5 dark:bg-white/10 text-gray-800 dark:text-gray-100"
        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
    }`}
  >
    {label} {value}
  </span>
);

const ChallengeCard: React.FC<{ data: typeof CHALLENGES[number] }> = ({ data }) => {
  const meta = AFFINITY_META[data.type];
  const req = data.requirements;
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
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${meta.badge}`}>
            {meta.icon}
            <span>{meta.label}</span>
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

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Requires</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-gray-900/5 dark:bg-white/10 text-gray-800 dark:text-gray-100">
            {stageName(req.stage)}
          </span>
          <StatPill label="STR" value={req.strength} highlight={data.type === "strength"} />
          <StatPill label="AGI" value={req.agility} highlight={data.type === "agility"} />
          <StatPill label="WIS" value={req.wisdom} highlight={data.type === "wisdom"} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200/70 dark:border-gray-700 pt-2.5">
          <span className="inline-flex items-center gap-1" title="Daily attempts">
            <Repeat size={13} /> {data.maxDailyAttempts}/day
          </span>
          <span className="inline-flex items-center gap-1" title="Max score">
            <Trophy size={13} /> {data.maxScore.toLocaleString()}
          </span>
          <span
            className="inline-flex items-center gap-1"
            title={`Base XP reward — Trial Mastery multiplies this up to ×${getMasteryConfig().tiers.at(-1)?.xpMult ?? 3}`}
          >
            <Star size={13} /> {data.xpReward.base} XP
          </span>
        </div>
      </div>
    </div>
  );
};

const Challenges: React.FC = () => {
  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Challenges
          </h1>
          <p className="italic text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mt-2 mb-6">
            &ldquo;Every trial tempers the spirit within.&rdquo;
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Challenges are sacred trials that test a Totem&rsquo;s core strengths — raw force, quick
            reflexes, or spiritual wisdom. Each challenge draws upon an Affinity and presents a unique
            interactive trial, from cracking enchanted boulders to weaving memory runes. Totems grow
            stronger through these trials, earning experience and happiness based on performance —
            and every completion builds the keeper&rsquo;s lasting <span className="font-semibold text-gray-700 dark:text-gray-300">Mastery</span> of
            that trial.
          </p>

          {/* Affinities */}
          <section className="mt-6">
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              The Three Affinities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["strength", "agility", "wisdom"] as AffinityType[]).map((key) => {
                const meta = AFFINITY_META[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-xl border border-amber-200/70 dark:border-gray-700 bg-amber-50/50 dark:bg-gray-800 px-3 py-2.5"
                  >
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border ${meta.badge}`}>
                      {meta.icon}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{meta.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Most trials lean on one of these three affinities — a Totem&rsquo;s relevant stat extends
              its reaction window, accuracy, or endurance, so a well-matched spirit has the edge.
            </p>

            <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-900/15 px-3 py-2.5">
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${AFFINITY_META.balance.badge}`}>
                {AFFINITY_META.balance.icon}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-800 dark:text-gray-200">Balance</span> trials
                aren&rsquo;t tied to any one stat — any Totem can attempt them, and they reward pure
                skill and timing over raw numbers.
              </p>
            </div>
          </section>

          {/* Trial Mastery */}
          <section className="mt-8">
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Trial Mastery
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              A trial remembered is a trial mastered. Every completion — by <span className="font-semibold text-gray-700 dark:text-gray-300">any</span> of
              your Totems — deepens your bond with that trial, climbing six ranks from Novice to
              Diamond. Mastery belongs to the keeper, not the spirit: switch Totems freely, and the
              count carries on. It is measured in completions alone — show up, finish the trial, and
              the rank will come.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
              {getMasteryConfig().tiers.map((t) => (
                <div
                  key={t.tier}
                  className="rounded-xl border border-amber-200/70 dark:border-gray-700 bg-amber-50/50 dark:bg-gray-800 px-3 py-2.5 text-center"
                >
                  <Award className={`w-5 h-5 mx-auto ${MASTERY_TIER_COLOR[t.tier] ?? MASTERY_TIER_COLOR[0]}`} aria-hidden="true" />
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{t.name}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    {t.minCompletions > 0 ? `${t.minCompletions} completions` : "the first step"}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ×{t.xpMult} XP
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Each rank multiplies the experience <span className="font-semibold text-gray-600 dark:text-gray-300">every</span> Totem
              earns from that trial, forever after. Reaching a new rank also grants a one-time burst
              of bonus experience — and from Silver onward, a chest of Essence. Keepers prize
              mastered trials as the swiftest road for raising a fresh Totem toward Ascension: the
              multipliers you earned serve every spirit that follows.
            </p>

            <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-900/15 px-3 py-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-600 bg-amber-500/80 text-amber-50 shrink-0">
                <Gauge size={14} />
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-800 dark:text-gray-200">Difficulty</span> matches
                your Totem&rsquo;s stage. Lower it anytime to keep a trial completable — less experience,
                but the path stays open. At{" "}
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">Gold</span> mastery
                the seal breaks: any difficulty, any Totem, a higher score ceiling.
              </p>
            </div>
          </section>

          {/* Trials */}
          <section className="mt-8">
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Known Trials
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {CHALLENGES.length} trials await, unlocking as your Totem matures from Hatchling onward.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SORTED_CHALLENGES.map((c) => (
                <ChallengeCard key={c.id} data={c} />
              ))}
            </div>
          </section>

          {/* Arena — coming soon */}
          <section className="mt-10">
            <div className="rounded-2xl border border-purple-300/60 dark:border-purple-700/60
              bg-gradient-to-br from-purple-50 to-amber-50/40 dark:from-purple-900/20 dark:to-gray-900
              p-5 flex items-start gap-4">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300 shrink-0">
                <Swords size={22} />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100">
                    The Arena
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 max-w-2xl">
                  Where solo trials temper a single spirit, the Arena will test your whole roster.
                  Assemble a <span className="font-semibold text-gray-700 dark:text-gray-300">team of Totems</span> and
                  pit their combined Affinities against domain guardians and, in time, rival keepers.
                  Strategy, synergy, and the bonds you&rsquo;ve forged will decide the victor.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Challenges;
