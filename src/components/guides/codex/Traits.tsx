import React from "react";
import CodexSidebar from "./CodexSidebar";
import { getTraitsBySlot, type TraitSlot } from "../../../config/traits";
import { TraitIcon, SLOT_COLOR_CLASSES } from "../../../utils/traitIcons";

const SLOT_HEADERS: { slot: TraitSlot; title: string; subtitle: string; theme: string }[] = [
  {
    slot: "innate",
    title: "Innate",
    subtitle: "What it was born with",
    theme: "from-stone-50 to-stone-100 dark:from-slate-800 dark:to-slate-900 border-stone-200 dark:border-slate-700",
  },
  {
    slot: "learned",
    title: "Learned",
    subtitle: "Chosen at Stage 3 (Adult)",
    theme: "from-blue-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 border-blue-200 dark:border-slate-600",
  },
  {
    slot: "awakened",
    title: "Awakened",
    subtitle: "Chosen at Stage 5 (Ascended)",
    theme: "from-amber-50 to-violet-50 dark:from-slate-700 dark:to-slate-800 border-amber-200 dark:border-slate-600",
  },
];

const Traits: React.FC = () => {
  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Traits
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Every totem carries up to three traits — small markers of nature, learning, and awakening
            that make each individual feel distinct from others of the same species and color. The
            first is random at birth. The other two are choices you make as your totem grows. Choices
            are permanent.
          </p>

          {SLOT_HEADERS.map(({ slot, title, subtitle, theme }) => (
            <section key={slot} className="mb-8">
              <div className={`bg-gradient-to-r ${theme} rounded-lg p-4 mb-3 border`}>
                <h2 className={`text-xl font-bold ${SLOT_COLOR_CLASSES[slot]}`}>{title}</h2>
                <p className="text-sm text-gray-600 dark:text-slate-300">{subtitle}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {getTraitsBySlot(slot).map((t) => (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-start gap-3"
                  >
                    <div className="shrink-0 p-1.5 rounded-md bg-gray-50 dark:bg-gray-900">
                      <TraitIcon traitId={t.id} size={24} colorBySlot />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{t.name}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 italic mt-0.5">
                        "{t.description}"
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {t.category === "passive" ? "Passive" : "Active"}
                        </span>
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Traits;
