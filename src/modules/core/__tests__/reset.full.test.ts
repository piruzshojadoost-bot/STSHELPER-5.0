import { describe, it, expect } from 'vitest';
import { resetApp } from '../reset';

describe('resetApp (full test)', () => {
  it('should be a function', () => {
    expect(typeof resetApp).toBe('function');
  });

  // Lägg till tester för state-reset och DOM-manipulation här
});
