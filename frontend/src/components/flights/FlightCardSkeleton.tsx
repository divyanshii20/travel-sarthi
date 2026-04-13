import { Skeleton } from '@/components/ui/Skeleton';

export function FlightCardSkeleton() {
  return (
    <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-2 min-w-[140px]">
        <Skeleton width="32px" height="32px" className="rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <Skeleton width="80px" height="14px" />
          <Skeleton width="50px" height="11px" />
        </div>
      </div>
      <div className="flex items-center gap-3 flex-1">
        <Skeleton width="40px" height="28px" />
        <Skeleton className="flex-1" height="2px" />
        <Skeleton width="40px" height="28px" />
      </div>
      <div className="flex flex-col items-end gap-2 min-w-[130px]">
        <Skeleton width="100px" height="28px" />
        <Skeleton width="70px" height="20px" className="rounded-full" />
      </div>
      <Skeleton width="32px" height="32px" className="rounded-lg" />
    </div>
  );
}
