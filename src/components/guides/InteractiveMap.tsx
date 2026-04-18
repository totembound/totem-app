import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPinIcon, X, Info } from "lucide-react";
import Tooltip from "../Tooltip";
import { LOCATIONS } from "../../config/constants";
import { Location } from "../../types/types";

interface MapPinProps {
  location: Location;
  isSelected: boolean;
  onHover: (location: Location) => void;
  onClick: (location: Location) => void;
  onLeave: () => void;
}

const MapPin: React.FC<MapPinProps> = ({
  location,
  isSelected,
  onHover,
  onClick,
  onLeave,
}) => {
  return (
     <div className="relative z-30">
    <Tooltip content={location.name} position="top">
      <div
        className={`
          cursor-pointer transition-all duration-200 hover:scale-125 
          ${isSelected ? "scale-125 drop-shadow-lg" : ""}
        `}
        onMouseEnter={() => onHover(location)}
        onMouseLeave={onLeave}
        onClick={() => onClick(location)}
      >
        {/* Responsive pin that scales with container */}
        <div
          className={`
            rounded-full border-2 border-white shadow-lg
            flex items-center justify-center
            ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""}
            ${location.type === "Forest" ? "bg-green-600" : ""}
            ${location.type === "Lake" ? "bg-blue-600" : ""}
            ${location.type === "Volcano" ? "bg-red-600" : ""}
            ${location.type === "Desert" ? "bg-yellow-600" : ""}
            ${location.type === "Mist" ? "bg-amber-600" : ""}
            ${location.type === "Marsh" ? "bg-indigo-600" : ""}
            ${location.type === "Ruins" ? "bg-purple-600" : ""}
            ${location.type === "Mountains" ? "bg-gray-600" : ""}
          `}
          style={{
            width: 'clamp(16px, 2.5vw, 24px)', // Scales between 16px and 24px
            height: 'clamp(16px, 2.5vw, 24px)'
          }}
        >
          <div 
            className="bg-white rounded-full"
            style={{
              width: 'clamp(6px, 1vw, 8px)', // Inner dot scales too
              height: 'clamp(6px, 1vw, 8px)'
            }}
          ></div>
        </div>
      </div>
    </Tooltip>
    </div>
  );
};

interface LocationDetailsProps {
  location: Location | null;
  onClose: () => void;
  isMobile: boolean;
}

const LocationDetails: React.FC<LocationDetailsProps> = ({
  location,
  onClose,
  isMobile,
}) => {
  if (!location) return null;

   const typeColors = {
    Forest: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Lake: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Volcano: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Desert: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    Ruins: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Mountains: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    Mist: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    Marsh: "bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-300",
  };

  return (
    <div className={`
      ${isMobile 
        ? 'w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700' 
        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg min-w-[120px]'
      }
      p-4
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {location.name}
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[location.type]}`}>
            {location.type}
        </span>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            <Info className="w-4 h-4" />
            Description
          </h4>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {location.desc}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Additional Details
          </h4>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {location.details}
          </p>
          {location.image && <div>
            <img
                src={location.image}
                alt={location.name}
                className={`w-full h-full object-cover rounded`}
            />
          </div>}
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Coordinates: {location.coordinates.x}, {location.coordinates.y}
          </p>
        </div>
      </div>
    </div>
    );
};

interface InteractiveMapProps {
  selected?: Location;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ selected }) => {
  const [searchParams] = useSearchParams();
  const queryLocationId = Number(searchParams.get("location"));
  const queryLocation = Number.isFinite(queryLocationId)
    ? LOCATIONS.find((l) => l.id === queryLocationId) || null
    : null;

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    selected || queryLocation || null
  );
  const [hoveredLocation, setHoveredLocation] = useState<Location | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const locations = LOCATIONS;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (queryLocation) {
      setSelectedLocation(queryLocation);
    }
  }, [queryLocation?.id]);

  const handlePinClick = (location: Location) => {
    setSelectedLocation(location);
  };

  const handlePinHover = (location: Location) => {
    if (!isMobile) {
      setHoveredLocation(location);
    }
  };

  const handlePinLeave = () => {
    if (!isMobile) {
      setHoveredLocation(null);
    }
  };

  const handleCloseDetails = () => {
    setSelectedLocation(null);
  };

  const displayLocation = selectedLocation || hoveredLocation;

  return (
     <div className="w-full bg-gray-50 dark:bg-gray-900">
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} sm:min-h-[480px]`}>
        {/* Map Section */}
        <div className={`relative ${isMobile ? 'w-full' : 'flex-1'}`}>
          <div 
            ref={mapContainerRef}
            className="relative w-full mx-auto"
            style={{ maxWidth: '800px',  aspectRatio: '1 / 1' }}
          >
            {/* Map Image */}
            <img 
              alt="Domains Map"
              src="/domains/domains-area-map.png"
              className="w-full h-full object-cover sm:min-h-[480px] sm:min-w-[480px]"
            />

            {/* Map Pins - positioned absolutely within the image container */}
            {locations.map((location) => (
              <div
                key={location.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
                  selectedLocation?.id === location.id || hoveredLocation?.id === location.id 
                    ? 'z-50' 
                    : 'z-20'
                }`}
                style={{
                  left: `${location.coordinates.x}%`,
                  top: `${location.coordinates.y}%`,
                }}
              >
                <MapPin
                  location={location}
                  isSelected={selectedLocation?.id === location.id}
                  onHover={handlePinHover}
                  onClick={handlePinClick}
                  onLeave={handlePinLeave}
                />
              </div>
            ))}

            {/* Map Title */}
            <div className="absolute bottom-2 left-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg shadow-md z-10">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Explorer's Map
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Click or hover pins to explore
              </p>
            </div>
          </div>
        </div>

        {/* Details Panel - Desktop */}
        {!isMobile && (
          <div className="w-80 min-w-80 bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            {displayLocation ? (
              <LocationDetails 
                location={displayLocation} 
                onClose={handleCloseDetails}
                isMobile={false}
              />
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
                <MapPinIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Explore the Map</h3>
                <p className="text-sm">
                  Click or hover over the pins to discover amazing locations and their stories.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Details Panel */}
      {isMobile && selectedLocation && (
        <div className="w-full">
            <LocationDetails 
                location={selectedLocation} 
                onClose={handleCloseDetails}
                isMobile={true}
            />
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;