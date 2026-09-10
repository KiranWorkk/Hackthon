"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { useSidebar } from "@/components/providers/sidebar-provider";

export function SidebarLogo() {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  if (isCollapsed) {
    return (
      <div className="flex h-14 items-center justify-center">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-50"
          aria-label="Expand sidebar"
        >
          <Image
            src="/logoPS.svg"
            alt="Practice Suite Logo Icon"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-14 items-center justify-between px-4">
      <Image
        src="/practicesuite logo.svg"
        alt="practicesuite logo"
        width={130}
        height={28}
        className="h-7 w-auto"
      />
      <button
        type="button"
        onClick={() => setIsCollapsed(true)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        aria-label="Collapse sidebar"
      >
        <HugeiconsIcon icon={Menu01Icon} size={20} />
      </button>
    </div>
  );
}
