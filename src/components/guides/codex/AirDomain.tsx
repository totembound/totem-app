import CodexSidebar from "./CodexSidebar";

const AirDomain = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div className="text-gray-600 dark:text-gray-400">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Air Domain
          </h1>
          <p className="text-lg mt-3">
            The <strong>Air Domain</strong> is the breath of the world — restless, weightless, and eternal. It carries whispers from distant lands, guiding those who listen closely.     
          </p>

          <p className="my-3">
            Air Totems are attuned to movement, perception, and clarity. They are swift and light-footed, often elusive and elegant in form. Where others charge, Air spirits glide. Where others strike, they dodge.
            The skies above the Totem Lands shimmer with wind-carved shrines, floating stones, and elemental trails. Totems of the Air Domain often excel in agility-based trials and reflex challenges, and their spirits are known for guiding the lost. In battle or journey, they are the scouts, messengers, and visionaries.
          </p>

          <div className="rounded-lg">
            <img 
              alt="Air Domain"
              src="/domains/air-domain.jpg"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
    );
}

export default AirDomain;