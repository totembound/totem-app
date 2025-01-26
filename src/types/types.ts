export enum Species {
    Goose,
    Otter,
    Wolf,
    Falcon,
    Beaver,
    Deer,
    Woodpecker,
    Salmon,
    Bear,
    Raven,
    Snake,
    Owl,
    None
}

export enum Color {
    Brown,
    Gray,
    White,
    Tawny,
    Speckled,
    Russet,
    Slate,
    Copper,
    Cream,
    Dappled,
    Golden,
    DarkPurple,
    LightBlue,
    Charcoal,
    EmeraldGreen,
    CrimsonRed,
    DeepSapphire,
    RadiantGold,
    EtherealSilver,
    None
}

export enum Rarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary
}

export interface TotemAttributes {
    species: Species;
    color: Color;
    rarity: Rarity;
    happiness: number;
    experience: number;
    stage: number;
    lastFed: number;
    displayName: string;
    isStaked: boolean;
}

export interface NFTMetadata {
    id: string;
    tokenId: bigint;
    name: string;
    description: string;
    image: string;
    attributes: TotemAttributes;
}

export {}