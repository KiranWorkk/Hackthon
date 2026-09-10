"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockUser } from "@/components/sidebar/sidebar-data";
import { useSidebar } from "@/components/providers/sidebar-provider";

export function SidebarFooter() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex items-center gap-2 border-t border-slate-200 p-3">
      <Avatar className="h-8 w-8 shrink-0 bg-brand-teal-tint">
        <AvatarFallback className="bg-brand-teal-tint text-xs font-medium text-brand-teal-dark">
          {mockUser.initials}
        </AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">
            {mockUser.name}
          </p>
          <p className="truncate text-xs text-slate-500">{mockUser.email}</p>
        </div>
      )}
    </div>
  );
}
