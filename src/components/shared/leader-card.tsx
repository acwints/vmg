import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Linkedin } from "lucide-react";
import type { CompanyLeader } from "@/types";

interface LeaderCardProps {
  leader: CompanyLeader;
}

function getAvatarUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&size=128&background=0D1B2A&color=C5A55A&bold=true&format=png`;
}

export function LeaderCard({ leader }: LeaderCardProps) {
  const initials = leader.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/10 px-4 py-3">
      <Avatar className="h-9 w-9 shrink-0 border border-border/40">
        <Image
          src={getAvatarUrl(leader.name)}
          alt={leader.name}
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-cover"
          unoptimized
        />
        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {leader.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">{leader.title}</p>
      </div>
      {leader.linkedinUrl && (
        <a
          href={leader.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-colors"
          aria-label={`${leader.name} on LinkedIn`}
        >
          <Linkedin className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
