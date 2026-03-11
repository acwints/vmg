import { type LucideIcon, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataSourcePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  sourceName: string;
  className?: string;
}

export function DataSourcePlaceholder({
  title,
  description,
  icon: Icon,
  sourceName,
  className,
}: DataSourcePlaceholderProps) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed border-border/40 p-6 text-center",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-lg bg-muted/30 p-3">
          <Icon className="h-5 w-5 text-muted-foreground/80" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">
            {description}
          </p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground/70 cursor-not-allowed"
        >
          <Plug className="h-3 w-3" />
          Connect {sourceName}
        </button>
      </div>
    </div>
  );
}
