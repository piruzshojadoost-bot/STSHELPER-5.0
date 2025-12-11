import { describe, it, expect } from 'vitest';
import * as renderGlosses from '../renderGlosses';

describe('renderGlosses module', () => {
  it('should export at least one function', () => {
    const exportedFunctions = Object.values(renderGlosses).filter(v => typeof v === 'function');
    expect(exportedFunctions.length).toBeGreaterThan(0);
  });

  // Lägg till tester för gloss-rendering här
});
