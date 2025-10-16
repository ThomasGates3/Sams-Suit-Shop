import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';

describe('App Component', () => {
  it('should render the main heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain("Sam's Suit Shop");
  });

  it('should display welcome message', () => {
    render(<App />);
    const welcome = screen.getByText(/Welcome to Sam's Suit Shop/i);
    expect(welcome).toBeDefined();
  });

  it('should display suit categories', () => {
    render(<App />);
    expect(screen.getByText(/Formal Suits/i)).toBeDefined();
    expect(screen.getByText(/Casual Suits/i)).toBeDefined();
    expect(screen.getByText(/Wedding Suits/i)).toBeDefined();
  });
});