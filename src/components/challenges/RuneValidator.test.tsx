import { describe, it, expect, test } from '@jest/globals';
import { elementsDB, validateChainReaction, RuneType } from './RuneValidator';

describe('RuneValidator Tests', () => {
  
  describe('Elements Database Validation', () => {
    
    it('should have all basic elements (fire, water, earth, air, spirit)', () => {
      const basicElements = ['fire', 'water', 'earth', 'air', 'spirit'];
      basicElements.forEach(element => {
        expect(elementsDB.elements[element]).toBeDefined();
        expect(elementsDB.elements[element].tier).toBe(1);
      });
    });

    it('should have valid image paths for all elements', () => {
      Object.entries(elementsDB.elements).forEach(([elementName, elementData]) => {
        expect(elementData.image).toBeDefined();
        expect(typeof elementData.image).toBe('string');
        expect(elementData.image.length).toBeGreaterThan(0);
      });
    });

    it('should have valid tier values (1-4)', () => {
      Object.entries(elementsDB.elements).forEach(([elementName, elementData]) => {
        expect(elementData.tier).toBeDefined();
        expect(elementData.tier).toBeGreaterThan(0);
        expect(elementData.tier).toBeLessThanOrEqual(4);
      });
    });

    it('should have all combination results exist as elements', () => {
      Object.entries(elementsDB.elements).forEach(([elementName, elementData]) => {
        Object.entries(elementData.combinations).forEach(([combinesWith, result]) => {
          expect(elementsDB.elements[result]).toBeDefined();
          expect(elementsDB.elements[combinesWith]).toBeDefined();
        });
      });
    });

    it('should have tier 4 elements with no combinations (final tier)', () => {
      const tier4Elements = Object.entries(elementsDB.elements)
        .filter(([_, data]) => data.tier === 4);
      
      tier4Elements.forEach(([elementName, elementData]) => {
        expect(Object.keys(elementData.combinations).length).toBe(0);
      });
    });

    it('should have tier 1 elements with combinations only to tier 2', () => {
      const tier1Elements = Object.entries(elementsDB.elements)
        .filter(([_, data]) => data.tier === 1);
      
      tier1Elements.forEach(([elementName, elementData]) => {
        Object.values(elementData.combinations).forEach(result => {
          expect(elementsDB.elements[result].tier).toBe(2);
        });
      });
    });

    it('should have symmetric combinations where they exist', () => {
      // Check if A + B = C, then B + A should also = C (where it exists)
      const asymmetricCombinations: string[] = [];
      
      Object.entries(elementsDB.elements).forEach(([elementA, dataA]) => {
        Object.entries(dataA.combinations).forEach(([elementB, result]) => {
          const dataB = elementsDB.elements[elementB];
          const reverseResult = dataB.combinations[elementA];
          
          if (reverseResult && reverseResult !== result) {
            asymmetricCombinations.push(`${elementA} + ${elementB} = ${result}, but ${elementB} + ${elementA} = ${reverseResult}`);
          }
        });
      });
      
      expect(asymmetricCombinations).toEqual([]);
    });

    it('should not have self-referencing combinations', () => {
      Object.entries(elementsDB.elements).forEach(([elementName, elementData]) => {
        expect(elementData.combinations[elementName]).toBeUndefined();
        Object.values(elementData.combinations).forEach(result => {
          expect(result).not.toBe(elementName);
        });
      });
    });

    it('should have descriptions for tier 2+ elements', () => {
      const tier2PlusElements = Object.entries(elementsDB.elements)
        .filter(([_, elementData]) => elementData.tier > 1);
      
      const elementsWithoutDescriptions = tier2PlusElements.filter(([_, elementData]) => 
        !elementData.description || 
        typeof elementData.description !== 'string' || 
        elementData.description.length === 0
      );
      
      expect(tier2PlusElements.length).toBeGreaterThan(0); // Ensure we have tier 2+ elements to test
      expect(elementsWithoutDescriptions).toEqual([]);
    });
  });

  describe('Chain Reaction Validation', () => {
    
    it('should return undefined for empty sequence', () => {
      const result = validateChainReaction([]);
      expect(result).toBeUndefined();
    });

    it('should return the element for single rune', () => {
      const rune: RuneType = { id: 1, element: 'fire', image: '/test.png' };
      const result = validateChainReaction([rune]);
      expect(result).toBe('fire');
    });

    it('should validate basic two-element combinations', () => {
      const fireRune: RuneType = { id: 1, element: 'fire', image: '/fire.png' };
      const waterRune: RuneType = { id: 2, element: 'water', image: '/water.png' };
      
      const result = validateChainReaction([fireRune, waterRune]);
      expect(result).toBe('combust');
    });

    it('should validate reverse combinations', () => {
      const waterRune: RuneType = { id: 1, element: 'water', image: '/water.png' };
      const fireRune: RuneType = { id: 2, element: 'fire', image: '/fire.png' };
      
      const result = validateChainReaction([waterRune, fireRune]);
      expect(result).toBe('combust');
    });

    it('should validate three-element chain reactions', () => {
      const fireRune: RuneType = { id: 1, element: 'fire', image: '/fire.png' };
      const waterRune: RuneType = { id: 2, element: 'water', image: '/water.png' };
      const earthRune: RuneType = { id: 3, element: 'earth', image: '/earth.png' };
      
      // fire + water = combust, combust + earth = forge
      const result = validateChainReaction([fireRune, waterRune, earthRune]);
      expect(result).toBe('forge');
    });

    it('should return null for invalid combinations', () => {
      const fireRune: RuneType = { id: 1, element: 'fire', image: '/fire.png' };
      const infernoRune: RuneType = { id: 2, element: 'inferno', image: '/inferno.png' };
      
      // inferno is tier 4 and has no combinations
      const result = validateChainReaction([fireRune, infernoRune]);
      expect(result).toBeNull();
    });

    it('should handle unknown elements gracefully', () => {
      const unknownRune: RuneType = { id: 1, element: 'unknown', image: '/unknown.png' };
      const fireRune: RuneType = { id: 2, element: 'fire', image: '/fire.png' };
      
      const result = validateChainReaction([unknownRune, fireRune]);
      expect(result).toBeNull();
    });

    it('should validate complex chain reactions to tier 4', () => {
      // Test a path to a tier 4 element: fire + earth = lava, lava + water = obsidian, obsidian + air = ashcloud
      const fireRune: RuneType = { id: 1, element: 'fire', image: '/fire.png' };
      const earthRune: RuneType = { id: 2, element: 'earth', image: '/earth.png' };
      const waterRune: RuneType = { id: 3, element: 'water', image: '/water.png' };
      const airRune: RuneType = { id: 4, element: 'air', image: '/air.png' };
      
      const result = validateChainReaction([fireRune, earthRune, waterRune, airRune]);
      expect(result).toBe('ashcloud');
    });
  });

  describe('Integration Tests', () => {
    
    it('should validate all possible two-element combinations work', () => {
      const tier1Elements = ['fire', 'water', 'earth', 'air', 'spirit'];
      const invalidCombinations: string[] = [];
      const validResults: string[] = [];
      
      tier1Elements.forEach(elementA => {
        tier1Elements.forEach(elementB => {
          if (elementA !== elementB) {
            const runeA: RuneType = { id: 1, element: elementA, image: '/test.png' };
            const runeB: RuneType = { id: 2, element: elementB, image: '/test.png' };
            
            const result = validateChainReaction([runeA, runeB]);
            
            if (result === null) {
              invalidCombinations.push(`${elementA} + ${elementB} = null`);
            } else if (typeof result === 'string') {
              if (!elementsDB.elements[result]) {
                invalidCombinations.push(`${elementA} + ${elementB} = ${result} (undefined element)`);
              } else {
                validResults.push(`${elementA} + ${elementB} = ${result}`);
              }
            } else {
              invalidCombinations.push(`${elementA} + ${elementB} = ${typeof result} (unexpected type)`);
            }
          }
        });
      });
      
      // Ensure we have some valid combinations and no invalid ones
      expect(validResults.length).toBeGreaterThan(0);
      expect(invalidCombinations).toEqual([]);
    });

    it('should ensure no orphaned elements (unreachable through combinations)', () => {
      const reachableElements = new Set(['fire', 'water', 'earth', 'air', 'spirit']);
      
      // Add all combination results to reachable set
      Object.values(elementsDB.elements).forEach(elementData => {
        Object.values(elementData.combinations).forEach(result => {
          reachableElements.add(result);
        });
      });
      
      // Check that all elements in the database are reachable
      Object.keys(elementsDB.elements).forEach(elementName => {
        expect(reachableElements.has(elementName)).toBe(true);
      });
    });

    it('should validate tier progression makes sense', () => {
      Object.entries(elementsDB.elements).forEach(([elementName, elementData]) => {
        Object.values(elementData.combinations).forEach(result => {
          const resultTier = elementsDB.elements[result].tier;
          // Results should generally be higher tier than inputs
          expect(resultTier).toBeGreaterThanOrEqual(elementData.tier);
        });
      });
    });
  });
});