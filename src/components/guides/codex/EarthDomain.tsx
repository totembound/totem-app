import CodexSidebar from "./CodexSidebar";

const EarthDomain = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div className="text-gray-600 dark:text-gray-400">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Earth Domain
          </h1>
          <p className="text-lg mt-3">
            The <strong>Earth Domain</strong> is strength incarnate — rooted, unshaken, and ancient. It speaks in silence, in the grinding of stone and the pulse beneath the soil. 
          </p>

          <p className="my-3">
            Earth Totems are bastions of resilience and might. They carry the weight of ages in their bones and unmoved by storms or flame.
            Dwelling in forests, canyons, and mountainous ridges, Earth-aligned Totems are strong of body and steady of heart. They are often chosen as guardians and protectors, excelling in endurance trials and brute force challenges. These totems embody the power of patience — they do not rush, but they never yield.
          </p>

          <div className="rounded-lg">
            <img 
              alt="Earth Domain"
              src="/domains/earth-domain.jpg"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
    );
}

export default EarthDomain;