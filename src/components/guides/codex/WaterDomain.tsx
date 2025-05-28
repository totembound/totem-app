import CodexSidebar from "./CodexSidebar";

const WaterDomain = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div className="text-gray-600 dark:text-gray-400">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Water Domain
          </h1>
          <p className="text-lg mt-3">
            The <strong>Water Domain</strong> flows between worlds — calm as reflection, fierce as a flood. It is memory and intuition, the quiet murmur of forgotten dreams. 
          </p>

          <p className="my-3">
            Water Totems are wise, introspective, and fluid in motion. They adapt without losing form, shifting to overcome obstacles with grace.
            These spirits are often found in tranquil pools, mist-veiled rivers, or deep within ancient ruins surrounded by reeds. Water-aligned Totems specialize in wisdom-based trials, healing energy, and puzzle-solving tasks. Their strength lies not in resistance, but in understanding. They are the archivists of the spirit realm.
          </p>

          <div className="rounded-lg">
            <img 
              alt="Water Domain"
              src="/domains/water-domain.jpg"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
    );
}

export default WaterDomain;