import { describe, it, expect } from 'vitest';
import * as modals from '../modals';

describe('modals module', () => {
  it('should export at least one function', () => {
    const exportedFunctions = Object.values(modals).filter(v => typeof v === 'function');
    expect(exportedFunctions.length).toBeGreaterThan(0);
  });

  // Lägg till tester för modal-logik här
});
