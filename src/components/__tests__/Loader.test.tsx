import { describe, it, expect } from 'vitest';
import Loader from '../Loader';
import { render } from '@testing-library/react';

describe('Loader component', () => {
  it('should render without crashing', () => {
    const { container } = render(<Loader />);
    expect(container).toBeTruthy();
  });

  // Lägg till tester för loader-animation och tillstånd här
});
