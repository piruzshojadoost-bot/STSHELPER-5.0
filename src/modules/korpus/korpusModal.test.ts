import { describe, it, expect } from 'vitest';

// Enkel test för söklogik (mockad data)
import { setupKorpusModal } from './korpusModal';

describe('KorpusModal', () => {
  it('should be defined', () => {
    expect(setupKorpusModal).toBeTypeOf('function');
  });
});
