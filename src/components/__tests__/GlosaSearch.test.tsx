import { describe, it, expect } from 'vitest';
import GlosaSearch from '../GlosaSearch';
import { render } from '@testing-library/react';

describe('GlosaSearch component', () => {
  it('should render without crashing', () => {
    const { container } = render(<GlosaSearch />);
    expect(container).toBeTruthy();
  });

  // Lägg till tester för sök- och glosa-funktionalitet här
});
