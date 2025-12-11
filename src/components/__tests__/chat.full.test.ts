import { describe, it, expect } from 'vitest';
import * as chat from '../chat';

describe('chat module (full test)', () => {
  it('should export setupChatEventListeners', () => {
    expect(typeof chat.setupChatEventListeners).toBe('function');
  });

  it('should export handleOpenChat', () => {
    expect(typeof chat.handleOpenChat).toBe('function');
  });

  // Lägg till tester för chatlogik, event och rendering här
});
