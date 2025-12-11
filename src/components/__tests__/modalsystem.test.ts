import { describe, it, expect } from 'vitest';
import * as ModalSystem from './ModalSystem';

describe('ModalSystem module', () => {
  it('should export at least one function', () => {
    const exportedFunctions = Object.values(ModalSystem).filter(v => typeof v === 'function');
    expect(exportedFunctions.length).toBeGreaterThan(0);
  });

  // Lägg till tester för modalsystem-logik här
});
