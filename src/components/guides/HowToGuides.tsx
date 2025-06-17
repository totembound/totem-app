import React from "react";
import GuidesHeader from "./GuidesHeader";

const HowToGuides: React.FC = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
            <GuidesHeader title="How-To Guides"/>
            <p className="text-gray-600 dark:text-gray-400">
                Master Challenges, Expeditions, Runes, and Evolution.
            </p>
      </div>
    </div>
  );
};

export default HowToGuides;
