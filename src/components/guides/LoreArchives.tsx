import React from "react";
import GuidesHeader from "./GuidesHeader";

const LoreArchives: React.FC = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
            <GuidesHeader title="Lore Archives"/>
            <p className="text-gray-600 dark:text-gray-400">
                Dive into the history of TotemBound and ancient spirit tales.
            </p>
      </div>
    </div>
  );
};

export default LoreArchives;
