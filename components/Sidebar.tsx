"use client";

import { cn } from "cn";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { SidebarLogo } from "@/components/sidebar/SidebarLogo";
import { SidebarNav } from "@/components/sidebar/SidebarNav";
import { SidebarFooter } from "@/components/sidebar/SidebarFooter";

export function Sidebar() {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-150 lg:flex",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <SidebarLogo />
      <SidebarNav />
      <SidebarFooter />
    </aside>
  );
}
