/** Achievement definitions (bundled at build time). Source of truth for frontend. */

export interface AchievementMilestone {
    index: number;
    name: string;
    description: string;
    requirement: number;
    badgeUri: string;
}

export interface AchievementDefinition {
    id: string;
    name: string;
    description: string;
    category: number;
    type: number;
    subType: string;
    badgeUri?: string;
    requires?: any[];
    milestones?: AchievementMilestone[];
}

export interface AchievementCategory {
    id: number;
    name: string;
}

export interface AchievementType {
    id: number;
    name: string;
}

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
    { id: 0, name: "Evolution" },
    { id: 1, name: "Collection" },
    { id: 2, name: "Streak" },
    { id: 3, name: "Action" },
    { id: 4, name: "Challenge" },
    { id: 5, name: "Expedition" },
];

export const ACHIEVEMENT_TYPES: AchievementType[] = [
    { id: 0, name: "OneTime" },
    { id: 1, name: "Progression" },
];

export const ACHIEVEMENTS: AchievementDefinition[] = [
    {
        id: "ach_rare-collector",
        name: "Rare Collector",
        description: "The stars align as a Rare totem chooses you — a sign that fortune favors the bold keeper",
        category: 1,
        type: 0,
        subType: "rarity",
        badgeUri: "badges/rarity/rare.png",
    },
    {
        id: "ach_epic-collector",
        name: "Epic Collector",
        description: "An Epic totem's arrival sends tremors through the spirit realm — you've proven worthy of extraordinary power",
        category: 1,
        type: 0,
        subType: "rarity",
        badgeUri: "badges/rarity/epic.png",
    },
    {
        id: "ach_legendary-collector",
        name: "Legendary Collector",
        description: "Legends whisper of this moment — a totem of mythic power has bonded with your spirit",
        category: 1,
        type: 0,
        subType: "rarity",
        badgeUri: "badges/rarity/legendary.png",
    },
    {
        id: "ach_collector-progression",
        name: "Totem Collector",
        description: "Become a legendary collector of mystical totems",
        category: 1,
        type: 1,
        subType: "totems",
        milestones: [
            { index: 0, name: "Chosen Keeper", description: "Your journey begins with your first totem", requirement: 1, badgeUri: "badges/collector/1.png" },
            { index: 1, name: "Novice Curator", description: "With three totems in your collection, you begin to sense the patterns and connections between their energies", requirement: 3, badgeUri: "badges/collector/3.png" },
            { index: 2, name: "Dedicated Keeper", description: "Six totems now resonate within your vault, each one adding to your growing understanding of their mysteries", requirement: 6, badgeUri: "badges/collector/6.png" },
            { index: 3, name: "Established Guardian", description: "Your collection of twelve totems marks you as a serious guardian of these ancient artifacts", requirement: 12, badgeUri: "badges/collector/12.png" },
            { index: 4, name: "Master Curator", description: "With 32 totems, your collection has become a beacon of knowledge, the binary nature of their power grows clearer", requirement: 32, badgeUri: "badges/collector/32.png" },
            { index: 5, name: "Arcane Librarian", description: "64 totems - a collection that resonates with digital precision, your understanding of their interconnected powers deepens", requirement: 64, badgeUri: "badges/collector/64.png" },
            { index: 6, name: "Ethereal Archivist", description: "128 totems unite under your care, their combined energy forming complex patterns of power that few can comprehend", requirement: 128, badgeUri: "badges/collector/128.png" },
            { index: 7, name: "Legendary Sage", description: "You've attained true mastery with 256 totems, your collection is now a living repository of ancient wisdom and digital might", requirement: 256, badgeUri: "badges/collector/256.png" },
        ],
    },
    {
        id: "ach_species-mastery",
        name: "Totem Taxonomist",
        description: "Collect each unique species of totem, building a complete catalogue of their diverse forms",
        category: 1,
        type: 0,
        subType: "species",
        badgeUri: "badges/collection/totem-taxonomist.png",
    },
    {
        id: "ach_affinity-specialist",
        name: "Affinity Specialist",
        description: "Master collecting totems of a single affinity, unlocking deep understanding of their unique properties",
        category: 1,
        type: 1,
        subType: "affinity",
        milestones: [
            { index: 0, name: "Affinity Student", description: "6 totems of the same affinity show your focused interest", requirement: 6, badgeUri: "badges/collection/affinity-student.png" },
            { index: 1, name: "Affinity Scholar", description: "12 totems of one affinity mark you as a dedicated specialist", requirement: 12, badgeUri: "badges/collection/affinity-scholar.png" },
            { index: 2, name: "Affinity Master", description: "24 totems of the same affinity reveal the depths of your specialized knowledge", requirement: 24, badgeUri: "badges/collection/affinity-master.png" },
        ],
    },
    {
        id: "ach_affinity-diversity",
        name: "Affinity Harmonizer",
        description: "Collect rare totems from each affinity to unlock a deeper understanding",
        category: 1,
        type: 0,
        subType: "affinity",
        requires: ["ach_rare-collector"],
        badgeUri: "badges/collection/essence-harmonizer.png",
    },
    {
        id: "ach_domain-specialist",
        name: "Domain Specialist",
        description: "Master collecting totems of a single domain, deepening your connection to their realm of origin",
        category: 1,
        type: 1,
        subType: "domain",
        milestones: [
            { index: 0, name: "Domain Adept", description: "6 totems from one domain mark you as a dedicated student of their mystical origins", requirement: 6, badgeUri: "badges/collection/domain-student.png" },
            { index: 1, name: "Domain Expert", description: "12 totems from one domain, you've become a true authority", requirement: 12, badgeUri: "badges/collection/domain-scholar.png" },
            { index: 2, name: "Domain Sovereign", description: "24 totems from a single domain establish you as a legendary keeper of their realm", requirement: 24, badgeUri: "badges/collection/domain-master.png" },
        ],
    },
    {
        id: "ach_domain-diversity",
        name: "Domain Wayfarer",
        description: "Collect rare totems from all mystical domains to unlock their elemental nature",
        category: 1,
        type: 0,
        subType: "domain",
        requires: ["ach_rare-collector"],
        badgeUri: "badges/collection/domain-wayfarer.png",
    },
    {
        id: "ach_anti-meta-collector",
        name: "Underdog Collector",
        description: "Champions of the overlooked — prove that even humble totems can rise to greatness through devoted care",
        category: 1,
        type: 1,
        subType: "rarity",
        milestones: [
            { index: 0, name: "Humble Ascendant", description: "Evolve 3 common totems to maximum stage", requirement: 3, badgeUri: "badges/collection/humble-ascendant.png" },
            { index: 1, name: "Uncommon Champion", description: "Evolve 3 uncommon totems to maximum stage", requirement: 3, badgeUri: "badges/collection/uncommon-champion.png" },
            { index: 2, name: "Rare Virtuoso", description: "Evolve 3 rare totems to maximum stage", requirement: 3, badgeUri: "badges/collection/rare-virtuoso.png" },
        ],
    },
    {
        id: "ach_seasonal-collector",
        name: "Seasonal Spirit Keeper",
        description: "Collect special edition totems during seasonal events, preserving the timeline of mystical discoveries",
        category: 1,
        type: 1,
        subType: "seasonal",
        milestones: [
            { index: 0, name: "Seasonal Debut", description: "Your first seasonal totem marks the beginning of your temporal collection", requirement: 1, badgeUri: "badges/seasonal/debut.png" },
            { index: 1, name: "Seasonal Curator", description: "Three seasonal totems show your growing dedication to the preservation of mystical artifacts", requirement: 3, badgeUri: "badges/seasonal/curator.png" },
            { index: 2, name: "Seasonal Archiver", description: "Six seasonal totems make you a chronicler of rare and fleeting moments in time", requirement: 6, badgeUri: "badges/seasonal/archiver.png" },
            { index: 3, name: "Eternal Timekeeper", description: "Twelve seasonal totems secure your legacy as a guardian of history's magical echoes", requirement: 12, badgeUri: "badges/seasonal/timekeeper.png" },
        ],
    },
    {
        id: "ach_rare-evolution",
        name: "Rare Elder Evolution",
        description: "Guide a Rare totem through every stage of growth to achieve the wisdom of an Elder",
        category: 0,
        type: 0,
        subType: "rarity_evolution",
        requires: ["ach_rare-collector"],
        badgeUri: "badges/evolution/rare.png",
    },
    {
        id: "ach_epic-evolution",
        name: "Epic Elder Evolution",
        description: "Push an Epic totem beyond its already formidable power to reach the revered Elder stage",
        category: 0,
        type: 0,
        subType: "rarity_evolution",
        requires: ["ach_epic-collector"],
        badgeUri: "badges/evolution/epic.png",
    },
    {
        id: "ach_legendary-evolution",
        name: "Legendary Elder Evolution",
        description: "The ultimate test of a keeper — nurture a Legendary totem to its full Elder potential",
        category: 0,
        type: 0,
        subType: "rarity_evolution",
        requires: ["ach_legendary-collector"],
        badgeUri: "badges/evolution/legendary.png",
    },
    {
        id: "ach_evolution-progression",
        name: "Evolution Mastery",
        description: "Master the art of evolving your Totem through different stages",
        category: 0,
        type: 1,
        subType: "evolution",
        milestones: [
            { index: 0, name: "First Evolution", description: "Evolve your first totem to stage 2", requirement: 1, badgeUri: "badges/evolution/1.png" },
            { index: 1, name: "Adept Evolution", description: "Evolve a totem to stage 3", requirement: 2, badgeUri: "badges/evolution/2.png" },
            { index: 2, name: "Master Evolution", description: "Evolve a totem to stage 4 - Unlocks Epic rarity", requirement: 3, badgeUri: "badges/evolution/3.png" },
            { index: 3, name: "Elder Evolution", description: "Evolve a totem to stage 5 - Unlocks Legendary rarity", requirement: 4, badgeUri: "badges/evolution/4.png" },
        ],
    },
    {
        id: "ach_prestige-progression",
        name: "Prestige Collective",
        description: "Accumulate prestige levels across your totems, showcasing your mastery of totem evolution and growth",
        category: 0,
        type: 1,
        subType: "prestige",
        requires: [{ achievement: "ach_evolution-progression", milestoneIndex: 3 }],
        milestones: [
            { index: 0, name: "Emerging Collective", description: "Your first totem begins to transcend their elder stage", requirement: 1, badgeUri: "badges/prestige/collective1.png" },
            { index: 1, name: "Collective Wisdom", description: "Your totems are gaining collective experience, showing the depth of your nurturing and training", requirement: 3, badgeUri: "badges/prestige/collective3.png" },
            { index: 2, name: "Legendary Guardians", description: "Your totem collection begins to resonate with ancient knowledge, each totem contributing to a greater mystical understanding", requirement: 5, badgeUri: "badges/prestige/collective5.png" },
            { index: 3, name: "Ethereal Convergence", description: "Your totems are evolving beyond individual limitations, creating a powerful collective consciousness", requirement: 10, badgeUri: "badges/prestige/collective10.png" },
            { index: 4, name: "Cosmic Resonance", description: "Your totem collection has reached a level of prestige that few thought possible, weaving a tapestry of magical potential", requirement: 25, badgeUri: "badges/prestige/collective25.png" },
            { index: 5, name: "Realm Shapers", description: "Your totems have collectively ascended to a plane of existence that challenges the very foundations of magical understanding", requirement: 50, badgeUri: "badges/prestige/collective50.png" },
            { index: 6, name: "Infinite Pantheon", description: "A legendary achievement that represents the ultimate collective evolution of totems, transcending all known boundaries of magical potential", requirement: 100, badgeUri: "badges/prestige/collective100.png" },
        ],
    },
    {
        id: "ach_color-collector-evolution",
        name: "Chromatic Mastery",
        description: "A true artist of evolution — raise totems of every color to their Elder form, painting a masterpiece of chromatic power",
        category: 0,
        type: 0,
        subType: "color",
        requires: [{ achievement: "ach_evolution-progression", milestoneIndex: 3 }],
        badgeUri: "badges/evolution/chromatic.png",
    },
    {
        id: "ach_mixed-affinity-evolution",
        name: "Balanced Spirit Keeper",
        description: "Evolve totems with different affinities to their maximum potential",
        category: 0,
        type: 1,
        subType: "affinity",
        milestones: [
            { index: 0, name: "Dual Affinity Harmony", description: "Evolve totems from 2 different affinities", requirement: 2, badgeUri: "badges/evolution/dual-affinity.png" },
            { index: 1, name: "Triforce of Spirits", description: "Evolve totems from 3 different affinities", requirement: 3, badgeUri: "badges/evolution/tri-affinity.png" },
        ],
    },
    {
        id: "ach_login-progression",
        name: "Daily Devotion",
        description: "Return faithfully each day, building an unbreakable bond with your totems through consistent devotion",
        category: 2,
        type: 1,
        subType: "daily_login",
        milestones: [
            { index: 0, name: "Week Warrior", description: "Maintain a 7-day login streak", requirement: 7, badgeUri: "badges/streak/7.png" },
            { index: 1, name: "Monthly Master", description: "Maintain a 30-day login streak", requirement: 30, badgeUri: "badges/streak/30.png" },
            { index: 2, name: "Seasonal Spirit", description: "Maintain a 90-day login streak", requirement: 90, badgeUri: "badges/streak/90.png" },
            { index: 3, name: "Seasonal Guardian", description: "Maintain a 180-day (6-month) login streak", requirement: 180, badgeUri: "badges/streak/180.png" },
            { index: 4, name: "Eternal Spirit Keeper", description: "Maintain a 365-day (1-year) login streak", requirement: 365, badgeUri: "badges/streak/365.png" },
        ],
    },
    {
        id: "ach_persistence-reward",
        name: "Timeless Keeper",
        description: "The greatest keepers are those who endure — your unwavering presence strengthens the bond between realms",
        category: 2,
        type: 1,
        subType: "long_term_engagement",
        milestones: [
            { index: 0, name: "First Moon", description: "Consistent caretaker for 30 days", requirement: 30, badgeUri: "badges/persistence/first-moon.png" },
            { index: 1, name: "Cycle Master", description: "Consistent caretaker for 90 days", requirement: 90, badgeUri: "badges/persistence/cycle-master.png" },
            { index: 2, name: "Eternal Spirit", description: "Demonstrate unwavering commitment for a full year", requirement: 365, badgeUri: "badges/persistence/eternal-spirit.png" },
        ],
    },
    {
        id: "ach_referral-master",
        name: "Totem Recruiter",
        description: "Spread the call across realms — every new keeper you guide strengthens the bonds that hold our world together",
        category: 2,
        type: 1,
        subType: "referral",
        milestones: [
            { index: 0, name: "First Companion", description: "Refer your first friend", requirement: 1, badgeUri: "badges/community/first-referral.png" },
            { index: 1, name: "Totem Spreader", description: "Refer 5 friends who join the game", requirement: 5, badgeUri: "badges/community/totem-spreader.png" },
            { index: 2, name: "Spirit Network", description: "Refer 25 friends who join the game", requirement: 25, badgeUri: "badges/community/spirit-network.png" },
        ],
    },
    {
        id: "ach_community-ambassador",
        name: "Community Ambassador",
        description: "Step beyond your own journey to uplift fellow keepers — your voice echoes through the community halls",
        category: 2,
        type: 1,
        subType: "social_engagement",
        milestones: [
            { index: 0, name: "First Connection", description: "Join the official Discord", requirement: 1, badgeUri: "badges/community/first-connection.png" },
            { index: 1, name: "Social Butterfly", description: "Participate in 10 community events", requirement: 10, badgeUri: "badges/community/social-butterfly.png" },
            { index: 2, name: "Community Leader", description: "Participate in 50 community events", requirement: 50, badgeUri: "badges/community/leader.png" },
        ],
    },
    {
        id: "ach_feed-progression",
        name: "Feeding Mastery",
        description: "Nourish your totems with unwavering dedication, from first meals to becoming a cosmic provider of life-giving energy",
        category: 3,
        type: 1,
        subType: "feed_count",
        milestones: [
            { index: 0, name: "Caring Keeper", description: "Feed your totem 100 times", requirement: 100, badgeUri: "badges/action/feed/100.png" },
            { index: 1, name: "Diligent Caretaker", description: "Feed your totem 500 times", requirement: 500, badgeUri: "badges/action/feed/500.png" },
            { index: 2, name: "Devoted Guardian", description: "Feed your totem 1,000 times", requirement: 1000, badgeUri: "badges/action/feed/1000.png" },
            { index: 3, name: "Everlasting Nurturer", description: "Feed your totem 5,000 times", requirement: 5000, badgeUri: "badges/action/feed/5000.png" },
            { index: 4, name: "Eternal Provider", description: "Feed your totem 10,000 times", requirement: 10000, badgeUri: "badges/action/feed/10000.png" },
            { index: 5, name: "Cosmic Nurturer", description: "Your dedication to feeding transcends mortal understanding", requirement: 25000, badgeUri: "badges/action/feed/25000.png" },
            { index: 6, name: "Primordial Sustainer", description: "You've become one with the life-giving essence of nourishment", requirement: 50000, badgeUri: "badges/action/feed/50000.png" },
            { index: 7, name: "Omnipotent Nurturer", description: "Your feeding prowess has become a fundamental force of creation itself", requirement: 100000, badgeUri: "badges/action/feed/100000.png" },
        ],
    },
    {
        id: "ach_treat-progression",
        name: "Treating Mastery",
        description: "Your healing touch grows stronger with each treatment, evolving from gentle care to transcendent restoration",
        category: 3,
        type: 1,
        subType: "treat_count",
        milestones: [
            { index: 0, name: "Gentle Healer", description: "Treat your totem 100 times", requirement: 100, badgeUri: "badges/action/treat/100.png" },
            { index: 1, name: "Soothing Spirit", description: "Treat your totem 500 times", requirement: 500, badgeUri: "badges/action/treat/500.png" },
            { index: 2, name: "Compassionate Guardian", description: "Treat your totem 1,000 times", requirement: 1000, badgeUri: "badges/action/treat/1000.png" },
            { index: 3, name: "Blessed Medic", description: "Treat your totem 5,000 times", requirement: 5000, badgeUri: "badges/action/treat/5000.png" },
            { index: 4, name: "Divine Healer", description: "Treat your totem 10,000 times", requirement: 10000, badgeUri: "badges/action/treat/10000.png" },
            { index: 5, name: "Ethereal Healer", description: "Your healing touch resonates with the deepest mystical energies", requirement: 25000, badgeUri: "badges/action/treat/25000.png" },
            { index: 6, name: "Immortal Caretaker", description: "Your compassion has become a force that defies the boundaries of existence", requirement: 50000, badgeUri: "badges/action/treat/50000.png" },
            { index: 7, name: "Eternal Mender", description: "Your healing transcends time, space, and the very essence of existence", requirement: 100000, badgeUri: "badges/action/treat/100000.png" },
        ],
    },
    {
        id: "ach_train-progression",
        name: "Training Mastery",
        description: "Forge your totems through rigorous training, ascending from apprentice drills to reality-bending mastery",
        category: 3,
        type: 1,
        subType: "train_count",
        milestones: [
            { index: 0, name: "Aspiring Trainer", description: "Train your totem 100 times", requirement: 100, badgeUri: "badges/action/train/100.png" },
            { index: 1, name: "Skilled Instructor", description: "Train your totem 500 times", requirement: 500, badgeUri: "badges/action/train/500.png" },
            { index: 2, name: "Master Mentor", description: "Train your totem 1,000 times", requirement: 1000, badgeUri: "badges/action/train/1000.png" },
            { index: 3, name: "Legendary Sensei", description: "Train your totem 5,000 times", requirement: 5000, badgeUri: "badges/action/train/5000.png" },
            { index: 4, name: "Totem Whisperer", description: "Train your totem 10,000 times", requirement: 10000, badgeUri: "badges/action/train/10000.png" },
            { index: 5, name: "Quantum Mentor", description: "Your training techniques bend the very fabric of spiritual potential", requirement: 25000, badgeUri: "badges/action/train/25000.png" },
            { index: 6, name: "Transcendent Sensei", description: "You've unlocked the ultimate secrets of spiritual cultivation", requirement: 50000, badgeUri: "badges/action/train/50000.png" },
            { index: 7, name: "Reality Weaver", description: "Your training has evolved beyond skill - you now reshape spiritual potential at will", requirement: 100000, badgeUri: "badges/action/train/100000.png" },
        ],
    },
    {
        id: "ach_balanced-care",
        name: "Holistic Caretaker",
        description: "True mastery lies in balance — nurture your totems equally through feeding, training, and treating to unlock deeper bonds",
        category: 3,
        type: 1,
        subType: "balanced_actions",
        milestones: [
            { index: 0, name: "Mindful Keeper", description: "You are learning the fundamentals of nurturing these mystical beings", requirement: 10, badgeUri: "badges/action/balanced-care/10.png" },
            { index: 1, name: "Harmony Initiator", description: "Perform 50 balanced actions across feed, train, and treat", requirement: 50, badgeUri: "badges/action/balanced-care/50.png" },
            { index: 2, name: "Attentive Guardian", description: "A hundred care actions demonstrate your growing dedication to the well-being of your totems", requirement: 100, badgeUri: "badges/action/balanced-care/100.png" },
            { index: 3, name: "Spirit Harmonizer", description: "Perform 250 perfectly balanced actions", requirement: 250, badgeUri: "badges/action/balanced-care/250.png" },
            { index: 4, name: "Balanced Nurturer", description: "Your consistent care creates harmony, 500 actions show your deep commitment to totem wellness", requirement: 500, badgeUri: "badges/action/balanced-care/500.png" },
            { index: 5, name: "Devoted Custodian", description: "A thousand acts of care mark you as a true guardian, your totems thrive under your watchful guidance", requirement: 1000, badgeUri: "badges/action/balanced-care/1000.png" },
            { index: 6, name: "Enlightened Caregiver", description: "Your dedication transcends mere maintenance, each of your 2,500 actions flows with intuitive understanding", requirement: 2500, badgeUri: "badges/action/balanced-care/2500.png" },
            { index: 7, name: "Mystic Cultivator", description: "Five thousand care actions have attuned you to the deepest needs of your totems", requirement: 5000, badgeUri: "badges/action/balanced-care/5000.png" },
            { index: 8, name: "Legendary Steward", description: "Ten thousand acts of nurturing mark you as a true master of totem care", requirement: 10000, badgeUri: "badges/action/balanced-care/10000.png" },
        ],
    },
    {
        id: "ach_challenge-initiate",
        name: "Challenge Initiate",
        description: "Face your first challenge and begin your journey to greatness",
        category: 4,
        type: 0,
        subType: "challenge",
        badgeUri: "badges/challenge/initiate.png",
    },
    {
        id: "ach_challenge-progression",
        name: "Challenge Master",
        description: "Each trial tempers your resolve — push through ever-greater challenges to forge an unbreakable spirit",
        category: 4,
        type: 1,
        subType: "challenge",
        requires: ["ach_challenge-initiate"],
        milestones: [
            { index: 0, name: "Challenge Seeker", description: "Complete 10 challenges", requirement: 10, badgeUri: "badges/challenge/10.png" },
            { index: 1, name: "Challenge Apprentice", description: "Complete 100 challenges", requirement: 100, badgeUri: "badges/challenge/100.png" },
            { index: 2, name: "Challenge Adept", description: "Complete 1,000 challenges - your dedication to mastery begins to show", requirement: 1000, badgeUri: "badges/challenge/1000.png" },
            { index: 3, name: "Challenge Expert", description: "Complete 5,000 challenges - your skill and strategy set you apart from the rest", requirement: 5000, badgeUri: "badges/challenge/5000.png" },
            { index: 4, name: "Challenge Master", description: "Complete 10,000 challenges - others now look to you for guidance and inspiration", requirement: 10000, badgeUri: "badges/challenge/10000.png" },
            { index: 5, name: "Challenge Grandmaster", description: "Complete 50,000 challenges - your achievements inspire awe and admiration", requirement: 50000, badgeUri: "badges/challenge/50000.png" },
            { index: 6, name: "Challenge Legend", description: "Complete 100,000 challenges - your name will be forever etched in the annals of history", requirement: 100000, badgeUri: "badges/challenge/100000.png" },
        ],
    },
    {
        id: "ach_expedition-explorer",
        name: "Expedition Explorer",
        description: "Begin your journey as an expedition explorer",
        category: 5,
        type: 0,
        subType: "expedition",
        badgeUri: "badges/expedition/explorer.png",
    },
    {
        id: "ach_expedition-progression",
        name: "Expedition Expert",
        description: "The unknown calls to those brave enough to answer — chart your path through ever more perilous territories",
        category: 5,
        type: 1,
        subType: "expedition",
        requires: ["ach_expedition-explorer"],
        milestones: [
            { index: 0, name: "Expedition Seeker", description: "Complete 10 expeditions", requirement: 10, badgeUri: "badges/expedition/10.png" },
            { index: 1, name: "Expedition Scout", description: "Complete 50 expeditions", requirement: 50, badgeUri: "badges/expedition/50.png" },
            { index: 2, name: "Expedition Pathfinder", description: "Complete 250 expeditions - master the basics of exploration", requirement: 250, badgeUri: "badges/expedition/250.png" },
            { index: 3, name: "Expedition Explorer", description: "Complete 1,000 expeditions - forge new paths through unknown territories", requirement: 1000, badgeUri: "badges/expedition/1000.png" },
            { index: 4, name: "Expedition Wayfarer", description: "Complete 2,000 expeditions - traverse the most challenging terrains", requirement: 2000, badgeUri: "badges/expedition/2000.png" },
            { index: 5, name: "Expedition Paragon", description: "Complete 5,000 expeditions - achieve mastery of exploration", requirement: 5000, badgeUri: "badges/expedition/5000.png" },
            { index: 6, name: "Expedition Legend", description: "Complete 10,000 expeditions - you've mastered every path and discovered every secret", requirement: 10000, badgeUri: "badges/expedition/10000.png" },
        ],
    },
];

export function getAchievementById(id: string): AchievementDefinition | undefined {
    return ACHIEVEMENTS.find((a) => a.id === id);
}
