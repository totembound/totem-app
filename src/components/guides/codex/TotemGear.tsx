import React from "react";
import CodexSidebar from "./CodexSidebar";

const TotemGear: React.FC = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Totem Gear
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Every Totem can eventually be equipped with sacred items: Amulets, Spirit Bands, and Essence Stones. 
            These gear pieces are more than simple boosts - they are spiritual tools, forged from Runic essence and shaped by Domain influence. 
            Amulets might increase affinity strength, Spirit Bands offer resilience, and Essence Stones awaken dormant abilities. 
            Gear adds a new layer of depth to your Totem’s journey, allowing you to customize their power and purpose.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TotemGear;
