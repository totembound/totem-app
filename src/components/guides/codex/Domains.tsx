import React from "react";
import { Link } from "react-router-dom";
import CodexSidebar from "./CodexSidebar";
import { getDomainColor, getTotemDomainIcon } from "../../../utils/totems";
import { Domain } from "../../../types/types";

type DomainCardData = {
  domain: Domain;
  slug: string;
  image: string;
  description: string;
};

const DOMAIN_CARDS: DomainCardData[] = [
  {
    domain: Domain.Air,
    slug: "air",
    image: "/domains/air-domain.jpg",
    description:
      "The breath of the world — restless, weightless, and eternal. It carries whispers from distant lands, guiding those who listen closely.",
  },
  {
    domain: Domain.Earth,
    slug: "earth",
    image: "/domains/earth-domain.jpg",
    description:
      "Strength incarnate — rooted, unshaken, and ancient. It speaks in silence, in the grinding of stone and the pulse beneath the soil.",
  },
  {
    domain: Domain.Water,
    slug: "water",
    image: "/domains/water-domain.jpg",
    description:
      "Flows between worlds — calm as reflection, fierce as a flood. It is memory and intuition, the quiet murmur of forgotten dreams.",
  },
  {
    domain: Domain.Fire,
    slug: "fire",
    image: "/domains/fire-domain.jpg",
    description:
      "Unrelenting — passion, power, destruction, and rebirth. It is a spark that ignites change, a flame that either purifies or consumes.",
  },
  {
    domain: Domain.Spirit,
    slug: "spirit",
    image: "/domains/spirit-domain.jpg",
    description:
      "The thread between all things — weaving unseen paths, connecting life to memory, creature to land, past to future.",
  },
  {
    domain: Domain.Shadow,
    slug: "shadow",
    image: "/domains/shadow-domain.jpg",
    description:
      "Not evil — unseen. An eerie realm, the flicker of movement just outside vision. The truth wrapped in mystery.",
  },
];

const DomainCard: React.FC<{ data: DomainCardData }> = ({ data }) => {
  const name = `${Domain[data.domain]} Domain`;
  return (
    <Link
      to={`/guides/codex/domains/${data.slug}`}
      className="group text-left rounded-2xl overflow-hidden border border-amber-200/70 dark:border-gray-700
        bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900
        shadow-md hover:shadow-xl hover:ring-2 hover:ring-purple-400 transition-all duration-200
        flex flex-col"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={data.image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${getDomainColor(data.domain)}`}
          >
            {getTotemDomainIcon(Domain[data.domain])}
            <span>{Domain[data.domain]}</span>
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-serif text-xl font-bold text-white text-shadow-lg leading-tight">
            {name}
          </h3>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
          {data.description}
        </p>
      </div>
    </Link>
  );
};

const Domains: React.FC = () => {
  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Domains
          </h1>
          <p className="italic text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mt-2 mb-6">
            &ldquo;Six elemental forces. Six paths of being.&rdquo;
          </p>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Every Totem is attuned to one of six elemental Domains: Air, Earth, Water, Fire, Spirit,
            or Shadow. These Domains shape not only the totem&rsquo;s nature, but how they interact
            with the world around them. A Totem&rsquo;s Domain determines its role in challenges,
            expeditions, and beyond.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {DOMAIN_CARDS.map((d) => (
              <DomainCard key={d.slug} data={d} />
            ))}
          </div>

          <section className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Map of the Domains
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Each Domain holds a region of the spirit realm. Their borders blur where elements
              meet — at the cliffs, the shorelines, the fault lines of memory.
            </p>
            <div className="rounded-xl overflow-hidden border border-amber-200/70 dark:border-gray-700">
              <img
                alt="Domains Map"
                src="/domains/domains-map.png"
                className="w-full h-auto object-contain"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Domains;
