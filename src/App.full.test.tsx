import { describe, it, expect } from 'vitest';
import App from './App';
import { render } from '@testing-library/react';

describe('App component (full test)', () => {
  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  // Lägg till tester för navigation och huvudfunktioner här
});
