import type { ReactNode } from 'react';

type BadgeVariant = 'saffron' | 'teal' | 'gold' | 'coral' | 'lavender' | 'muted' | 'green' | 'red';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm';
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  saffron: 'bg-saffron-50 text-saffron-700 border border-saffron-100',
  teal: 'bg-teal-50 text-teal-700 border border-teal-100',
  gold: 'bg-amber-50 text-amber-700 border border-amber-100',
  coral: 'bg-red-50 text-red-600 border border-red-100',
  lavender: 'bg-purple-50 text-purple-700 border border-purple-100',
  muted: 'bg-card text-muted border border-card',
  green: 'bg-green-50 text-green-700 border border-green-100',
  red: 'bg-red-50 text-red-600 border border-red-100',
};

const sizeClasses = {
  xs: 'px-2 py-0.5 text-xs',
  sm: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'muted', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span
      className={`badge ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
