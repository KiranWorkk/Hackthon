import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/providers/sidebar-provider";
import { ShellBody } from "@/components/ShellBody";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <ShellBody>{children}</ShellBody>
    </SidebarProvider>
  );
}
