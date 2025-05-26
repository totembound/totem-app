import React from "react";
import CodexSidebar from "./CodexSidebar";
import InteractiveMap from "../InteractiveMap";

const WorldMap: React.FC = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            World Map
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Spanning vast biomes shaped by elemental forces, every region holds secrets, trials, and sacred grounds. 
            Explore a world where evolution is tied not just to combat, but to place, lore, and elemental resonance.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            While much of the Air, Earth, and Water Domains has been charted and understood, the lands of Fire, Spirit, and Shadow remain largely uncharted, veiled in mystery, danger, and forgotten truths.
          </p>
          <InteractiveMap />
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
