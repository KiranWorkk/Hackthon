"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { navItems } from "@/components/sidebar/sidebar-data";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 items-stretch justify-around border-t border-slate-200 bg-white lg:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium",
              isActive ? "text-brand-teal-dark" : "text-slate-500"
            )}
          >
            <Icon className="h-4.5 w-4.5" />
            <span className="truncate px-1">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
