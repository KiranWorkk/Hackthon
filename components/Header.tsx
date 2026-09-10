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
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 py-3 md:px-6 md:py-4">
      <div className="min-w-0">
        <h1
          className={`text-page-heading truncate tracking-tight text-slate-900 ${
            description ? "mb-1 md:mb-1.5" : ""
          }`}
        >
          {title}
        </h1>
        {description && (
          <p className="truncate text-sm leading-normal text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
