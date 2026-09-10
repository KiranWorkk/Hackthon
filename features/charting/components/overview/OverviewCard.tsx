import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

export function OverviewCard({
  icon,
  title,
  children,
}: {
  icon: IconSvgElement;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <HugeiconsIcon icon={icon} size={17} className="text-primary" />
        <h3 className="text-sm font-semibold text-[#0A0A0A]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
