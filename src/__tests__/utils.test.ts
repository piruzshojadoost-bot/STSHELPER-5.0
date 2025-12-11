import { describe, it, expect } from 'vitest';
import * as utils from '../utils';

describe('utils module', () => {
  it('should export at least one function', () => {
    const exportedFunctions = Object.values(utils).filter(v => typeof v === 'function');
    expect(exportedFunctions.length).toBeGreaterThan(0);
  });

  // Lägg till tester för utility-funktioner här
});
