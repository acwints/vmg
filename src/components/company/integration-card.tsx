import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

export function MetricRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${accent ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

export function IntegrationCard({
  logo,
  name,
  status,
  children,
}: {
  logo: string;
  name: string;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <Image src={logo} alt={name} width={20} height={20} className="rounded" unoptimized />
          <span className="text-sm font-semibold text-foreground">{name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{status}</span>
        </div>
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}
