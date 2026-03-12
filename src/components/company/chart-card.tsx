"use client";

import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface ChartCardProps {
  title: string;
  icon: LucideIcon;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Consistent wrapper for all company-page charts.
 * Keeps visual rhythm with existing IntegrationCard / glass-card pattern.
 */
export function ChartCard({ title, icon: Icon, subtitle, children }: ChartCardProps) {
  return (
    <Card className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {subtitle && (
          <span className="text-[10px] text-muted-foreground font-medium">{subtitle}</span>
        )}
      </div>
      <CardContent className="p-5">
        <div className="h-[220px] w-full">{children}</div>
      </CardContent>
    </Card>
  );
}
