import {
  Backpack,
  Globe,
  Mountain,
  PawPrint,
  Shapes,
  Compass,
  Star,
  Swords,
  Map as MapIcon
} from "lucide-react";

// Define types for our navigation structure
export interface NavSubItemType {
  title: string;
  path: string;
}

export interface NavItemType {
  title: string;
  icon: React.ReactNode;
  path: string;
  children?: NavSubItemType[];
}

// Predefined navigation items for Codex
export const codexNavItems: NavItemType[] = [
  {
    title: "Totems",
    icon: <PawPrint size={18} />,
    path: "/guides/codex/totems",
    children: [
      {
        title: "Goose",
        path: "/guides/codex/totems/goose"
      },
      {
        title: "Otter",
        path: "/guides/codex/totems/otter"
      },
      {
        title: "Wolf",
        path: "/guides/codex/totems/wolf"
      },
      {
        title: "Falcon",
        path: "/guides/codex/totems/falcon"
      },
      {
        title: "Beaver",
        path: "/guides/codex/totems/beaver"
      },
      {
        title: "Deer",
        path: "/guides/codex/totems/deer"
      },
      {
        title: "Woodpecker",
        path: "/guides/codex/totems/woodpecker"
      },
      {
        title: "Turtle",
        path: "/guides/codex/totems/turtle"
      },
      {
        title: "Bear",
        path: "/guides/codex/totems/bear"
      },
      {
        title: "Raven",
        path: "/guides/codex/totems/raven"
      },
      {
        title: "Snake",
        path: "/guides/codex/totems/snake"
      },
      {
        title: "Owl",
        path: "/guides/codex/totems/owl"
      },
    ],
  },
  {
    title: "Traits",
    icon: <Star size={18} />,
    path: "/guides/codex/traits",
  },
  {
    title: "Domains",
    icon: <Globe size={18} />,
    path: "/guides/codex/domains",
    children: [
      {
        title: "Air",
        path: "/guides/codex/domains/air"
      },
      {
        title: "Earth",
        path: "/guides/codex/domains/earth"
      },
      {
        title: "Water",
        path: "/guides/codex/domains/water"
      },
      {
        title: "Fire",
        path: "/guides/codex/domains/fire"
      },
      {
        title: "Spirit",
        path: "/guides/codex/domains/spirit"
      },
      {
        title: "Shadow",
        path: "/guides/codex/domains/shadow"
      }
    ]
  },
  {
    title: "Habitats",
    icon: <Mountain size={18} />,
    path: "/guides/codex/habitats",
  },
  {
    title: "Map",
    icon: <Compass size={18} />,
    path: "/guides/codex/map",
  },
  {
    title: "Challenges",
    icon: <Swords size={18} />,
    path: "/guides/codex/challenges",
  },
  {
    title: "Expeditions",
    icon: <MapIcon size={18} />,
    path: "/guides/codex/expeditions",
  },
  {
    title: "Runes",
    icon: <Shapes size={18} />,
    path: "/guides/codex/runes",
  },
  {
    title: "Gear",
    icon: <Backpack size={18} />,
    path: "/guides/codex/gear",
  },
];