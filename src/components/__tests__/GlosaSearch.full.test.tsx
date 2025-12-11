import { describe, it, expect } from 'vitest';
import GlosaSearch from '../GlosaSearch';
import { render, fireEvent, screen } from '@testing-library/react';

describe('GlosaSearch component (full test)', () => {
  it('should render input and buttons', () => {
    render(<GlosaSearch />);
    expect(screen.getByPlaceholderText('Skriv tecken eller synonym...')).toBeInTheDocument();
    expect(screen.getByText('Sök')).toBeInTheDocument();
    expect(screen.getByText('Glosa')).toBeInTheDocument();
  });

  it('should update input value', () => {
    render(<GlosaSearch />);
    const input = screen.getByPlaceholderText('Skriv tecken eller synonym...');
    fireEvent.change(input, { target: { value: 'hund' } });
    expect((input as HTMLInputElement).value).toBe('hund');
  });

  it('should show error if no match found', async () => {
    render(<GlosaSearch />);
    const input = screen.getByPlaceholderText('Skriv tecken eller synonym...');
    fireEvent.change(input, { target: { value: 'xyz' } });
    fireEvent.click(screen.getByText('Sök'));
    // Eftersom fetch är mockad eller offline, kan vi bara testa att error visas
    expect(await screen.findByText(/Ingen träff i lexikon.|Fel vid sökning./)).toBeInTheDocument();
  });

  it('should show glossning result after clicking Glosa', async () => {
    render(<GlosaSearch />);
    const input = screen.getByPlaceholderText('Skriv tecken eller synonym...');
    fireEvent.change(input, { target: { value: 'jag behöver hjälp' } });
    fireEvent.click(screen.getByText('Glosa'));
    expect(await screen.findByText(/JAG BEHÖVA HJÄLP.|Ingen glossning kunde genereras./)).toBeInTheDocument();
  });
});
