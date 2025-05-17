import { ChevronLeft } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const LoreArchives: React.FC = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Lore Archives
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
                Dive into the history of TotemBound and ancient spirit tales.
            </p>
            <div className="text-center">
                
            </div>
            <Link to="/guides" className="inline-flex items-center text-purple-500 hover:text-purple-400 text-sm font-medium">
                <ChevronLeft size={18} className="mr-1" />
                Back to Guides
            </Link>
      </div>
    </div>
  );
};

export default LoreArchives;
