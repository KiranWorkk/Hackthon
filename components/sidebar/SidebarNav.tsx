"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { navItems } from "@/components/sidebar/sidebar-data";
import { useSidebar } from "@/components/providers/sidebar-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarNav() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        const link = (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isCollapsed && "justify-center px-0",
              isActive
                ? "bg-brand-teal-tint font-medium text-brand-teal-dark"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon
              className={cn(
                "h-4.5 w-4.5 shrink-0",
                isActive ? "text-brand-teal-dark" : "text-slate-500"
              )}
            />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
          </Link>
        );

        if (!isCollapsed) return link;

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.name}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
