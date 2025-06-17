import React from "react";
import TutorialPanels from "./TutorialPanels";
import GuidesHeader from "./GuidesHeader";
import { useUser } from "../../contexts/UserContext";

const Tutorial: React.FC = () => {
    const { tutorialWizardVisible, setTutorialWizardVisible } = useUser();

    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
        <GuidesHeader title="Spiritkeeper's Path"/>
        <div className="flex items-center gap-2">
          <p className="text-gray-600 dark:text-gray-400">
              Begin your Totem’s journey. Learn core mechanics and earn early achievements.
          </p>
          <button
            onClick={() => setTutorialWizardVisible(true)}
            className="text-sm text-purple-500 hover:text-purple-400 font-bold"
          >
            <span>Show Wizard</span>
          </button>
        </div>
        <TutorialPanels/>
      </div>
    </div>
  );
};

export default Tutorial;
