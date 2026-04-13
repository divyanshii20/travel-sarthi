interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-4 flex flex-col gap-3 ${className}`}>
      <Skeleton height="160px" className="rounded-xl" />
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton width="60px" height="24px" className="rounded-full" />
        <Skeleton width="80px" height="24px" className="rounded-full" />
      </div>
    </div>
  );
}
