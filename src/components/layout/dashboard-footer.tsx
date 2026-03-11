import Image from "next/image";

export function DashboardFooter() {
  return (
    <footer className="shrink-0 border-t border-border bg-card/50 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-4">
          <Image
            src="/vmg-vector.svg"
            alt="VMG"
            width={20}
            height={20}
            className="shrink-0 opacity-60 dark:invert-0 invert"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Velocity Made Good
            </span>
            <span className="text-xs text-muted-foreground/70">
              Direction matters more than speed alone.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
