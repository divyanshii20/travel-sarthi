import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('fires onClick when clicked', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={fn}>Go</Button>);
    await user.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('does NOT fire onClick when disabled', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={fn} disabled>Disabled</Button>);
    await user.click(screen.getByRole('button'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('does NOT fire onClick while loading', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={fn} isLoading>Loading</Button>);
    await user.click(screen.getByRole('button'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('renders a spinner while loading instead of leftIcon', () => {
    render(
      <Button isLoading leftIcon={<span data-testid="left">L</span>}>
        Save
      </Button>
    );
    expect(screen.queryByTestId('left')).not.toBeInTheDocument();
  });

  it('renders rightIcon when not loading', () => {
    render(<Button rightIcon={<span data-testid="right">→</span>}>Next</Button>);
    expect(screen.getByTestId('right')).toBeInTheDocument();
  });

  it('passes through type="submit"', () => {
    render(<Button type="submit">OK</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('applies the variant class', () => {
    const { rerender } = render(<Button variant="primary">P</Button>);
    expect(screen.getByRole('button').className).toContain('btn-primary');
    rerender(<Button variant="ghost">G</Button>);
    expect(screen.getByRole('button').className).toContain('btn-ghost');
  });
});
