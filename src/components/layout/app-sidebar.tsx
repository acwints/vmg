"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/sidebar-context";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Cpu,
  ShoppingBag,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  TrendingUp,
  Globe,
  Kanban,
} from "lucide-react";

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ElementType;
  basePath: string;
}

const sections: SidebarSection[] = [
  {
    id: "technology",
    label: "Technology",
    icon: Cpu,
    basePath: "/dashboard/technology",
  },
  {
    id: "consumer",
    label: "Consumer",
    icon: ShoppingBag,
    basePath: "/dashboard/consumer",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  const isSectionActive = (section: SidebarSection) => {
    return pathname.startsWith(section.basePath);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex h-full flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {/* Collapse toggle */}
        <div className={cn("px-3 py-3", collapsed && "flex justify-center")}>
          <button
            onClick={toggle}
            className="flex items-center justify-center p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <div className="space-y-1 px-2">
            {/* Dashboard Home */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard"
                    className={cn(
                      "flex items-center justify-center rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-200",
                      pathname === "/dashboard"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Dashboard</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span>Dashboard</span>
              </Link>
            )}

            <div className="pt-2" />

            {/* Portfolio Sections */}
            {sections.map((section) => {
              const SectionIcon = section.icon;
              const active = isSectionActive(section);

              return (
                <div key={section.id} className="mb-1">
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={section.basePath}
                          className={cn(
                            "flex items-center justify-center rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <SectionIcon className="h-4 w-4 shrink-0" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {section.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      href={section.basePath}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <SectionIcon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{section.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}

            <div className="pt-2" />

            {/* IC Memos */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/memos"
                    className={cn(
                      "flex items-center justify-center rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-200",
                      pathname === "/dashboard/memos"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">IC Memos</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/dashboard/memos"
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/memos"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span>IC Memos</span>
              </Link>
            )}

            {/* Fund Model */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/fund-model"
                    className={cn(
                      "flex items-center justify-center rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-200",
                      pathname === "/dashboard/fund-model"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <TrendingUp className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Fund Model</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/dashboard/fund-model"
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/fund-model"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span>Fund Model</span>
              </Link>
            )}

            {/* Macro */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/macro"
                    className={cn(
                      "flex items-center justify-center rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-200",
                      pathname === "/dashboard/macro"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Macro</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/dashboard/macro"
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/macro"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Globe className="h-4 w-4 shrink-0" />
                <span>Macro</span>
              </Link>
            )}

            {/* Pipeline */}
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/pipeline"
                    className={cn(
                      "flex items-center justify-center rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-200",
                      pathname === "/dashboard/pipeline"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Kanban className="h-4 w-4 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Pipeline</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                href="/dashboard/pipeline"
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  pathname === "/dashboard/pipeline"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Kanban className="h-4 w-4 shrink-0" />
                <span>Pipeline</span>
              </Link>
            )}
          </div>
        </ScrollArea>

        {/* Footer — Settings only */}
        <Separator />
        <div className="p-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center justify-center rounded-lg px-2.5 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </Link>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
