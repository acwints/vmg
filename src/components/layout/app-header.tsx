"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/context/theme-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Settings, LogOut, Menu } from "lucide-react";
import { useSidebar } from "@/context/sidebar-context";

export function AppHeader() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { toggleMobile } = useSidebar();

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "VM";

  return (
    <header className="flex items-center justify-between h-14 px-4 sm:px-7 border-b border-border bg-card shrink-0 overflow-hidden">
      {/* Left — Mobile menu + Logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMobile}
          className="flex md:hidden items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <Image
          src="/vmg-vector.svg"
          alt="VMG"
          width={22}
          height={22}
          className="dark:invert-0 invert"
        />
        <Image
          src="/vmg-logo.svg"
          alt="VMG Partners"
          width={72}
          height={25}
          className="hidden sm:inline dark:invert-0 invert"
        />
      </Link>
      </div>

      {/* Right — Theme + User */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Avatar className="h-7 w-7 shrink-0 border border-border">
                  <AvatarImage
                    src={session.user.image || undefined}
                    alt={session.user.name || "User"}
                  />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
