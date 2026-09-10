import { Stethoscope } from "lucide-react";

export function MobileTopBar() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 lg:hidden">
      <Stethoscope className="h-5 w-5 text-brand-teal-dark" />
      <span className="text-sm font-semibold text-slate-900">EHR Proto</span>
    </header>
  );
}
