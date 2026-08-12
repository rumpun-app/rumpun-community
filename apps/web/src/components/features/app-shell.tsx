"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

function AppShellInner({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.logout();
    } catch {
    }
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4" aria-label="Main navigation">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight"
          >
            Rumpun Community
          </Link>
          {state.status === "authenticated" ? (
            <>
              <Link href="/tree" className="text-sm text-muted-foreground hover:text-foreground">
                Tree
              </Link>
              <Link href="/people" className="text-sm text-muted-foreground hover:text-foreground">
                People
              </Link>
              <Link href="/sources" className="text-sm text-muted-foreground hover:text-foreground">
                Sources
              </Link>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {state.account.account.displayName}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} loading={loggingOut}>
                  Sign out
                </Button>
              </div>
            </>
          ) : null}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return <AppShellInner>{children}</AppShellInner>;
}
