"use client";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AssistantPanel } from "@/components/layout/assistant-panel";
import { DashboardFooter } from "@/components/layout/dashboard-footer";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { SidebarProvider } from "@/context/sidebar-context";
import { AssistantProvider } from "@/context/assistant-context";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AssistantProvider>
        <div className="flex h-screen flex-col bg-background">
          <AppHeader />
          <div className="flex flex-1 min-h-0">
            <AppSidebar />
            <MobileSidebar />
            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6">
              {children}
            </div>
            <AssistantPanel />
          </div>
          <DashboardFooter />
        </div>
      </AssistantProvider>
    </SidebarProvider>
  );
}
