import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders the label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders the placeholder', () => {
    render(<Input placeholder="you@example.com" />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('shows the error message when provided', () => {
    render(<Input error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('does not render an error when none provided', () => {
    render(<Input label="Email" />);
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="x" />);
    const input = screen.getByPlaceholderText('x') as HTMLInputElement;
    await user.type(input, 'hello');
    expect(input.value).toBe('hello');
  });

  it('renders leftIcon and rightIcon', () => {
    render(
      <Input
        leftIcon={<span data-testid="L">L</span>}
        rightIcon={<span data-testid="R">R</span>}
      />
    );
    expect(screen.getByTestId('L')).toBeInTheDocument();
    expect(screen.getByTestId('R')).toBeInTheDocument();
  });

  it('forwards type attribute', () => {
    render(<Input type="password" placeholder="pwd" />);
    const input = screen.getByPlaceholderText('pwd') as HTMLInputElement;
    expect(input.type).toBe('password');
  });
});
