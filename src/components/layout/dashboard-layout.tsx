"use client";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AssistantPanel } from "@/components/layout/assistant-panel";
import { DashboardFooter } from "@/components/layout/dashboard-footer";
import { SidebarProvider } from "@/context/sidebar-context";
import { AssistantProvider } from "@/context/assistant-context";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AssistantProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <AppHeader />
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <AppSidebar />
            <div className="flex flex-1 min-h-0 flex-col overflow-y-auto">
              <main className="flex-1 p-6">
                {children}
              </main>
              <DashboardFooter />
            </div>
            <AssistantPanel />
          </div>
        </div>
      </AssistantProvider>
    </SidebarProvider>
  );
}
