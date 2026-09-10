import type { ReactNode } from "react";

export function Header({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {description && (
          <p className="truncate text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
