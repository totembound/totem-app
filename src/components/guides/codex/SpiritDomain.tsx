import CodexSidebar from "./CodexSidebar";

const SpiritDomain = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div className="text-gray-600 dark:text-gray-400">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Spirit Domain
          </h1>
          <p className="text-lg mt-3">
            The <strong>Spirit Domain</strong> is the thread between all things. It weaves unseen paths, connecting life to memory, creature to land, past to future.
          </p>

          <p className="my-3">
            Spirit Totems are rare and enigmatic — their strength lies in harmony and presence, not power. They feel the world’s patterns, and with gentle action, reshape them.
            Spirit-aligned Totems walk between Domains. They often serve as guides, healers, or catalysts in rituals. Their bond to others grants them synergy bonuses, unlocking effects that no Totem can access alone. In battle or expedition, they unify, uplift, and restore — silently shaping fate through unseen means.
          </p>

          <div className="rounded-lg">
            <img 
              alt="Spirit Domain"
              src="/domains/spirit-domain.jpg"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
    );
}

export default SpiritDomain;