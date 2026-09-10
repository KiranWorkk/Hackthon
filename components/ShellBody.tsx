import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileTopBar } from "@/components/MobileTopBar";
import { BottomNav } from "@/components/BottomNav";

export function ShellBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
