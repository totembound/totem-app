import CodexSidebar from "./CodexSidebar";

const ShadowDomain = () => {
    return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <CodexSidebar />
        <div className="text-gray-600 dark:text-gray-400">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Shadow Domain
          </h1>
          <p className="text-lg mt-3">
            The <strong>Shadow Domain</strong> is not evil — it is unseen. An eerie realm, the flicker of movement just outside vision. The truth wrapped in mystery. 
          </p>

          <p className="my-3">
            Shadow Totems are cunning, silent, and adaptable. They specialize in misdirection, stealth, and survival, thriving where others falter.
            These spirits dwell in twilight forests, ruins cloaked in mist, and the hidden crags of forgotten places. Their abilities lend themselves to stealth trials, reactive dodging, and counter-attacks. While often misunderstood, they are essential to the balance — knowing when not to act is itself a kind of wisdom.
          </p>

          <div className="rounded-lg">
            <img 
              alt="Shadow Domain"
              src="/domains/shadow-domain.jpg"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
    );
}

export default ShadowDomain;