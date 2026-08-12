import { SystemReadiness } from "@/components/features/system-readiness";
import { AppShell } from "@/components/features/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import Link from "next/link";

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Rumpun Community
          </h1>
          <p className="text-muted-foreground">
            A community-maintained family tree builder.
          </p>
        </div>

        <SystemReadiness />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/bootstrap">
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle>Bootstrap</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                First-administrator setup and tree initialization.
              </CardContent>
            </Card>
          </Link>
          <Link href="/login">
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle>Sign in</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Log in to your account.
              </CardContent>
            </Card>
          </Link>
          <Link href="/tree">
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle>Family Tree</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                View and edit the family tree.
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
