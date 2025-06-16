import React from "react";
import TutorialPanels from "./TutorialPanels";
import GuidesHeader from "./GuidesHeader";

const Tutorial: React.FC = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
        <GuidesHeader title="Spiritkeeper's Path"/>
        <p className="text-gray-600 dark:text-gray-400">
            Begin your Totem’s journey. Learn core mechanics and earn early achievements.
        </p>
        <TutorialPanels/>
      </div>
    </div>
  );
};

export default Tutorial;
