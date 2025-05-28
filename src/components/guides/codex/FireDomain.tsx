import CodexSidebar from "./CodexSidebar";

const FireDomain = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div className="text-gray-600 dark:text-gray-400">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Fire Domain
          </h1>
          <p className="text-lg mt-3">
            The <strong>Fire Domain</strong> is unrelenting — passion, power, destruction, and rebirth. It is a spark that ignites change, a flame that either purifies or consumes.
          </p>

          <p className="my-3">
            Fire Totems are fierce and energetic, driven by instinct and bold emotion. They burn hot and fast, favoring direct action over careful thought.
            These Totems are often found near volcanic ridges, ember-lit shrines, or under blazing desert skies. Fire-aligned Totems dominate strength-based and momentum-driven trials, unleashing bursts of power and fury. Though hard to tame, they carry the essence of transformation within them.
          </p>

          <div className="rounded-lg">
            <img 
              alt="Fire Domain"
              src="/domains/fire-domain.jpg"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
    );
}

export default FireDomain;