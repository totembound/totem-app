import React from "react";
import { BookOpenText, Hammer, PawPrint, Award, Scroll } from "lucide-react";
import { Link } from "react-router-dom";

const About: React.FC = () => {
  const cards = [
    {
      title: "Spiritkeeper’s Path",
      description: "Begin your Totem’s journey. Learn core mechanics and earn early achievements.",
      image: '/guides/spiritkeepers-path-banner.jpg',
      href: '/guides/tutorial'
    },
    {
      title: "How-To Guides",
      description: "Master Challenges, Expeditions, Runes, and Evolution.",
      image: '/guides/how-to-banner.jpg',
      href: '/guides/how-to',
    },
    {
      title: "Totem Codex",
      description: "Explore all known Totems, their domains, affinities, and spirit traits.",
      image: '/guides/totem-codex-banner.jpg',
      href: '/guides/codex',
    },
    {
      title: "Lore Archives",
      description: "Dive into the history of TotemBound and ancient spirit tales.",
      image: '/guides/lore-banner.jpg',
      href: '/guides/lore',
    },
  ];

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Totem Keeper Guides
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
                Learn the ways of the Totem Lands, from your first steps to the ancient rites. Every spirit's journey begins with knowledge.
            </p>
            <div className="text-center">
            <div className="container mx-auto mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {cards.map((card, idx) => (
                <Link
                    key={idx}
                    to={card.href}
                    className="group rounded-2xl bg-zinc-200 dark:bg-zinc-900 bg-white 
                    overflow-hidden hover:shadow-xl hover:ring-2 hover:ring-purple-400 transition-all duration-200  
                    shadow-lg border border-gray-300 dark:border-gray-700"
                >
                    <div
                    className="h-48 sm:h-64 bg-cover bg-center relative"
                    style={{
                        backgroundImage: `url(${card.image})`,
                    }}
                    >
                    <div className="absolute inset-0 bg-black/50 dark:bg-black/50 bg-white/20"></div>
                    <h2 className="absolute bottom-2 left-4 text-xl font-semibold text-white drop-shadow-lg">
                        {card.title}
                    </h2>
                    </div>
                    <div className="p-4">
                        <p className="text-zinc-700 dark:text-gray-300 text-sm">{card.description}</p>
                    </div>
                </Link>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default About;
