import { Skeleton } from "@/shared/ui/skeleton";

type SummaryStatCardProps = {
  label: string;
  value: number;
  isLoading?: boolean;
  className?: string;
};

export function SummaryStatCard({
  label,
  value,
  isLoading = false,
  className,
}: SummaryStatCardProps) {
  return (
    <div
      className={
        className ?? "rounded-[1.5rem] border border-line bg-white/80 px-4 py-4"
      }
    >
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      {isLoading ? (
        <div className="mt-2 space-y-2">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      ) : (
        <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      )}
    </div>
  );
}
