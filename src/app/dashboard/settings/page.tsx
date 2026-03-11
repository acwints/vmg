"use client";

import { useSession } from "next-auth/react";
import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  BarChart3,
  Briefcase,
  Building2,
  Database,
  LineChart,
  Mail,
  Network,
  Plug,
  Shield,
  Users,
} from "lucide-react";

const integrations = [
  {
    name: "Crunchbase",
    icon: Building2,
    category: "Market Intel",
    description: "Company profiles, funding rounds, and comparable market activity.",
  },
  {
    name: "Pitchbook",
    icon: BarChart3,
    category: "Research",
    description: "Private market comps, cap tables, and transaction benchmarking.",
  },
  {
    name: "Attio",
    icon: Users,
    category: "CRM",
    description: "Relationship intelligence, pipeline contacts, and meeting history.",
  },
  {
    name: "HubSpot",
    icon: Network,
    category: "CRM",
    description: "Pipeline workflows, notes, and commercial activity sync.",
  },
  {
    name: "Affinity",
    icon: Users,
    category: "Network",
    description: "Firm relationship graph, outreach activity, and sourcing coverage.",
  },
  {
    name: "Carta",
    icon: LineChart,
    category: "Ownership",
    description: "Cap table snapshots, dilution tracking, and option pool visibility.",
  },
  {
    name: "Chronograph",
    icon: Briefcase,
    category: "Fund Ops",
    description: "Fund reporting, LP statements, and performance recordkeeping.",
  },
  {
    name: "Cobalt (FactSet)",
    icon: Activity,
    category: "Portfolio Data",
    description: "Portfolio monitoring, valuation support, and investor reporting.",
  },
  {
    name: "Standard Metrics",
    icon: Database,
    category: "Portfolio Data",
    description: "Company reporting packages, KPI collection, and board data flows.",
  },
  {
    name: "Visible",
    icon: Plug,
    category: "Portfolio Data",
    description: "Founder updates, board reporting, and recurring operating metrics.",
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="max-w-3xl mx-auto w-full space-y-8 animate-fade-in">
      <SectionHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarImage
                src={session?.user?.image || undefined}
                alt={session?.user?.name || "User"}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {session?.user?.name || "User"}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {session?.user?.email || "No email"}
              </div>
              <Badge variant="active" className="mt-1">
                <Shield className="h-3 w-3 mr-1" />
                Team Member
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            User preferences and customization options will be available in a
            future update.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Integrations</CardTitle>
            <Badge variant="secondary">10 available</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect external systems for market intel, CRM workflows, portfolio reporting,
            and fund operations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => {
              const Icon = integration.icon;

              return (
                <div
                  key={integration.name}
                  className="rounded-xl border border-border/60 bg-background/70 p-4 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="rounded-xl bg-secondary p-2.5 shrink-0">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground">
                            {integration.name}
                          </h3>
                          <Badge variant="outline" className="text-[10px]">
                            {integration.category}
                          </Badge>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      Not Connected
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
