import { describe, it, expect } from 'vitest';
import * as VideoGrid from '../VideoGrid';

describe('VideoGrid (full test)', () => {
  it('should export createNoSignCardElement', () => {
    expect(typeof VideoGrid.createNoSignCardElement).toBe('function');
  });

  it('should create a no-sign card element', () => {
    const el = VideoGrid.createNoSignCardElement('test', [{ base: 'test', isWord: true }], 'card1');
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toContain('video-card-no-sign');
  });

  // Lägg till tester för event, rendering och grid-logik här
});
