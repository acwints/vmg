"use client";

import type { ElementType } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFundOverview } from "@/hooks/use-api";
import { useSidebar } from "@/context/sidebar-context";
import { sortFunds } from "@/lib/fund-order";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Compass,
  ChevronRight,
  Kanban,
  Landmark,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

type Icon = ElementType;

interface NavChild {
  label: string;
  href: string;
  isActive?: boolean;
}

interface NavGroup {
  label: string;
  href: string;
  icon: Icon;
  children?: NavChild[];
  description?: string;
}

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarIconLink({
  href,
  icon: IconComponent,
  label,
  active,
}: {
  href: string;
  icon: Icon;
  label: string;
  active: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={cn(
            "flex items-center justify-center rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-200",
            active
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <IconComponent className="h-4 w-4 shrink-0" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarSection({
  pathname,
  group,
  open,
  onOpenChange,
}: {
  pathname: string;
  group: NavGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const active = isPathActive(pathname, group.href);
  const IconComponent = group.icon;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="space-y-1.5">
        <div
          className={cn(
            "flex items-center gap-1 rounded-lg px-1 py-1",
            active && "bg-primary text-primary-foreground shadow-sm"
          )}
        >
          <Link
            href={group.href}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-200",
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <IconComponent className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{group.label}</span>
          </Link>

          {group.children?.length ? (
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  active
                    ? "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                aria-label={open ? `Collapse ${group.label}` : `Expand ${group.label}`}
              >
                <ChevronRight
                  className={cn("h-4 w-4 transition-transform", open && "rotate-90")}
                />
              </button>
            </CollapsibleTrigger>
          ) : null}
        </div>

        {group.children?.length ? (
          <CollapsibleContent className="space-y-1.5">
            <div className="ml-5 space-y-1 border-l border-border/70 pl-3">
              {group.children.map((child) => {
                const childActive = isPathActive(pathname, child.href);
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      childActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        child.isActive
                          ? "bg-emerald-500"
                          : childActive
                            ? "bg-foreground"
                            : "bg-muted-foreground/50"
                      )}
                    />
                    <span className="truncate">{child.label}</span>
                  </Link>
                );
              })}
            </div>
            {group.description ? (
              <p className="px-4 text-xs italic leading-snug text-muted-foreground/80">
                {group.description}
              </p>
            ) : null}
          </CollapsibleContent>
        ) : null}
      </div>
    </Collapsible>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const { overview } = useFundOverview();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "/dashboard/portfolio": false,
    "/dashboard/pipeline": false,
    "/dashboard/fund": false,
    "/dashboard/industry": false,
  });

  const fundChildren =
    overview ? sortFunds(overview.funds).map((fund) => ({
      label: fund.name,
      href: `/dashboard/fund/${fund.slug}`,
      isActive: fund.status === "active",
    })) : [];

  const navGroups: NavGroup[] = [
    {
      label: "Portfolio",
      href: "/dashboard/portfolio",
      icon: Building2,
      children: [
        { label: "Consumer", href: "/dashboard/portfolio/consumer" },
        { label: "Technology", href: "/dashboard/portfolio/technology" },
      ],
    },
    {
      label: "Pipeline",
      href: "/dashboard/pipeline",
      icon: Kanban,
      children: [
        { label: "Consumer", href: "/dashboard/pipeline/consumer" },
        { label: "Technology", href: "/dashboard/pipeline/technology" },
      ],
    },
    {
      label: "Funds",
      href: "/dashboard/fund",
      icon: Landmark,
      children: fundChildren,
    },
    {
      label: "Industry",
      href: "/dashboard/industry",
      icon: Compass,
      children: [
        { label: "Consumer", href: "/dashboard/industry/consumer" },
        { label: "Technology", href: "/dashboard/industry/technology" },
      ],
    },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "hidden md:flex h-full flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-[60px]" : "w-[260px]"
        )}
      >
        <div className={cn("px-3 py-3", collapsed && "flex justify-center")}>
          <button
            onClick={toggle}
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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

        <ScrollArea className="flex-1 py-3">
          {collapsed ? (
            <div className="space-y-2 px-2">
              <SidebarIconLink
                href="/dashboard"
                icon={LayoutDashboard}
                label="Dashboard"
                active={pathname === "/dashboard"}
              />

              <div className="px-1 py-1">
                <Separator />
              </div>

              {navGroups.map((group) => (
                <SidebarIconLink
                  key={group.href}
                  href={group.href}
                  icon={group.icon}
                  label={group.label}
                  active={isPathActive(pathname, group.href)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4 px-3">
              <div className="space-y-2">
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

                <Separator className="my-2" />
              </div>

              <div className="space-y-4">
                {navGroups.map((group) => (
                  <SidebarSection
                    key={group.href}
                    pathname={pathname}
                    group={group}
                    open={openGroups[group.href] ?? false}
                    onOpenChange={(open) =>
                      setOpenGroups((current) => ({ ...current, [group.href]: open }))
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
