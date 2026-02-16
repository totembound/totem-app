import React from "react";
import CodexSidebar from "./CodexSidebar";
import { getDomainColor, getTotemDomainIcon } from "../../../utils/totems";
import { Domain } from "../../../types/types";
import { Link } from "react-router-dom";


const Domains: React.FC = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Domains
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Every Totem is attuned to one of six elemental Domains: Air, Earth, Water, Fire, Spirit, or Shadow. 
            These Domains shape not only the totem’s nature, but how they interact with the world around them. 
            Air favors agility and perception. 
            Earth embodies strength and stability. 
            Water offers wisdom and memory. 
            Fire channels chaos and passion. 
            Spirit binds life to life, and Shadow weaves secrets into survival. 
            A Totem's Domain determines its role in challenges, expeditions, and beyond.
          </p>

          <div className="flex flex-col justify-start sm:flex-row gap-3 mt-4">
            <div className="sm:w-1/2 flex flex-col gap-2 text-gray-700 dark:text-gray-400">
                <div className="h-16 flex flex-row gap-2">
                  <div className={`p-1.5 rounded-md ${getDomainColor(Domain.Air)}`}>
                    {getTotemDomainIcon(Domain[Domain.Air])}
                  </div>
                  <span className="text-sm">
                    The <Link
                          className="hover:underline mx-0.5"
                          to={`/guides/codex/domains/air`}
                      >
                      <strong>Air Domain</strong>
                    </Link> is the breath of the world — restless, weightless, and eternal. It carries whispers from distant lands, guiding those who listen closely.   
                  </span>
                </div>

                <div className="h-16 flex flex-row gap-2">
                  <div className={`p-1.5 rounded-md ${getDomainColor(Domain.Earth)}`}>
                    {getTotemDomainIcon(Domain[Domain.Earth])}
                  </div>
                  <span className="text-sm">
                    The <Link
                          className="hover:underline mx-0.5"
                          to={`/guides/codex/domains/earth`}
                      >
                      <strong>Earth Domain</strong>
                    </Link> is strength incarnate — rooted, unshaken, and ancient. It speaks in silence, in the grinding of stone and the pulse beneath the soil. 
                  </span>
                </div>

                <div className="h-16 flex flex-row gap-2">
                  <div className={`p-1.5 rounded-md ${getDomainColor(Domain.Water)}`}>
                    {getTotemDomainIcon(Domain[Domain.Water])}
                  </div>
                  <span className="text-sm">
                    The <Link
                          className="hover:underline mx-0.5"
                          to={`/guides/codex/domains/water`}
                      >
                      <strong>Water Domain</strong>
                    </Link> flows between worlds — calm as reflection, fierce as a flood. It is memory and intuition, the quiet murmur of forgotten dreams. 
                  </span>
                </div>

                <div className="h-16 flex flex-row gap-2">
                  <div className={`p-1.5 rounded-md ${getDomainColor(Domain.Fire)}`}>
                    {getTotemDomainIcon(Domain[Domain.Fire])}
                  </div>
                  <span className="text-sm">
                    The <Link
                          className="hover:underline mx-0.5"
                          to={`/guides/codex/domains/fire`}
                      >
                      <strong>Fire Domain</strong>
                    </Link> is unrelenting — passion, power, destruction, and rebirth. It is a spark that ignites change, a flame that either purifies or consumes.
                  </span>
                </div>

                <div className="h-16 flex flex-row gap-2">
                  <div className={`p-1.5 rounded-md ${getDomainColor(Domain.Spirit)}`}>
                    {getTotemDomainIcon(Domain[Domain.Spirit])}
                  </div>
                  <span className="text-sm">
                    The <Link
                          className="hover:underline mx-0.5"
                          to={`/guides/codex/domains/spirit`}
                      >
                      <strong>Spirit Domain</strong>
                    </Link> is the thread between all things — weaving unseen paths, connecting life to memory, creature to land, past to future.
                  </span>
                </div>

                <div className="h-16 flex flex-row gap-2">
                  <div className={`p-1.5 rounded-md ${getDomainColor(Domain.Shadow)}`}>
                    {getTotemDomainIcon(Domain[Domain.Shadow])}
                  </div>
                  <span className="text-sm">
                    The <Link
                          className="hover:underline mx-0.5"
                          to={`/guides/codex/domains/shadow`}
                      >
                      <strong>Shadow Domain</strong>
                    </Link> is not evil — it is unseen. An eerie realm, the flicker of movement just outside vision. The truth wrapped in mystery. 
                  </span>
                </div>
            </div>
            <div className="sm:w-1/2 mb-auto">
              <img alt="Domains Map"
                  src="/domains/domains-map.png"
                  className="w-full h-full object-contain"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Domains;
