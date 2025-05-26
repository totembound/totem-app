import RuneCraftingElements from './RuneCraftingElements.json';

export type RuneType = {
  id: number;
  element: string;
  image: string;
  tier?: number;
};

export type ElementData = {
  image: string;
  tier: number;
  description?: string;
  combinations: Record<string, string>;
};

export type ElementsDatabase = {
  elements: Record<string, ElementData>;
};

export const elementsDB: ElementsDatabase = RuneCraftingElements || {
    elements: {
      fire: { image: "/images/runes/fire.png", tier: 1, combinations: {} },
      water: { image: "/images/runes/water.png", tier: 1, combinations: {} },
      earth: { image: "/images/runes/earth.png", tier: 1, combinations: {} },
      air: { image: "/images/runes/air.png", tier: 1, combinations: {} },
    }
  };

export const validateChainReaction = (runeSequence: RuneType[]): string | null => {
    // Get the elements from the runes
    const elements = runeSequence.map(rune => rune.element);
    
    // Start with the first element
    let result = elements[0];
    
    // Sequentially combine with each subsequent element
    for (let i = 1; i < elements.length; i++) {
      const nextElement = elements[i];
      
      // Check if current result can combine with the next element
      const combinations = elementsDB.elements[result]?.combinations || {};
      if (combinations[nextElement]) {
        result = combinations[nextElement];
      } 
      // Also check if the next element can combine with the current result
      else {
        const reverseCombinations = elementsDB.elements[nextElement]?.combinations || {};
        if (reverseCombinations[result]) {
          result = reverseCombinations[result];
        } 
        // If no combination is possible, mark as failed
        else {
          return null;
        }
      }
    }
    return result;
  };