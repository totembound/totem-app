/** Shop configuration (bundled at build time). Source of truth for frontend. */

export interface EssenceExchangeBundle {
    id: string;
    gems: number;
    essence: number;
    bonus: number;
    bonusNote: string | null;
    label: string;
    popular?: boolean;
}

export interface SpecialOfferBundle {
    id: string;
    bundleId: number;
    name: string;
    description: string;
    gemCost: number;
    priceUsd: string;
    essence: number;
    includesTotem: boolean;
    totemRarity: string;
    dailyLimit: number;
    category: string;
    enabled: boolean;
}

export interface GemPackage {
    id: string;
    name: string;
    price: number;
    priceFormatted: string;
    gems: number;
    bonus: number;
    bonusFormatted: string | null;
    category: string;
    enabled: boolean;
}

export interface MonthlySeriesBundle {
    id: string;
    name: string;
    description: string;
    price: number;
    priceFormatted: string;
    gems: number;
    essence: number;
    bonus: number;
    bonusFormatted: string;
    limitedTotems: number;
    exclusiveTitle: string | null;
    exclusiveBadge: boolean;
    category: string;
    dailyLimit: number;
    enabled: boolean;
}

export interface LimitedTotemSeries {
    description: string;
    schedule: string;
    availabilityDays: number;
    maxPerUser: number;
    currentSeries: null;
    upcomingSeries: unknown[];
}

export const GEM_TO_ESSENCE_RATE = 5 as const;

export const ESSENCE_EXCHANGE_BUNDLES: EssenceExchangeBundle[] = [
    { id: "exchange_small", gems: 100, essence: 500, bonus: 0, bonusNote: null, label: "1 Totem" },
    { id: "exchange_medium", gems: 500, essence: 2750, bonus: 10, bonusNote: "+10%", label: "5+ Totems", popular: true },
    { id: "exchange_large", gems: 1000, essence: 6000, bonus: 20, bonusNote: "+20%", label: "12 Totems" },
    { id: "exchange_mega", gems: 2500, essence: 16250, bonus: 30, bonusNote: "+30%", label: "32+ Totems" },
];

export const SPECIAL_OFFER_BUNDLES: SpecialOfferBundle[] = [
    {
        id: "bundle_newplayer",
        bundleId: 0,
        name: "New Player Bundle",
        description: "500 Essence and an uncommon spirit totem!",
        gemCost: 500,
        priceUsd: "$5",
        essence: 500,
        includesTotem: true,
        totemRarity: "uncommon",
        dailyLimit: 1,
        category: "special",
        enabled: true,
    },
    {
        id: "bundle_rare",
        bundleId: 1,
        name: "Daily Rare Special",
        description: "750 Essence and guaranteed rare totem!",
        gemCost: 1000,
        priceUsd: "$10",
        essence: 750,
        includesTotem: true,
        totemRarity: "rare",
        dailyLimit: 1,
        category: "special",
        enabled: true,
    },
    {
        id: "bundle_epic",
        bundleId: 2,
        name: "Daily Epic Special",
        description: "1,000 Essence and guaranteed epic totem!",
        gemCost: 2500,
        priceUsd: "$25",
        essence: 1000,
        includesTotem: true,
        totemRarity: "epic",
        dailyLimit: 1,
        category: "special",
        enabled: true,
    },
    {
        id: "bundle_monthly",
        bundleId: 3,
        name: "Monthly Collector Series",
        description: "2,000 Essence and exclusive limited monthly totem!",
        gemCost: 5000,
        priceUsd: "$50",
        essence: 2000,
        includesTotem: true,
        totemRarity: "exclusive",
        dailyLimit: 1,
        category: "monthly",
        enabled: true,
    },
];

export const GEM_PACKAGES: GemPackage[] = [
    {
        id: "pkg_starter",
        name: "Starter Pack",
        price: 499,
        priceFormatted: "$4.99",
        gems: 500,
        bonus: 0,
        bonusFormatted: null,
        category: "standard",
        enabled: true,
    },
    {
        id: "pkg_popular",
        name: "Popular Pack",
        price: 999,
        priceFormatted: "$9.99",
        gems: 1100,
        bonus: 10,
        bonusFormatted: "+10%",
        category: "standard",
        enabled: true,
    },
    {
        id: "pkg_best_value",
        name: "Best Value",
        price: 2499,
        priceFormatted: "$24.99",
        gems: 3000,
        bonus: 20,
        bonusFormatted: "+20%",
        category: "standard",
        enabled: true,
    },
    {
        id: "pkg_ultimate",
        name: "Ultimate Pack",
        price: 4999,
        priceFormatted: "$49.99",
        gems: 6500,
        bonus: 30,
        bonusFormatted: "+30%",
        category: "standard",
        enabled: true,
    },
];

export const MONTHLY_SERIES_BUNDLES: MonthlySeriesBundle[] = [
    {
        id: "bundle_collector",
        name: "Collector Bundle",
        description: "Monthly collector bundle with 1 exclusive limited totem",
        price: 7499,
        priceFormatted: "$74.99",
        gems: 10000,
        essence: 50000,
        bonus: 43,
        bonusFormatted: "+43%",
        limitedTotems: 1,
        exclusiveTitle: null,
        exclusiveBadge: false,
        category: "collector",
        dailyLimit: 1,
        enabled: false,
    },
    {
        id: "bundle_founder",
        name: "Founder Bundle",
        description: "Premium bundle with exclusive Founder title",
        price: 9999,
        priceFormatted: "$99.99",
        gems: 15000,
        essence: 75000,
        bonus: 50,
        bonusFormatted: "+50%",
        limitedTotems: 1,
        exclusiveTitle: "Founder",
        exclusiveBadge: false,
        category: "collector",
        dailyLimit: 1,
        enabled: false,
    },
    {
        id: "bundle_legendary",
        name: "Legendary Bundle",
        description: "Ultimate bundle with 2 limited totems, Legend title, and exclusive badge",
        price: 14999,
        priceFormatted: "$149.99",
        gems: 25000,
        essence: 125000,
        bonus: 67,
        bonusFormatted: "+67%",
        limitedTotems: 2,
        exclusiveTitle: "Legend",
        exclusiveBadge: true,
        category: "collector",
        dailyLimit: 1,
        enabled: false,
    },
];

export const LIMITED_TOTEM_SERIES: LimitedTotemSeries = {
    description: "Monthly limited totem releases. Each month features a new exclusive color/species combo.",
    schedule: "First of each month",
    availabilityDays: 30,
    maxPerUser: 1,
    currentSeries: null,
    upcomingSeries: [],
};
