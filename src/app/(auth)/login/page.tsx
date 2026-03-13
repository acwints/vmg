"use client";

import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <Card className="w-full max-w-md border-border shadow-lg relative z-10 animate-fade-in">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Logo */}
            <div className="space-y-3">
              <Image
                src="/vmg-vector.svg"
                alt="VMG"
                width={40}
                height={40}
                className="mx-auto dark:invert-0 invert"
              />
              <Image
                src="/vmg-logo.svg"
                alt="VMG Partners"
                width={100}
                height={34}
                className="mx-auto dark:invert-0 invert"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Portfolio Intelligence Platform
              </p>
            </div>

            {/* Error */}
            {error === "AccessDenied" && (
              <div className="w-full rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">
                  Access is limited to @vmgpartners.com accounts and approved demo users.
                </p>
              </div>
            )}

            {/* Sign in button */}
            <Button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full h-11 text-sm font-medium"
              size="lg"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>

            <p className="text-[11px] text-muted-foreground/60">
              Restricted to VMG Partners team members and approved demo accounts
            </p>

            {/* Dev login */}
            {process.env.NODE_ENV === "development" && (
              <>
                <div className="w-full flex items-center gap-3 text-muted-foreground/30">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] uppercase tracking-wider">
                    Dev only
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    signIn("credentials", {
                      email: "dev@vmgpartners.com",
                      callbackUrl: "/dashboard",
                    })
                  }
                  className="w-full text-xs"
                >
                  Dev Login
                </Button>
              </>
            )}

            {/* Test user skip login */}
            <div className="w-full flex items-center gap-3 text-muted-foreground/30">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] uppercase tracking-wider">
                Test Access
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                signIn("credentials", {
                  email: "test@vmgpartners.com",
                  callbackUrl: "/dashboard",
                })
              }
              className="w-full text-xs"
            >
              Skip Login (Test User)
            </Button>
            <p className="text-[10px] text-muted-foreground/50">
              For demo and testing purposes only
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
