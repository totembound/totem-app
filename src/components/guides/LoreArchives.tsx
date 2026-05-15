import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, MapPin, Sparkles, X } from "lucide-react";
import { withVillagePrefix } from "../village/villagePath";
import GuidesHeader from "./GuidesHeader";
import {
  DOMAIN_LORE,
  ERAS,
  FACTIONS,
  MYTHIC_EVENTS,
  TALES,
  TRADITIONS,
  type Era,
  type EraId,
  type Tale,
} from "../../config/lore";
import { LOCATIONS } from "../../config/constants";
import { getDomainColor, getTotemDomainIcon } from "../../utils/totems";
import { Domain } from "../../types/types";

const locationById = (id: number) => LOCATIONS.find((l) => l.id === id);

const eraById = (id: EraId): Era | undefined => ERAS.find((e) => e.id === id);

const LocationChip: React.FC<{ id: number }> = ({ id }) => {
  const location = useLocation();
  const loc = locationById(id);
  if (!loc) return null;
  return (
    <Link
      to={withVillagePrefix(location.pathname, `/guides/codex/map?location=${id}`)}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        bg-purple-100 text-purple-800 hover:bg-purple-200
        dark:bg-purple-900/60 dark:text-purple-200 dark:hover:bg-purple-800
        transition-colors"
    >
      <MapPin className="w-3 h-3" />
      {loc.name}
    </Link>
  );
};

const EraBadge: React.FC<{ era: EraId }> = ({ era }) => {
  const e = eraById(era);
  if (!e) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
      bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
      {e.name}
    </span>
  );
};

const TaleCard: React.FC<{ tale: Tale; onOpen: (t: Tale) => void }> = ({ tale, onOpen }) => {
  return (
    <button
      type="button"
      onClick={() => onOpen(tale)}
      className="group text-left rounded-2xl overflow-hidden border border-amber-200/70 dark:border-gray-700
        bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900
        shadow-md hover:shadow-xl hover:ring-2 hover:ring-purple-400 transition-all duration-200
        flex flex-col min-h-[280px]"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={tale.image}
          alt={tale.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${getDomainColor(tale.domain)}`}>
            {getTotemDomainIcon(Domain[tale.domain])}
            <span>{Domain[tale.domain]}</span>
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <h3 className="font-serif text-xl font-bold text-white text-shadow-lg leading-tight">
            {tale.title}
          </h3>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <p className="italic text-sm text-gray-700 dark:text-gray-300 leading-snug">
          &ldquo;{tale.epigraph}&rdquo;
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <EraBadge era={tale.era} />
          {tale.linkedLocationIds.slice(0, 2).map((id) => (
            <LocationChip key={id} id={id} />
          ))}
        </div>
      </div>
    </button>
  );
};

const TaleModal: React.FC<{ tale: Tale | null; onClose: () => void }> = ({ tale, onClose }) => {
  useEffect(() => {
    if (!tale) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [tale, onClose]);

  if (!tale) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 sm:bg-transparent sm:dark:bg-transparent sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="hidden sm:block fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] bg-white dark:bg-gray-900 sm:rounded-2xl sm:border sm:border-amber-200/70 sm:dark:border-gray-700 shadow-2xl overflow-y-auto">
        <div className="relative h-56 sm:h-80 overflow-hidden sm:rounded-t-2xl">
          <img src={tale.image} alt={tale.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Close tale"
            className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full
              flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${getDomainColor(tale.domain)}`}>
                {getTotemDomainIcon(Domain[tale.domain])}
                <span>{Domain[tale.domain]}</span>
              </span>
              <EraBadge era={tale.era} />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white text-shadow-lg">
              {tale.title}
            </h2>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <p className="italic text-base text-gray-700 dark:text-gray-300 border-l-4 border-amber-400 dark:border-amber-500 pl-3">
            &ldquo;{tale.epigraph}&rdquo;
          </p>
          {tale.body.map((para, idx) => (
            <p key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {para}
            </p>
          ))}

          {tale.relicName && (
            <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-300 flex-shrink-0" />
              <p className="text-sm text-amber-900 dark:text-amber-200">
                <span className="font-semibold">Relic:</span> {tale.relicName}
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Linked Sites
            </p>
            <div className="flex flex-wrap gap-2">
              {tale.linkedLocationIds.map((id) => (
                <LocationChip key={id} id={id} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const TalesSection: React.FC = () => {
  const [selected, setSelected] = useState<Tale | null>(null);
  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Tales of the Totems
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        The old stories of the Spirit Realm — origin myths, fallen heroes, and the legends each
        species still whispers before sleep.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {TALES.map((tale) => (
          <TaleCard key={tale.id} tale={tale} onOpen={setSelected} />
        ))}
      </div>
      <TaleModal tale={selected} onClose={() => setSelected(null)} />
    </section>
  );
};

const ErasTimeline: React.FC = () => (
  <div>
    <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
      The Five Eras
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {ERAS.map((era) => (
        <div
          key={era.id}
          className="rounded-xl p-4 bg-gradient-to-br from-amber-50 to-white
            dark:from-gray-800 dark:to-gray-900 border border-amber-200/70 dark:border-gray-700"
        >
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
            Era {era.order}
          </div>
          <div className="font-serif font-bold text-gray-900 dark:text-gray-100 mb-2">
            {era.name}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{era.flavor}</p>
        </div>
      ))}
    </div>
  </div>
);

const EventsList: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div>
      <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        Battles &amp; Events
      </h3>
      <div className="space-y-2">
        {MYTHIC_EVENTS.map((ev) => {
          const open = openId === ev.id;
          return (
            <div
              key={ev.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : ev.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                aria-expanded={open}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-serif font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {ev.name}
                  </span>
                  <EraBadge era={ev.era} />
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open && (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{ev.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {ev.linkedLocationIds.map((id) => (
                      <LocationChip key={id} id={id} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FactionsGrid: React.FC = () => (
  <div>
    <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
      Factions &amp; Orders
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {FACTIONS.map((f) => (
        <div
          key={f.id}
          className="rounded-xl p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-serif font-bold text-gray-900 dark:text-gray-100">{f.name}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              f.status === "Existing"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : f.status === "Fallen"
                ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                : "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200"
            }`}>
              {f.status}
            </span>
          </div>
          <p className="italic text-sm text-gray-600 dark:text-gray-400 mb-2">{f.philosophy}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{f.hook}</p>
        </div>
      ))}
    </div>
  </div>
);

const TraditionsGrid: React.FC = () => (
  <div>
    <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
      Ancient Traditions
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {TRADITIONS.map((t) => (
        <div
          key={t.id}
          className="rounded-lg p-4 bg-gradient-to-br from-amber-50/60 to-white
            dark:from-gray-800 dark:to-gray-900 border border-amber-200/60 dark:border-gray-700"
        >
          <h4 className="font-serif font-bold text-gray-900 dark:text-gray-100 mb-1">{t.name}</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">{t.description}</p>
        </div>
      ))}
    </div>
  </div>
);

const DomainsPanel: React.FC = () => (
  <div>
    <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
      The Six Domains
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {DOMAIN_LORE.map((d) => (
        <div
          key={d.name}
          className="rounded-xl p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${getDomainColor(d.domain)}`}>
                {getTotemDomainIcon(d.name)}
                <span>{d.name}</span>
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              d.state === "Bound"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200"
            }`}>
              {d.state === "Sleeping" ? "Sleeping" : "Bound"}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{d.flavor}</p>
          {d.species.length > 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Species:</span> {d.species.join(", ")}
            </p>
          ) : (
            <p className="text-xs italic text-gray-500 dark:text-gray-400">Awaiting a totem.</p>
          )}
        </div>
      ))}
    </div>
  </div>
);

const ChroniclesSection: React.FC = () => (
  <section className="mt-12 space-y-8">
    <div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Chronicles of the Realm
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Eras, battles, factions, and the old traditions still kept by those who remember.
      </p>
    </div>
    <ErasTimeline />
    <DomainsPanel />
    <EventsList />
    <FactionsGrid />
    <TraditionsGrid />
  </section>
);

const AtlasSection: React.FC = () => {
  const rows = useMemo(() => {
    return TALES.map((t) => ({
      id: t.id,
      title: t.title,
      emoji: t.emoji,
      era: t.era,
      domain: t.domain,
      locations: t.linkedLocationIds.map(locationById).filter(Boolean),
    }));
  }, []);

  return (
    <section className="mt-12">
      <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Atlas of Myth
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Every tale is tethered to a place on the map. Follow a chip to find its pin.
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Tale</th>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Domain</th>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Era</th>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Linked Sites</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-serif">
                  <span className="inline-block w-6 mr-2 text-center align-middle">{r.emoji}</span>
                  {r.title}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getDomainColor(r.domain)}`}>
                    {Domain[r.domain]}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <EraBadge era={r.era} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {r.locations.map((loc) =>
                      loc ? <LocationChip key={loc.id} id={loc.id} /> : null
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const LoreArchives: React.FC = () => {
  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
        <GuidesHeader title="Lore Archives" />
        <p className="italic text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mt-2 mb-6">
          &ldquo;The world does not forget. It only waits to be remembered.&rdquo;
        </p>
        <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
          Dive into the history of TotemBound and the ancient spirit tales — the heroes each species
          still whispers about, the battles that reshaped the map, and the traditions kept by those
          who refused to forget.
        </p>

        <TalesSection />
        <ChroniclesSection />
        <AtlasSection />
      </div>
    </div>
  );
};

export default LoreArchives;
