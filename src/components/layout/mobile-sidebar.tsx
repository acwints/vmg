"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/sidebar-context";
import { useFundOverview } from "@/hooks/use-api";
import { sortFunds } from "@/lib/fund-order";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Compass,
  Kanban,
  Landmark,
  LayoutDashboard,
  X,
} from "lucide-react";

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileSidebar() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { overview } = useFundOverview();

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  if (!mobileOpen) return null;

  const fundChildren =
    overview
      ? sortFunds(overview.funds).map((fund) => ({
          label: fund.name,
          href: `/dashboard/fund/${fund.slug}`,
        }))
      : [];

  const navGroups = [
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
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setMobileOpen(false)}
      />
      {/* Panel */}
      <div className="relative z-10 flex h-full w-[260px] flex-col border-r border-border bg-card shadow-lg">
        <div className="flex items-center justify-end px-3 py-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Separator />

        <ScrollArea className="flex-1 py-3">
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

            <div className="space-y-3">
              {navGroups.map((group) => {
                const active = isPathActive(pathname, group.href);
                const IconComponent = group.icon;
                return (
                  <div key={group.href} className="space-y-1">
                    <Link
                      href={group.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <IconComponent className="h-4 w-4 shrink-0" />
                      <span>{group.label}</span>
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
                              <span className="truncate">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
