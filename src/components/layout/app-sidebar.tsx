"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFundOverview } from "@/hooks/use-api";
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
  Building2,
  Compass,
  Kanban,
  Landmark,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";

type Icon = ElementType;

interface NavChild {
  label: string;
  href: string;
}

interface NavGroup {
  label: string;
  href: string;
  icon: Icon;
  children?: NavChild[];
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
}: {
  pathname: string;
  group: NavGroup;
}) {
  const active = isPathActive(pathname, group.href);
  const IconComponent = group.icon;

  return (
    <div className="space-y-1.5">
      <Link
        href={group.href}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <IconComponent className="h-4 w-4 shrink-0" />
        <span className="flex-1">{group.label}</span>
      </Link>

      {group.children?.length ? (
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
                    childActive ? "bg-foreground" : "bg-muted-foreground/50"
                  )}
                />
                <span className="truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const { overview } = useFundOverview();

  const fundChildren =
    overview?.funds.map((fund) => ({
      label: fund.name,
      href: `/dashboard/fund/${fund.slug}`,
    })) ?? [];

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
      label: "Fund",
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
          "flex h-full flex-col border-r border-border bg-card transition-all duration-300",
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
                  <SidebarSection key={group.href} pathname={pathname} group={group} />
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="p-3">
          {collapsed ? (
            <SidebarIconLink
              href="/dashboard/settings"
              icon={Settings}
              label="Settings"
              active={pathname === "/dashboard/settings"}
            />
          ) : (
            <Link
              href="/dashboard/settings"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === "/dashboard/settings"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
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
