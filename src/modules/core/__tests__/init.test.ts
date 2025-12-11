import { describe, it, expect } from 'vitest';
import * as init from '../init';

describe('init module', () => {
  it('should export at least one function', () => {
    const exportedFunctions = Object.values(init).filter(v => typeof v === 'function');
    expect(exportedFunctions.length).toBeGreaterThan(0);
  });

  // Lägg till tester för init-logik här
});
