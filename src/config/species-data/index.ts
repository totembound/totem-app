import type { SpeciesConfig } from '../../utils/species';
import { bearData } from './bear';
import { beaverData } from './beaver';
import { deerData } from './deer';
import { falconData } from './falcon';
import { gooseData } from './goose';
import { otterData } from './otter';
import { owlData } from './owl';
import { ravenData } from './raven';
import { snakeData } from './snake';
import { turtleData } from './turtle';
import { wolfData } from './wolf';
import { woodpeckerData } from './woodpecker';

export const SPECIES_DATA: ReadonlyMap<string, SpeciesConfig> = new Map([
  ['bear', bearData],
  ['beaver', beaverData],
  ['deer', deerData],
  ['falcon', falconData],
  ['goose', gooseData],
  ['otter', otterData],
  ['owl', owlData],
  ['raven', ravenData],
  ['snake', snakeData],
  ['turtle', turtleData],
  ['wolf', wolfData],
  ['woodpecker', woodpeckerData],
]);

export {
  bearData,
  beaverData,
  deerData,
  falconData,
  gooseData,
  otterData,
  owlData,
  ravenData,
  snakeData,
  turtleData,
  wolfData,
  woodpeckerData,
};
