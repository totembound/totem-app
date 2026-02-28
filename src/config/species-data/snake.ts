import type { SpeciesConfig } from '../../utils/species';

export const snakeData: SpeciesConfig = {
  "id": 10,
  "name": "Snake",
  "fullName": "Stealthy Snake",
  "title": "The Silent Observer",
  "description": "The Snake represents stealth, transformation, and wisdom. It moves unnoticed, striking only when the time is right.",
  "affinity": "Agility",
  "domain": "Air",
  "locationId": 19,
  "available": false,
  "placeholderImage": "/totems/snakeplacecard.png",
  "baseStats": {
    "strength": 5,
    "agility": 12,
    "wisdom": 7
  },
  "stages": [
    "Hatchling",
    "Slitherling",
    "Striker",
    "Warden",
    "Wise Elder"
  ],
  "colors": {}
};
