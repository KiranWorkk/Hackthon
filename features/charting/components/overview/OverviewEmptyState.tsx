export function OverviewEmptyState({
  message,
  className = "py-6",
}: {
  message: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <p className="text-center text-xs text-slate-400">{message}</p>
    </div>
  );
}
