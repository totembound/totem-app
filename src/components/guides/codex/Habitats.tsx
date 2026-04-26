import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import CodexSidebar from "./CodexSidebar";
import { AVAILABLE_SPECIES, LOCATIONS } from "../../../config/constants";
import { getDomainColor, getTotemDomainIcon } from "../../../utils/totems";
import { Domain, Species } from "../../../types/types";

interface HabitatCard {
  id: number;
  name: string;
  species: string;
  speciesEnum: Species;
  title: string;
  description: string;
  domain: string;
  affinity: string;
  type: string;
  coordinates: { x: number; y: number };
  image: string;
  available: boolean;
}

const Habitats: React.FC = () => {
  const [selectedHabitat, setSelectedHabitat] = useState<HabitatCard | null>(null);
  const [_showUnavailable, _setShowUnavailable] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedHabitat) {
        setSelectedHabitat(null);
      }
    };

    if (selectedHabitat) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [selectedHabitat]);

  // Handle click outside modal to close
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedHabitat(null);
    }
  };
  
  // Create habitat cards by combining species and location data
  const habitatCards: HabitatCard[] = AVAILABLE_SPECIES.map(species => {
    const location = LOCATIONS.find(loc => loc.id === species.locationId);
    return {
      id: species.id,
      name: location?.name || "Unknown Habitat",
      species: species.name,
      speciesEnum: species.species,
      title: species.title,
      description: location?.desc || "A mysterious habitat awaits discovery.",
      domain: species.domain,
      affinity: species.affinity,
      type: location?.type || "Unknown",
      coordinates: location?.coordinates || { x: 0, y: 0 },
      image: species.image,
      available: species.available
    };
  });
  const selectedDomain = Domain[selectedHabitat?.domain as keyof typeof Domain];

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        <CodexSidebar />
        
        <div>
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Totem Habitats
              </h1>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Habitats are sacred spaces where Totems find peace, recovery, and power. 
              Each Domain is linked to a specific type of habitat - groves, cliffs, caves, sanctuaries - where aligned Totems thrive. 
              In time, assigning Totems to their native Habitats will unlock passive benefits: faster happiness recovery, reduced cooldowns, or bonus rewards from expeditions. 
              Habitats are part of the future expansion of the spirit world, deepening your connection to each Totem's home.
            </p>
          </div>

          {/* Habitat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {habitatCards.map((habitat) => {
              return (
                <div
                  key={habitat.id}
                  className={`group relative bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer ${
                    habitat.available 
                      ? 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600' 
                      : 'border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-80'
                  }`}
                  onClick={() => setSelectedHabitat(habitat)}
                >
                  {/* Habitat Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={`/habitats/${habitat.species.toLowerCase()}-habitat.jpg`}
                      alt={habitat.species}
                      className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        !habitat.available ? 'grayscale' : ''
                      }`}
                    />
                    
                    {/* Overlay for unavailable */}
                    {!habitat.available && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Coming Soon
                        </span>
                      </div>
                    )}
                    
                    {/* Species Badge - Top Left */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                        {habitat.species}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {habitat.name}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {habitat.description}
                    </p>
                    
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Habitat Details Modal */}
          {selectedHabitat && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
             onClick={handleModalBackdropClick}
             >
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="relative h-48 sm:h-96 overflow-hidden rounded-t-2xl">
                  <img
                    src={`/habitats/${selectedHabitat.species.toLowerCase()}-habitat.jpg`}
                    alt={selectedHabitat.species}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setSelectedHabitat(null)}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    <X className="h-4 w-4"/>
                  </button>
                  <div className="absolute bottom-4 left-4">
                    <h2 className="text-2xl font-bold text-white mb-1 text-shadow-lg">
                      {selectedHabitat.name}
                    </h2>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <div className="text-white/90 text-sm flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${getDomainColor(selectedDomain)}`} >
                        {getTotemDomainIcon(selectedHabitat.domain)}
                      </div>
                      <span className="font-bold text-shadow-lg">{selectedHabitat.domain} Domain</span>
                    </div>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-4">
                  <div className="flex flex-col gap-2 text-gray-700 dark:text-gray-300">
                    <p className="font-bold">
                      {selectedHabitat.species} Habitat
                    </p>
                    <p className="font-bold">
                      {selectedHabitat.title}
                    </p>
                    <p>{selectedHabitat.description}</p>
                 </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-500 px-4 py-2">
                      Coordinates: {selectedHabitat.coordinates.x}, {selectedHabitat.coordinates.y}
                    </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Habitats;