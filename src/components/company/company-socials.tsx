"use client";

import { Card, CardContent } from "@/components/ui/card";
import { socialMetrics } from "@/lib/mock-metrics";
import { PLATFORM_COLORS } from "@/lib/theme-colors";
import { ExternalLink } from "lucide-react";

interface CompanySocialsProps {
  companyName: string;
  isConsumer: boolean;
}

export function CompanySocials({ companyName, isConsumer }: CompanySocialsProps) {
  const socials = socialMetrics(companyName, isConsumer);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Social Accounts
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {socials.map((s) => {
          const colors = PLATFORM_COLORS[s.platform] || PLATFORM_COLORS.X;
          return (
            <Card key={s.platform} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                    {s.platform}
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/70" />
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">{s.handle}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-muted-foreground">Followers</span>
                    <span className="text-sm font-bold text-foreground">{s.followers}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-muted-foreground">Engagement</span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{s.engagement}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-muted-foreground">Posts / wk</span>
                    <span className="text-sm font-medium text-foreground">{s.postsPerWeek}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
