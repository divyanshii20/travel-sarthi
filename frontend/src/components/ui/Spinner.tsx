interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const sizes = { sm: 'w-4 h-4 border-2', md: 'w-7 h-7 border-2', lg: 'w-10 h-10 border-[3px]' };

export function Spinner({ size = 'md', color = 'border-saffron', className = '' }: SpinnerProps) {
  return (
    <span
      className={`inline-block rounded-full border-t-transparent animate-spin ${sizes[size]} ${color} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}
